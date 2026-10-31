// Date helpers. Every business date in the CRM is US Central (America/Chicago).
import { fromZonedTime, toZonedTime, formatInTimeZone } from "date-fns-tz";
import { config } from "../config.js";

const TZ = config.timeZone;
const pad = (n) => String(n).padStart(2, "0");

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** { year, month (1-12), day, weekday (0=Sun) } of "now" (or a date) in Central time */
export function centralParts(date = new Date()) {
  const z = toZonedTime(date, TZ);
  return { year: z.getFullYear(), month: z.getMonth() + 1, day: z.getDate(), weekday: z.getDay() };
}

/** UTC instant of 00:00 Central on the given calendar day */
export function centralMidnight(year, month, day = 1) {
  // normalise overflow (e.g. month 13 -> next year)
  const d = new Date(Date.UTC(year, month - 1, day));
  return fromZonedTime(
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T00:00:00`,
    TZ,
  );
}

/** [start, end) of a Central calendar month as UTC instants */
export function monthRange(year, month) {
  return { start: centralMidnight(year, month, 1), end: centralMidnight(year, month + 1, 1) };
}

/** [start, end) of a Central calendar day */
export function dayRange(year, month, day) {
  return { start: centralMidnight(year, month, day), end: centralMidnight(year, month, day + 1) };
}

export function todayRange(now = new Date()) {
  const p = centralParts(now);
  return dayRange(p.year, p.month, p.day);
}

export function currentMonthRange(now = new Date()) {
  const p = centralParts(now);
  return monthRange(p.year, p.month);
}

/** Shift a {year, month} by n months */
export function addMonths({ year, month }, n) {
  const idx = year * 12 + (month - 1) + n;
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}

/** "yyyy-MM-dd" key of a date in Central time */
export function dateKey(date) {
  if (!date) return null;
  return formatInTimeZone(new Date(date), TZ, "yyyy-MM-dd");
}

/** Contact date from the form ("yyyy-MM-dd") pinned to 12:00 Central */
export function contactDateFromInput(value) {
  if (!value) return new Date();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return fromZonedTime(`${value}T12:00:00`, TZ);
  const d = new Date(value);
  return isNaN(d.getTime()) ? new Date() : d;
}

export function formatCentral(date, fmt = "MMM d, yyyy h:mm a") {
  return formatInTimeZone(new Date(date), TZ, fmt);
}

export function monthLabel(year, month) {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** Parse "yyyy-MM" (or year+month query params) into {year, month}; defaults to current month */
export function parseMonthParam(q = {}) {
  if (q.month && /^\d{4}-\d{1,2}$/.test(q.month)) {
    const [y, m] = q.month.split("-").map(Number);
    return { year: y, month: m };
  }
  const now = centralParts();
  const year = Number(q.year) || now.year;
  const month = Number(q.month) || now.month;
  return { year, month: Math.min(12, Math.max(1, month)) };
}

/* ------------------------------------------------------------------
   Attendance helpers.
   The team works the US day from India (about 5:30 PM – 3:30 AM IST),
   so an attendance "day" is the US Central calendar date (same idea as
   the HR CRM). Punch times are shown in IST, where people actually are.
------------------------------------------------------------------- */
export const IST = "Asia/Kolkata";

export const formatIST = (date, fmt = "hh:mm a") => (date ? formatInTimeZone(new Date(date), IST, fmt) : null);

/** Biometric machines send IST time without an offset, e.g. "2026-06-26 21:15:00" */
export function parseDeviceTime(value) {
  if (!value) return null;
  const s = String(value).trim().replace(" ", "T");
  const d = /(Z|[+-]\d{2}:?\d{2})$/.test(s) ? new Date(s) : fromZonedTime(s, IST);
  return isNaN(d.getTime()) ? null : d;
}

/** Most recent 4:30 AM IST at or before `now` (auto clock-out cutoff) */
export function lastIstCutoff(now = new Date(), hhmm = "04:30") {
  const today = formatInTimeZone(now, IST, "yyyy-MM-dd");
  let cutoff = fromZonedTime(`${today}T${hhmm}:00`, IST);
  if (cutoff > now) cutoff = new Date(cutoff.getTime() - 86400000);
  return cutoff;
}

/** Every calendar day of a Central month: [{ date, day, weekday, nthWeekday }] */
export function monthDays(year, month) {
  const days = [];
  const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
  for (let d = 1; d <= count; d++) {
    const weekday = new Date(Date.UTC(year, month - 1, d)).getUTCDay();
    days.push({ date: `${year}-${pad(month)}-${pad(d)}`, day: d, weekday, nthWeekday: Math.floor((d - 1) / 7) + 1 });
  }
  return days;
}

/** "yyyy-MM-dd" key shifted by n days */
export function shiftDateKey(key, n) {
  const [y, m, d] = key.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** [start, end) of a Central day given as "yyyy-MM-dd" */
export function dayRangeKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return dayRange(y, m, d);
}
