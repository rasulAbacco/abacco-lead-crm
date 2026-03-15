// src/routes/targetRoutes.js
import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

/* =========================================================
   GET EMPLOYEES WITH TARGET + LEAD DISTRIBUTION
========================================================= */
router.get("/", async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      where: { role: "EMPLOYEE" },
      include: {
        leadTarget: true, // 👈 fetch distribution rule
      },
    });

    const result = employees.map((emp) => {
      const diff = new Date().getTime() - new Date(emp.joiningDate).getTime();

      const expYears = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
      const expMonths = Math.floor((diff / (1000 * 60 * 60 * 24 * 30)) % 12);
      const totalMonths = expYears * 12 + expMonths;

      return {
        id: emp.id,
        employeeId: emp.employeeId,
        fullName: emp.fullName,
        target: emp.target,
        joiningDate: emp.joiningDate,

        experience: `${expYears} years ${expMonths} months`,
        expInMonths: totalMonths,

        // 👇 Lead Distribution
        associationPercent: emp.leadTarget?.associationPercent ?? 0,
        attendeesPercent: emp.leadTarget?.attendeesPercent ?? 0,
        industryPercent: emp.leadTarget?.industryPercent ?? 0,
      };
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching employee targets" });
  }
});

/* =========================================================
   LEADS SUMMARY (UNCHANGED)
========================================================= */
router.get("/leads-summary", async (req, res) => {
  try {
    const now = new Date();

    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const getSummary = async (start, end) => {
      const leads = await prisma.lead.findMany({
        where: { date: { gte: start, lte: end } },
        select: { leadType: true },
      });

      const summary = { total: 0, associations: 0, industry: 0, attendees: 0 };

      leads.forEach((lead) => {
        if (!lead.leadType) return;

        const type = lead.leadType.trim().toLowerCase();

        if (type.includes("association")) summary.associations += 1;
        else if (type.includes("industry")) summary.industry += 1;
        else if (type.includes("attendee")) summary.attendees += 1;

        summary.total += 1;
      });

      return summary;
    };

    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
    );

    const today = await getSummary(startOfToday, endOfToday);

    const monthsData = {};
    for (let m = 0; m < 12; m++) {
      const start = new Date(now.getFullYear(), m, 1);
      const end = new Date(now.getFullYear(), m + 1, 0, 23, 59, 59);

      monthsData[months[m]] = await getSummary(start, end);
    }

    const weeklyData = [];
    const currentDay = now.getDay();

    const monday = new Date(now);
    monday.setDate(now.getDate() - (currentDay === 0 ? 6 : currentDay - 1));

    for (let i = 0; i < 6; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);

      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const end = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate(),
        23,
        59,
        59,
      );

      const summary = await getSummary(start, end);

      weeklyData.push({
        day: day.toLocaleDateString("en-US", { weekday: "short" }),
        ...summary,
      });
    }

    res.json({
      success: true,
      today,
      weekly: weeklyData,
      months: monthsData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch leads summary" });
  }
});

/* =========================================================
   UPDATE EMPLOYEE TARGET (UNCHANGED)
========================================================= */
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { target } = req.body;

  if (!target || isNaN(target) || target < 0) {
    return res.status(400).json({ error: "Invalid target value" });
  }

  try {
    const updated = await prisma.employee.update({
      where: { id: parseInt(id) },
      data: { target: parseInt(target) },
    });

    res.json({
      message: "Target updated successfully",
      employee: updated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating target" });
  }
});

/* =========================================================
   SAVE LEAD DISTRIBUTION (NEW)
========================================================= */
router.put("/lead-distribution/:employeeId", async (req, res) => {
  const { employeeId } = req.params;

  const { associationPercent, attendeesPercent, industryPercent } = req.body;

  const total =
    Number(associationPercent) +
    Number(attendeesPercent) +
    Number(industryPercent);

  if (total !== 100) {
    return res.status(400).json({
      error: "Total percentage must equal 100%",
    });
  }

  try {
    const existing = await prisma.employeeLeadTarget.findUnique({
      where: { employeeId },
    });

    if (existing) {
      const updated = await prisma.employeeLeadTarget.update({
        where: { employeeId },
        data: {
          associationPercent,
          attendeesPercent,
          industryPercent,
        },
      });

      return res.json(updated);
    }

    const created = await prisma.employeeLeadTarget.create({
      data: {
        employeeId,
        associationPercent,
        attendeesPercent,
        industryPercent,
      },
    });

    res.json(created);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error saving lead distribution" });
  }
});

export default router;
