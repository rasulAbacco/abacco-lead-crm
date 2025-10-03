import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const employeePassword = await bcrypt.hash("password123", 10);

  // Create Admin
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@example.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // Create Employees
  await prisma.user.createMany({
    data: [
      {
        name: "John Doe",
        email: "john@example.com",
        password: employeePassword,
        role: "EMPLOYEE",
      },
      {
        name: "Jane Smith",
        email: "jane@example.com",
        password: employeePassword,
        role: "EMPLOYEE",
      },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Seed completed: Admin + Employees created");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
