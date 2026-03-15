// server/src/routes/notificationRoutes.js

import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate, authorizeRole } from "../middlewares/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * ==================================================
 * GET MY NOTIFICATIONS (ACTIVE / STICKY ONLY)
 * ==================================================
 * URL: GET /api/notifications/my
 * - Returns only notifications that are NOT dismissed
 * - Old notifications remain hidden
 * - New notifications stay until user cancels
 */
router.get("/my", authenticate, authorizeRole("EMPLOYEE"), async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        isDismissed: false, // ⭐ CORE RULE
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(notifications);
  } catch (error) {
    console.error("Notification fetch failed:", error);
    res.status(500).json({ message: "Failed to load notifications" });
  }
});

/**
 * ==================================================
 * MARK NOTIFICATION AS READ (OPTIONAL)
 * ==================================================
 * URL: PATCH /api/notifications/:id/read
 * - Marks as read
 * - DOES NOT hide notification
 */
router.patch(
  "/:id/read",
  authenticate,
  authorizeRole("EMPLOYEE"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const userId = req.user.id;

      await prisma.notification.updateMany({
        where: { id, userId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Mark read failed:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  }
);

/**
 * ==================================================
 * DISMISS NOTIFICATION (THIS IS THE KEY FEATURE)
 * ==================================================
 * URL: PATCH /api/notifications/:id/dismiss
 * - This is the ONLY way a notification disappears
 */
router.patch(
  "/:id/dismiss",
  authenticate,
  authorizeRole("EMPLOYEE"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const userId = req.user.id;

      const notification = await prisma.notification.findFirst({
        where: { id, userId },
      });

      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      await prisma.notification.update({
        where: { id },
        data: {
          isDismissed: true,
          dismissedAt: new Date(),
        },
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Dismiss notification failed:", error);
      res.status(500).json({ message: "Failed to dismiss notification" });
    }
  }
);
// POST /api/notifications/subscribe
router.post(
  "/subscribe",
  authenticate,
  authorizeRole("EMPLOYEE"),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { endpoint, keys } = req.body;

      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return res.status(400).json({ message: "Invalid subscription" });
      }

      // Avoid duplicates
      const exists = await prisma.pushSubscription.findFirst({
        where: { endpoint },
      });
      if (exists) return res.json({ success: true });

      await prisma.pushSubscription.create({
        data: {
          userId,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
      });

      res.json({ success: true });
    } catch (err) {
      console.error("Push subscribe failed:", err);
      res.status(500).json({ message: "Subscription failed" });
    }
  }
);

export default router;
