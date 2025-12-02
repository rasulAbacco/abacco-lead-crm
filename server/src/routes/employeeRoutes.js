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
  const startOfMonth = new Date(
    nowUSA.getFullYear(),
    nowUSA.getMonth(),
    1,
    0,
    0,
    0
  );
  const endOfMonth = new Date(
    nowUSA.getFullYear(),
    nowUSA.getMonth() + 1,
    0,
    23,
    59,
    59
  );
  return {
    start: fromZonedTime(startOfMonth, USA_TZ),
    end: fromZonedTime(endOfMonth, USA_TZ),
  };
}

/* ===========================================================
   ✅ GET /api/employees
   Fetch employees with daily/monthly leads in CST
   =========================================================== */
// src/routes/employeeRoutes.js

/* ===========================================================
   ✅ GET /api/employees
   Fetch employees with daily/monthly leads + qualified/disqualified counts
   =========================================================== */
router.get("/", async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      where: {
        role: "EMPLOYEE",
        isActive: true
      },
      select: {
        employeeId: true,
        fullName: true,
        email: true,
        target: true,
        isActive: true,
      },
    });


    const { start: startOfMonth, end: endOfMonth } = getUSAMonthRange();
    const { start: startOfToday, end: endOfToday } = getUSATodayRange();

    const employeesWithLeads = await Promise.all(
      employees.map(async (emp) => {
        // Monthly leads count
        const monthlyLeads = await prisma.lead.count({
          where: {
            employeeId: emp.employeeId,
            date: { gte: startOfMonth, lte: endOfMonth },
          },
        });

        // Daily leads count
        const dailyLeads = await prisma.lead.count({
          where: {
            employeeId: emp.employeeId,
            date: { gte: startOfToday, lte: endOfToday },
          },
        });

        // ✅ Qualified leads count (monthly)
        const qualifiedLeads = await prisma.lead.count({
          where: {
            employeeId: emp.employeeId,
            date: { gte: startOfMonth, lte: endOfMonth },
            qualified: true,
          },
        });

        // ✅ Disqualified leads count (monthly)
        const disqualifiedLeads = await prisma.lead.count({
          where: {
            employeeId: emp.employeeId,
            date: { gte: startOfMonth, lte: endOfMonth },
            qualified: false,
          },
        });

        // ✅ Pending leads count (monthly - where qualified is null)
        const pendingLeads = await prisma.lead.count({
          where: {
            employeeId: emp.employeeId,
            date: { gte: startOfMonth, lte: endOfMonth },
            qualified: null,
          },
        });

        return {
          id: emp.employeeId,
          employeeId: emp.employeeId,
          name: emp.fullName,
          fullName: emp.fullName,
          email: emp.email,
          isActive: emp.isActive,
          dailyLeads,
          monthlyLeads,
          leads: monthlyLeads,
          qualifiedLeads,
          disqualifiedLeads,
          pendingLeads,
          target: emp.target || 0,
          // <-- NEW: double target achieved (monthly)
          doubleTargetAchieved: (emp.target && emp.target > 0)
            ? (qualifiedLeads >= (emp.target * 2))
            : false,
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
      isEdited: lead.isEdited,
      forwarded: lead.forwarded,
      qualified: lead.qualified,
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
      where: { role: "EMPLOYEE", isActive: true },
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
            forwarded: true,
            qualified: true,
            createdAt: true,
            isEdited: true,
            attendeesCount: true,
          },
          orderBy: {
            date: "desc",
          },
        },
      },
      orderBy: {
        fullName: "asc",
      },
    });

    console.log(`✅ Fetched ${employees.length} employees with leads`);
    res.json(employees);
  } catch (error) {
    console.error("❌ Error fetching employees with leads:", error);
    res.status(500).json({ error: "Failed to fetch employees with leads" });
  }
});

/* ===========================================================
   ✅ POST /api/employees/leads/:id/forward
   Marks a lead as forwarded in the DB
   =========================================================== */
// router.post("/leads/:id/forward", async (req, res) => {
//   try {
//     const leadId = parseInt(req.params.id);

//     if (isNaN(leadId)) {
//       return res.status(400).json({ error: "Invalid lead ID" });
//     }

//     const existingLead = await prisma.lead.findUnique({
//       where: { id: leadId },
//     });

//     if (!existingLead) {
//       return res.status(404).json({ error: "Lead not found" });
//     }

//     const updatedLead = await prisma.lead.update({
//       where: { id: leadId },
//       data: { forwarded: true },
//       select: {
//         id: true,
//         forwarded: true,
//         qualified: true,
//         subjectLine: true,
//         leadEmail: true,
//       },
//     });

//     console.log(`✅ Lead ${leadId} marked as forwarded`);
//     res.json(updatedLead);
//   } catch (error) {
//     console.error("❌ Error forwarding lead:", error);
//     res.status(500).json({ error: "Failed to forward lead" });
//   }
// });

router.post("/leads/:id/forward", async (req, res) => {
  try {
    const leadId = parseInt(req.params.id);
    if (isNaN(leadId)) {
      return res.status(400).json({ error: "Invalid lead ID" });
    }

    console.log("🔹 Forward request received for lead ID:", leadId);

    // Fetch lead
    const existingLead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!existingLead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    console.log("🟢 Lead fetched successfully:", existingLead.id);

    // Build payload for Sales CRM
    const payload = {
      client: existingLead.clientEmail,
      email: existingLead.leadEmail,
      cc: existingLead.ccEmail,
      phone: existingLead.phone,
      country: existingLead.country,
      subject: existingLead.subjectLine,
      body: existingLead.emailPitch,
      leadType: existingLead.leadType,
      createdAt: existingLead.createdAt,
      empId: existingLead.employeeId || null,

      // 👇 OPTIONAL (currently always null unless you add it later)
      leadDetailsId: null,
    };

    console.log("📤 Sending payload to Sales CRM:", payload);

    // Send to Sales CRM
    const crmResponse = await fetch(
      "https://abacco-sales-crm.onrender.com/api/sales/leads",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const crmData = await crmResponse.json();
    console.log("✅ Sales CRM Response:", crmData);

    if (!crmResponse.ok) {
      return res.status(502).json({
        error: "Failed to forward lead to Sales CRM",
        crmResponse: crmData,
      });
    }

    // Update forwarded flag
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: { forwarded: true },
      select: {
        id: true,
        forwarded: true,
        clientEmail: true,
        leadEmail: true,
        ccEmail: true,
        subjectLine: true,
        emailPitch: true,
        phone: true,
        country: true,
        leadType: true,
        createdAt: true,
        employeeId: true,
      },
    });

    console.log(`✅ Lead ${leadId} marked as forwarded`);
    res.json({
      message: "Lead forwarded successfully",
      forwardedLead: updatedLead,
      crmResponse: crmData,
    });
  } catch (error) {
    console.error("💥 SERVER ERROR:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
      stack: error.stack,
    });
  }
});

/* ===========================================================
   ✅ POST /api/employees/leads/:id/qualify
   Marks a lead as qualified (true) or disqualified (false)
   =========================================================== */
router.post("/leads/:id/qualify", async (req, res) => {
  try {
    const leadId = parseInt(req.params.id);
    const { qualified } = req.body;

    if (isNaN(leadId)) {
      return res.status(400).json({ error: "Invalid lead ID" });
    }

    if (typeof qualified !== "boolean") {
      return res.status(400).json({
        error: "Invalid qualified value. Must be true or false",
      });
    }

    const existingLead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!existingLead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: { qualified },
      select: {
        id: true,
        forwarded: true,
        qualified: true,
        subjectLine: true,
        leadEmail: true,
      },
    });

    console.log(
      `✅ Lead ${leadId} marked as ${qualified ? "qualified" : "disqualified"}`
    );
    res.json(updatedLead);
  } catch (error) {
    console.error("❌ Error updating lead qualification:", error);
    res.status(500).json({ error: "Failed to update lead qualification" });
  }
});

/* ===========================================================
   ✅ GET /api/employees/leads/stats
   Get lead statistics for today (optional date parameter)
   =========================================================== */
router.get("/leads/stats", async (req, res) => {
  try {
    const { date } = req.query;

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const leads = await prisma.lead.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        id: true,
        forwarded: true,
        qualified: true,
      },
    });

    const stats = {
      totalLeads: leads.length,
      forwarded: leads.filter((l) => l.forwarded).length,
      qualified: leads.filter((l) => l.qualified === true).length,
      disqualified: leads.filter((l) => l.qualified === false).length,
      pending: leads.filter((l) => l.qualified === null).length,
    };

    console.log(
      `✅ Stats fetched for ${targetDate.toISOString().split("T")[0]}:`,
      stats
    );
    res.json(stats);
  } catch (error) {
    console.error("❌ Error fetching lead stats:", error);
    res.status(500).json({ error: "Failed to fetch lead statistics" });
  }
});

/* ===========================================================
   ✅ PATCH /api/employees/leads/:id/reset-qualification
   Reset lead qualification status to null
   =========================================================== */
router.patch("/leads/:id/reset-qualification", async (req, res) => {
  try {
    const leadId = parseInt(req.params.id);

    if (isNaN(leadId)) {
      return res.status(400).json({ error: "Invalid lead ID" });
    }

    // Check if lead exists
    const existingLead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!existingLead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    // Reset qualification to null
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: { qualified: null },
      select: {
        id: true,
        forwarded: true,
        qualified: true,
        subjectLine: true,
      },
    });

    console.log(`✅ Lead ${leadId} qualification reset to null`);
    res.json(updatedLead);
  } catch (error) {
    console.error("❌ Error resetting lead qualification:", error);
    res.status(500).json({ error: "Failed to reset lead qualification" });
  }
});

/* ===========================================================
   ✅ PATCH /api/employees/leads/:id/bulk-update
   Update multiple fields of a lead at once
   =========================================================== */
router.patch("/leads/:id/bulk-update", async (req, res) => {
  try {
    const leadId = parseInt(req.params.id);
    const { forwarded, qualified } = req.body;

    if (isNaN(leadId)) {
      return res.status(400).json({ error: "Invalid lead ID" });
    }

    // Build update data object
    const updateData = {};

    if (typeof forwarded === "boolean") {
      updateData.forwarded = forwarded;
    }

    if (qualified !== undefined) {
      updateData.qualified = qualified;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    // Check if lead exists
    const existingLead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!existingLead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    // Update lead
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: updateData,
      select: {
        id: true,
        forwarded: true,
        qualified: true,
        subjectLine: true,
        leadEmail: true,
        employee: {
          select: {
            employeeId: true,
            fullName: true,
          },
        },
      },
    });

    console.log(`✅ Lead ${leadId} bulk updated:`, updateData);
    res.json(updatedLead);
  } catch (error) {
    console.error("❌ Error bulk updating lead:", error);
    res.status(500).json({ error: "Failed to bulk update lead" });
  }
});

/* ===========================================================
   ✅ GET /api/employees/leads/today/count
   Get count of today's leads grouped by employee
   =========================================================== */
router.get("/leads/today/count", async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const employees = await prisma.employee.findMany({
      where: {
        role: "EMPLOYEE",
        isActive: true,
      },
      select: {
        employeeId: true,
        fullName: true,
        _count: {
          select: {
            leads: {
              where: {
                date: {
                  gte: startOfDay,
                  lte: endOfDay,
                },
              },
            },
          },
        },
      },
    });

    const result = employees.map((emp) => ({
      employeeId: emp.employeeId,
      fullName: emp.fullName,
      todayLeadsCount: emp._count.leads,
    }));

    console.log(
      `✅ Today's lead count fetched for ${employees.length} employees`
    );
    res.json(result);
  } catch (error) {
    console.error("❌ Error fetching today's lead count:", error);
    res.status(500).json({ error: "Failed to fetch today's lead count" });
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
        new Date(
          dayUSA.getFullYear(),
          dayUSA.getMonth(),
          dayUSA.getDate(),
          0,
          0,
          0
        ),
        USA_TZ
      );
      const end = fromZonedTime(
        new Date(
          dayUSA.getFullYear(),
          dayUSA.getMonth(),
          dayUSA.getDate(),
          23,
          59,
          59
        ),
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
      const start = fromZonedTime(
        new Date(nowUSA.getFullYear(), m, 1, 0, 0, 0),
        USA_TZ
      );
      const end = fromZonedTime(
        new Date(nowUSA.getFullYear(), m + 1, 0, 23, 59, 59),
        USA_TZ
      );
      monthsData[months[m]] = await getSummary(start, end);
    }

    res.json({ success: true, today, weekly: weeklyData, months: monthsData });
  } catch (err) {
    console.error("❌ Error in leads-summary:", err);
    res.status(500).json({ error: "Failed to fetch leads summary" });
  }
});

/* ===========================================================
   ✅ GET /api/employees/:id/leads
   Get all leads for a specific employee
   =========================================================== */
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
      fullName: employee.fullName,
      leads: employee.leads,
    });
  } catch (error) {
    console.error("Error fetching employee leads:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ===========================================================
   ✅ GET /api/employees/:id/target
   Get employee details including target
   =========================================================== */
router.get("/:id/target", async (req, res) => {
  const { id } = req.params;

  try {
    const employee = await prisma.employee.findUnique({
      where: { employeeId: id },
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

/* ===========================================================
   ✅ POST /api/employees
   Create a new employee
   =========================================================== */
router.post("/", async (req, res) => {
  try {
    const employeeData = req.body;

    // Check for duplicates
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
        joiningDate: employeeData.joiningDate
          ? new Date(employeeData.joiningDate)
          : null,
      },
    });

    res.json({ success: true, employee: created });
  } catch (error) {
    console.error("❌ Error creating employee:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

/* ===========================================================
   ✅ GET /api/employees/leads/:employeeId
   Get all leads for a specific employee by employeeId
   =========================================================== */
router.get("/leads/:employeeId", async (req, res) => {
  const { employeeId } = req.params;

  try {
    if (!employeeId) {
      return res.status(400).json({ error: "Employee ID is required" });
    }

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
      return res
        .status(404)
        .json({ message: "No leads found for this employee" });
    }

    res.json(leads);
  } catch (error) {
    console.error("Error fetching employee leads:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ===========================================================
   ✅ PUT /api/employees/leads/:id
   Update a lead
   =========================================================== */
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
      forwarded,
      qualified,
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
    if (forwarded !== undefined) updateData.forwarded = forwarded;
    if (qualified !== undefined) updateData.qualified = qualified;

    // Handle date
    if (date) {
      updateData.date = new Date(date);
    }

    // Update the lead
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: updateData,
    });

    console.log(`✅ Lead ${leadId} updated successfully`);
    res.json({ success: true, lead: updatedLead });
  } catch (error) {
    console.error("Error updating lead:", error);
    res.status(500).json({ error: "Failed to update lead" });
  }
});

/* ===========================================================
   GET /api/employees/leaderboard?period=today|month
   Returns ranking of employees by qualified leads for the chosen period
   =========================================================== */
router.get("/leaderboard", async (req, res) => {
  try {
    const { period = "today" } = req.query;

    let start, end;
    if (period === "month") {
      const m = getUSAMonthRange();
      start = m.start; end = m.end;
    } else if (period === "today") {
      const t = getUSATodayRange();
      start = t.start; end = t.end;
    } else {
      return res.status(400).json({ error: "Invalid period" });
    }

    // Fetch employees
    const employees = await prisma.employee.findMany({
      where: { role: "EMPLOYEE", isActive: true },
      select: { employeeId: true, fullName: true }
    });

    // Fetch qualified leads for selected range
    const leads = await prisma.lead.findMany({
      where: { qualified: true, date: { gte: start, lte: end } }
    });

    // Group by employee
    const byEmp = {};
    leads.forEach((l) => {
      if (!byEmp[l.employeeId]) byEmp[l.employeeId] = [];
      byEmp[l.employeeId].push(l);
    });

    const isAttendee = (l) => l?.leadType?.toLowerCase().includes("attend");
    const isUSA = (l) => l?.country?.toLowerCase().includes("us");

    const leaderboard = [];

    for (const emp of employees) {
      const eLeads = byEmp[emp.employeeId] || [];

      // Group employee leads by date
      const byDate = {};
      eLeads.forEach((l) => {
        const key = new Date(l.date).toISOString().slice(0, 10);
        if (!byDate[key]) byDate[key] = [];
        byDate[key].push(l);
      });

      // Incentive counters
      let c500 = 0, c1000 = 0, c1500 = 0, c5000 = 0;

      // Track daily performance for double target calculation
      let qualifiedDays = 0;

      Object.values(byDate).forEach((dayLeads) => {
        // Daily counts
        const dailyUS = dayLeads.filter(
          (l) => isAttendee(l) && isUSA(l) && (l.attendeesCount || 0) >= 1500
        ).length;

        let dailyMixed = 0;
        if (dailyUS < 7) {
          dailyMixed = dayLeads.filter(
            (l) => isAttendee(l) && (l.attendeesCount || 0) >= 1500
          ).length;
        } else {
          dailyMixed = dayLeads.filter(
            (l) =>
              isAttendee(l) &&
              !isUSA(l) &&
              (l.attendeesCount || 0) >= 1500
          ).length;
        }

        const dailyAssoc = dayLeads.filter(
          (l) =>
            l.leadType?.toLowerCase().includes("association") &&
            isUSA(l)
        ).length;

        // Check if employee qualified for any incentive tier on this day
        if (dailyUS >= 7 || dailyMixed >= 10 || dailyAssoc >= 12) {
          qualifiedDays++;
        }

        // Apply slabs
        // US Attendees
        if (dailyUS >= 15) c1500++;
        else if (dailyUS >= 10) c1000++;
        else if (dailyUS >= 7) c500++;

        // Mixed
        if (dailyMixed >= 15) c1000++;
        else if (dailyMixed >= 10) c500++;

        // Association
        if (dailyAssoc >= 18) c1000++;
        else if (dailyAssoc >= 12) c500++;
      });

      // Check for double target (qualified for at least 15 days in a month)
      if (period === "month" && qualifiedDays >= 15) {
        c5000 = 1;
      }

      // Total incentive amount
      const totalAmount =
        c500 * 500 +
        c1000 * 1000 +
        c1500 * 1500 +
        c5000 * 5000;

      leaderboard.push({
        employeeId: emp.employeeId,
        name: emp.fullName,
        c500,
        c1000,
        c1500,
        c5000,
        totalAmount,
        totalLeads: eLeads.length,
      });
    }

    // Sorting logic
    leaderboard.sort((a, b) => {
      if (b.totalAmount !== a.totalAmount)
        return b.totalAmount - a.totalAmount;
      return b.totalLeads - a.totalLeads;
    });

    res.json({ period, results: leaderboard });

  } catch (err) {
    console.error("❌ Leaderboard Error:", err);
    res.status(500).json({ error: "Failed to generate leaderboard" });
  }
});




/* ===========================================================
   GET /api/employees/incentive-summary
   Returns detailed incentive breakdown per employee
   =========================================================== */
router.get("/incentive-summary", async (req, res) => {
  try {
    const monthParam = req.query.month;
    let startMonth, endMonth;

    if (monthParam && monthParam.length === 7) {
      const [year, month] = monthParam.split("-").map(Number);
      startMonth = new Date(year, month - 1, 1, 0, 0, 0);
      endMonth = new Date(year, month, 0, 23, 59, 59);
    } else {
      const m = getUSAMonthRange();
      startMonth = m.start;
      endMonth = m.end;
    }

    const employees = await prisma.employee.findMany({
      where: { role: "EMPLOYEE", isActive: true },
      select: { employeeId: true, fullName: true, target: true }
    });

    const monthLeads = await prisma.lead.findMany({
      where: {
        qualified: true,
        date: { gte: startMonth, lte: endMonth }
      }
    });

    const groupByEmployee = (leads) =>
      leads.reduce((acc, l) => {
        acc[l.employeeId] = acc[l.employeeId] || [];
        acc[l.employeeId].push(l);
        return acc;
      }, {});

    const empLeads = groupByEmployee(monthLeads);

    const detailed = {
      usAttendees: { L7: [], L10: [], L15: [] },
      mixed: { L10: [], L15: [] },
      association: { L12: [], L18: [] },
      monthlyDoubleTarget: []
    };

    const add = (bucket, emp, records, amount) => {
      bucket.push({
        employeeId: emp.employeeId,
        name: emp.fullName,
        times: records.length,
        total: amount * records.length,
        dates: records     // <--- send dates to frontend
      });
    };

    const isAttendee = (l) => l.leadType?.toLowerCase().includes("attend");
    const isUSA = (l) => l.country?.toLowerCase().includes("us");

    for (const emp of employees) {
      const leads = empLeads[emp.employeeId] || [];

      // Group by date
      const byDate = {};
      leads.forEach((l) => {
        const key = new Date(l.date).toISOString().slice(0, 10);
        byDate[key] = byDate[key] || [];
        byDate[key].push(l);
      });

      const us7Records = [], us10Records = [], us15Records = [];
      const mix10Records = [], mix15Records = [];
      const assoc12Records = [], assoc18Records = [];

      Object.entries(byDate).forEach(([date, dayLeads]) => {
        // DAILY US Attendees
        const dailyUS = dayLeads.filter(
          (l) => isAttendee(l) && isUSA(l) && (l.attendeesCount || 0) >= 1500
        ).length;

        // DAILY MIXED
        let dailyMixed = 0;

        if (dailyUS < 7) {
          dailyMixed = dayLeads.filter(
            (l) => isAttendee(l) && (l.attendeesCount || 0) >= 1500
          ).length;
        } else {
          dailyMixed = dayLeads.filter(
            (l) =>
              isAttendee(l) &&
              !isUSA(l) &&
              (l.attendeesCount || 0) >= 1500
          ).length;
        }

        // DAILY ASSOCIATION
        const dailyAssoc = dayLeads.filter(
          (l) =>
            l.leadType?.toLowerCase().includes("association") &&
            isUSA(l)
        ).length;

        // --- US Attendees slabs ---
        if (dailyUS >= 15) us15Records.push({ date, count: dailyUS });
        else if (dailyUS >= 10) us10Records.push({ date, count: dailyUS });
        else if (dailyUS >= 7) us7Records.push({ date, count: dailyUS });

        // --- Mixed slabs ---
        if (dailyMixed >= 15) mix15Records.push({ date, count: dailyMixed });
        else if (dailyMixed >= 10) mix10Records.push({ date, count: dailyMixed });

        // --- Association slabs ---
        if (dailyAssoc >= 18) assoc18Records.push({ date, count: dailyAssoc });
        else if (dailyAssoc >= 12) assoc12Records.push({ date, count: dailyAssoc });
      });

      // PUSH RESULTS
      if (us15Records.length) add(detailed.usAttendees.L15, emp, us15Records, 1500);
      if (us10Records.length) add(detailed.usAttendees.L10, emp, us10Records, 1000);
      if (us7Records.length) add(detailed.usAttendees.L7, emp, us7Records, 500);

      if (mix15Records.length) add(detailed.mixed.L15, emp, mix15Records, 1000);
      if (mix10Records.length) add(detailed.mixed.L10, emp, mix10Records, 500);

      if (assoc18Records.length) add(detailed.association.L18, emp, assoc18Records, 1000);
      if (assoc12Records.length) add(detailed.association.L12, emp, assoc12Records, 500);

      // MONTHLY DOUBLE TARGET
      const qualifiedMonthly = leads.length;
      if (emp.target && qualifiedMonthly >= emp.target * 2) {
        detailed.monthlyDoubleTarget.push({
          employeeId: emp.employeeId,
          name: emp.fullName,
          times: 1,
          total: 5000
        });
      }
    }

    res.json(detailed);

  } catch (err) {
    console.error("❌ Incentive Summary Error:", err);
    res.status(500).json({ error: "Failed to fetch incentive summary" });
  }
});






export default router;
