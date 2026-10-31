// Database upgrade for an existing CRM database. Safe to run on every deploy.
//   npm run db:upgrade        (alias: npm run upgrade:v2)
// Steps (each is skipped when already applied):
//   v2: prisma/upgrade-v2.sql  — lead statuses, removed features, retention tables
//   v3: prisma/upgrade-v3.sql  — attendance, biometric, clock-in, notifications
//   + hashes any remaining plain-text passwords
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import prisma from "../src/prismaClient.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function splitSql(sql) {
  return sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(/;\s*(?:\n|$)/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function tableExists(name) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
    name,
  );
  return rows.length > 0;
}

async function applyFile(file, label) {
  const statements = splitSql(fs.readFileSync(path.join(__dirname, "../prisma", file), "utf8"));
  console.log(`• ${label}: applying ${statements.length} statements in one transaction…`);
  await prisma.$transaction(
    async (tx) => {
      for (const stmt of statements) await tx.$executeRawUnsafe(stmt);
    },
    { timeout: 10 * 60 * 1000 },
  );
}

let signOut = false;

async function v2() {
  if (await tableExists("RetentionRun")) return console.log("• v2 already applied");
  await applyFile("upgrade-v2.sql", "v2");
  const counts = await prisma.$queryRawUnsafe(`SELECT status::text AS status, count(*)::int AS n FROM "Lead" GROUP BY status ORDER BY status`);
  console.log("  Lead statuses after upgrade:", counts);
  signOut = true;
}

async function v3() {
  if (await tableExists("WorkSession")) return console.log("• v3 already applied");
  await applyFile("upgrade-v3.sql", "v3");
}

async function hashPasswords() {
  const employees = await prisma.employee.findMany({ select: { id: true, password: true } });
  let hashed = 0;
  for (const e of employees) {
    if (e.password && !e.password.startsWith("$2")) {
      await prisma.employee.update({ where: { id: e.id }, data: { password: await bcrypt.hash(e.password, 10) } });
      hashed++;
    }
  }
  if (hashed) console.log(`• Passwords hashed: ${hashed}`);
}

async function main() {
  await v2();
  await v3();
  await hashPasswords();
  if (signOut) await prisma.session.updateMany({ where: { isActive: true }, data: { isActive: false } });
  console.log("✅ Database is up to date");
}

main()
  .catch((e) => {
    console.error("❌ Upgrade failed — the failing step was rolled back.", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
