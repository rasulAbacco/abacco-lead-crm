import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// Create Lead

// POST /api/leads
router.post("/", async (req, res) => {
  try {
    const { leads } = req.body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ success: false, message: "No leads provided" });
    }

    const lead = leads[0];
    const { id, clientEmail, link, date } = lead;

    if (!clientEmail || !link) {
      return res.status(400).json({ success: false, message: "Client email and link are required" });
    }

    const normalizeEmail = (e) => (e || "").trim().toLowerCase();
    const normalizeLink = (raw) => {
      if (!raw) return "";
      let s = raw.trim();
      if (!/^https?:\/\//i.test(s)) s = "http://" + s;
      try {
        const u = new URL(s);
        u.hash = "";
        u.searchParams.forEach((v, k) => {
          if (k.startsWith("utm_") || ["fbclid", "gclid"].includes(k)) u.searchParams.delete(k);
        });
        u.pathname = u.pathname.replace(/\/+$/, "");
        return `${u.protocol}//${u.hostname}${u.pathname}${u.search || ""}`.toLowerCase();
      } catch {
        return s.replace(/\/+$/, "").toLowerCase();
      }
    };

    const normalizedClientEmail = normalizeEmail(clientEmail);
    const normalizedLink = normalizeLink(link);

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const existingLead = await prisma.lead.findFirst({
      where: {
        clientEmail: normalizedClientEmail,
        link: normalizedLink,
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
        message: `Duplicate found (created on ${existingLead.createdAt.toLocaleDateString("en-IN")}). You can resubmit after ${remainingDays} day(s).`,
        existingDate: existingLead.createdAt,
        retryAfterDays: remainingDays,
      });
    }

    // ✅ Safe insert (no overwriting)
    const { id: _, ...leadData } = lead;
    const newLead = await prisma.lead.create({
      data: {
        ...leadData,
        clientEmail: normalizedClientEmail,
        link: normalizedLink,
        date: new Date(date || new Date()),
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


// Get all leads
router.get("/", async (req, res) => {
  try {
    const { employeeId } = req.query;

    if (!employeeId) {
      return res.status(400).json({ success: false, message: "Employee ID is required" });
    }

    const leads = await prisma.lead.findMany({
      where: { employeeId: employeeId.toString() },
    });

    res.json({ success: true, leads });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single lead
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


// ✅ Get count of leads by email
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


// Update lead
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let { date, ...data } = req.body;

    if (date) {
      const parsed = new Date(date);
      data.date = isNaN(parsed.getTime()) ? new Date() : parsed;
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

// Delete lead
router.delete("/:id", async (req, res) => {
  try {
    await prisma.lead.delete({
      where: { id: Number(req.params.id) },
    });
    res.json({ success: true, message: "Lead deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ New route: Fetch all leads with employee info
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
      date: lead.date,
      link: lead.link,
      employee: lead.employee, // nested employee info if needed
    }));

    res.json(formattedLeads);
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});


export default router;

