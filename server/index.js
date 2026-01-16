// server/index.js
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
import { getUSADateTime } from "./src/utils/timezone.js";
import linksRouter from "./src/routes/linksRouter.js";
import reportsRoutes from "./src/routes/reportsRoutes.js";
import incentiveRoutes from "./src/routes/incentiveRoutes.js";
import leaderboardRoutes from "./src/routes/leaderboardRoutes.js";
import quoteRoutes from "./src/routes/quoteRoutes.js";

console.log("🕐 Server time (UTC):", new Date().toISOString());
console.log("🇺🇸 US (New York) time:", getUSADateTime());

process.env.TZ = 'America/Chicago';


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
app.use("/api/links", linksRouter);
app.use("/api/reports", reportsRoutes);
app.use("/api/incentives", incentiveRoutes);
app.use("/api/employee", leaderboardRoutes);
app.use("/api/quotes", quoteRoutes);

// Add JWT secret to environment
process.env.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

