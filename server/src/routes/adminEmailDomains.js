import express from "express";
import { PrismaClient } from "@prisma/client";
const router = express.Router();
const prisma = new PrismaClient();

// Get all employees with their domains and lead counts
router.get("/email-domains-all", async (req, res) => {
  try {
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
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    // Add leadCount to each domain safely
    const employeesWithLeadCounts = await Promise.all(
      employees.map(async (employee) => {
        // 🛡️ Always ensure array
        const domains = Array.isArray(employee.mailDomains)
          ? employee.mailDomains
          : [];

        const domainsWithCounts = await Promise.all(
          domains.map(async (domain) => {
            const leadCount = await prisma.lead.count({
              where: {
                leadEmail: domain.email,
              },
            });

            return {
              ...domain,
              leadCount: Number(leadCount) || 0, // prevents NaN
            };
          }),
        );

        return {
          ...employee,
          mailDomains: domainsWithCounts, // ⚠️ must stay mailDomains
        };
      }),
    );

    res.json({ employees: employeesWithLeadCounts });
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
