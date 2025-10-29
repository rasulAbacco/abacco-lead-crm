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
router.post("/leads/:id/forward", async (req, res) => {
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

    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: { forwarded: true },
      select: {
        id: true,
        forwarded: true,
        qualified: true,
        subjectLine: true,
        leadEmail: true,
      },
    });

    console.log(`✅ Lead ${leadId} marked as forwarded`);
    res.json(updatedLead);
  } catch (error) {
    console.error("❌ Error forwarding lead:", error);
    res.status(500).json({ error: "Failed to forward lead" });
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

    // Validate qualified value
    if (typeof qualified !== "boolean") {
      return res.status(400).json({ 
        error: "Invalid qualified value. Must be true or false" 
      });
    }

    // Check if lead exists
    const existingLead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!existingLead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    // Update lead qualification status
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
    
    // Use provided date or today's date
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Get all leads for the target date
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
      forwarded: leads.filter(l => l.forwarded).length,
      qualified: leads.filter(l => l.qualified === true).length,
      disqualified: leads.filter(l => l.qualified === false).length,
      pending: leads.filter(l => l.qualified === null).length,
    };

    console.log(`✅ Stats fetched for ${targetDate.toISOString().split('T')[0]}:`, stats);
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

    const result = employees.map(emp => ({
      employeeId: emp.employeeId,
      fullName: emp.fullName,
      todayLeadsCount: emp._count.leads,
    }));

    console.log(`✅ Today's lead count fetched for ${employees.length} employees`);
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
        joiningDate: employeeData.joiningDate ? new Date(employeeData.joiningDate) : null,
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
      return res.status(404).json({ message: "No leads found for this employee" });
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

export default router;