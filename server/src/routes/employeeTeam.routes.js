import express from "express";

import {
  getMyTeam,
  getEmployeeTeamReports,
} from "../controllers/employeeTeam.controller.js";

import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

// ==========================================
// MY TEAM
// ==========================================

router.get("/my-team", authenticate, getMyTeam);

// ==========================================
// TEAM REPORTS
// ==========================================

router.get("/reports", authenticate, getEmployeeTeamReports);

export default router;
