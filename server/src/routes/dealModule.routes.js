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

import { authenticate, authorizeRole } from "../middlewares/auth.js";

const router = express.Router();

// ================= DEAL ROUTES =================

// Admin deals
router.get("/deals", authenticate, getDeals);
router.post("/deals", authenticate, createDeal);
router.put("/deals/:id", authenticate, updateDeal);
router.delete("/deals/:id", authenticate, deleteDeal);

// Employee deals (only their own)
router.get("/emp-deals", authenticate, getEmployeeDeals);

// ================= INDUSTRY =================

router.get("/industries", authenticate, (req, res) =>
  getMasters({ ...req, params: { type: "industries" } }, res),
);

router.post("/industries", authenticate, (req, res) =>
  createMaster({ ...req, params: { type: "industries" } }, res),
);

router.delete("/industries/:id", authenticate, (req, res) =>
  deleteMaster(
    { ...req, params: { type: "industries", id: req.params.id } },
    res,
  ),
);

// ================= LEAD TYPES =================

router.get("/lead-types", authenticate, (req, res) =>
  getMasters({ ...req, params: { type: "lead-types" } }, res),
);

router.post("/lead-types", authenticate, (req, res) =>
  createMaster({ ...req, params: { type: "lead-types" } }, res),
);

router.delete("/lead-types/:id", authenticate, (req, res) =>
  deleteMaster(
    { ...req, params: { type: "lead-types", id: req.params.id } },
    res,
  ),
);

// ================= DEAL STATUS =================

router.get("/deal-status", authenticate, (req, res) =>
  getMasters({ ...req, params: { type: "deal-status" } }, res),
);

router.post("/deal-status", authenticate, (req, res) =>
  createMaster({ ...req, params: { type: "deal-status" } }, res),
);

router.delete("/deal-status/:id", authenticate, (req, res) =>
  deleteMaster(
    { ...req, params: { type: "deal-status", id: req.params.id } },
    res,
  ),
);

export default router;
