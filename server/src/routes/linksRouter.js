import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate, authorizeRole } from "../middlewares/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * ✅ ADMIN: Share a new link with employees
 */
// inside linksRouter.js (replace previous /share implementation)
router.post("/share", authenticate, async (req, res) => {
  try {
    const rawRole = req.user?.role;
    const rawEmployeeId = req.user?.employeeId;
    const role = rawRole ? String(rawRole).trim().toUpperCase() : null;
    const employeeId = rawEmployeeId ? String(rawEmployeeId).trim().toUpperCase() : null;

    if (!(role === "ADMIN" || (role === "EMPLOYEE" && employeeId === "AT014"))) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    const { links, linkType, country, recipientIds } = req.body;

    // Validate links
    if (!Array.isArray(links) || links.length === 0) {
      return res.status(400).json({ message: "links must be a non-empty array" });
    }

    const cleanedLinks = links
      .map((u) => (typeof u === "string" ? u.trim() : ""))
      .filter(Boolean);

    if (cleanedLinks.length === 0) {
      return res.status(400).json({ message: "At least one valid URL is required" });
    }

    // Validate type
    const validTypes = ["Association Type", "Industry Type", "Attendees Type", "World Wide"];
    if (!validTypes.includes(linkType)) {
      return res.status(400).json({ message: "Invalid link type" });
    }

    if (!country.trim()) {
      return res.status(400).json({ message: "Country required" });
    }

    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
      return res.status(400).json({ message: "recipientIds must be non-empty array" });
    }

    const normalizedRecipientIds = recipientIds.map((id) => Number(id));

    // Validate recipients exist
    const validRecipients = await prisma.employee.findMany({
      where: { id: { in: normalizedRecipientIds }, role: "EMPLOYEE", isActive: true },
      select: { id: true },
    });

    if (validRecipients.length !== normalizedRecipientIds.length) {
      return res.status(400).json({ message: "Invalid employee IDs" });
    }

    // Resolve createdById
    let createdById = req.user?.id || req.user?.userId;
    if (!createdById && employeeId) {
      const emp = await prisma.employee.findUnique({
        where: { employeeId },
        select: { id: true },
      });
      createdById = emp?.id;
    }

    if (!createdById) {
      return res.status(401).json({ message: "Cannot resolve creator ID" });
    }

    // Build URL entries
    const urlCreateObjects = cleanedLinks.map((u) => ({ url: u }));

    // Build recipients
    const recipientCreateObjects = normalizedRecipientIds.map((rid) => ({
      recipientId: rid,
      receivedDate: new Date(),
      isSeen: false,
      isRead: false,
      isOpen: false,
    }));

    // MAIN CREATE
    const created = await prisma.sharedLink.create({
      data: {
        linkType,
        country,
        createdById,

        // New multiple-URL creation
        urls: {
          create: urlCreateObjects,
        },

        // Create recipient records
        recipients: {
          create: recipientCreateObjects,
        },

        // Legacy: Store first URL in old `link`
        link: cleanedLinks[0] || null,
      },
      include: {
        urls: true,
        createdBy: true,
        recipients: {
          include: {
            recipient: true,
          },
        },
      },
    });

    res.status(201).json(created);
  } catch (err) {
    console.error("❌ Error in POST /share:", err);
    res.status(400).json({ message: err.message || "Failed to share" });
  }
});





/**
 * ✅ ADMIN: Get all shared link info with recipients
 */
router.get("/shared-info", authenticate, async (req, res) => {
  try {
    const { role, employeeId } = req.user;

    if (!(role === "ADMIN" || (role === "EMPLOYEE" && employeeId === "AT014"))) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    const links = await prisma.sharedLink.findMany({
      include: {
        createdBy: {
          select: { id: true, employeeId: true, fullName: true },
        },
        urls: {
          select: { id: true, url: true },
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
          orderBy: { receivedDate: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = links.map((sl) => ({
  ...sl,
  allUrls:
    sl.urls && sl.urls.length > 0
      ? sl.urls.map((u) => ({ id: u.id, url: u.url }))
      : sl.link
      ? [{ id: null, url: sl.link }]
      : []
}));

res.json(result);

  } catch (err) {
    console.error("❌ Error in GET /shared-info:", err);
    res.status(500).json({ message: "Failed to load shared links" });
  }
});



/**
 * ✅ EMPLOYEE: Get all links shared with this employee
 */
router.get("/my", authenticate, authorizeRole("EMPLOYEE"), async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;

    const recs = await prisma.receivedLink.findMany({
      where: { recipientId: userId },
      include: {
        sharedLink: {
          include: {
            urls: true, // ⭐ IMPORTANT: include new multi-URL field
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

    res.json(recs);
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


/**
 * ✅ Track and redirect when employee clicks a shared link
 * e.g. GET /api/links/open/:receivedLinkId
 */
// REMOVE authenticate + authorizeRole middlewares
router.get("/open/:urlId", async (req, res) => {
  try {
    const urlId = Number(req.params.urlId);
    if (isNaN(urlId)) {
      return res.status(400).json({ message: "Invalid URL ID" });
    }

    // Find the URL and its sharedLink
    const urlEntry = await prisma.sharedLinkUrl.findUnique({
      where: { id: urlId },
      include: { sharedLink: true },
    });

    if (!urlEntry) {
      return res.status(404).json({ message: "URL not found" });
    }

    // Mark ALL recipients of this SharedLink as "opened"
    await prisma.receivedLink.updateMany({
      where: { sharedLinkId: urlEntry.sharedLinkId },
      data: {
        isOpen: true,
        openedAt: new Date(),
      },
    });

    return res.redirect(urlEntry.url);
  } catch (err) {
    console.error("❌ Error in GET /open/:urlId:", err);
    res.status(500).json({ message: "Failed to open URL" });
  }
});




export default router;