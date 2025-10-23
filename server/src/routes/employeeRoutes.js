// src/routes/employeeRoutes.js
import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// src/routes/employeeRoutes.js
router.get("/", async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      where: { role: "EMPLOYEE" },
      select: {
        employeeId: true,
        fullName: true,
        email: true,
        target: true, // ✅ fetch target from DB
      },
    });

    const now = new Date();

    // Set start and end of month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Set start and end of today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const employeesWithLeads = await Promise.all(
      employees.map(async (emp) => {
        const monthlyLeads = await prisma.lead.count({
          where: {
            employeeId: emp.employeeId,
            date: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        });

        const dailyLeads = await prisma.lead.count({
          where: {
            employeeId: emp.employeeId,
            date: {
              gte: startOfToday,
              lte: endOfToday,
            },
          },
        });

        return {
          id: emp.employeeId, // frontend expects 'id'
          name: emp.fullName,
          email: emp.email,
          dailyLeads,
          monthlyLeads,
          target: emp.target || 0, // ✅ use target from DB
        };
      })
    );

    res.json(employeesWithLeads);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});


// Get All leads without employee filter
router.get("/full", async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      include: {
        employee: {
          select: {
            employeeId: true,
            fullName: true,
            email: true,
          },
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
      employee: lead.employee, // nested object { employeeId, fullName, email }
    }));

    res.json(formattedLeads);
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

// GET /api/employees/with-leads
router.get("/with-leads", async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      where: { role: "EMPLOYEE" }, // <-- only employees
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
            // time: true,
            link: true,
          },
        },
      },
    });

    res.json(employees);
  } catch (error) {
    console.error("Error fetching employees with leads:", error);
    res.status(500).json({ error: "Failed to fetch employees with leads" });
  }
});
/**
 * GET /api/employees/leads-summary
 * Returns today's summary and month-wise summary of leads by type
 */
router.get("/leads-summary", async (req, res) => {
  try {
    const now = new Date();
    const months = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December"
    ];

    const getSummary = async (start, end) => {
      const leads = await prisma.lead.findMany({
        where: { date: { gte: start, lte: end } },
        select: { leadType: true },
      });

      const summary = { total: 0, associations: 0, industry: 0, attendees: 0 };

      leads.forEach(lead => {
        if (!lead.leadType) return;
        const type = lead.leadType.trim().toLowerCase();

        if (type.includes("association")) summary.associations += 1;
        else if (type.includes("industry")) summary.industry += 1;
        else if (type.includes("attendee")) summary.attendees += 1;

        summary.total += 1;
      });

      return summary;
    };

    // --- Today ---
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const today = await getSummary(startOfToday, endOfToday);

    // --- Weekly (exclude Sundays) ---
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);

      // Skip Sundays
      if (day.getDay() === 0) continue;

      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59);

      const summary = await getSummary(start, end);

      weeklyData.push({
        day: day.toLocaleDateString("en-US", { weekday: "short" }),
        ...summary,
      });
    }

    // --- Monthly ---
    const monthsData = {};
    for (let m = 0; m < 12; m++) {
      const start = new Date(now.getFullYear(), m, 1);
      const end = new Date(now.getFullYear(), m + 1, 0, 23, 59, 59);
      monthsData[months[m]] = await getSummary(start, end);
    }

    res.json({ success: true, today, weekly: weeklyData, months: monthsData });
  } catch (err) {
    console.error(err);
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

export default router;

