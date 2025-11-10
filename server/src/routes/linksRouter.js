import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate, authorizeRole } from "../middlewares/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * ✅ ADMIN: Share a new link with employees
 */
router.post("/share", authenticate, async (req, res) => {
  try {
    // -- normalize & inspect incoming user for robust authorization --
    const rawRole = req.user?.role;
    const rawEmployeeId = req.user?.employeeId || req.user?.employee_id || req.user?.empId;
    const role = rawRole ? String(rawRole).trim().toUpperCase() : null;
    const employeeId = rawEmployeeId ? String(rawEmployeeId).trim().toUpperCase() : null;

    console.log("/share - req.user:", JSON.stringify(req.user, null, 2));

    // Allow ADMIN or the special employee AT014
    if (!(role === "ADMIN" || (role === "EMPLOYEE" && employeeId === "AT014"))) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    // -- inputs --
    const { link, linkType, country, recipientIds } = req.body;

    // Prefer DB id from token, but keep previous fallbacks and log if missing
    const createdById = req.user?.id || req.user?.userId;
    if (!createdById) {
      console.warn("⚠️ Missing user ID in token (createdById). req.user:", req.user);
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

    // Create Shared Link with recipients (with notification fields)
    const shared = await prisma.sharedLink.create({
      data: {
        link: link.trim(),
        linkType,
        country: country.trim(),
        createdById,
        recipients: {
          create: recipientIds.map((rid) => ({
            recipientId: rid,
            isSeen: false,    // new notification — not seen yet
            isRead: false,    // not clicked/opened yet
            receivedDate: new Date(),
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
router.get("/shared-info", authenticate, async (req, res) => {
  try {
    const { role, employeeId } = req.user || {};

    // ✅ Only allow Admin or specific Employee ID AT014
    if (!(role === "ADMIN" || (role === "EMPLOYEE" && employeeId === "AT014"))) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    // ✅ Original logic
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
/**
 * ✅ ADMIN (or special employee AT014): Update link details (link, linkType, country)
 */
router.put("/:id", authenticate, async (req, res) => {
  try {
    // --- normalize & debug incoming user ---
    const rawRole = req.user?.role;
    const rawEmployeeId = req.user?.employeeId || req.user?.employee_id || req.user?.empId;
    const role = rawRole ? String(rawRole).trim().toUpperCase() : null;
    const employeeId = rawEmployeeId ? String(rawEmployeeId).trim().toUpperCase() : null;

    console.log("/links/:id - req.user:", JSON.stringify(req.user, null, 2));

    // Allow ADMIN or the special employee AT014
    if (!(role === "ADMIN" || (role === "EMPLOYEE" && employeeId === "AT014"))) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    // --- inputs ---
    const id = parseInt(req.params.id, 10);
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
    return res.json(updated);
  } catch (err) {
    console.error("❌ Error updating link:", err);
    return res.status(500).json({ message: "Failed to update link" });
  }
});

/**
 * ✅ ADMIN (or special employee AT014): Update recipients for a link (add/remove employees)
 */
router.put("/:id/recipients", authenticate, async (req, res) => {
  try {
    // --- normalize & debug incoming user ---
    const rawRole = req.user?.role;
    const rawEmployeeId = req.user?.employeeId || req.user?.employee_id || req.user?.empId;
    const role = rawRole ? String(rawRole).trim().toUpperCase() : null;
    const employeeId = rawEmployeeId ? String(rawEmployeeId).trim().toUpperCase() : null;

    console.log("/links/:id/recipients - req.user:", JSON.stringify(req.user, null, 2));

    // Allow ADMIN or the special employee AT014
    if (!(role === "ADMIN" || (role === "EMPLOYEE" && employeeId === "AT014"))) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    const id = parseInt(req.params.id, 10);
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

    // Use a transaction so delete + create is atomic
    await prisma.$transaction([
      prisma.receivedLink.deleteMany({
        where: { sharedLinkId: id },
      }),
      prisma.receivedLink.createMany({
        data: recipientIds.map((rid) => ({
          sharedLinkId: id,
          recipientId: rid,
        })),
      }),
    ]);

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
    return res.json(updated);
  } catch (err) {
    console.error("❌ Error updating recipients:", err);
    return res.status(500).json({ message: "Failed to update recipients" });
  }
});


/**
 * ✅ EMPLOYEE: Mark all received links as seen
 */
router.put("/mark-seen", authenticate, authorizeRole("EMPLOYEE"), async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;

    const result = await prisma.receivedLink.updateMany({
      where: { recipientId: userId, OR: [{ isSeen: false }, { isRead: false }] },
      data: {
        isSeen: true,
        isRead: true,
        seenAt: new Date(),
      },
    });

    res.json({
      message: "All links marked as read and seen",
      updatedCount: result.count,
    });
  } catch (err) {
    console.error("❌ Error marking all links as read:", err);
    res.status(500).json({ message: "Failed to mark links as read" });
  }
});


/**
 * ✅ EMPLOYEE: Get count of unseen links
 */
router.get("/unseen-count", authenticate, authorizeRole("EMPLOYEE"), async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;

    const unseenCount = await prisma.receivedLink.count({
      where: {
        recipientId: userId,
        isSeen: false,
      },
    });

    res.json({ unseenCount });
  } catch (err) {
    console.error("❌ Error fetching unseen count:", err);
    res.status(500).json({ message: "Failed to fetch unseen count" });
  }
});

/**
 * ✅ EMPLOYEE: Mark a single received link as seen/read
 */
router.put("/mark-read/:id", authenticate, authorizeRole("EMPLOYEE"), async (req, res) => {
  try {
    const receivedLinkId = parseInt(req.params.id, 10);
    const userId = req.user.id || req.user.userId;

    if (isNaN(receivedLinkId)) {
      return res.status(400).json({ message: "Invalid link ID" });
    }

    // Ensure this received link belongs to the requesting user
    const received = await prisma.receivedLink.findFirst({
      where: { id: receivedLinkId, recipientId: userId },
    });

    if (!received) {
      return res.status(404).json({ message: "Link not found or you don't have access" });
    }

    // Update the record: mark as seen and/or read and record timestamps
    const updated = await prisma.receivedLink.update({
      where: { id: receivedLinkId },
      data: {
        isSeen: true,
        seenAt: new Date(),
        isRead: true,      // optional depending on your model semantics
      // optional
      },
    });

    return res.json({ message: "Link marked as read", updated });
  } catch (err) {
    console.error("❌ Error marking single link as read:", err);
    return res.status(500).json({ message: "Failed to mark link as read" });
  }
});


export default router;