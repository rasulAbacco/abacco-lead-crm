// backend/routes/industryRouter.js
import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route   POST /api/industry
 * @desc    Add a new industry entry for an employee
 */
router.post("/", async (req, res) => {
  try {
    const { employeeId, fullName, industryName, leadType, countryName  } = req.body;

    if (!employeeId || !industryName || !leadType) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const industry = await prisma.industry.create({
      data: {
        employeeId,
        fullName,
        industryName,
        leadType,
        countryName
      },
    });

    res.json({ success: true, industry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * @route   GET /api/industry
 * @desc    Fetch all industry entries
 */
router.get("/", async (req, res) => {
  try {
    const industries = await prisma.industry.findMany();
    res.json({ success: true, industries });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
