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
    console.log("POST /share - req.user:", JSON.stringify(req.user, null, 2));
    console.log("POST /share - req.body:", JSON.stringify(req.body, null, 2));

    // Authorization (ADMIN or special employee AT014)
    const rawRole = req.user?.role;
    const rawEmployeeId = req.user?.employeeId || req.user?.employee_id || req.user?.empId;
    const role = rawRole ? String(rawRole).trim().toUpperCase() : null;
    const employeeId = rawEmployeeId ? String(rawEmployeeId).trim().toUpperCase() : null;

    if (!(role === "ADMIN" || (role === "EMPLOYEE" && employeeId === "AT014"))) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    // Inputs
    const { link, linkType, country, recipientIds } = req.body;

    // Basic validation
    if (!link || typeof link !== "string" || link.trim() === "") {
      return res.status(400).json({ message: "Valid link URL is required" });
    }
    const validTypes = ["Association Type", "Industry Type", "Attendees Type", "World Wide"];
    if (!linkType || typeof linkType !== "string" || !validTypes.includes(linkType)) {
      return res.status(400).json({ message: `Valid link type is required. One of: ${validTypes.join(", ")}` });
    }
    if (!country || typeof country !== "string" || country.trim() === "") {
      return res.status(400).json({ message: "Country is required" });
    }
    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
      return res.status(400).json({ message: "Please select at least one employee (recipientIds array required)" });
    }

    // Normalize recipientIds to numeric IDs
    const normalizedRecipientIds = recipientIds.map((rid) => {
      if (typeof rid === "number") return rid;
      if (typeof rid === "string") return parseInt(rid, 10);
      return NaN;
    });
    if (normalizedRecipientIds.some((id) => Number.isNaN(id))) {
      return res.status(400).json({ message: "recipientIds must be an array of numeric IDs (or numeric strings)" });
    }

    // Resolve createdById (prefer DB id in token, else lookup by employeeId)
    let createdById = req.user?.id || req.user?.userId;
    if (!createdById && employeeId) {
      const creator = await prisma.employee.findUnique({
        where: { employeeId }, // assumes employeeId column is unique
        select: { id: true },
      });
      if (creator) createdById = creator.id;
      else return res.status(401).json({ message: "Invalid token: cannot resolve user id from token employeeId" });
    }
    if (!createdById) return res.status(401).json({ message: "Invalid or missing user ID in token" });

    // Verify recipients exist and are active employees
    const validRecipients = await prisma.employee.findMany({
      where: { id: { in: normalizedRecipientIds }, role: "EMPLOYEE", isActive: true },
      select: { id: true },
    });
    if (validRecipients.length !== normalizedRecipientIds.length) {
      return res.status(400).json({ message: "One or more invalid employee IDs provided" });
    }

    // Attempt to create with the richer payload (with isSeen/isRead). If Prisma complains about unknown args,
    // retry with a minimal payload (recipientId only / plus receivedDate if you want).
    const nestedCreateWithFlags = normalizedRecipientIds.map((rid) => ({
      recipientId: rid,
      isSeen: false,
      isRead: false,
      receivedDate: new Date(),
    }));

    let shared;
    try {
      shared = await prisma.sharedLink.create({
        data: {
          link: link.trim(),
          linkType,
          country: country.trim(),
          createdById,
          recipients: { create: nestedCreateWithFlags },
        },
        include: {
          recipients: {
            include: {
              recipient: { select: { id: true, employeeId: true, fullName: true, email: true } },
            },
          },
          createdBy: { select: { id: true, employeeId: true, fullName: true } },
        },
      });
    } catch (innerErr) {
      // If Prisma complains about unknown argument(s) like isSeen/isRead, retry with a safe minimal payload.
      const msg = innerErr?.message || String(innerErr);
      console.warn("POST /share - initial Prisma create failed:", msg);

      // Detect unknown-argument error for isSeen/isRead (common message includes 'Unknown argument `isSeen`')
      if (msg.includes("Unknown argument") || msg.includes("Unknown field")) {
        const minimalRecipients = normalizedRecipientIds.map((rid) => ({
          recipientId: rid,
          // keep receivedDate if your schema likely supports it; if not, remove it
          receivedDate: new Date(),
        }));

        // Retry with minimal payload (recipientId [+ receivedDate])
        shared = await prisma.sharedLink.create({
          data: {
            link: link.trim(),
            linkType,
            country: country.trim(),
            createdById,
            recipients: { create: minimalRecipients },
          },
          include: {
            recipients: {
              include: {
                recipient: { select: { id: true, employeeId: true, fullName: true, email: true } },
              },
            },
            createdBy: { select: { id: true, employeeId: true, fullName: true } },
          },
        });
      } else {
        // Not an unknown-argument issue — rethrow to be handled below
        throw innerErr;
      }
    }

    console.log("✅ Shared link created successfully:", shared.id);
    return res.status(201).json(shared);
  } catch (err) {
    console.error("❌ Error creating shared link:", err);

    if (err?.name === "PrismaClientValidationError") {
      return res.status(400).json({ message: "Invalid data provided. Please check your inputs.", error: err.message });
    }
    if (err?.code === "P2003") {
      return res.status(400).json({ message: "Foreign key constraint failed – invalid employee IDs." });
    }
    // Return Prisma message for quicker debugging in dev
    return res.status(400).json({ message: err?.message || "Error creating shared link" });
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
// DELETE /api/links/:id  (ADMIN or special employee AT014 allowed)
router.delete("/:id", authenticate, async (req, res) => {
  try {
    // --- normalize & debug incoming user ---
    const rawRole = req.user?.role;
    const rawEmployeeId = req.user?.employeeId || req.user?.employee_id || req.user?.empId;
    const role = rawRole ? String(rawRole).trim().toUpperCase() : null;
    const employeeId = rawEmployeeId ? String(rawEmployeeId).trim().toUpperCase() : null;

    console.log("DELETE /links/:id - req.user:", JSON.stringify(req.user, null, 2));

    // Allow ADMIN or the special employee AT014
    if (!(role === "ADMIN" || (role === "EMPLOYEE" && employeeId === "AT014"))) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    // --- parse and validate id ---
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid link ID" });
    }

    // --- check existence ---
    const existingLink = await prisma.sharedLink.findUnique({ where: { id } });
    if (!existingLink) {
      return res.status(404).json({ message: "Link not found" });
    }

    // --- delete in a transaction (delete child receivedLink rows then the sharedLink) ---
    await prisma.$transaction([
      prisma.receivedLink.deleteMany({ where: { sharedLinkId: id } }),
      prisma.sharedLink.delete({ where: { id } }),
    ]);

    console.log("✅ Shared link deleted successfully:", id);
    return res.json({ message: "Shared link deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting link:", err);

    // Prisma "not found" error
    if (err?.code === "P2025") {
      return res.status(404).json({ message: "Link not found (prisma)" });
    }

    // Foreign key / constraint errors or other issues
    return res.status(500).json({ message: "Failed to delete link", error: err?.message });
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