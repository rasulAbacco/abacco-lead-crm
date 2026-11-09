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
  monthDays,
  monthRange,
  MONTH_NAMES,
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
  loadCalendar,
  calFor,
  isWorkingDay,
  isDefaultWorkingDay,
  parseSaturdaysOff,
  DEFAULT_SATURDAYS_OFF,
} from "../services/attendance.js";
import { notify } from "../services/notify.js";
import {
  attendanceWorkbookBuffer,
  punchGridWorkbookBuffer,
  sliceReport,
} from "../utils/attendanceExcel.js";
import {
  emailAttendanceReport,
  emailPunchReport,
} from "../jobs/attendanceJobs.js";
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

/* Punch report filters: from / to (yyyy-MM-dd inside the month), team, q (name / ID) */
const punchFilters = (src) => ({
  from: /^\d{4}-\d{2}-\d{2}$/.test(src.from || "") ? src.from : undefined,
  to: /^\d{4}-\d{2}-\d{2}$/.test(src.to || "") ? src.to : undefined,
  team: ["Marketing", "Developer"].includes(src.team) ? src.team : undefined,
  q: src.q ? String(src.q).slice(0, 60) : undefined,
});

admin.get(
  "/monthly/punch-export",
  ah(async (req, res) => {
    const { year, month } = ym(req.query);
    const report = sliceReport(
      await monthlyAttendance(year, month),
      punchFilters(req.query),
    );
    const tag =
      report.range && report.rangeLabel !== report.label
        ? `${report.range.from}_to_${report.range.to}`
        : `${year}-${String(month).padStart(2, "0")}`;
    sendXlsx(res, punchGridWorkbookBuffer(report), `punch-in-out-${tag}.xlsx`);
  }),
);

/* Email the punch in / out report to the report address (info@abaccotech.com) */
admin.post(
  "/monthly/punch-email",
  ah(async (req, res) => {
    const { year, month } = ym(req.body || {});
    try {
      const r = await emailPunchReport(
        year,
        month,
        punchFilters(req.body || {}),
        { sentBy: req.user?.fullName || req.user?.name },
      );
      res.json({ success: true, ...r });
    } catch (e) {
      if (e.status === 400) return res.status(400).json({ message: e.message });
      console.error("punch report email failed:", e.message);
      res
        .status(502)
        .json({ message: "Email could not be sent. Check the SMTP settings." });
    }
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
    const wds = [...groups.values()].map((g) => g.wd).sort();
    const calendar = wds.length
      ? await loadCalendar(wds[0], wds[wds.length - 1], empIds)
      : null;
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
        calendar: calFor(calendar, g.employeeId, g.wd),
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

/* =====================================================================
   WORKING-DAY CALENDAR  (Attendance → Working days)
   Company calendar: a date that is different for everyone (Saturday made
   working, festival holiday). Person exceptions: someone must work a date
   (e.g. every Saturday while behind target) or has it off.
===================================================================== */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

admin.get(
  "/calendar",
  ah(async (req, res) => {
    const { year, month } = ym(req.query);
    const days = monthDays(year, month);
    const from = days[0].date;
    const to = days[days.length - 1].date;
    const todayKey = dateKey(new Date());
    const now = centralParts();

    // target performance: this month if it has started, otherwise the current month
    const started = from <= todayKey;
    const basis = started
      ? { year, month }
      : { year: now.year, month: now.month };
    const basisDays = monthDays(basis.year, basis.month).length;
    const isCurrent = basis.year === now.year && basis.month === now.month;
    const fraction = isCurrent ? now.day / basisDays : 1;
    const br = monthRange(basis.year, basis.month);

    const [people, calendar, counts] = await Promise.all([
      prisma.employee.findMany({
        where: { isActive: true, role: { in: ["EMPLOYEE", "DEVELOPER"] } },
        select: {
          employeeId: true,
          fullName: true,
          role: true,
          saturdayRule: true,
          target: true,
        },
        orderBy: { fullName: "asc" },
      }),
      loadCalendar(from, to),
      prisma.lead.groupBy({
        by: ["employeeId"],
        where: { date: { gte: br.start, lt: br.end } },
        _count: { _all: true },
      }),
    ]);
    const leadsOf = new Map(counts.map((c) => [c.employeeId, c._count._all]));
    const overrides = [...calendar.personal.values()];
    const monthKey = from.slice(0, 7);
    const satOff = calendar.months.get(monthKey) || null;

    res.json({
      year,
      month,
      label: `${MONTH_NAMES[month - 1]} ${year}`,
      todayKey,
      basis: {
        label: `${MONTH_NAMES[basis.month - 1]} ${basis.year}`,
        isCurrent,
        fraction,
      },
      saturdaysOff: satOff || DEFAULT_SATURDAYS_OFF,
      saturdaysCustom: !!satOff,
      days: days.map((d) => {
        const c = calendar.company.get(d.date) || null;
        const list = overrides.filter((o) => o.date === d.date);
        return {
          date: d.date,
          day: d.day,
          weekday: d.weekday,
          nthWeekday: d.nthWeekday,
          defaultWorking: isDefaultWorkingDay(d, "ALTERNATE", satOff),
          companyWorking: isWorkingDay(d, "ALTERNATE", {
            company: c,
            personal: null,
            satOff,
          }),
          companyType: c?.type || null,
          note: c?.note || null,
          working: list.filter((o) => o.working).map((o) => o.employeeId),
          off: list.filter((o) => !o.working).map((o) => o.employeeId),
        };
      }),
      employees: people.map((e) => {
        const leads = leadsOf.get(e.employeeId) || 0;
        const expected = Math.floor((e.target || 0) * fraction);
        let workingDays = 0;
        let extraDays = 0;
        for (const d of days) {
          const cal = calFor(calendar, e.employeeId, d.date);
          if (isWorkingDay(d, e.saturdayRule, cal)) {
            workingDays++;
            if (
              cal.personal?.working &&
              !isWorkingDay(d, e.saturdayRule, { ...cal, personal: null })
            )
              extraDays++;
          }
        }
        return {
          employeeId: e.employeeId,
          name: e.fullName,
          role: e.role,
          saturdayRule: e.saturdayRule,
          target: e.target || 0,
          leads,
          pct: e.target ? Math.round((leads / e.target) * 100) : null,
          expected,
          behind: e.role !== "DEVELOPER" && e.target > 0 && leads < expected,
          reached: e.role !== "DEVELOPER" && e.target > 0 && leads >= e.target,
          workingDays,
          extraDays,
        };
      }),
    });
  }),
);

/* Company calendar for one date: WORKING / WEEK_OFF / HOLIDAY for everyone, or DEFAULT (normal rule) */
admin.put(
  "/calendar/day",
  ah(async (req, res) => {
    const { date, type } = req.body || {};
    const note =
      String(req.body?.note || "")
        .trim()
        .slice(0, 120) || null;
    if (!DATE_RE.test(date || ""))
      return res.status(400).json({ message: "Pick a valid date" });
    if (type === "DEFAULT" || !type) {
      await prisma.workCalendarDay.deleteMany({ where: { date } });
    } else if (["WORKING", "WEEK_OFF", "HOLIDAY"].includes(type)) {
      await prisma.workCalendarDay.upsert({
        where: { date },
        update: { type, note },
        create: { date, type, note },
      });
    } else {
      return res
        .status(400)
        .json({
          message: "Type must be WORKING, WEEK_OFF, HOLIDAY or DEFAULT",
        });
    }
    res.json({ success: true });
  }),
);

/* Which Saturdays are off this month for people on alternate Saturdays.
   off: [1..5] (e.g. [2,4] or [1,3,5]); off: null = back to the default (2nd + 4th). */
admin.put(
  "/calendar/saturdays",
  ah(async (req, res) => {
    const { year, month } = ym(req.body || {});
    const monthKey = `${year}-${String(month).padStart(2, "0")}`;
    const reset = req.body?.off === null || req.body?.off === undefined;
    if (!reset && !Array.isArray(req.body.off))
      return res.status(400).json({ message: "off must be a list like [2,4]" });
    const off = reset
      ? DEFAULT_SATURDAYS_OFF
      : parseSaturdaysOff(req.body.off.join(","));
    if (reset)
      await prisma.workMonthRule.deleteMany({ where: { month: monthKey } });
    else
      await prisma.workMonthRule.upsert({
        where: { month: monthKey },
        update: { saturdaysOff: off.join(",") },
        create: { month: monthKey, saturdaysOff: off.join(",") },
      });

    // tell people on alternate Saturdays which Saturdays they have off
    if (req.body?.notify !== false) {
      const sats = monthDays(year, month).filter((d) => d.weekday === 6);
      const offDays = sats
        .filter((d) => off.includes(d.nthWeekday))
        .map((d) => d.day);
      const people = await prisma.employee.findMany({
        where: {
          isActive: true,
          saturdayRule: "ALTERNATE",
          role: { in: ["EMPLOYEE", "DEVELOPER"] },
        },
        select: { employeeId: true },
      });
      const mName = MONTH_NAMES[month - 1];
      await notify(
        people.map((p) => p.employeeId),
        {
          type: "attendance",
          title: `Saturdays off in ${mName}`,
          body: offDays.length
            ? `${offDays.map((d) => `${mName.slice(0, 3)} ${d}`).join(", ")} are off. Other Saturdays are working days.`
            : "All Saturdays are working days this month.",
          link: "/employee-dashboard",
          refKey: `satoff:${monthKey}`,
        },
      ).catch(() => {});
    }
    res.json({ success: true, saturdaysOff: off });
  }),
);

/* Person exceptions for one or more dates.
   working: true = must work, false = day off, null = back to normal. */
admin.put(
  "/calendar/people",
  ah(async (req, res) => {
    const dates = [
      ...new Set((req.body?.dates || []).filter((d) => DATE_RE.test(d))),
    ].slice(0, 62);
    const employeeIds = [
      ...new Set((req.body?.employeeIds || []).map(String)),
    ].slice(0, 500);
    const working =
      req.body?.working === true
        ? true
        : req.body?.working === false
          ? false
          : null;
    const note =
      String(req.body?.note || "")
        .trim()
        .slice(0, 120) || null;
    if (!dates.length)
      return res.status(400).json({ message: "Pick at least one date" });
    if (!employeeIds.length)
      return res.status(400).json({ message: "Pick at least one employee" });

    if (working === null) {
      const r = await prisma.workDayOverride.deleteMany({
        where: { date: { in: dates }, employeeId: { in: employeeIds } },
      });
      return res.json({ success: true, changed: r.count });
    }
    const valid = await prisma.employee.findMany({
      where: { employeeId: { in: employeeIds } },
      select: { employeeId: true },
    });
    const ops = [];
    for (const { employeeId } of valid)
      for (const date of dates)
        ops.push(
          prisma.workDayOverride.upsert({
            where: { employeeId_date: { employeeId, date } },
            update: { working, note },
            create: { employeeId, date, working, note },
          }),
        );
    await prisma.$transaction(ops);

    // tell people about extra working days
    if (working) {
      const nice = dates
        .sort()
        .map((d) =>
          formatCentral(new Date(`${d}T12:00:00-06:00`), "EEE, MMM d"),
        );
      await notify(
        valid.map((v) => v.employeeId),
        {
          type: "attendance",
          title:
            dates.length === 1
              ? `You are working on ${nice[0]}`
              : `${dates.length} extra working days`,
          body: `${nice.join(", ")}${note ? `. ${note}` : ""}`,
          link: "/employee-dashboard",
        },
      ).catch(() => {});
    }
    res.json({ success: true, changed: ops.length });
  }),
);

router.use("/admin", admin);

export default router;
