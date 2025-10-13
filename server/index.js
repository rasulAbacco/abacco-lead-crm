import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import authRoutes from "./src/routes/authRoutes.js";
import employeeRoutes from "./src/routes/employeeRoutes.js";
import leadsRoutes from "./src/routes/leadsRoutes.js";
import targetRoutes from "./src/routes/targetRoutes.js";
import industryRouter from "./src/routes/industryRouter.js";
import employeesDeatails from './src/routes/employees.js'

dotenv.config();
const prisma = new PrismaClient();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/leads", leadsRoutes);
app.use("/api/targets", targetRoutes);
app.use("/api/industry", industryRouter);
app.use('/api/all-employees', employeesDeatails)

// Add JWT secret to environment
process.env.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Start server
const PORT = process.env.PORT || 4001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));









// import express from "express";
// import cors from "cors";
// import { PrismaClient } from "@prisma/client";
// import dotenv from "dotenv";
// import authRoutes from "./src/routes/authRoutes.js";
// import employeeRoutes from "./src/routes/employeeRoutes.js";
// dotenv.config();
// const prisma = new PrismaClient();
// const app = express();

// app.use(cors());
// app.use(express.json());

// // POST /leads
// app.post("/leads", async (req, res) => {
//   try {
//     const {
//       employeeId,
//       agentName,
//       clientEmail,
//       ccEmail,
//       subjectLine,
//       emailPitch,
//       website,
//       phone,
//       country,
//       leadType,
//       date,
//     } = req.body;

//     const lead = await prisma.lead.create({
//       data: {
//         employeeId,
//         agentName,
//         clientEmail,
//         ccEmail,
//         subjectLine,
//         emailPitch,
//         website,
//         phone,
//         country,
//         leadType,
//         date: new Date(date),
//       },
//     });

//     res.status(201).json({ success: true, lead });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// // GET /leads
// app.get("/leads", async (req, res) => {
//   const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });
//   res.json(leads);
// });

// // Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/employees", employeeRoutes);

// const PORT = process.env.PORT || 4000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
