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


// ==========================================================
// ✅ Create Lead (Central USA Time) — Updated with Domain + Keyword Subject Match
// ==========================================================

router.post("/", async (req, res) => {
  try {
    const { leads } = req.body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No leads provided",
      });
    }

    const lead = leads[0];
    const { clientEmail, link, subjectLine, date } = lead;

    if (!clientEmail || !link || !subjectLine) {
      return res.status(400).json({
        success: false,
        message: "Client email, link, and subject line are required",
      });
    }

    // -----------------------------------------------------------
    // Normalizers
    // -----------------------------------------------------------
    const normalizeEmail = (e) => (e || "").trim().toLowerCase();

    const normalizeLink = (raw) => {
      if (!raw) return "";
      let s = raw.trim();
      if (!/^https?:\/\//i.test(s)) s = "http://" + s;
      try {
        const u = new URL(s);
        u.hash = "";
        u.searchParams.forEach((v, k) => {
          if (k.startsWith("utm_") || ["fbclid", "gclid"].includes(k)) {
            u.searchParams.delete(k);
          }
        });
        return `${u.protocol}//${u.hostname}${u.pathname.replace(/\/+$/, "")}`;
      } catch {
        return s.replace(/\/+$/, "");
      }
    };

    const normalizeSubject = (s) => (s || "").trim().toLowerCase();

    // -----------------------------------------------------------
    // NEW: Extract Domain Only
    // -----------------------------------------------------------
    const extractDomain = (raw) => {
      try {
        const u = new URL(normalizeLink(raw));
        return u.hostname.toLowerCase();
      } catch {
        return "";
      }
    };

    // -----------------------------------------------------------
    // NEW: Keyword Extraction
    // Removes filler words like: list, mailing, professionals, verified, etc.
    // -----------------------------------------------------------
    const extractKeywords = (text) => {
      if (!text) return [];
      const blacklist = [
        "list",
        "mailing",
        "verified",
        "professional",
        "professionals",
        "email",
        "contacts",
        "contact",
        "database"
      ];

      return text
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w && !blacklist.includes(w));
    };

    // Apply Normalization
    const normalizedEmail = normalizeEmail(clientEmail);
    const normalizedLink = normalizeLink(link);
    const normalizedSubject = normalizeSubject(subjectLine);
    const domain = extractDomain(normalizedLink);
    const subjectKeywords = extractKeywords(normalizedSubject);

    // -----------------------------------------------------------
    // NEW: Duplicate Logic (Last 3 months)
    // -----------------------------------------------------------
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Fetch all leads from same domain + email (within 3 months)
    const possibleDuplicates = await prisma.lead.findMany({
      where: {
        clientEmail: normalizedEmail,
        createdAt: { gte: threeMonthsAgo }
      }
    });

    // Check keyword similarity
    const isSubjectSimilar = (a, b) => {
      const aWords = extractKeywords(a);
      const bWords = extractKeywords(b);
      return aWords.join(" ") === bWords.join(" ");
    };

    const foundDuplicate = possibleDuplicates.find((item) => {
      const itemDomain = extractDomain(item.link);
      const itemSubject = item.subjectLine;

      const sameDomain = itemDomain === domain;
      const sameSubjectMeaning =
        isSubjectSimilar(itemSubject, normalizedSubject);

      return sameDomain && sameSubjectMeaning;
    });

    if (foundDuplicate) {
      const retryAfter = new Date(foundDuplicate.createdAt);
      retryAfter.setMonth(retryAfter.getMonth() + 3);
      const remainingDays = Math.ceil(
        (retryAfter - new Date()) / (1000 * 60 * 60 * 24)
      );

      return res.status(400).json({
        success: false,
        duplicate: true,
        message: `This lead looks similar to one already submitted within the last 3 months.`,
        reason: "Same domain and similar subject meaning.",
        retryAfterDays: remainingDays,
      });
    }

    // -----------------------------------------------------------
    // Save Lead
    // -----------------------------------------------------------
    const usaDate = getUSADateTime();
    const utcDate = fromZonedTime(usaDate, "America/Chicago");

    const { id: _, ...leadData } = lead;

    const newLead = await prisma.lead.create({
      data: {
        ...leadData,
        clientEmail: normalizedEmail,
        link: normalizedLink,
        subjectLine: normalizedSubject,
        date: date
          ? fromZonedTime(`${date}T12:00:00`, "America/Chicago")
          : utcDate,
      },
    });

    return res.status(201).json({ success: true, lead: newLead });
  } catch (error) {
    console.error("❌ Error creating lead:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
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
