// Admin security tools: allowed IPs and login history (last 7 days).
import express from "express";
import prisma from "../prismaClient.js";
import { authenticate, requireAdmin, ah } from "../middlewares/auth.js";
import { getClientIp } from "../utils/ipExtractor.js";
import {
  createAllowedIP,
  getAllAllowedIPs,
  updateAllowedIP,
  updateIPStatus,
  deleteAllowedIP,
} from "../services/ipWhitelistService.js";

const router = express.Router();
router.use(authenticate, requireAdmin);

const isIp = (s) =>
  /^(\d{1,3}\.){3}\d{1,3}$/.test(s) || /^[0-9a-f:]+$/i.test(s);

router.get("/my-ip", (req, res) => res.json({ ip: getClientIp(req) }));

router.get(
  "/allowed-ips",
  ah(async (req, res) => res.json(await getAllAllowedIPs())),
);

router.post(
  "/allowed-ips",
  ah(async (req, res) => {
    const ipAddress = String(req.body.ipAddress || "").trim();
    if (!isIp(ipAddress))
      return res.status(400).json({ message: "Enter a valid IP address" });
    try {
      res.status(201).json(
        await createAllowedIP({
          ipAddress,
          label: req.body.label?.trim() || null,
        }),
      );
    } catch (e) {
      if (e.code === "P2002")
        return res
          .status(400)
          .json({ message: "This IP is already in the list" });
      throw e;
    }
  }),
);

router.put(
  "/allowed-ips/:id",
  ah(async (req, res) => {
    const ipAddress = String(req.body.ipAddress || "").trim();
    if (!isIp(ipAddress))
      return res.status(400).json({ message: "Enter a valid IP address" });
    try {
      res.json(
        await updateAllowedIP(req.params.id, {
          ipAddress,
          label: req.body.label?.trim() || null,
        }),
      );
    } catch (e) {
      if (e.code === "P2002")
        return res
          .status(400)
          .json({ message: "This IP is already in the list" });
      throw e;
    }
  }),
);

router.patch(
  "/allowed-ips/:id/status",
  ah(async (req, res) => {
    if (typeof req.body.status !== "boolean")
      return res.status(400).json({ message: "status must be true or false" });
    // never lock everyone out: keep at least one active IP
    if (req.body.status === false) {
      const active = await prisma.allowedIP.count({ where: { status: true } });
      if (active <= 1)
        return res
          .status(400)
          .json({ message: "At least one IP must stay enabled" });
    }
    res.json(await updateIPStatus(req.params.id, req.body.status));
  }),
);

router.delete(
  "/allowed-ips/:id",
  ah(async (req, res) => {
    const active = await prisma.allowedIP.count({ where: { status: true } });
    const ip = await prisma.allowedIP.findUnique({
      where: { id: req.params.id },
    });
    if (ip?.status && active <= 1)
      return res
        .status(400)
        .json({ message: "At least one IP must stay enabled" });
    await deleteAllowedIP(req.params.id);
    res.json({ success: true });
  }),
);

router.get(
  "/login-history",
  ah(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(10, Number(req.query.limit) || 50));
    const where = {};
    if (req.query.status === "SUCCESS" || req.query.status === "FAILED")
      where.status = req.query.status;
    if (req.query.search?.trim()) {
      const s = req.query.search.trim();
      where.OR = [
        { employeeName: { contains: s, mode: "insensitive" } },
        { employeeId: { contains: s, mode: "insensitive" } },
        { email: { contains: s, mode: "insensitive" } },
        { ipAddress: { contains: s } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.loginHistory.findMany({
        where,
        orderBy: { loginTime: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.loginHistory.count({ where }),
    ]);
    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  }),
);

export default router;
