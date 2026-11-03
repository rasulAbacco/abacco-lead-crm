// Attendance calculation shared by the admin report, Excel/email and dashboards.
//
// Day        = US Central calendar date (the night shift in IST is one US day).
// Biometric  = first and last punch of the day on the machine.
//   PRESENT       first->last >= 9h (FULL_DAY_HOURS)
//   HALF_DAY      both punches but less than 9h
//   MISSING_OUT   only one punch on a past day (forgot to punch out)
//   IN            only one punch so far today (still working)
//   ABSENT        working day without any punch (past days only)
//   WEEK_OFF      Saturday that is off for this person (see saturdayRule)
//   HOLIDAY       Sunday
//   Punches on WEEK_OFF / HOLIDAY still count, flagged as offDayWork.
// Saturday rule per employee: WORKING (every Saturday), OFF, ALTERNATE (2nd + 4th Saturday off).
// System clock-in is reported next to it; sessions closed automatically at
// 4:30 AM IST are marked "Not clocked out" and their hours are NOT counted.
import prisma from "../prismaClient.js";
import { config } from "../config.js";
import {
  monthRange,
  monthDays,
  lastIstCutoff,
  dateKey,
  formatIST,
  formatCentral,
  dayRangeKey,
  MONTH_NAMES,
} from "../utils/time.js";

export const STATUS_CODE = {
  PRESENT: "P",
  HALF_DAY: "HD",
  MISSING_OUT: "MP",
  IN: "IN",
  ABSENT: "A",
  WEEK_OFF: "WO",
  HOLIDAY: "H",
};
export const STATUS_LABEL = {
  PRESENT: "Present",
  HALF_DAY: "Half day",
  MISSING_OUT: "Missing punch-out",
  IN: "Working now",
  ABSENT: "Absent",
  WEEK_OFF: "Week off",
  HOLIDAY: "Holiday",
};
export const SATURDAY_LABEL = {
  WORKING: "Every Saturday",
  OFF: "Saturday off",
  ALTERNATE: "Alternate (2nd & 4th off)",
};

export function isWorkingDay(day, saturdayRule = "ALTERNATE") {
  if (day.weekday === 0) return false;
  if (day.weekday === 6) {
    if (saturdayRule === "OFF") return false;
    if (saturdayRule === "ALTERNATE") return ![2, 4].includes(day.nthWeekday);
  }
  return true;
}

/* ---------------------------------------------------------------------
   Duplicate / re-sent punch protection.
   The machine (or its sync software) often re-sends old records, or the
   same card is tapped twice within seconds. Any punches of the same card
   closer than PUNCH_GAP are ONE punch, so an old 12:00 can never turn
   into a "punch out". Applied on ingest AND on every calculation, so
   duplicates that are already in the database are ignored too.
   Set PUNCH_DEBOUNCE_SECONDS in .env to change (default 120 s).
--------------------------------------------------------------------- */
export const PUNCH_GAP_MS =
  (Number(process.env.PUNCH_DEBOUNCE_SECONDS) || 120) * 1000;

export function collapsePunches(times, gap = PUNCH_GAP_MS) {
  const sorted = [...times].sort((a, b) => a - b);
  const out = [];
  for (const t of sorted)
    if (!out.length || t - out[out.length - 1] >= gap) out.push(t);
  return out;
}

/** Is the shift of this US date over? Past days: yes. Today: yes once the
 *  auto clock-out time (4:30 AM IST) has passed. Future: no. */
export function dayIsClosed(key, now = new Date()) {
  const todayKey = dateKey(now);
  if (key < todayKey) return true;
  if (key > todayKey) return false;
  return dateKey(lastIstCutoff(now, config.autoClockOutIst)) >= todayKey;
}

export const fmtMinutes = (m) =>
  m == null
    ? null
    : `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;

export function dayFromKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return {
    date: key,
    day: d,
    weekday,
    nthWeekday: Math.floor((d - 1) / 7) + 1,
  };
}

/** Status of one employee on one day */
export function evaluateDay(
  day,
  {
    punches = [],
    sessions = [],
    saturdayRule,
    joiningKey,
    todayKey,
    todayClosed = false,
  },
) {
  punches = collapsePunches(punches); // ignore re-sent / double punches
  const working = isWorkingDay(day, saturdayRule);
  const future = day.date > todayKey;
  const beforeJoin = joiningKey && day.date < joiningKey;
  // "today" only runs until the auto clock-out time passes; after that the
  // day is final (no punch = ABSENT, one punch = MISSING_OUT)
  const isToday = day.date === todayKey && !todayClosed;

  let status = null;
  let first = null,
    last = null,
    minutes = null;
  if (punches.length) {
    first = punches[0];
    last = punches[punches.length - 1];
    const span = last.getTime() - first.getTime();
    if (punches.length >= 2 && span > 0) {
      minutes = Math.floor(span / 60000);
      status =
        minutes >= config.fullDayHours * 60
          ? "PRESENT"
          : isToday
            ? "IN"
            : "HALF_DAY";
    } else {
      status = isToday ? "IN" : "MISSING_OUT";
      last = null;
    }
  } else if (!future && !beforeJoin) {
    if (!working) status = day.weekday === 0 ? "HOLIDAY" : "WEEK_OFF";
    else if (!isToday) status = "ABSENT";
  } else if (future && !working) {
    status = day.weekday === 0 ? "HOLIDAY" : "WEEK_OFF";
  }

  // system clock-in
  let sysMinutes = 0,
    sysOpen = false,
    notClockedOut = false,
    firstIn = null,
    lastOut = null;
  for (const s of sessions) {
    if (!firstIn || s.clockIn < firstIn) firstIn = s.clockIn;
    if (s.autoClosed) notClockedOut = true;
    else if (s.clockOut) {
      sysMinutes += Math.floor((s.clockOut - s.clockIn) / 60000);
      if (!lastOut || s.clockOut > lastOut) lastOut = s.clockOut;
    } else {
      sysOpen = true;
      sysMinutes += Math.floor((Date.now() - s.clockIn) / 60000);
    }
  }

  return {
    date: day.date,
    weekday: day.weekday,
    working,
    status,
    code: status ? STATUS_CODE[status] : "",
    offDayWork: !!punches.length && !working,
    firstPunch: first,
    lastPunch: last,
    firstPunchIST: formatIST(first),
    lastPunchIST: formatIST(last),
    firstPunchCT: first ? formatCentral(first, "hh:mm a") : null,
    lastPunchCT: last ? formatCentral(last, "hh:mm a") : null,
    minutes,
    hours: fmtMinutes(minutes),
    punchCount: punches.length,
    system: sessions.length
      ? {
          sessions: sessions.length,
          minutes: sysMinutes,
          hours: fmtMinutes(sysMinutes),
          open: sysOpen,
          notClockedOut,
          clockInIST: formatIST(firstIn),
          clockOutIST: formatIST(lastOut),
        }
      : null,
  };
}

async function loadMonth(year, month, employeeId) {
  const r = monthRange(year, month);
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  const [employees, punches, sessions] = await Promise.all([
    prisma.employee.findMany({
      where: employeeId ? { employeeId } : { isActive: true },
      select: {
        employeeId: true,
        fullName: true,
        role: true,
        joiningDate: true,
        saturdayRule: true,
        isActive: true,
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.biometricPunch.findMany({
      where: {
        employeeId: employeeId || { not: null },
        punchTime: { gte: r.start, lt: r.end },
      },
      select: { employeeId: true, punchTime: true },
      orderBy: { punchTime: "asc" },
    }),
    prisma.workSession.findMany({
      where: {
        workDate: { startsWith: prefix },
        ...(employeeId && { employeeId }),
      },
      orderBy: { clockIn: "asc" },
    }),
  ]);
  return { employees, punches, sessions };
}

function index(punches, sessions) {
  const p = {},
    s = {};
  for (const x of punches)
    ((p[x.employeeId] ||= {})[dateKey(x.punchTime)] ||= []).push(x.punchTime);
  for (const x of sessions)
    ((s[x.employeeId] ||= {})[x.workDate] ||= []).push(x);
  return { p, s };
}

/** Full month report for every active employee (or one) */
export async function monthlyAttendance(year, month, { employeeId } = {}) {
  const { employees, punches, sessions } = await loadMonth(
    year,
    month,
    employeeId,
  );
  const { p, s } = index(punches, sessions);
  const days = monthDays(year, month);
  const todayKey = dateKey(new Date());
  const todayClosed = dayIsClosed(todayKey);

  const hasPunches = new Set(punches.map((x) => x.employeeId));
  const hasSessions = new Set(sessions.map((x) => x.employeeId));
  const rows = employees
    // admins only appear if they actually punched or clocked in
    .filter(
      (e) =>
        e.role !== "ADMIN" ||
        hasPunches.has(e.employeeId) ||
        hasSessions.has(e.employeeId),
    )
    .map((e) => {
      const joiningKey = e.joiningDate ? dateKey(e.joiningDate) : null;
      const list = days.map((d) =>
        evaluateDay(d, {
          punches: p[e.employeeId]?.[d.date] || [],
          sessions: s[e.employeeId]?.[d.date] || [],
          saturdayRule: e.saturdayRule,
          joiningKey,
          todayKey,
          todayClosed,
        }),
      );
      const sum = {
        present: 0,
        halfDay: 0,
        absent: 0,
        missingOut: 0,
        weekOff: 0,
        holiday: 0,
        offDayWork: 0,
        minutes: 0,
        workingDays: 0,
      };
      const sys = { days: 0, minutes: 0, notClockedOut: 0 };
      for (const d of list) {
        if (d.status === "PRESENT") sum.present++;
        if (d.status === "HALF_DAY") sum.halfDay++;
        if (d.status === "ABSENT") sum.absent++;
        if (d.status === "MISSING_OUT") sum.missingOut++;
        if (d.status === "WEEK_OFF") sum.weekOff++;
        if (d.status === "HOLIDAY") sum.holiday++;
        if (d.offDayWork) sum.offDayWork++;
        if (d.working && d.date <= todayKey) sum.workingDays++;
        sum.minutes += d.minutes || 0;
        if (d.system) {
          sys.days++;
          if (!d.system.open) sys.minutes += d.system.minutes;
          if (d.system.notClockedOut) sys.notClockedOut++;
        }
      }
      // half day counts as 0.5 present day
      sum.attendedDays = sum.present + sum.halfDay * 0.5;
      sum.hours = fmtMinutes(sum.minutes);
      sys.hours = fmtMinutes(sys.minutes);
      return {
        employeeId: e.employeeId,
        name: e.fullName,
        saturdayRule: e.saturdayRule,
        role: e.role,
        team:
          e.role === "DEVELOPER"
            ? "Developer"
            : e.role === "ADMIN"
              ? "Admin"
              : "Marketing",
        hasBiometric: hasPunches.has(e.employeeId),
        days: list,
        summary: sum,
        system: sys,
      };
    });

  return {
    year,
    month,
    label: `${MONTH_NAMES[month - 1]} ${year}`,
    fullDayHours: config.fullDayHours,
    days: days.map((d) => ({ date: d.date, day: d.day, weekday: d.weekday })),
    rows,
  };
}

/** Today + yesterday for one employee (employee dashboard) */
export async function recentDays(employeeId, n = 2) {
  const emp = await prisma.employee.findUnique({
    where: { employeeId },
    select: { saturdayRule: true, joiningDate: true },
  });
  const todayKey = dateKey(new Date());
  const keys = Array.from({ length: n }, (_, i) =>
    dateKey(new Date(Date.now() - i * 86400000)),
  );
  const start = dayRangeKey(keys[keys.length - 1]).start;
  const [punches, sessions] = await Promise.all([
    prisma.biometricPunch.findMany({
      where: { employeeId, punchTime: { gte: start } },
      orderBy: { punchTime: "asc" },
      select: { punchTime: true },
    }),
    prisma.workSession.findMany({
      where: { employeeId, workDate: { in: keys } },
      orderBy: { clockIn: "asc" },
    }),
  ]);
  return keys.map((k) =>
    evaluateDay(dayFromKey(k), {
      punches: punches
        .filter((x) => dateKey(x.punchTime) === k)
        .map((x) => x.punchTime),
      sessions: sessions.filter((x) => x.workDate === k),
      saturdayRule: emp?.saturdayRule,
      joiningKey: emp?.joiningDate ? dateKey(emp.joiningDate) : null,
      todayKey,
      todayClosed: dayIsClosed(todayKey),
    }),
  );
}
