import express from "express";
import {
  getDeals,
  createDeal,
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
router.get("/deals", getDeals);
router.post("/deals", createDeal);
router.put("/deals/:id", updateDeal);
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