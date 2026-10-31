// Bell notifications for the logged-in user.
import express from "express";
import prisma from "../prismaClient.js";
import { authenticate, ah } from "../middlewares/auth.js";

const router = express.Router();
router.use(authenticate);

router.get(
  "/",
  ah(async (req, res) => {
    const employeeId = req.user.employeeId;
    const [items, unread] = await Promise.all([
      prisma.notification.findMany({ where: { employeeId }, orderBy: { createdAt: "desc" }, take: 30 }),
      prisma.notification.count({ where: { employeeId, readAt: null } }),
    ]);
    res.json({ items, unread });
  }),
);

router.post(
  "/read-all",
  ah(async (req, res) => {
    await prisma.notification.updateMany({ where: { employeeId: req.user.employeeId, readAt: null }, data: { readAt: new Date() } });
    res.json({ success: true });
  }),
);

router.post(
  "/:id/read",
  ah(async (req, res) => {
    await prisma.notification.updateMany({ where: { id: Number(req.params.id), employeeId: req.user.employeeId }, data: { readAt: new Date() } });
    res.json({ success: true });
  }),
);

export default router;
