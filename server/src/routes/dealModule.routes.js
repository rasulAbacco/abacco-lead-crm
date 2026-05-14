// dealModule.routes.js
import express from "express";

import {
  getDeals,
  getDealYears,
  getDealAnalytics,
  createDeal,
  bulkUploadDeals,
  updateDeal,
  deleteDeal,
  getMasters,
  createMaster,
  deleteMaster,
  getEmployeeDeals,
} from "../controllers/dealModule.controller.js";

import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

// 🔒 Apply auth to all routes
router.use(authenticate);

// ===============================
// DEAL ROUTES
// ===============================

// RAW DEAL RECORDS
router.get("/deals", getDeals);

// YEARS DROPDOWN
router.get("/deals/years", getDealYears);

// GROUPED ANALYTICS
router.get("/deals/analytics", getDealAnalytics);

// CREATE SINGLE DEAL
router.post("/deals", createDeal);

// BULK UPLOAD
router.post("/deals/bulk-upload", bulkUploadDeals);

// UPDATE DEAL
router.put("/deals/:id", updateDeal);

// DELETE DEAL
router.delete("/deals/:id", deleteDeal);

// ===============================
// EMPLOYEE DEALS
// ===============================
router.get("/emp-deals", getEmployeeDeals);

// ===============================
// MASTER DATA (GENERIC)
// ===============================
// Supported types:
// - industries
// - lead-types
// - deal-status
// - events
// - associations

router.get("/masters/:type", getMasters);

router.post("/masters/:type", createMaster);

router.delete("/masters/:type/:id", deleteMaster);

export default router;
