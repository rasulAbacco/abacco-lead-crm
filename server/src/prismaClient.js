// One shared Prisma client for the whole server (v1 created ~20 separate pools).
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export default prisma;
