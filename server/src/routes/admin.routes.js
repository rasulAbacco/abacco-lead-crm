// admin.routes.js
import express from "express";
import {
  createSalesEmployee,
  getSalesEmployees,
  updateSalesEmployee,
  toggleSalesEmployeeStatus,
  assignSalesAndForwardLead,
  createLeadStatus,
  getLeadStatuses,
  deleteLeadStatus,
} from "../controllers/admin.controller.js";

import { authenticate } from "../middlewares/auth.js";
import { PrismaClient } from "@prisma/client";

import {
  addAllowedIP,
  getAllowedIPs,
  toggleAllowedIP,
  removeAllowedIP,
} from "../controllers/allowedIPController.js";

import { getClientIp } from "../utils/ipExtractor.js";

const prisma = new PrismaClient();
const router = express.Router();

// 🔒 All routes below are ADMIN only
router.use(authenticate);

// ===============================
// SALES EMPLOYEE
// ===============================
router.post("/sales-employees", createSalesEmployee);
router.get("/sales-employees", getSalesEmployees);
router.put("/sales-employees/:id", updateSalesEmployee);
router.patch("/sales-employees/:id/status", toggleSalesEmployeeStatus);

// ===============================
// LEAD ASSIGNMENT
// ===============================
router.post("/leads/:leadId/assign-sales", assignSalesAndForwardLead);
router.put("/leads/:leadId/assign-sales", assignSalesAndForwardLead);

// ===============================
// LEAD STATUS
// ===============================
router.post("/lead-status", createLeadStatus);
router.get("/lead-status", getLeadStatuses);
router.delete("/lead-status/:id", deleteLeadStatus);

// ===============================
// ALLOWED IP MANAGEMENT
// ===============================
router.post("/allowed-ips", addAllowedIP);
router.get("/allowed-ips", getAllowedIPs);
router.patch("/allowed-ips/:id/status", toggleAllowedIP);
router.delete("/allowed-ips/:id", removeAllowedIP);

// ===============================
// UTIL: GET CLIENT IP
// ===============================
router.get("/my-ip", (req, res) => {
  const ip = getClientIp(req);

  res.json({
    success: true,
    ip,
  });
});

// ===============================
// LOGIN HISTORY
// ===============================
router.get("/login-history", async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const skip = (page - 1) * limit;

    const history = await prisma.loginHistory.findMany({
      orderBy: { loginTime: "desc" },
      skip: Number(skip),
      take: Number(limit),
    });

    const total = await prisma.loginHistory.count();

    res.json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      data: history,
    });
  } catch (error) {
    console.error("Login history fetch error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch login history",
    });
  }
});

export default router;