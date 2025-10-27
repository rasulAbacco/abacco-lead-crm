import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate, authorizeRole } from "../middlewares/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * ✅ ADMIN: Share a new link with employees
 */
router.post("/share", authenticate, authorizeRole("ADMIN"), async (req, res) => {
  try {
    const { link, linkType, country, recipientIds } = req.body;
    const createdById = req.user?.id || req.user?.userId;

    // Validate user identity
    if (!createdById) {
      console.warn("⚠️ Missing user ID in token:", req.user);
      return res.status(401).json({ message: "Invalid or missing user ID in token" });
    }

    // Validate link
    if (!link || typeof link !== "string" || link.trim() === "") {
      return res.status(400).json({ message: "Valid link URL is required" });
    }

    // Validate link type
    const validTypes = ["Association Type", "Industry Type", "Attendees Type", "World Wide"];
    if (!linkType || !validTypes.includes(linkType)) {
      return res.status(400).json({ message: "Valid link type is required" });
    }

    // Validate country
    if (!country || typeof country !== "string" || country.trim() === "") {
      return res.status(400).json({ message: "Country is required" });
    }

    // Validate recipients
    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
      return res.status(400).json({ message: "Please select at least one employee" });
    }

    // Verify recipients exist and are employees
    const validRecipients = await prisma.employee.findMany({
      where: {
        id: { in: recipientIds },
        role: "EMPLOYEE",
        isActive: true,
      },
      select: { id: true },
    });

    if (validRecipients.length !== recipientIds.length) {
      return res.status(400).json({
        message: "One or more invalid employee IDs provided",
      });
    }

    // Create Shared Link with recipients
    const shared = await prisma.sharedLink.create({
      data: {
        link: link.trim(),
        linkType,
        country: country.trim(),
        createdById,
        recipients: {
          create: recipientIds.map((rid) => ({
            recipientId: rid,
          })),
        },
      },
      include: {
        recipients: {
          include: {
            recipient: {
              select: {
                id: true,
                employeeId: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            employeeId: true,
            fullName: true,
          },
        },
      },
    });

    console.log("✅ Shared link created successfully:", shared.id);
    return res.status(201).json(shared);
  } catch (err) {
    console.error("❌ Error creating shared link:", err);

    if (err.name === "PrismaClientValidationError") {
      return res.status(400).json({
        message: "Invalid data provided. Please check your inputs.",
        error: err.message,
      });
    }

    if (err.code === "P2003") {
      return res.status(400).json({
        message: "Foreign key constraint failed – invalid employee IDs.",
      });
    }

    return res.status(500).json({ message: "Error creating shared link" });
  }
});

/**
 * ✅ ADMIN: Get all shared link info with recipients
 */
router.get("/shared-info", authenticate, authorizeRole("ADMIN"), async (req, res) => {
  try {
    const links = await prisma.sharedLink.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            employeeId: true,
            fullName: true,
          },
        },
        recipients: {
          include: {
            recipient: {
              select: {
                id: true,
                employeeId: true,
                fullName: true,
                email: true,
              },
            },
          },
          orderBy: {
            receivedDate: "desc",
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(Array.isArray(links) ? links : []);
  } catch (err) {
    console.error("❌ Error fetching shared info:", err);
    res.status(500).json({ message: "Failed to load shared info" });
  }
});

/**
 * ✅ EMPLOYEE: Get all links shared with this employee
 */
router.get("/my", authenticate, authorizeRole("EMPLOYEE"), async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;

    if (!userId) {
      return res.status(401).json({ message: "Invalid user ID in token" });
    }

    const recs = await prisma.receivedLink.findMany({
      where: { recipientId: userId },
      include: {
        sharedLink: {
          include: {
            createdBy: {
              select: {
                id: true,
                employeeId: true,
                fullName: true,
              },
            },
          },
        },
        recipient: {
          select: {
            id: true,
            employeeId: true,
            fullName: true,
          },
        },
      },
      orderBy: { receivedDate: "desc" },
    });
    res.json(Array.isArray(recs) ? recs : []);
  } catch (err) {
    console.error("❌ Error fetching employee links:", err);
    res.status(500).json({ message: "Failed to load employee links" });
  }
});

/**
 * ✅ ADMIN: Delete a shared link and all its assignments
 */
router.delete("/:id", authenticate, authorizeRole("ADMIN"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid link ID" });
    }

    // Check if link exists
    const existingLink = await prisma.sharedLink.findUnique({
      where: { id },
    });

    if (!existingLink) {
      return res.status(404).json({ message: "Link not found" });
    }

    // Delete all received links first (cascade)
    await prisma.receivedLink.deleteMany({
      where: { sharedLinkId: id },
    });

    // Delete the shared link
    await prisma.sharedLink.delete({
      where: { id },
    });

    console.log("✅ Shared link deleted successfully:", id);
    res.json({ message: "Shared link deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting link:", err);
    res.status(500).json({ message: "Failed to delete link" });
  }
});

/**
 * ✅ EMPLOYEE: Delete a received link (remove from their list)
 */
router.delete("/received/:id", authenticate, authorizeRole("EMPLOYEE"), async (req, res) => {
  try {
    const receivedLinkId = parseInt(req.params.id);
    const userId = req.user.id || req.user.userId;

    if (isNaN(receivedLinkId)) {
      return res.status(400).json({ message: "Invalid link ID" });
    }

    // Verify this received link belongs to the user
    const receivedLink = await prisma.receivedLink.findFirst({
      where: {
        id: receivedLinkId,
        recipientId: userId,
      },
    });

    if (!receivedLink) {
      return res.status(404).json({ message: "Link not found or you don't have access" });
    }

    // Delete the received link
    await prisma.receivedLink.delete({
      where: { id: receivedLinkId },
    });

    console.log("✅ Received link deleted successfully:", receivedLinkId);
    res.json({ message: "Link removed successfully" });
  } catch (err) {
    console.error("❌ Error deleting received link:", err);
    res.status(500).json({ message: "Failed to delete link" });
  }
});

/**
 * ✅ ADMIN: Update link details (link, linkType, country)
 */
router.put("/:id", authenticate, authorizeRole("ADMIN"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { link, linkType, country } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid link ID" });
    }

    // Validate inputs
    if (!link || typeof link !== "string" || link.trim() === "") {
      return res.status(400).json({ message: "Valid link URL is required" });
    }

    const validTypes = ["Association Type", "Industry Type", "Attendees Type", "World Wide"];
    if (!linkType || !validTypes.includes(linkType)) {
      return res.status(400).json({ message: "Valid link type is required" });
    }

    if (!country || typeof country !== "string" || country.trim() === "") {
      return res.status(400).json({ message: "Country is required" });
    }

    // Check if link exists
    const existingLink = await prisma.sharedLink.findUnique({
      where: { id },
    });

    if (!existingLink) {
      return res.status(404).json({ message: "Link not found" });
    }

    // Update the link
    const updated = await prisma.sharedLink.update({
      where: { id },
      data: {
        link: link.trim(),
        linkType,
        country: country.trim(),
      },
      include: {
        recipients: {
          include: {
            recipient: {
              select: {
                id: true,
                employeeId: true,
                fullName: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            employeeId: true,
            fullName: true,
          },
        },
      },
    });

    console.log("✅ Link updated successfully:", id);
    res.json(updated);
  } catch (err) {
    console.error("❌ Error updating link:", err);
    res.status(500).json({ message: "Failed to update link" });
  }
});

/**
 * ✅ ADMIN: Update recipients for a link (add/remove employees)
 */
router.put("/:id/recipients", authenticate, authorizeRole("ADMIN"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { recipientIds } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid link ID" });
    }

    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
      return res.status(400).json({ message: "Please select at least one employee" });
    }

    // Verify link exists
    const existingLink = await prisma.sharedLink.findUnique({
      where: { id },
    });

    if (!existingLink) {
      return res.status(404).json({ message: "Link not found" });
    }

    // Verify recipients exist
    const validRecipients = await prisma.employee.findMany({
      where: {
        id: { in: recipientIds },
        role: "EMPLOYEE",
        isActive: true,
      },
      select: { id: true },
    });

    if (validRecipients.length !== recipientIds.length) {
      return res.status(400).json({
        message: "One or more invalid employee IDs provided",
      });
    }

    // Delete existing recipients
    await prisma.receivedLink.deleteMany({
      where: { sharedLinkId: id },
    });

    // Create new recipients
    await prisma.receivedLink.createMany({
      data: recipientIds.map((rid) => ({
        sharedLinkId: id,
        recipientId: rid,
      })),
    });

    // Fetch updated link
    const updated = await prisma.sharedLink.findUnique({
      where: { id },
      include: {
        recipients: {
          include: {
            recipient: {
              select: {
                id: true,
                employeeId: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    console.log("✅ Recipients updated successfully for link:", id);
    res.json(updated);
  } catch (err) {
    console.error("❌ Error updating recipients:", err);
    res.status(500).json({ message: "Failed to update recipients" });
  }
});

export default router;