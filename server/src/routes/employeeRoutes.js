// src/routes/employeeRoutes.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import { fromZonedTime } from "date-fns-tz";

import {
  getUSADateTime,
  getUSATodayRange,
  toUSAZone,
} from "../utils/timezone.js";

const router = express.Router();
const prisma = new PrismaClient();
const USA_TZ = "America/Chicago";

/* ===========================================================
   ✅ Helper: Get current month's range in Central USA time
   =========================================================== */
function getUSAMonthRange() {
  const nowUSA = getUSADateTime();
  const startOfMonth = new Date(nowUSA.getFullYear(), nowUSA.getMonth(), 1, 0, 0, 0);
  const endOfMonth = new Date(nowUSA.getFullYear(), nowUSA.getMonth() + 1, 0, 23, 59, 59);
  return {
    start: fromZonedTime(startOfMonth, USA_TZ),
    end: fromZonedTime(endOfMonth, USA_TZ),
  };
}

/* ===========================================================
   ✅ GET /api/employees
   Fetch employees with daily/monthly leads in CST
   =========================================================== */
router.get("/", async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      where: { role: "EMPLOYEE" },
      select: {
        employeeId: true,
        fullName: true,
        email: true,
        target: true,
      },
    });

    const { start: startOfMonth, end: endOfMonth } = getUSAMonthRange();
    const { start: startOfToday, end: endOfToday } = getUSATodayRange();

    const employeesWithLeads = await Promise.all(
      employees.map(async (emp) => {
        const monthlyLeads = await prisma.lead.count({
          where: {
            employeeId: emp.employeeId,
            date: { gte: startOfMonth, lte: endOfMonth },
          },
        });

        const dailyLeads = await prisma.lead.count({
          where: {
            employeeId: emp.employeeId,
            date: { gte: startOfToday, lte: endOfToday },
          },
        });

        return {
          id: emp.employeeId,
          name: emp.fullName,
          email: emp.email,
          dailyLeads,
          monthlyLeads,
          target: emp.target || 0,
        };
      })
    );

    res.json(employeesWithLeads);
  } catch (error) {
    console.error("❌ Error fetching employees:", error);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

/* ===========================================================
   ✅ GET /api/employees/full
   Fetch all leads (no filters)
   =========================================================== */
router.get("/full", async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      include: {
        employee: {
          select: { employeeId: true, fullName: true, email: true },
        },
      },
      orderBy: { id: "asc" },
    });

    const formattedLeads = leads.map((lead) => ({
      id: lead.id,
      employeeId: lead.employeeId,
      agentName: lead.agentName,
      clientEmail: lead.clientEmail,
      leadEmail: lead.leadEmail,
      ccEmail: lead.ccEmail,
      subjectLine: lead.subjectLine,
      emailPitch: lead.emailPitch,
      emailResponce: lead.emailResponce,
      website: lead.website,
      phone: lead.phone,
      country: lead.country,
      leadType: lead.leadType,
      date: lead.date,
      createdAt: lead.createdAt,
      link: lead.link,
      isEdited: lead.isEdited, // Added this field to include the edit status
      employee: lead.employee,
    }));

    res.json(formattedLeads);
  } catch (error) {
    console.error("❌ Error fetching leads:", error);
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

/* ===========================================================
   ✅ GET /api/employees/with-leads
   Returns employees and all leads (no filtering)
   =========================================================== */
router.get("/with-leads", async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      where: { role: "EMPLOYEE" },
      select: {
        id: true,
        employeeId: true,
        fullName: true,
        email: true,
        leads: {
          select: {
            id: true,
            agentName: true,
            clientEmail: true,
            leadEmail: true,
            ccEmail: true,
            subjectLine: true,
            emailPitch: true,
            emailResponce: true,
            website: true,
            phone: true,
            country: true,
            leadType: true,
            date: true,
            link: true,
          },
        },
      },
    });

    res.json(employees);
  } catch (error) {
    console.error("❌ Error fetching employees with leads:", error);
    res.status(500).json({ error: "Failed to fetch employees with leads" });
  }
});

/* ===========================================================
   ✅ GET /api/employees/leads-summary
   Returns daily, weekly, and monthly summary (CST)
   =========================================================== */
router.get("/leads-summary", async (req, res) => {
  try {
    const nowUSA = getUSADateTime();
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
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
        if (type.includes("association")) summary.associations++;
        else if (type.includes("industry")) summary.industry++;
        else if (type.includes("attendee")) summary.attendees++;
        summary.total++;
      });

      return summary;
    };

    // --- Today ---
    const { start: startOfToday, end: endOfToday } = getUSATodayRange();
    const today = await getSummary(startOfToday, endOfToday);

    // --- Weekly (CST, skip Sundays) ---
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const dayUSA = new Date(nowUSA);
      dayUSA.setDate(nowUSA.getDate() - i);

      if (dayUSA.getDay() === 0) continue; // skip Sunday

      const start = fromZonedTime(
        new Date(dayUSA.getFullYear(), dayUSA.getMonth(), dayUSA.getDate(), 0, 0, 0),
        USA_TZ
      );
      const end = fromZonedTime(
        new Date(dayUSA.getFullYear(), dayUSA.getMonth(), dayUSA.getDate(), 23, 59, 59),
        USA_TZ
      );

      const summary = await getSummary(start, end);
      weeklyData.push({
        day: dayUSA.toLocaleDateString("en-US", { weekday: "short" }),
        ...summary,
      });
    }

    // --- Monthly ---
    const monthsData = {};
    for (let m = 0; m < 12; m++) {
      const start = fromZonedTime(new Date(nowUSA.getFullYear(), m, 1, 0, 0, 0), USA_TZ);
      const end = fromZonedTime(new Date(nowUSA.getFullYear(), m + 1, 0, 23, 59, 59), USA_TZ);
      monthsData[months[m]] = await getSummary(start, end);
    }

    res.json({ success: true, today, weekly: weeklyData, months: monthsData });
  } catch (err) {
    console.error("❌ Error in leads-summary:", err);
    res.status(500).json({ error: "Failed to fetch leads summary" });
  }
});



// GET /api/employees/:id/leads
router.get("/:id/leads", async (req, res) => {
  const { id } = req.params;

  try {
    const employee = await prisma.employee.findUnique({
      where: { employeeId: id },
      include: { leads: true },
    });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json({
      fullName: employee.fullName, // 👈 add this
      leads: employee.leads,
    });
  } catch (error) {
    console.error("Error fetching employee leads:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// ✅ Get employee details including target
router.get("/:id/target", async (req, res) => {
  const { id } = req.params;

  try {
    const employee = await prisma.employee.findUnique({
      where: { employeeId: id }, // use employeeId (string) not auto-increment id
      select: { employeeId: true, fullName: true, target: true },
    });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json({ target: employee.target, employee });
  } catch (error) {
    console.error("Error fetching employee target:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/employees
// src/routes/leadRoutes.js


// POST /api/leads
// POST /api/leads
router.post("/", async (req, res) => {
  try {
    const employeeData = req.body;

    // 🔍 Check for duplicates
    const existing = await prisma.employee.findUnique({
      where: { employeeId: employeeData.employeeId },
    });

    if (existing) {
      return res.status(400).json({ error: "Employee ID already exists" });
    }

    const created = await prisma.employee.create({
      data: {
        employeeId: employeeData.employeeId,
        fullName: employeeData.fullName,
        email: employeeData.email,
        password: employeeData.password,
        target: employeeData.target ? parseInt(employeeData.target, 10) : null,
        joiningDate: employeeData.joiningDate ? new Date(employeeData.joiningDate) : null,
      },
    });

    res.json({ success: true, employee: created });
  } catch (error) {
    console.error("❌ Error creating employee:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});


router.get("/leads/:employeeId", async (req, res) => {
  const { employeeId } = req.params;

  try {
    if (!employeeId) {
      return res.status(400).json({ error: "Employee ID is required" });
    }

    // ✅ Fetch all leads that belong to this employee
    const leads = await prisma.lead.findMany({
      where: { employeeId },
      orderBy: { createdAt: "desc" },
      include: {
        employee: {
          select: {
            employeeId: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!leads.length) {
      return res.status(404).json({ message: "No leads found for this employee" });
    }

    res.json(leads);
  } catch (error) {
    console.error("Error fetching employee leads:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/leads/:id - Update a lead
// PUT /api/leads/:id - Update a lead
router.put("/leads/:id", async (req, res) => {
  const { id } = req.params;
  const leadId = parseInt(id, 10);

  if (isNaN(leadId)) {
    return res.status(400).json({ error: "Invalid lead ID" });
  }

  try {
    const {
      agentName,
      clientEmail,
      leadEmail,
      ccEmail,
      phone,
      country,
      subjectLine,
      leadType,
      date,
      link,
      emailPitch,
      emailResponce,
      isEdited,
    } = req.body;

    // Prepare update data
    const updateData = {};

    if (agentName !== undefined) updateData.agentName = agentName;
    if (clientEmail !== undefined) updateData.clientEmail = clientEmail;
    if (leadEmail !== undefined) updateData.leadEmail = leadEmail;
    if (ccEmail !== undefined) updateData.ccEmail = ccEmail;
    if (phone !== undefined) updateData.phone = phone;
    if (country !== undefined) updateData.country = country;
    if (subjectLine !== undefined) updateData.subjectLine = subjectLine;
    if (leadType !== undefined) updateData.leadType = leadType;
    if (link !== undefined) updateData.link = link;
    if (emailPitch !== undefined) updateData.emailPitch = emailPitch;
    if (emailResponce !== undefined) updateData.emailResponce = emailResponce;
    if (isEdited !== undefined) updateData.isEdited = isEdited;

    // Handle date - it comes as "2025-10-04T17:00:00.000Z"
    if (date) {
      updateData.date = new Date(date);
    }

    // Update the lead
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: updateData,
    });

    res.json({ success: true, lead: updatedLead });
  } catch (error) {
    console.error("Error updating lead:", error);
    res.status(500).json({ error: "Failed to update lead" });
  }
});
export default router;

