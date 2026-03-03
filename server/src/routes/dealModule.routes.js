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
router.get("/deals", getDeals);
router.post("/deals", createDeal);
router.put("/deals/:id", updateDeal);
router.delete("/deals/:id", deleteDeal);
router.get(
  "/emp-deals",
  authenticate, // 🔥 MUST BE HERE
  getEmployeeDeals,
);
// ================= INDUSTRY =================
router.get("/industries", (req, res) =>
  getMasters({ ...req, params: { type: "industries" } }, res),
);

router.post("/industries", (req, res) =>
  createMaster({ ...req, params: { type: "industries" } }, res),
);

router.delete("/industries/:id", (req, res) =>
  deleteMaster(
    { ...req, params: { type: "industries", id: req.params.id } },
    res,
  ),
);

// ================= LEAD TYPES =================
router.get("/lead-types", (req, res) =>
  getMasters({ ...req, params: { type: "lead-types" } }, res),
);

router.post("/lead-types", (req, res) =>
  createMaster({ ...req, params: { type: "lead-types" } }, res),
);

router.delete("/lead-types/:id", (req, res) =>
  deleteMaster(
    { ...req, params: { type: "lead-types", id: req.params.id } },
    res,
  ),
);

// ================= DEAL STATUS =================
router.get("/deal-status", (req, res) =>
  getMasters({ ...req, params: { type: "deal-status" } }, res),
);

router.post("/deal-status", (req, res) =>
  createMaster({ ...req, params: { type: "deal-status" } }, res),
);

router.delete("/deal-status/:id", (req, res) =>
  deleteMaster(
    { ...req, params: { type: "deal-status", id: req.params.id } },
    res,
  ),
);

export default router;
