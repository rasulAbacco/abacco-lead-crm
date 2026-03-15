import express from "express";
import { PrismaClient } from "@prisma/client";
import webpush from "web-push";

import { authenticate, authorizeRole } from "../middlewares/auth.js";

const router = express.Router();
const prisma = new PrismaClient();
router.post("/share", authenticate, async (req, res) => {
  try {
    /* =====================================================
       1. AUTHORIZATION
    ===================================================== */
    const role = req.user?.role?.toUpperCase();
    const employeeId = req.user?.employeeId?.toUpperCase();

    const isAllowed =
      role === "ADMIN" || (role === "EMPLOYEE" && employeeId === "AT014");

    if (!isAllowed) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    /* =====================================================
       2. INPUT VALIDATION
    ===================================================== */
    const { links, linkType, country, recipientIds, message } = req.body;

    if (!Array.isArray(links) || links.length === 0) {
      return res.status(400).json({ message: "Links array is required" });
    }

    const cleanedLinks = links
      .map((l) => (typeof l === "string" ? l.trim() : ""))
      .filter(Boolean);

    if (cleanedLinks.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one valid URL required" });
    }

    const VALID_TYPES = [
      "Association Type",
      "Industry Type",
      "Attendees Type",
      "World Wide",
    ];

    if (!VALID_TYPES.includes(linkType)) {
      return res.status(400).json({ message: "Invalid link type" });
    }

    if (!country || !country.trim()) {
      return res.status(400).json({ message: "Country is required" });
    }

    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
      return res.status(400).json({ message: "Recipients are required" });
    }

    /* =====================================================
       3. NORMALIZE IDS (CRITICAL FIX)
    ===================================================== */
    const normalizedRecipientIds = recipientIds
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id));

    if (normalizedRecipientIds.length !== recipientIds.length) {
      return res.status(400).json({ message: "Invalid recipient IDs" });
    }

    /* =====================================================
       4. VALIDATE RECIPIENTS EXIST
    ===================================================== */
    const validEmployees = await prisma.employee.findMany({
      where: {
        id: { in: normalizedRecipientIds },
        role: "EMPLOYEE",
        isActive: true,
      },
      select: { id: true },
    });

    if (validEmployees.length !== normalizedRecipientIds.length) {
      return res.status(400).json({ message: "One or more employees invalid" });
    }

    /* =====================================================
       5. RESOLVE CREATOR
    ===================================================== */
    let createdById = req.user?.id;

    if (!createdById && employeeId) {
      const emp = await prisma.employee.findUnique({
        where: { employeeId },
        select: { id: true },
      });
      createdById = emp?.id;
    }

    if (!createdById) {
      return res.status(401).json({ message: "Unable to resolve creator" });
    }
    // ✅ Resolve sender name for notification
    let senderName = "Admin";

    if (role === "EMPLOYEE" && employeeId === "AT014") {
      const senderEmp = await prisma.employee.findUnique({
        where: { id: createdById },
        select: { fullName: true },
      });

      senderName = senderEmp?.fullName || "Admin";
    }

    /* =====================================================
       6. CREATE SHARED LINK + RECIPIENTS
    ===================================================== */
    const sharedLink = await prisma.sharedLink.create({
      data: {
        linkType,
        country,
        message: message?.trim() ? message.trim() : null, // ⭐ THIS LINE
        createdById,
        link: cleanedLinks[0], // legacy support
        sharedEmployeeIds: normalizedRecipientIds.join(","), // ⭐ SNAPSHOT

        urls: {
          create: cleanedLinks.map((url) => ({ url })),
        },

        recipients: {
          create: normalizedRecipientIds.map((id) => ({
            recipientId: id,
            isSeen: false,
            isRead: false,
            isOpen: false,
          })),
        },
      },
    });

    /* =====================================================
       7. CREATE STICKY IN-APP NOTIFICATIONS
    ===================================================== */
    await prisma.notification.createMany({
      data: normalizedRecipientIds.map((id) => ({
        userId: id,
        title: "📢 New Links Assigned",
        message: message?.trim()
          ? message.trim().slice(0, 120)
          : `New ${linkType} links have been shared with you`,
        link: "/my-links",
        type: "link",
        isRead: false,
        isDismissed: false,
      })),
    });

    /* =====================================================
       8. SEND PUSH NOTIFICATIONS (FIXED QUERY)
    ===================================================== */
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: { in: normalizedRecipientIds }, // ✅ FIX
      },
    });

    console.log(
      "🔔 Push subscriptions found:",
      subscriptions.length,
      "for users:",
      normalizedRecipientIds
    );

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify({
            title: "📢 New Links Assigned",
            message: `${senderName} has shared a link with you`,
            link: "/my-links",
          })
        );
      } catch (err) {
        console.error("❌ Push failed:", err.message);

        // Remove dead subscriptions
        if (err.statusCode === 404 || err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
      }
    }

    /* =====================================================
       9. RESPONSE
    ===================================================== */
    return res.status(201).json(sharedLink);
  } catch (error) {
    console.error("❌ /links/share failed:", error);
    return res.status(500).json({ message: "Failed to share links" });
  }
});

/**
 * ✅ ADMIN: Get all shared link info with recipients
 */
router.get("/shared-info", authenticate, async (req, res) => {
  try {
    const { role, employeeId } = req.user;

    if (
      !(role === "ADMIN" || (role === "EMPLOYEE" && employeeId === "AT014"))
    ) {
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
    // 1️⃣ Collect ALL snapshot employee IDs (numeric)
    const snapshotEmployeeIds = [
      ...new Set(
        links
          .flatMap((sl) =>
            sl.sharedEmployeeIds
              ? sl.sharedEmployeeIds.split(",").map((id) => Number(id))
              : []
          )
          .filter(Boolean)
      ),
    ];
    // 2️⃣ Fetch employees using numeric IDs
    const employees = await prisma.employee.findMany({
      where: { id: { in: snapshotEmployeeIds } },
      select: {
        id: true,
        fullName: true,
        employeeId: true, // AT012 etc
      },
    });

    // 3️⃣ Create lookup map
    const employeeMap = Object.fromEntries(
      employees.map((e) => [e.id, `${e.fullName} (${e.employeeId})`])
    );

    const result = links.map((sl) => {
      const snapshotIds = sl.sharedEmployeeIds
        ? sl.sharedEmployeeIds.split(",").map(Number)
        : [];

      return {
        ...sl,

        // ✅ THIS IS THE FIX
        snapshotEmployees: snapshotIds.map((id) => ({
          id,
          name: employeeMap[id] || `Employee (${id})`,
        })),

        allUrls:
          sl.urls && sl.urls.length > 0
            ? sl.urls.map((u) => ({ id: u.id, url: u.url }))
            : sl.link
            ? [{ id: null, url: sl.link }]
            : [],
      };
    });

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
    const rawEmployeeId =
      req.user?.employeeId || req.user?.employee_id || req.user?.empId;
    const role = rawRole ? String(rawRole).trim().toUpperCase() : null;
    const employeeId = rawEmployeeId
      ? String(rawEmployeeId).trim().toUpperCase()
      : null;

    console.log(
      "DELETE /links/:id - req.user:",
      JSON.stringify(req.user, null, 2)
    );

    // Allow ADMIN or the special employee AT014
    if (
      !(role === "ADMIN" || (role === "EMPLOYEE" && employeeId === "AT014"))
    ) {
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
    return res
      .status(500)
      .json({ message: "Failed to delete link", error: err?.message });
  }
});

/**
 * ✅ EMPLOYEE: Delete a received link (remove from their list)
 */
router.delete(
  "/received/:id",
  authenticate,
  authorizeRole("EMPLOYEE"),
  async (req, res) => {
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
        return res
          .status(404)
          .json({ message: "Link not found or you don't have access" });
      }
      // ❗ BLOCK delete if link is not opened
      if (!receivedLink.isOpen) {
        return res.status(400).json({
          message: "You must open the link before deleting it",
        });
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
  }
);

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
    const rawEmployeeId =
      req.user?.employeeId || req.user?.employee_id || req.user?.empId;
    const role = rawRole ? String(rawRole).trim().toUpperCase() : null;
    const employeeId = rawEmployeeId
      ? String(rawEmployeeId).trim().toUpperCase()
      : null;

    console.log("/links/:id - req.user:", JSON.stringify(req.user, null, 2));

    // Allow ADMIN or the special employee AT014
    if (
      !(role === "ADMIN" || (role === "EMPLOYEE" && employeeId === "AT014"))
    ) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    // --- inputs ---
    const id = parseInt(req.params.id, 10);
    const { link, linkType, country, message } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid link ID" });
    }

    // Validate inputs
    if (!link || typeof link !== "string" || link.trim() === "") {
      return res.status(400).json({ message: "Valid link URL is required" });
    }

    const validTypes = [
      "Association Type",
      "Industry Type",
      "Attendees Type",
      "World Wide",
    ];
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
        message: message?.trim() ? message.trim() : null, // ⭐ ADD
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
    const rawEmployeeId =
      req.user?.employeeId || req.user?.employee_id || req.user?.empId;
    const role = rawRole ? String(rawRole).trim().toUpperCase() : null;
    const employeeId = rawEmployeeId
      ? String(rawEmployeeId).trim().toUpperCase()
      : null;

    console.log(
      "/links/:id/recipients - req.user:",
      JSON.stringify(req.user, null, 2)
    );

    // Allow ADMIN or the special employee AT014
    if (
      !(role === "ADMIN" || (role === "EMPLOYEE" && employeeId === "AT014"))
    ) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    const id = parseInt(req.params.id, 10);
    const { recipientIds } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid link ID" });
    }

    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Please select at least one employee" });
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
router.put(
  "/mark-seen",
  authenticate,
  authorizeRole("EMPLOYEE"),
  async (req, res) => {
    try {
      const userId = req.user.id || req.user.userId;

      const result = await prisma.receivedLink.updateMany({
        where: {
          recipientId: userId,
          OR: [{ isSeen: false }, { isRead: false }],
        },
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
  }
);

/**
 * ✅ EMPLOYEE: Get count of unseen links
 */
router.get(
  "/unseen-count",
  authenticate,
  authorizeRole("EMPLOYEE"),
  async (req, res) => {
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
  }
);

/**
 * ✅ EMPLOYEE: Mark a single received link as seen/read
 */
router.put(
  "/mark-read/:id",
  authenticate,
  authorizeRole("EMPLOYEE"),
  async (req, res) => {
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
        return res
          .status(404)
          .json({ message: "Link not found or you don't have access" });
      }

      // Update the record: mark as seen and/or read and record timestamps
      const updated = await prisma.receivedLink.update({
        where: { id: receivedLinkId },
        data: {
          isSeen: true,
          seenAt: new Date(),
          isRead: true, // optional depending on your model semantics
          // optional
        },
      });

      return res.json({ message: "Link marked as read", updated });
    } catch (err) {
      console.error("❌ Error marking single link as read:", err);
      return res.status(500).json({ message: "Failed to mark link as read" });
    }
  }
);

/**
 * ✅ Track and redirect when employee clicks a shared link
 * e.g. GET /api/links/open/:receivedLinkId
 */
// REMOVE authenticate + authorizeRole middlewares
// router.get("/open/:urlId", async (req, res) => {
//   try {
//     const urlId = Number(req.params.urlId);
//     if (isNaN(urlId)) {
//       return res.status(400).json({ message: "Invalid URL ID" });
//     }

//     // Find the URL and its sharedLink
//     const urlEntry = await prisma.sharedLinkUrl.findUnique({
//       where: { id: urlId },
//       include: { sharedLink: true },
//     });

//     if (!urlEntry) {
//       return res.status(404).json({ message: "URL not found" });
//     }

//     // Mark ALL recipients of this SharedLink as "opened"
//     await prisma.receivedLink.updateMany({
//       where: { sharedLinkId: urlEntry.sharedLinkId },
//       data: {
//         isOpen: true,
//         openedAt: new Date(),
//       },
//     });

//     return res.redirect(urlEntry.url);
//   } catch (err) {
//     console.error("❌ Error in GET /open/:urlId:", err);
//     res.status(500).json({ message: "Failed to open URL" });
//   }
// });
// ✅ Track and redirect when employee clicks a shared link
// GET /api/links/open/:receivedLinkId
router.get("/open/:receivedLinkId", async (req, res) => {
  try {
    const receivedLinkId = Number(req.params.receivedLinkId);
    if (isNaN(receivedLinkId)) {
      return res.status(400).json({ message: "Invalid received link ID" });
    }

    // Find the received link (this identifies the employee!)
    const receivedLink = await prisma.receivedLink.findUnique({
      where: { id: receivedLinkId },
      include: {
        sharedLink: {
          include: { urls: true },
        },
      },
    });

    if (!receivedLink) {
      return res.status(404).json({ message: "Received link not found" });
    }

    // ✅ Mark ONLY THIS employee's link as opened
    if (!receivedLink.isOpen) {
      await prisma.receivedLink.update({
        where: { id: receivedLinkId },
        data: {
          isOpen: true,
          openedAt: new Date(),
        },
      });
    }

    // Redirect to the first URL (or you can improve later)
    const redirectUrl =
      receivedLink.sharedLink.urls?.[0]?.url || receivedLink.sharedLink.link;

    if (!redirectUrl) {
      return res.status(404).json({ message: "No URL found" });
    }

    return res.redirect(redirectUrl);
  } catch (err) {
    console.error("❌ Error in GET /open/:receivedLinkId:", err);
    res.status(500).json({ message: "Failed to open URL" });
  }
});

export default router;
