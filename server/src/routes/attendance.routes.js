// Attendance: biometric machine punches, system clock-in/out, reports.
import express from "express";
import prisma from "../prismaClient.js";
import { config } from "../config.js";
import { authenticate, requireAdmin, ah } from "../middlewares/auth.js";
import { getClientIp } from "../utils/ipExtractor.js";
import {
  dateKey,
  parseDeviceTime,
  centralParts,
  formatIST,
  formatCentral,
  dayRangeKey,
} from "../utils/time.js";
import {
  monthlyAttendance,
  recentDays,
  fmtMinutes,
  SATURDAY_LABEL,
} from "../services/attendance.js";
import { attendanceWorkbookBuffer } from "../utils/attendanceExcel.js";
import { emailAttendanceReport } from "../jobs/attendanceJobs.js";
import { sendXlsx } from "../utils/excel.js";

const router = express.Router();

/* =====================================================================
   PUBLIC — called by the biometric machine (same payload as the HR CRM)
   POST /api/attendance/device/punch
   Body: one record or an array of records:
     { EnrollmentId, DevicesId | DeviceId, SerialNo, PunchMode, PunchDateAndTime: "2026-06-26 21:15:00" (IST) }
   Optional: BIOMETRIC_DEVICE_KEY env -> machine must send ?key=… or header x-device-key.
===================================================================== */
router.get("/device/test", (req, res) =>
  res.json({ success: true, message: "Lead CRM biometric API working" }),
);

router.post(
  "/device/punch",
  ah(async (req, res) => {
    if (
      config.deviceKey &&
      (req.query.key || req.headers["x-device-key"]) !== config.deviceKey
    ) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid device key" });
    }
    const records = Array.isArray(req.body) ? req.body : [req.body];
    let inserted = 0,
      skipped = 0,
      unknownDevice = 0;
    const devices = await prisma.biometricDevice.findMany({
      where: { isActive: true },
    });

    for (const item of records.slice(0, 5000)) {
      const enrollmentId = String(
        item?.EnrollmentId ?? item?.EnrollmentID ?? item?.enrollmentId ?? "",
      ).trim();
      const deviceCode = String(
        item?.DevicesId ?? item?.DeviceId ?? item?.deviceCode ?? "",
      ).trim();
      const serialNo = String(item?.SerialNo ?? item?.serialNo ?? "").trim();
      const punchTime = parseDeviceTime(
        item?.PunchDateAndTime ?? item?.punchDateTime,
      );
      if (!enrollmentId || !punchTime) {
        skipped++;
        continue;
      }

      const device = devices.find(
        (d) =>
          d.deviceCode === deviceCode && (!serialNo || d.serialNo === serialNo),
      );
      if (!device) {
        unknownDevice++;
        continue;
      } // only registered machines are accepted

      const mapping = await prisma.biometricMapping.findFirst({
        where: { enrollmentId, location: device.location, isActive: true },
        select: { id: true, employeeId: true },
      });
      const exists = await prisma.biometricPunch.findFirst({
        where: { enrollmentId, punchTime, deviceId: device.id },
        select: { id: true },
      });
      if (exists) {
        skipped++;
        continue;
      }

      await prisma.biometricPunch.create({
        data: {
          enrollmentId,
          deviceId: device.id,
          mappingId: mapping?.id || null,
          employeeId: mapping?.employeeId || null,
          location: device.location,
          punchTime,
          punchMode: item?.PunchMode != null ? String(item.PunchMode) : null,
        },
      });
      inserted++;
    }
    res.json({ success: true, inserted, skipped, unknownDevice });
  }),
);

/* ===================== everything below needs login ===================== */
router.use(authenticate);

/* ---------- system clock-in / clock-out (every user) ---------- */
async function clockState(employeeId) {
  const todayKey = dateKey(new Date());
  const [open, today] = await Promise.all([
    prisma.workSession.findFirst({
      where: { employeeId, clockOut: null },
      orderBy: { clockIn: "desc" },
    }),
    prisma.workSession.findMany({
      where: { employeeId, workDate: todayKey },
      orderBy: { clockIn: "asc" },
    }),
  ]);
  let minutes = 0;
  for (const s of today) {
    if (s.autoClosed) continue;
    minutes += Math.floor(((s.clockOut || new Date()) - s.clockIn) / 60000);
  }
  return {
    clockedIn: !!open,
    since: open?.clockIn || null,
    sinceIST: formatIST(open?.clockIn),
    todayMinutes: minutes,
    todayHours: fmtMinutes(minutes),
    sessions: today.map((s) => ({
      id: s.id,
      clockIn: s.clockIn,
      clockOut: s.clockOut,
      autoClosed: s.autoClosed,
      clockInIST: formatIST(s.clockIn),
      clockOutIST: s.autoClosed ? null : formatIST(s.clockOut),
    })),
  };
}

router.get(
  "/clock",
  ah(async (req, res) => res.json(await clockState(req.user.employeeId))),
);

router.post(
  "/clock/in",
  ah(async (req, res) => {
    const employeeId = req.user.employeeId;
    const open = await prisma.workSession.findFirst({
      where: { employeeId, clockOut: null },
    });
    if (open)
      return res.status(400).json({
        message: `You are already clocked in since ${formatIST(open.clockIn)} IST`,
      });
    const now = new Date();
    await prisma.workSession.create({
      data: {
        employeeId,
        workDate: dateKey(now),
        clockIn: now,
        clockInIp: getClientIp(req),
      },
    });
    res.json(await clockState(employeeId));
  }),
);

router.post(
  "/clock/out",
  ah(async (req, res) => {
    const employeeId = req.user.employeeId;
    const open = await prisma.workSession.findFirst({
      where: { employeeId, clockOut: null },
      orderBy: { clockIn: "desc" },
    });
    if (!open)
      return res.status(400).json({ message: "You are not clocked in" });
    await prisma.workSession.update({
      where: { id: open.id },
      data: { clockOut: new Date(), clockOutIp: getClientIp(req) },
    });
    res.json(await clockState(employeeId));
  }),
);

/* ---------- my attendance: today + yesterday (employee dashboard) ---------- */
router.get(
  "/me",
  ah(async (req, res) => {
    const [days, mapping] = await Promise.all([
      recentDays(req.user.employeeId, 2),
      prisma.biometricMapping.findFirst({
        where: { employeeId: req.user.employeeId, isActive: true },
        select: { id: true },
      }),
    ]);
    res.json({
      days,
      hasBiometric: !!mapping,
      fullDayHours: config.fullDayHours,
    });
  }),
);

/* ===================== ADMIN ===================== */
const admin = express.Router();
admin.use(requireAdmin);

const ym = (q) => {
  const p = centralParts();
  return { year: Number(q.year) || p.year, month: Number(q.month) || p.month };
};

admin.get(
  "/monthly",
  ah(async (req, res) => {
    const { year, month } = ym(req.query);
    res.json(await monthlyAttendance(year, month));
  }),
);

admin.get(
  "/monthly/export",
  ah(async (req, res) => {
    const { year, month } = ym(req.query);
    const report = await monthlyAttendance(year, month);
    sendXlsx(
      res,
      attendanceWorkbookBuffer(report),
      `attendance-${year}-${String(month).padStart(2, "0")}.xlsx`,
    );
  }),
);

admin.post(
  "/monthly/email",
  ah(async (req, res) => {
    const { year, month } = ym(req.body || {});
    const ok = await emailAttendanceReport(year, month, { force: true });
    if (!ok)
      return res
        .status(502)
        .json({ message: "Email could not be sent. Check the SMTP settings." });
    res.json({ success: true, to: config.attendanceReportEmail });
  }),
);

/* People who can have a biometric card: marketing employees + developers */
admin.get(
  "/people",
  ah(async (req, res) => {
    const rows = await prisma.employee.findMany({
      where: { isActive: true, role: { in: ["EMPLOYEE", "DEVELOPER"] } },
      select: { employeeId: true, fullName: true, role: true },
      orderBy: { fullName: "asc" },
    });
    res.json(
      rows.map((e) => ({
        employeeId: e.employeeId,
        name: e.fullName,
        role: e.role,
      })),
    );
  }),
);

/* Who is working right now */
admin.get(
  "/today",
  ah(async (req, res) => {
    const todayKey = dateKey(new Date());
    const { start, end } = dayRangeKey(todayKey);
    const [employees, punches, sessions] = await Promise.all([
      prisma.employee.findMany({
        where: { isActive: true, role: "EMPLOYEE" },
        select: { employeeId: true, fullName: true },
        orderBy: { fullName: "asc" },
      }),
      prisma.biometricPunch.findMany({
        where: {
          punchTime: { gte: start, lt: end },
          employeeId: { not: null },
        },
        orderBy: { punchTime: "asc" },
        select: { employeeId: true, punchTime: true },
      }),
      prisma.workSession.findMany({
        where: { workDate: todayKey },
        orderBy: { clockIn: "asc" },
      }),
    ]);
    res.json({
      date: todayKey,
      rows: employees.map((e) => {
        const p = punches.filter((x) => x.employeeId === e.employeeId);
        const s = sessions.filter((x) => x.employeeId === e.employeeId);
        const open = s.find((x) => !x.clockOut);
        return {
          employeeId: e.employeeId,
          name: e.fullName,
          firstPunchIST: formatIST(p[0]?.punchTime),
          lastPunchIST:
            p.length > 1 ? formatIST(p[p.length - 1].punchTime) : null,
          clockedIn: !!open,
          clockInIST: formatIST(s[0]?.clockIn),
        };
      }),
    });
  }),
);

/* Raw punch log */
admin.get(
  "/punches",
  ah(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 50);
    const where = {};
    if (req.query.mapped === "true") where.mappingId = { not: null };
    if (req.query.mapped === "false") where.mappingId = null;
    if (req.query.employeeId) where.employeeId = req.query.employeeId;
    if (req.query.date && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)) {
      const r = dayRangeKey(req.query.date);
      where.punchTime = { gte: r.start, lt: r.end };
    }

    const allPunches = await prisma.biometricPunch.findMany({
      where,
      orderBy: { punchTime: "asc" },
      include: {
        employee: { select: { fullName: true } },
        device: { select: { deviceName: true, deviceCode: true } },
      },
    });

    const groups = {};
    for (const r of allPunches) {
      const wd = dateKey(r.punchTime);
      const key = `${wd}_${r.enrollmentId}`;
      if (!groups[key]) {
        groups[key] = {
          id: r.id, // using first punch ID as unique key for React
          enrollmentId: r.enrollmentId,
          employeeId: r.employeeId,
          name: r.employee?.fullName || null,
          location: r.location,
          device: r.device?.deviceName || r.device?.deviceCode || null,
          workDateSort: wd,
          workDate: formatCentral(r.punchTime, "MMM d"),
          punches: [],
        };
      }
      groups[key].punches.push(r.punchTime);
    }

    // Sort by most recent work date first, then by employee name
    const groupedList = Object.values(groups).sort((a, b) => {
      if (a.workDateSort > b.workDateSort) return -1;
      if (a.workDateSort < b.workDateSort) return 1;
      return (a.name || "").localeCompare(b.name || "");
    });

    const total = groupedList.length;
    const paged = groupedList.slice((page - 1) * limit, page * limit);

    res.json({
      rows: paged.map((g) => {
        const inPunch = g.punches[0];
        const outPunch =
          g.punches.length > 1 ? g.punches[g.punches.length - 1] : null;
        return {
          id: g.id,
          enrollmentId: g.enrollmentId,
          employeeId: g.employeeId,
          name: g.name,
          location: g.location,
          device: g.device,
          workDate: g.workDate,
          inPunchIST: formatIST(inPunch, "MMM d, hh:mm a"),
          outPunchIST: outPunch ? formatIST(outPunch, "MMM d, hh:mm a") : null,
        };
      }),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  }),
);

/* Devices */
admin.get(
  "/devices",
  ah(async (req, res) =>
    res.json(
      await prisma.biometricDevice.findMany({
        orderBy: [{ location: "asc" }, { id: "asc" }],
      }),
    ),
  ),
);

admin.post(
  "/devices",
  ah(async (req, res) => {
    const deviceCode = String(req.body.deviceCode || "").trim();
    const serialNo = String(req.body.serialNo || "").trim();
    const location = String(req.body.location || "").trim();
    if (!deviceCode || !serialNo || !location)
      return res.status(400).json({
        message: "Device code, serial number and location are required",
      });
    try {
      res.status(201).json(
        await prisma.biometricDevice.create({
          data: {
            deviceCode,
            serialNo,
            location,
            deviceName: req.body.deviceName?.trim() || null,
          },
        }),
      );
    } catch (e) {
      if (e.code === "P2002")
        return res.status(400).json({
          message: `Device ${deviceCode} is already registered at ${location}`,
        });
      throw e;
    }
  }),
);

admin.patch(
  "/devices/:id/toggle",
  ah(async (req, res) => {
    const d = await prisma.biometricDevice.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!d) return res.status(404).json({ message: "Device not found" });
    res.json(
      await prisma.biometricDevice.update({
        where: { id: d.id },
        data: { isActive: !d.isActive },
      }),
    );
  }),
);

/* Card mappings */
admin.get(
  "/mappings",
  ah(async (req, res) => {
    const rows = await prisma.biometricMapping.findMany({
      where: req.query.all === "true" ? {} : { isActive: true },
      include: {
        employee: { select: { fullName: true, saturdayRule: true } },
        _count: { select: { punches: true } },
      },
      orderBy: [{ isActive: "desc" }, { assignedAt: "desc" }],
    });
    res.json(
      rows.map((m) => ({
        ...m,
        name: m.employee?.fullName,
        saturdayRule: SATURDAY_LABEL[m.employee?.saturdayRule],
        punches: m._count.punches,
      })),
    );
  }),
);

admin.post(
  "/mappings",
  ah(async (req, res) => {
    const employeeId = String(req.body.employeeId || "").trim();
    const enrollmentId = String(req.body.enrollmentId || "").trim();
    const location = String(req.body.location || "").trim();
    if (!employeeId || !enrollmentId || !location)
      return res.status(400).json({
        message: "Employee, card / enrollment ID and location are required",
      });
    const emp = await prisma.employee.findUnique({
      where: { employeeId },
      select: { fullName: true },
    });
    if (!emp) return res.status(404).json({ message: "Employee not found" });
    if (
      await prisma.biometricMapping.findFirst({
        where: { employeeId, isActive: true },
      })
    ) {
      return res.status(400).json({
        message: `${emp.fullName} already has an active card. Remove it first.`,
      });
    }
    if (
      await prisma.biometricMapping.findFirst({
        where: { enrollmentId, location, isActive: true },
      })
    ) {
      return res.status(400).json({
        message: `Card ${enrollmentId} is already assigned at ${location}`,
      });
    }
    const mapping = await prisma.biometricMapping.create({
      data: { employeeId, enrollmentId, location },
    });
    // link punches that arrived before the card was assigned
    const { count } = await prisma.biometricPunch.updateMany({
      where: { enrollmentId, location, mappingId: null },
      data: { mappingId: mapping.id, employeeId },
    });
    res.status(201).json({ ...mapping, linkedPunches: count });
  }),
);

admin.patch(
  "/mappings/:id/deactivate",
  ah(async (req, res) => {
    const m = await prisma.biometricMapping.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!m) return res.status(404).json({ message: "Mapping not found" });
    res.json(
      await prisma.biometricMapping.update({
        where: { id: m.id },
        data: { isActive: false, deactivatedAt: new Date() },
      }),
    );
  }),
);

/* Admin can fix a forgotten clock-out */
admin.patch(
  "/sessions/:id/close",
  ah(async (req, res) => {
    const s = await prisma.workSession.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!s) return res.status(404).json({ message: "Session not found" });
    const out = req.body.clockOut ? new Date(req.body.clockOut) : new Date();
    if (isNaN(out) || out <= s.clockIn)
      return res
        .status(400)
        .json({ message: "Clock-out must be after clock-in" });
    res.json(
      await prisma.workSession.update({
        where: { id: s.id },
        data: { clockOut: out, autoClosed: false },
      }),
    );
  }),
);

router.use("/admin", admin);

export default router;
