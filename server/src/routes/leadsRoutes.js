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

// ==========================================================
// ✅ Create Lead (Central USA Time)
// ==========================================================


router.post("/", async (req, res) => {
  try {
    const { leads } = req.body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ success: false, message: "No leads provided" });
    }

    const lead = leads[0];
    const { id, clientEmail, link, subjectLine, date } = lead;

    if (!clientEmail || !link || !subjectLine) {
      return res.status(400).json({
        success: false,
        message: "Client email, link, and subject line are required",
      });
    }

    // Normalize email and link
    const normalizeEmail = (e) => (e || "").trim().toLowerCase();
    const normalizeLink = (raw) => {
      if (!raw) return "";
      let s = raw.trim();
      if (!/^https?:\/\//i.test(s)) s = "http://" + s;
      try {
        const u = new URL(s);
        u.hash = "";
        u.searchParams.forEach((v, k) => {
          if (k.startsWith("utm_") || ["fbclid", "gclid"].includes(k))
            u.searchParams.delete(k);
        });
        u.pathname = u.pathname.replace(/\/+$/, "");
        return `${u.protocol}//${u.hostname}${u.pathname}${u.search || ""}`.toLowerCase();
      } catch {
        return s.replace(/\/+$/, "").toLowerCase();
      }
    };

    // Normalize subject line
    const normalizeSubject = (s) => {
      if (!s) return "";
      return s.trim().toLowerCase();
    };

    const normalizedClientEmail = normalizeEmail(clientEmail);
    const normalizedLink = normalizeLink(link);
    const normalizedSubjectLine = normalizeSubject(subjectLine);

    // Prevent duplicates (within last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const existingLead = await prisma.lead.findFirst({
      where: {
        clientEmail: normalizedClientEmail,
        link: normalizedLink,
        subjectLine: normalizedSubjectLine, // Added subjectLine to duplicate check
        createdAt: { gte: threeMonthsAgo },
      },
    });

    if (existingLead) {
      const retryAfter = new Date(existingLead.createdAt);
      retryAfter.setMonth(retryAfter.getMonth() + 3);
      const remainingDays = Math.ceil((retryAfter - new Date()) / (1000 * 60 * 60 * 24));

      return res.status(400).json({
        success: false,
        duplicate: true,
        message: `Duplicate found (created on ${existingLead.createdAt.toLocaleDateString(
          "en-IN"
        )}). You can resubmit after ${remainingDays} day(s).`,
        existingDate: existingLead.createdAt,
        retryAfterDays: remainingDays,
      });
    }

    // ✅ Use Central USA timezone-based UTC date
    const usaDate = getUSADateTime();
    const utcDate = fromZonedTime(usaDate, "America/Chicago");

    const { id: _, ...leadData } = lead;

    const newLead = await prisma.lead.create({
      data: {
        ...leadData,
        clientEmail: normalizedClientEmail,
        link: normalizedLink,
        subjectLine: normalizedSubjectLine, // Store normalized subject line
        // ✅ FIXED: ensure selected date falls in US day (noon CST)
        date: date
          ? fromZonedTime(`${date}T12:00:00`, "America/Chicago")
          : utcDate,
      },
    });

    return res.status(201).json({ success: true, lead: newLead });
  } catch (error) {
    console.error("❌ Error creating lead:", error);
    if (error.code === "P2002") {
      return res.status(400).json({
        success: false,
        duplicate: true,
        message: "Duplicate lead already exists.",
      });
    }
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==========================================================
// ✅ Get all leads by employee ID
// ==========================================================
router.get("/", async (req, res) => {
  try {
    const { employeeId } = req.query;

    if (!employeeId) {
      return res.status(400).json({ success: false, message: "Employee ID is required" });
    }

    const leads = await prisma.lead.findMany({
      where: { employeeId: employeeId.toString() },
      orderBy: { id: "desc" },
    });

    res.json({ success: true, leads });
  } catch (err) {
    console.error("Error fetching leads:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================================
// ✅ Get single lead by ID
// ==========================================================
router.get("/:id", async (req, res) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }
    res.json({ success: true, lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================================
// ✅ Get count of leads by email
// ==========================================================
router.get("/count/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const count = await prisma.lead.count({
      where: { leadEmail: email },
    });

    res.json({ success: true, email, count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================================
// ✅ Update lead (maintaining Central USA Time)
// ==========================================================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let { date, ...data } = req.body;

    if (date) {
      const parsed = new Date(date);
      data.date = isNaN(parsed.getTime())
        ? fromZonedTime(getUSADateTime(), "America/Chicago")
        : parsed;
    } else {
      data.date = fromZonedTime(getUSADateTime(), "America/Chicago");
    }

    const updatedLead = await prisma.lead.update({
      where: { id: Number(id) },
      data,
    });

    res.json({ success: true, lead: updatedLead });
  } catch (err) {
    console.error("Error updating lead:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================================
// ✅ Delete lead
// ==========================================================
router.delete("/:id", async (req, res) => {
  try {
    await prisma.lead.delete({
      where: { id: Number(req.params.id) },
    });
    res.json({ success: true, message: "Lead deleted" });
  } catch (err) {
    console.error("Error deleting lead:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================================
// ✅ Fetch all leads with employee info
// ==========================================================
router.get("/all", async (req, res) => {
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
      subjectLine: lead.subjectLine,
      leadType: lead.leadType,
      date: toUSAZone(lead.date),
      link: lead.link,
      employee: lead.employee,
    }));

    res.json(formattedLeads);
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

// ==========================================================
// ✅ Get Today's Leads (Central USA Time)
// ==========================================================
router.get("/today", async (req, res) => {
  try {
    const { start, end } = getUSATodayRange();

    const leads = await prisma.lead.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = leads.map((lead) => ({
      ...lead,
      createdAt: toUSAZone(lead.createdAt),
    }));

    res.json({ success: true, leads: formatted });
  } catch (err) {
    console.error("Error fetching today's leads:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
