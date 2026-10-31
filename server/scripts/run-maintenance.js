// Run the retention + cleanup job once from the command line.
//   npm run retention:run
import "dotenv/config";
import prisma from "../src/prismaClient.js";
import { runMaintenance } from "../src/jobs/maintenance.js";

const result = await runMaintenance();
console.log(result);
await prisma.$disconnect();
