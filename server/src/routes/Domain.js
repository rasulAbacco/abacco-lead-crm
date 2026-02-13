import express from "express";
import { PrismaClient } from "@prisma/client";
const router = express.Router();
const prisma = new PrismaClient();
// Get all domains for an employee
// router.get("/:employeeId", async (req, res) => {
//   try {
//     const { employeeId } = req.params;

//     const domains = await prisma.emailDomain.findMany({
//       where: { employeeId },
//       orderBy: { createdAt: "desc" },
//     });

//     res.json({ domains });
//   } catch (error) {
//     console.error("Error fetching domains:", error);
//     res.status(500).json({ error: "Failed to fetch domains" });
//   }
// });
router.get("/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;

    const domains = await prisma.emailDomain.findMany({
      where: { employeeId },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const domainsWithCounts = await Promise.all(
      domains.map(async (domain) => {
        const normalizedEmail = domain.email?.trim().toLowerCase();

        // ✅ Total Leads (match employeeId also)
        const totalCount = await prisma.lead.count({
          where: {
            employeeId: employeeId,
            leadEmail: {
              equals: normalizedEmail,
              mode: "insensitive", // 🔥 important
            },
          },
        });

        // ✅ Current Month Leads
        const currentMonthCount = await prisma.lead.count({
          where: {
            employeeId: employeeId,
            leadEmail: {
              equals: normalizedEmail,
              mode: "insensitive",
            },
            date: {
              gte: startOfMonth,
              lt: endOfMonth,
            },
          },
        });

        return {
          ...domain,
          totalCount,
          currentMonthCount,
        };
      }),
    );

    res.json({ domains: domainsWithCounts });
  } catch (error) {
    console.error("Error fetching domains:", error);
    res.status(500).json({ error: "Failed to fetch domains" });
  }
});

// Create new domain
router.post("/", async (req, res) => {
  try {
    const { email, domain, isActive, employeeId } = req.body;

    const newDomain = await prisma.emailDomain.create({
      data: {
        email,
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
