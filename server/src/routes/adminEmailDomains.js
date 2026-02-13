import express from "express";
import { PrismaClient } from "@prisma/client";
import NodeCache from "node-cache";
const router = express.Router();
const prisma = new PrismaClient();
const cache = new NodeCache({ stdTTL: 300 });

// Get all employees with their domains and lead counts
router.get("/email-domains-all", async (req, res) => {
  try {
    // 1️⃣ Fetch employees with domains
    const employees = await prisma.employee.findMany({
      where: {
        role: "EMPLOYEE",
        isActive: true,
      },
      select: {
        id: true,
        employeeId: true,
        fullName: true,
        email: true,
        mailDomains: {
          select: {
            id: true,
            email: true,
            domain: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    // 2️⃣ Fetch all leads once
    const leads = await prisma.lead.findMany({
      select: {
        employeeId: true,
        leadEmail: true,
        date: true,
      },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // 3️⃣ Build email-based stats map
    // Key format: "employeeId_clientEmail"
    const stats = {};

    leads.forEach((lead) => {
      if (!lead.employeeId || !lead.leadEmail) return;

      const empId = String(lead.employeeId).trim();
      const leadEmail = lead.leadEmail.toLowerCase().trim();

      const key = `${empId}_${leadEmail}`;

      if (!stats[key]) {
        stats[key] = { total: 0, currentMonth: 0 };
      }

      stats[key].total++;

      if (lead.date >= startOfMonth && lead.date < endOfMonth) {
        stats[key].currentMonth++;
      }
    });

    // 4️⃣ Attach correct counts per employee and domain email
    const result = employees.map((employee) => {
      const updatedDomains = employee.mailDomains.map((domain) => {
        const domainEmail = domain.email.toLowerCase().trim();
        const key = `${employee.employeeId}_${domainEmail}`;
        const domainStats = stats[key] || {
          total: 0,
          currentMonth: 0,
        };

        return {
          ...domain,
          totalCount: domainStats.total,
          currentMonthCount: domainStats.currentMonth,
        };
      });

      return {
        ...employee,
        mailDomains: updatedDomains,
      };
    });

    res.json({ employees: result });
  } catch (error) {
    console.error("Error fetching admin email domains:", error);
    res.status(500).json({ error: "Failed to fetch email domains" });
  }
});

// Delete a domain (admin only)
router.delete("/email-domains/:id", async (req, res) => {
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

// Toggle domain status (admin only)
router.patch("/email-domains/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const updated = await prisma.emailDomain.update({
      where: { id: parseInt(id) },
      data: { isActive },
    });

    res.json({ domain: updated });
  } catch (error) {
    console.error("Error updating domain status:", error);
    res.status(500).json({ error: "Failed to update domain status" });
  }
});

export default router;
