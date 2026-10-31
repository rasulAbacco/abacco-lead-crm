// Formatting helpers. Business dates are shown in US Central time, like the server.
import { formatInTimeZone } from "date-fns-tz";

export const TZ = "America/Chicago";

export const STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "NO_RESPONSE", label: "No Response" },
  { value: "LEAVE_OUT", label: "Leave Out" },
];
export const STATUS_LABEL = { PENDING: "Pending", ACTIVE: "Active", NO_RESPONSE: "No Response", LEAVE_OUT: "Leave Out" };

export const LEAD_TYPES = ["Association Lead", "Attendees Lead", "Industry Lead", "Member Attendees"];
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function fmtDate(d, pattern = "MMM d, yyyy") {
  if (!d) return "—";
  try {
    return formatInTimeZone(new Date(d), TZ, pattern);
  } catch {
    return "—";
  }
}
export const fmtDateTime = (d) => fmtDate(d, "MMM d, yyyy h:mm a");
export const todayKey = () => formatInTimeZone(new Date(), TZ, "yyyy-MM-dd");
export const currentMonthKey = () => formatInTimeZone(new Date(), TZ, "yyyy-MM");

export function nowCentralParts() {
  const [y, m, d] = todayKey().split("-").map(Number);
  return { year: y, month: m, day: d };
}

/** Last n months (newest first) as {key:"2026-10", year, month, label} */
export function recentMonths(n = 4) {
  const { year, month } = nowCentralParts();
  return Array.from({ length: n }, (_, i) => {
    const idx = year * 12 + (month - 1) - i;
    const y = Math.floor(idx / 12);
    const m = (idx % 12) + 1;
    return { key: `${y}-${String(m).padStart(2, "0")}`, year: y, month: m, label: `${MONTHS[m - 1]} ${y}` };
  });
}

export const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
export const num = (n) => Number(n || 0).toLocaleString("en-IN");
export const pct = (n) => `${Math.round(Number(n || 0))}%`;

export function leadCategory(t = "") {
  const s = String(t).toLowerCase();
  if (s.includes("member")) return "Member Attendees";
  if (s.includes("association")) return "Association";
  if (s.includes("industry")) return "Industry";
  if (s.includes("attend")) return "Attendees";
  return t || "Other";
}

export function timeLeft(until) {
  const ms = new Date(until).getTime() - Date.now();
  if (ms <= 0) return "now";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h >= 1 ? `${h}h ${m}m` : `${m}m`;
}
