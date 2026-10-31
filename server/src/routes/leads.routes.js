// Leads: upload (employee), my leads, admin review + status, lists, export.
import express from "express";
import prisma from "../prismaClient.js";
import { config } from "../config.js";
import { authenticate, requireAdmin, requireEmployee, ah } from "../middlewares/auth.js";
import { remember, invalidate, CK } from "../utils/cache.js";
import {
  todayRange, monthRange, dayRange, centralParts, addMonths, parseMonthParam,
  contactDateFromInput, dateKey, MONTH_NAMES, monthLabel,
} from "../utils/time.js";
import { leadCategory, emptyCategoryCounts } from "../utils/leadTypes.js";
import { leadsWorkbookBuffer, sendXlsx } from "../utils/excel.js";
import { notify } from "../services/notify.js";

const router = express.Router();
router.use(authenticate);

export const LEAD_STATUSES = ["PENDING", "ACTIVE", "NO_RESPONSE", "LEAVE_OUT"];

const LIST_SELECT = {
  id: true, employeeId: true, agentName: true, clientEmail: true, leadEmail: true, ccEmail: true,
  subjectLine: true, emailPitch: true, emailResponce: true, website: true, phone: true, country: true,
  leadType: true, link: true, attendeesCount: true, date: true, createdAt: true, isEdited: true,
  status: true, statusUpdatedAt: true,
};
const WITH_EMPLOYEE = { ...LIST_SELECT, employee: { select: { fullName: true } } };

function leadsChanged() {
  invalidate(CK.leads);
}

/* ---------- helpers (same normalisation as v1 so duplicates behave identically) ---------- */
const normalizeEmail = (e) => (e || "").trim().toLowerCase();
function normalizeLink(raw) {
  if (!raw) return "";
  let s = String(raw).trim();
  if (!/^https?:\/\//i.test(s)) s = "http://" + s;
  try {
    const u = new URL(s);
    u.hash = "";
    [...u.searchParams.keys()].forEach((k) => {
      if (k.startsWith("utm_") || ["fbclid", "gclid"].includes(k)) u.searchParams.delete(k);
    });
    u.pathname = u.pathname.replace(/\/+$/, "");
    return `${u.protocol}//${u.hostname}${u.pathname}${u.search || ""}`.toLowerCase();
  } catch {
    return s.replace(/\/+$/, "").toLowerCase();
  }
}
const joinList = (arr) => (Array.isArray(arr) ? arr.map((x) => String(x).trim()).filter(Boolean).join(",") : "");

const EDITABLE = [
  "agentName", "clientEmail", "leadEmail", "ccEmail", "subjectLine", "emailPitch", "emailResponce",
  "website", "phone", "country", "leadType", "link",
];

/* =========================================================
   UPLOAD (employee) — payload unchanged from v1: { leads: [ {...} ] }
========================================================= */
router.post(
  "/",
  requireEmployee,
  ah(async (req, res) => {
    const lead = Array.isArray(req.body.leads) ? req.body.leads[0] : req.body;
    if (!lead) return res.status(400).json({ success: false, message: "No lead provided" });

    const { clientEmail, link, subjectLine, leadEmail, emailPitch, leadType } = lead;
    if (!clientEmail || !link || !subjectLine || !leadEmail || !emailPitch || !leadType) {
      return res.status(400).json({ success: false, message: "Client email, lead email, link, subject, pitch and lead type are required" });
    }

    const normalizedClientEmail = normalizeEmail(clientEmail);

    // Duplicate rule (same as v1): same client email uploaded within the last 2 months.
    const windowStart = new Date();
    windowStart.setMonth(windowStart.getMonth() - config.duplicateWindowMonths);
    const existing = await prisma.lead.findFirst({
      where: { clientEmail: normalizedClientEmail, createdAt: { gte: windowStart } },
      orderBy: { createdAt: "desc" },
      include: { employee: { select: { employeeId: true, fullName: true, email: true } } },
    });
    if (existing) {
      const retryAfter = new Date(existing.createdAt);
      retryAfter.setMonth(retryAfter.getMonth() + config.duplicateWindowMonths);
      return res.status(400).json({
        success: false,
        duplicate: true,
        duplicateLead: {
          id: existing.id,
          clientEmail: existing.clientEmail,
          subjectLine: existing.subjectLine,
          createdAt: existing.createdAt,
          contactDate: existing.date,
          uploadedBy: existing.employee,
          retryAfter,
          remainingDays: Math.max(0, Math.ceil((retryAfter - new Date()) / 86400000)),
        },
      });
    }

    const created = await prisma.lead.create({
      data: {
        employeeId: req.user.employeeId, // always from the login, never from the form
        agentName: lead.agentName || null,
        clientEmail: normalizedClientEmail,
        leadEmail: String(leadEmail).trim(),
        ccEmail: joinList(lead.ccEmails) || lead.ccEmail || "",
        subjectLine: String(subjectLine).trim().toLowerCase(),
        emailPitch,
        emailResponce: lead.emailResponce || null,
        website: lead.website || null,
        phone: joinList(lead.phones) || lead.phone || "",
        country: lead.country || null,
        leadType,
        link: normalizeLink(link),
        attendeesCount: lead.attendeesCount ? parseInt(lead.attendeesCount, 10) || null : null,
        date: contactDateFromInput(lead.date),
      },
      select: LIST_SELECT,
    });

    leadsChanged();
    res.status(201).json({ success: true, lead: created });
  }),
);

/* =========================================================
   MY LEADS (employee) — everything still retained (max 4 months)
========================================================= */
router.get(
  "/mine",
  ah(async (req, res) => {
    const employeeId = req.user.employeeId;
    const leads = await remember(`${CK.leads}mine:${employeeId}`, () =>
      prisma.lead.findMany({ where: { employeeId }, orderBy: { id: "desc" }, select: LIST_SELECT }),
    );
    res.json(leads);
  }),
);

/* =========================================================
   EDIT a lead — employee: own leads only; admin: any. Status is NOT editable here.
========================================================= */
router.put(
  "/:id",
  ah(async (req, res) => {
    const id = Number(req.params.id);
    const lead = await prisma.lead.findUnique({ where: { id }, select: { employeeId: true } });
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    if (!req.isAdmin && lead.employeeId !== req.user.employeeId) {
      return res.status(403).json({ message: "You can only edit your own leads" });
    }

    const data = {};
    for (const f of EDITABLE) if (req.body[f] !== undefined) data[f] = req.body[f];
    if (data.clientEmail !== undefined) data.clientEmail = normalizeEmail(data.clientEmail);
    if (req.body.phones !== undefined) data.phone = joinList(req.body.phones);
    if (req.body.ccEmails !== undefined) data.ccEmail = joinList(req.body.ccEmails);
    if (req.body.attendeesCount !== undefined) data.attendeesCount = req.body.attendeesCount ? parseInt(req.body.attendeesCount, 10) || null : null;
    if (req.body.date) data.date = contactDateFromInput(String(req.body.date).slice(0, 10));
    data.isEdited = true;

    const updated = await prisma.lead.update({ where: { id }, data, select: LIST_SELECT });
    leadsChanged();
    res.json({ success: true, lead: updated });
  }),
);

/* =========================================================
   STATUS (admin only): Active / No Response / Leave Out / Pending
========================================================= */
router.patch(
  "/:id/status",
  requireAdmin,
  ah(async (req, res) => {
    const id = Number(req.params.id);
    const status = String(req.body.status || "").toUpperCase();
    if (!LEAD_STATUSES.includes(status)) return res.status(400).json({ message: "Invalid status" });
    const updated = await prisma.lead.update({
      where: { id },
      data: { status, statusUpdatedAt: status === "PENDING" ? null : new Date() },
      select: { id: true, status: true, statusUpdatedAt: true, employeeId: true, clientEmail: true, subjectLine: true },
    });
    leadsChanged();
    if (status !== "PENDING") {
      const label = { ACTIVE: "Active", NO_RESPONSE: "No Response", LEAVE_OUT: "Leave Out" }[status];
      notify(updated.employeeId, {
        type: "lead_status",
        title: `Lead marked ${label}`,
        body: `${updated.clientEmail} — ${updated.subjectLine}`,
        link: "/myleads",
        refKey: `lead:${updated.id}`,
      });
    }
    res.json(updated);
  }),
);

/* =========================================================
   REVIEW (admin): per-employee counts for a day + older pending
========================================================= */
function reviewDay(q) {
  if (q.date && /^\d{4}-\d{2}-\d{2}$/.test(q.date)) {
    const [y, m, d] = q.date.split("-").map(Number);
    return { key: q.date, ...dayRange(y, m, d) };
  }
  const r = todayRange();
  return { key: dateKey(new Date()), ...r };
}

router.get(
  "/review/summary",
  requireAdmin,
  ah(async (req, res) => {
    const day = reviewDay(req.query);
    const data = await remember(`${CK.leads}review:${day.key}`, async () => {
      const [employees, dayCounts, dayPending, olderPending] = await Promise.all([
        prisma.employee.findMany({
          where: { role: "EMPLOYEE", isActive: true },
          select: { employeeId: true, fullName: true },
          orderBy: { fullName: "asc" },
        }),
        prisma.lead.groupBy({ by: ["employeeId"], where: { date: { gte: day.start, lt: day.end } }, _count: { _all: true } }),
        prisma.lead.groupBy({ by: ["employeeId"], where: { date: { gte: day.start, lt: day.end }, status: "PENDING" }, _count: { _all: true } }),
        prisma.lead.groupBy({ by: ["employeeId"], where: { date: { lt: day.start }, status: "PENDING" }, _count: { _all: true } }),
      ]);
      const toMap = (rows) => Object.fromEntries(rows.map((r) => [r.employeeId, r._count._all]));
      const dc = toMap(dayCounts), dp = toMap(dayPending), op = toMap(olderPending);
      return {
        date: day.key,
        employees: employees.map((e) => ({
          employeeId: e.employeeId,
          name: e.fullName,
          dayCount: dc[e.employeeId] || 0,
          dayPending: dp[e.employeeId] || 0,
          olderPending: op[e.employeeId] || 0,
        })),
      };
    });
    res.json(data);
  }),
);

router.get(
  "/review/leads",
  requireAdmin,
  ah(async (req, res) => {
    const { employeeId, scope = "day" } = req.query;
    const day = reviewDay(req.query);
    const where = scope === "pending" ? { date: { lt: day.start }, status: "PENDING" } : { date: { gte: day.start, lt: day.end } };
    if (employeeId) where.employeeId = String(employeeId);
    const limit = Math.min(Number(req.query.limit) || 100, 300);
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({ where, orderBy: { date: "desc" }, take: limit, select: WITH_EMPLOYEE }),
      prisma.lead.count({ where }),
    ]);
    res.json({ leads, total, limit });
  }),
);

/* =========================================================
   ALL LEADS (admin) — filtered + paginated in the database
========================================================= */
function buildListWhere(q, { forceEmployeeId } = {}) {
  const where = {};
  const { year, month } = parseMonthParam(q);
  if (q.month !== "all") {
    const r = monthRange(year, month);
    where.date = { gte: r.start, lt: r.end };
  }
  const emp = forceEmployeeId || q.employeeId;
  if (emp && emp !== "all") where.employeeId = String(emp);
  if (q.status && q.status !== "all" && LEAD_STATUSES.includes(q.status)) where.status = q.status;
  if (q.leadType && q.leadType !== "all") where.leadType = { equals: q.leadType, mode: "insensitive" };
  if (q.search && q.search.trim()) {
    const s = q.search.trim();
    where.OR = ["clientEmail", "leadEmail", "subjectLine", "agentName", "country", "phone", "employeeId"].map((f) => ({
      [f]: { contains: s, mode: "insensitive" },
    }));
  }
  return { where, year, month };
}

router.get(
  "/",
  requireAdmin,
  ah(async (req, res) => {
    const { where } = buildListWhere(req.query);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Math.max(10, Number(req.query.limit) || 50));
    const orderBy = req.query.sort === "oldest" ? { date: "asc" } : { date: "desc" };
    const key = `${CK.leads}list:${JSON.stringify({ where, page, limit, orderBy })}`;
    const data = await remember(key, async () => {
      const [rows, total, byStatus] = await Promise.all([
        prisma.lead.findMany({ where, orderBy: [orderBy, { id: "desc" }], skip: (page - 1) * limit, take: limit, select: WITH_EMPLOYEE }),
        prisma.lead.count({ where }),
        prisma.lead.groupBy({ by: ["status"], where, _count: { _all: true } }),
      ]);
      return {
        leads: rows,
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        statusCounts: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
      };
    });
    res.json(data);
  }),
);

/* =========================================================
   EXCEL EXPORT — admin: any filter; employee: own leads only
========================================================= */
router.get(
  "/export",
  ah(async (req, res) => {
    const { where, year, month } = buildListWhere(req.query, { forceEmployeeId: req.isAdmin ? null : req.user.employeeId });
    const leads = await prisma.lead.findMany({
      where,
      orderBy: { date: "asc" },
      select: { ...LIST_SELECT, employee: { select: { fullName: true } } },
    });
    const label = req.query.month === "all" ? "all" : `${MONTH_NAMES[month - 1]}-${year}`;
    const who = req.isAdmin ? (where.employeeId || "all") : req.user.employeeId;
    sendXlsx(res, leadsWorkbookBuffer(leads, label), `leads-${label}-${who}.xlsx`);
  }),
);

/* =========================================================
   SUMMARY for charts (admin): today, last 6 working days, last 4 months
========================================================= */
router.get(
  "/summary",
  requireAdmin,
  ah(async (req, res) => {
    const data = await remember(`${CK.leads}summary:${dateKey(new Date())}`, async () => {
      const now = centralParts();
      const first = addMonths(now, -(config.retentionMonths - 1));
      const leads = await prisma.lead.findMany({
        where: { date: { gte: monthRange(first.year, first.month).start } },
        select: { leadType: true, date: true },
      });
      const today = emptyCategoryCounts();
      const todayKey = dateKey(new Date());
      const byDay = {};
      const byMonth = {};
      for (const l of leads) {
        const k = dateKey(l.date);
        const cat = leadCategory(l.leadType);
        (byDay[k] ||= emptyCategoryCounts());
        byDay[k].total++; byDay[k][cat]++;
        const mk = k.slice(0, 7);
        (byMonth[mk] ||= emptyCategoryCounts());
        byMonth[mk].total++; byMonth[mk][cat]++;
        if (k === todayKey) { today.total++; today[cat]++; }
      }
      // last 7 calendar days excluding Sundays
      const weekly = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const k = dateKey(d);
        const p = centralParts(d);
        if (p.weekday === 0) continue;
        weekly.push({ day: k, label: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][p.weekday], ...(byDay[k] || emptyCategoryCounts()) });
      }
      const months = [];
      for (let i = config.retentionMonths - 1; i >= 0; i--) {
        const m = addMonths(now, -i);
        const mk = `${m.year}-${String(m.month).padStart(2, "0")}`;
        months.push({ month: mk, label: monthLabel(m.year, m.month), ...(byMonth[mk] || emptyCategoryCounts()) });
      }
      return { today, weekly, months };
    }, 120);
    res.json(data);
  }),
);

/* =========================================================
   ONE EMPLOYEE's leads (admin) for a month
========================================================= */
router.get(
  "/employee/:employeeId",
  requireAdmin,
  ah(async (req, res) => {
    const { where } = buildListWhere({ ...req.query, employeeId: req.params.employeeId });
    const [employee, leads] = await Promise.all([
      prisma.employee.findUnique({ where: { employeeId: req.params.employeeId }, select: { employeeId: true, fullName: true, email: true, target: true } }),
      prisma.lead.findMany({ where, orderBy: { date: "desc" }, select: LIST_SELECT }),
    ]);
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json({ employee, leads });
  }),
);

export default router;
