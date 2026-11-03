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
  STATUS_LABEL,
  PUNCH_GAP_MS,
  collapsePunches,
  dayIsClosed,
  dayFromKey,
  evaluateDay,
} from "../services/attendance.js";
import {
  attendanceWorkbookBuffer,
  punchGridWorkbookBuffer,
} from "../utils/attendanceExcel.js";
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

/* Serialise ingestion so two overlapping requests (machine retry, double
   click on "send") can never both pass the duplicate check. */
let ingestLock = Promise.resolve();
const withIngestLock = (fn) => {
  const run = ingestLock.then(fn, fn);
  ingestLock = run.catch(() => {});
  return run;
};

async function ingestPunches(records) {
  let inserted = 0,
    skipped = 0,
    unknownDevice = 0;
  const [devices, mappings] = await Promise.all([
    prisma.biometricDevice.findMany({ where: { isActive: true } }),
    prisma.biometricMapping.findMany({
      where: { isActive: true },
      select: {
        id: true,
        employeeId: true,
        enrollmentId: true,
        location: true,
      },
    }),
  ]);
  const mappingIndex = new Map(
    mappings.map((m) => [`${m.enrollmentId}|${m.location}`, m]),
  );

  // 1. validate + resolve machine / card
  const valid = [];
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
      continue; // only registered machines are accepted
    }
    valid.push({
      enrollmentId,
      device,
      mapping: mappingIndex.get(`${enrollmentId}|${device.location}`) || null,
      punchTime,
      punchMode: item?.PunchMode != null ? String(item.PunchMode) : null,
    });
  }
  if (!valid.length) return { inserted, skipped, unknownDevice };

  // 2. load what is already stored around these punches (one query)
  valid.sort((x, y) => x.punchTime - y.punchTime);
  const ids = [...new Set(valid.map((v) => v.enrollmentId))];
  const existing = await prisma.biometricPunch.findMany({
    where: {
      enrollmentId: { in: ids },
      punchTime: {
        gte: new Date(valid[0].punchTime.getTime() - PUNCH_GAP_MS),
        lte: new Date(
          valid[valid.length - 1].punchTime.getTime() + PUNCH_GAP_MS,
        ),
      },
    },
    select: { enrollmentId: true, punchTime: true },
  });
  const seen = new Map(); // enrollmentId -> [ms, ...] stored or accepted so far
  for (const e of existing) {
    if (!seen.has(e.enrollmentId)) seen.set(e.enrollmentId, []);
    seen.get(e.enrollmentId).push(e.punchTime.getTime());
  }

  // 3. skip exact repeats AND anything within PUNCH_GAP of a punch we already have
  const toCreate = [];
  for (const v of valid) {
    const ms = v.punchTime.getTime();
    const list = seen.get(v.enrollmentId) || [];
    if (list.some((t) => Math.abs(t - ms) < PUNCH_GAP_MS)) {
      skipped++;
      continue;
    }
    list.push(ms);
    seen.set(v.enrollmentId, list);
    toCreate.push({
      enrollmentId: v.enrollmentId,
      deviceId: v.device.id,
      mappingId: v.mapping?.id || null,
      employeeId: v.mapping?.employeeId || null,
      location: v.device.location,
      punchTime: v.punchTime,
      punchMode: v.punchMode,
    });
  }
  if (toCreate.length) {
    await prisma.biometricPunch.createMany({ data: toCreate });
    inserted = toCreate.length;
  }
  return { inserted, skipped, unknownDevice };
}

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
    const result = await withIngestLock(() => ingestPunches(records));
    res.json({ success: true, ...result });
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

admin.get(
  "/monthly/punch-export",
  ah(async (req, res) => {
    const { year, month } = ym(req.query);
    const report = await monthlyAttendance(year, month);
    sendXlsx(
      res,
      punchGridWorkbookBuffer(report),
      `punch-in-out-${year}-${String(month).padStart(2, "0")}.xlsx`,
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
        const p = collapsePunches(
          punches
            .filter((x) => x.employeeId === e.employeeId)
            .map((x) => x.punchTime),
        ).map((t) => ({ punchTime: t }));
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

/* Punch log.
   ?date=yyyy-MM-dd (US date)  default = today.   ?date=all = every stored day.
   For a single day it lists EVERY employee that has a card, so people who
   have not punched yet are visible:
     - day still running  -> "Not punched yet" (turns final at 4:30 AM IST auto punch-out)
     - day closed         -> "Absent"
   Re-sent / double punches are collapsed, so an old 12:00 is never shown as "Out". */
admin.get(
  "/punches",
  ah(async (req, res) => {
    const now = new Date();
    const todayKey = dateKey(now);
    const todayClosed = dayIsClosed(todayKey, now);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 50);
    const allDates = req.query.date === "all";
    const date = allDates
      ? null
      : /^\d{4}-\d{2}-\d{2}$/.test(req.query.date || "")
        ? req.query.date
        : todayKey;

    const where = {};
    if (req.query.mapped === "true") where.mappingId = { not: null };
    if (req.query.mapped === "false") where.mappingId = null;
    if (req.query.employeeId) where.employeeId = req.query.employeeId;
    if (date) {
      const r = dayRangeKey(date);
      where.punchTime = { gte: r.start, lt: r.end };
    }

    const punches = await prisma.biometricPunch.findMany({
      where,
      orderBy: { punchTime: "asc" },
      include: { device: { select: { deviceName: true, deviceCode: true } } },
    });

    // group: one row per person per US day
    const groups = new Map();
    const add = (wd, base) => {
      const key = `${wd}|${base.employeeId || `card:${base.enrollmentId}`}`;
      if (!groups.has(key)) groups.set(key, { key, wd, times: [], ...base });
      return groups.get(key);
    };
    for (const p of punches) {
      const g = add(dateKey(p.punchTime), {
        employeeId: p.employeeId,
        enrollmentId: p.enrollmentId,
        location: p.location,
        device: p.device?.deviceName || p.device?.deviceCode || null,
      });
      g.times.push(p.punchTime);
    }

    // roster for a single day: everybody with an active card
    if (date && req.query.mapped !== "false") {
      const mappings = await prisma.biometricMapping.findMany({
        where: {
          isActive: true,
          employee: { isActive: true },
          ...(req.query.employeeId && { employeeId: req.query.employeeId }),
        },
        select: { employeeId: true, enrollmentId: true, location: true },
      });
      for (const m of mappings)
        add(date, {
          employeeId: m.employeeId,
          enrollmentId: m.enrollmentId,
          location: m.location,
          device: null,
        });
    }

    const empIds = [
      ...new Set([...groups.values()].map((g) => g.employeeId).filter(Boolean)),
    ];
    const emps = await prisma.employee.findMany({
      where: { employeeId: { in: empIds } },
      select: {
        employeeId: true,
        fullName: true,
        saturdayRule: true,
        joiningDate: true,
      },
    });
    const empMap = new Map(emps.map((e) => [e.employeeId, e]));

    const list = [...groups.values()].map((g) => {
      const e = g.employeeId ? empMap.get(g.employeeId) : null;
      const ev = evaluateDay(dayFromKey(g.wd), {
        punches: g.times,
        saturdayRule: e?.saturdayRule,
        joiningKey: e?.joiningDate ? dateKey(e.joiningDate) : null,
        todayKey,
        todayClosed,
      });
      let code = ev.code;
      let status = ev.status ? STATUS_LABEL[ev.status] : "";
      if (!ev.status && !ev.punchCount && ev.working && g.wd === todayKey) {
        code = "NP"; // today's shift still running, nobody can be called absent yet
        status = "Not punched yet";
      }
      return {
        id: g.key,
        enrollmentId: g.enrollmentId,
        employeeId: g.employeeId,
        name: e?.fullName || null,
        location: g.location,
        device: g.device,
        workDate: g.wd,
        inPunchIST: ev.firstPunch
          ? formatIST(ev.firstPunch, "MMM d, hh:mm a")
          : null,
        outPunchIST: ev.lastPunch
          ? formatIST(ev.lastPunch, "MMM d, hh:mm a")
          : null,
        hours: ev.hours,
        code,
        status,
      };
    });

    list.sort((a, b) =>
      a.workDate !== b.workDate
        ? a.workDate < b.workDate
          ? 1
          : -1
        : (a.name || "~").localeCompare(b.name || "~"),
    );

    const summary = {
      punched: list.filter((r) => r.inPunchIST).length,
      notPunched: list.filter((r) => r.code === "NP").length,
      absent: list.filter((r) => r.code === "A").length,
    };
    const total = list.length;
    res.json({
      rows: list.slice((page - 1) * limit, page * limit),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      date: date || "all",
      todayKey,
      dayClosed: date ? dayIsClosed(date, now) : true,
      summary,
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
