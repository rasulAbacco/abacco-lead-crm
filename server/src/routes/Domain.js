import express from "express";
import { PrismaClient } from "@prisma/client";
const router = express.Router();
const prisma = new PrismaClient();

router.get("/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;

    console.log("Employee ID:", employeeId);

    // Fetch employee domains
    const domains = await prisma.emailDomain.findMany({
      where: { employeeId },
      orderBy: { createdAt: "desc" },
    });

    if (domains.length === 0) {
      return res.json({ domains: [] });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Normalize email list
    const emails = domains.map((d) => d.email.trim().toLowerCase());

    // Fetch all leads in ONE query
    const leads = await prisma.lead.findMany({
      where: {
        employeeId,
        leadEmail: {
          in: emails,
        },
      },
      select: {
        leadEmail: true,
        date: true,
      },
    });

    // Count leads in memory
    const leadCounts = {};

    for (const lead of leads) {
      const email = lead.leadEmail.trim().toLowerCase();

      if (!leadCounts[email]) {
        leadCounts[email] = {
          totalCount: 0,
          currentMonthCount: 0,
        };
      }

      leadCounts[email].totalCount++;

      if (lead.date >= startOfMonth && lead.date < endOfMonth) {
        leadCounts[email].currentMonthCount++;
      }
    }

    // Merge counts into domains
    const domainsWithCounts = domains.map((domain) => {
      const email = domain.email.trim().toLowerCase();

      return {
        ...domain,
        totalCount: leadCounts[email]?.totalCount || 0,
        currentMonthCount: leadCounts[email]?.currentMonthCount || 0,
      };
    });

    res.json({
      domains: domainsWithCounts,
    });
  } catch (error) {
    console.error("Error fetching domains:", error);
    res.status(500).json({
      error: "Failed to fetch domains",
    });
  }
});

// Create new domain
router.post("/", async (req, res) => {
  try {
    const { email, domain, isActive, employeeId } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    const newDomain = await prisma.emailDomain.create({
      data: {
        email: normalizedEmail,
        domain,
        isActive,
        employeeId,
      },
    });

    res.json({ domain: newDomain });
  } catch (error) {
    console.error("Error creating domain:", error);
    res.status(500).json({ error: "Failed to create domain" });
  }
});

// Update domain status
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const updated = await prisma.emailDomain.update({
      where: { id: parseInt(id) },
      data: { isActive },
    });

    res.json({ domain: updated });
  } catch (error) {
    console.error("Error updating domain:", error);
    res.status(500).json({ error: "Failed to update domain" });
  }
});

// Delete domain
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.emailDomain.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Domain deleted successfully" });
  } catch (error) {
    console.error("Error deleting domain:", error);
    res.status(500).json({ error: "Failed to delete domain" });
  }
});

export default router;
