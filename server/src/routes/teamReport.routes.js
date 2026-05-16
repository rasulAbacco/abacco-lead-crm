// server/src/routes/teamReport.routes.js

import express from "express";

import {
  createTeam,
  getTeams,
  getActiveEmployees,
  deleteTeam,
  createMonthlyReport,
  getTeamReports,
  updateMonthlyReport,
  deleteMonthlyReport,
  updateTeam,
  getDealAnnouncements,
  saveDealAnnouncements,
} from "../controllers/teamReport.controller.js";

import { authenticate, authorizeRole } from "../middlewares/auth.js";

const router = express.Router();

/* =========================================================
   TEAM
========================================================= */

// Create Team
router.post("/create-team", authenticate, authorizeRole("ADMIN"), createTeam);

// Get Teams
router.get("/teams", authenticate, authorizeRole("ADMIN"), getTeams);

// Delete Team
router.delete(
  "/delete-team/:id",
  authenticate,
  authorizeRole("ADMIN"),
  deleteTeam,
);

/* =========================================================
   EMPLOYEES
========================================================= */

// Active Employees
router.get(
  "/active-employees",
  authenticate,
  authorizeRole("ADMIN"),
  getActiveEmployees,
);

/* =========================================================
   TEAM REPORTS
========================================================= */

// Create Monthly Report
router.post(
  "/create-report",
  authenticate,
  authorizeRole("ADMIN"),
  createMonthlyReport,
);

// Get Reports
router.get("/reports", authenticate, authorizeRole("ADMIN"), getTeamReports);

// Update Report
router.put(
  "/update-report/:id",
  authenticate,
  authorizeRole("ADMIN"),
  updateMonthlyReport,
);

// Delete Report
router.delete(
  "/delete-report/:id",
  authenticate,
  authorizeRole("ADMIN"),
  deleteMonthlyReport,
);

router.put("/update-team/:id", authenticate, updateTeam);

/* =========================================================
   DEAL ANNOUNCEMENTS
========================================================= */

// Save Deal Announcements
router.post(
  "/deal-announcements",
  authenticate,
  saveDealAnnouncements,
);

// Get Deal Announcements
router.get(
  "/deal-announcements",
  authenticate,
  getDealAnnouncements,
);

export default router;
