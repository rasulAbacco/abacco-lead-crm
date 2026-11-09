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
// Saturday rule per employee: WORKING (every Saturday), OFF, ALTERNATE (Saturdays off as set for
//   the month in WorkMonthRule; default 2nd + 4th Saturday off).
// Working-day calendar (admin → Attendance → Working days) beats the rules above:
//   1. person's own exception for a date (WorkDayOverride: must work / day off)
//   2. company calendar for a date (WorkCalendarDay: WORKING for everyone / WEEK_OFF / HOLIDAY)
//   3. normal rule: Sunday off, Saturday per the person's Saturday rule
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
  ALTERNATE: "Alternate Saturdays",
};

export const DEFAULT_SATURDAYS_OFF = [2, 4];
export const parseSaturdaysOff = (s) =>
  [
    ...new Set(
      String(s ?? "")
        .split(",")
        .map(Number)
        .filter((n) => n >= 1 && n <= 5),
    ),
  ].sort();

/** Normal rule only (no calendar): Sunday off, Saturday per the person's rule.
 *  satOff = which Saturdays of the month are off for ALTERNATE people (default 2nd + 4th). */
export function isDefaultWorkingDay(
  day,
  saturdayRule = "ALTERNATE",
  satOff = null,
) {
  if (day.weekday === 0) return false;
  if (day.weekday === 6) {
    if (saturdayRule === "OFF") return false;
    if (saturdayRule === "ALTERNATE")
      return !(satOff || DEFAULT_SATURDAYS_OFF).includes(day.nthWeekday);
  }
  return true;
}

/** Is this a working day for this person? `cal` = calFor(...) (optional) */
export function isWorkingDay(day, saturdayRule = "ALTERNATE", cal = null) {
  if (cal?.personal) return cal.personal.working;
  if (cal?.company) return cal.company.type === "WORKING";
  return isDefaultWorkingDay(day, saturdayRule, cal?.satOff);
}

/** Load the working-day calendar for [fromKey, toKey] (yyyy-MM-dd, inclusive) */
export async function loadCalendar(fromKey, toKey, employeeIds) {
  const [company, personal, months] = await Promise.all([
    prisma.workCalendarDay.findMany({
      where: { date: { gte: fromKey, lte: toKey } },
    }),
    prisma.workDayOverride.findMany({
      where: {
        date: { gte: fromKey, lte: toKey },
        ...(employeeIds && { employeeId: { in: employeeIds } }),
      },
    }),
    prisma.workMonthRule.findMany({
      where: { month: { gte: fromKey.slice(0, 7), lte: toKey.slice(0, 7) } },
    }),
  ]);
  return {
    company: new Map(company.map((c) => [c.date, c])),
    personal: new Map(personal.map((o) => [`${o.employeeId}|${o.date}`, o])),
    months: new Map(
      months.map((m) => [m.month, parseSaturdaysOff(m.saturdaysOff)]),
    ),
  };
}

/** Calendar entries that apply to one person on one date */
export const calFor = (cal, employeeId, date) =>
  cal
    ? {
        company: cal.company.get(date) || null,
        personal: employeeId
          ? cal.personal.get(`${employeeId}|${date}`) || null
          : null,
        satOff: cal.months?.get(date.slice(0, 7)) || null,
      }
    : null;

/** Reason a day is off: company holiday / Sunday = HOLIDAY, otherwise WEEK_OFF (also company "Week off") */
const offStatus = (day, cal) =>
  !cal?.personal && (cal?.company?.type === "HOLIDAY" || day.weekday === 0)
    ? "HOLIDAY"
    : "WEEK_OFF";

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
    calendar = null,
  },
) {
  punches = collapsePunches(punches); // ignore re-sent / double punches
  const working = isWorkingDay(day, saturdayRule, calendar);
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
    if (!working) status = offStatus(day, calendar);
    else if (!isToday) status = "ABSENT";
  } else if (future && !working) {
    status = offStatus(day, calendar);
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
    // why the day is (not) a working day, for the calendar view
    dayNote: calendar?.personal?.note || calendar?.company?.note || null,
    extraDay:
      !!calendar?.personal?.working &&
      !isWorkingDay(day, saturdayRule, {
        company: calendar.company,
        personal: null,
        satOff: calendar.satOff,
      }),
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
  const days = monthDays(year, month);
  const [employees, punches, sessions, calendar] = await Promise.all([
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
    loadCalendar(
      days[0].date,
      days[days.length - 1].date,
      employeeId ? [employeeId] : undefined,
    ),
  ]);
  return { employees, punches, sessions, calendar };
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
  const { employees, punches, sessions, calendar } = await loadMonth(
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
          calendar: calFor(calendar, e.employeeId, d.date),
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
        extraDays: 0,
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
        if (d.extraDay) sum.extraDays++;
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
  const [punches, sessions, calendar] = await Promise.all([
    prisma.biometricPunch.findMany({
      where: { employeeId, punchTime: { gte: start } },
      orderBy: { punchTime: "asc" },
      select: { punchTime: true },
    }),
    prisma.workSession.findMany({
      where: { employeeId, workDate: { in: keys } },
      orderBy: { clockIn: "asc" },
    }),
    loadCalendar(keys[keys.length - 1], keys[0], [employeeId]),
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
      calendar: calFor(calendar, employeeId, k),
    }),
  );
}
