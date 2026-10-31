// Abacco Lead CRM — API server v2
import "dotenv/config"; // must be first so every module sees .env values
import express from "express";
import cors from "cors";
import compression from "compression";
import { config } from "./src/config.js";
import prisma from "./src/prismaClient.js";
import authRoutes from "./src/routes/auth.routes.js";
import leadsRoutes from "./src/routes/leads.routes.js";
import employeesRoutes from "./src/routes/employees.routes.js";
import incentivesRoutes from "./src/routes/incentives.routes.js";
import reportsRoutes from "./src/routes/reports.routes.js";
import teamsRoutes from "./src/routes/teams.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";
import systemRoutes, { ensureReleaseDate } from "./src/routes/system.routes.js";
import attendanceRoutes from "./src/routes/attendance.routes.js";
import notificationsRoutes from "./src/routes/notifications.routes.js";
import { startMaintenanceScheduler } from "./src/jobs/maintenance.js";
import { verifyMailer } from "./src/utils/mailer.js";

const app = express();
app.set("trust proxy", true); // Render sits behind a proxy (needed for client IPs)
app.disable("x-powered-by");

app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(compression());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (req, res) => res.json({ ok: true, version: "3.0.0" }));

app.use("/api/auth", authRoutes);
app.use("/api/leads", leadsRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/incentives", incentivesRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/teams", teamsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/notifications", notificationsRoutes);

app.use("/api", (req, res) => res.status(404).json({ message: "Not found" }));

// Central error handler
app.use((err, req, res, next) => {
  if (err?.code === "P2025") return res.status(404).json({ message: "Record not found" });
  console.error(`💥 ${req.method} ${req.originalUrl}:`, err);
  res.status(500).json({ message: "Server error" });
});

const server = app.listen(config.port, async () => {
  console.log(`✅ Lead CRM API on port ${config.port}`);
  await ensureReleaseDate().catch((e) => console.error("Release date error:", e.message));
  verifyMailer();
  if (process.env.DISABLE_SCHEDULER !== "true") startMaintenanceScheduler();
});

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
