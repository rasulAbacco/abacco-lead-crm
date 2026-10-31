// Create (or reset) an admin account.
//   npm run create-admin -- AT001 "Admin Name" admin@abaccotech.com "StrongPassword" [office-ip]
import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "../src/prismaClient.js";

const [employeeId, fullName, email, password, ip] = process.argv.slice(2);
if (!employeeId || !fullName || !email || !password) {
  console.log('Usage: npm run create-admin -- <EMPLOYEE_ID> "<Full Name>" <email> <password>');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 10);
const admin = await prisma.employee.upsert({
  where: { employeeId },
  update: { fullName, email: email.toLowerCase(), password: hash, role: "ADMIN", isActive: true },
  create: { employeeId, fullName, email: email.toLowerCase(), password: hash, role: "ADMIN", joiningDate: new Date() },
});
console.log(`✅ Admin ready: ${admin.employeeId} (${admin.email})`);
if (ip) {
  await prisma.allowedIP.upsert({ where: { ipAddress: ip }, update: { status: true }, create: { ipAddress: ip, label: "Office" } });
  console.log(`✅ Allowed IP ${ip}`);
}
await prisma.$disconnect();
