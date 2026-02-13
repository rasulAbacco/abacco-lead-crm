import express from "express";
import {
  createSalesEmployee,
  getSalesEmployees,
  updateSalesEmployee,
  toggleSalesEmployeeStatus,
  assignSalesAndForwardLead,
  createLeadStatus,
  getLeadStatuses,
} from "../controllers/admin.controller.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

// 🔒 all routes below are ADMIN only
router.use(authenticate);

/* SALES EMPLOYEE */
router.post("/sales-employees", createSalesEmployee);
router.get("/sales-employees", getSalesEmployees);
router.put("/sales-employees/:id", updateSalesEmployee);
router.patch("/sales-employees/:id/status", toggleSalesEmployeeStatus);

/* LEAD ASSIGNMENT */
router.post("/leads/:leadId/assign-sales", assignSalesAndForwardLead);
/* LEAD ASSIGNMENT */
router.put("/leads/:leadId/assign-sales", assignSalesAndForwardLead);
/* LEAD STATUS */
router.post("/lead-status", createLeadStatus);
router.get("/lead-status", getLeadStatuses);

export default router;
