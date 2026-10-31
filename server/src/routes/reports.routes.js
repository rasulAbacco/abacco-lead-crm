// Monthly performance reports (admin) and personal report (employee).
import express from "express";
import XLSX from "xlsx-js-style";
import prisma from "../prismaClient.js";
import { authenticate, requireAdmin, ah } from "../middlewares/auth.js";
import { remember, CK } from "../utils/cache.js";
import { monthRange, centralParts, addMonths, monthLabel, dateKey } from "../utils/time.js";
import { leadCategory } from "../utils/leadTypes.js";
import { sendXlsx } from "../utils/excel.js";
import { config } from "../config.js";

const router = express.Router();
router.use(authenticate);

const blank = () => ({
  totalLeads: 0, association: 0, attendees: 0, industry: 0, memberAttendees: 0,
  pending: 0, active: 0, noResponse: 0, leaveOut: 0,
});
const STATUS_KEY = { PENDING: "pending", ACTIVE: "active", NO_RESPONSE: "noResponse", LEAVE_OUT: "leaveOut" };

/** Months still kept in the database, newest first */
function retainedMonths() {
  const now = centralParts();
  return Array.from({ length: config.retentionMonths }, (_, i) => addMonths(now, -i));
}

async function monthlyReport(year, month) {
  return remember(`${CK.leads}report:${year}-${month}`, async () => {
    const r = monthRange(year, month);
    const [employees, leads] = await Promise.all([
      prisma.employee.findMany({ where: { role: "EMPLOYEE" }, select: { employeeId: true, fullName: true, email: true, target: true, isActive: true } }),
      prisma.lead.findMany({ where: { date: { gte: r.start, lt: r.end } }, select: { employeeId: true, leadType: true, status: true } }),
    ]);
    const rows = {};
    for (const l of leads) {
      const row = (rows[l.employeeId] ||= blank());
      row.totalLeads++;
      const cat = leadCategory(l.leadType);
      if (row[cat] !== undefined) row[cat]++;
      row[STATUS_KEY[l.status]]++;
    }
    return employees
      .filter((e) => e.isActive || rows[e.employeeId])
      .map((e) => {
        const row = rows[e.employeeId] || blank();
        return {
          employeeId: e.employeeId,
          name: e.fullName,
          email: e.email,
          target: e.target || 0,
          ...row,
          achievement: e.target > 0 ? Math.round((row.totalLeads / e.target) * 100) : null,
        };
      })
      .sort((a, b) => b.totalLeads - a.totalLeads);
  });
}

router.get(
  "/months",
  ah(async (req, res) => {
    res.json(retainedMonths().map((m) => ({ year: m.year, month: m.month, label: monthLabel(m.year, m.month) })));
  }),
);

router.get(
  "/monthly",
  requireAdmin,
  ah(async (req, res) => {
    const now = centralParts();
    const year = Number(req.query.year) || now.year;
    const month = Number(req.query.month) || now.month;
    res.json({ year, month, label: monthLabel(year, month), rows: await monthlyReport(year, month) });
  }),
);

router.get(
  "/monthly/export",
  requireAdmin,
  ah(async (req, res) => {
    const now = centralParts();
    const year = Number(req.query.year) || now.year;
    const month = Number(req.query.month) || now.month;
    const rows = await monthlyReport(year, month);
    const header = ["Employee ID", "Name", "Target", "Total Leads", "Achievement %", "Association", "Attendees", "Industry", "Member Attendees", "Active", "No Response", "Leave Out", "Pending"];
    const data = rows.map((r) => [r.employeeId, r.name, r.target, r.totalLeads, r.achievement ?? "", r.association, r.attendees, r.industry, r.memberAttendees, r.active, r.noResponse, r.leaveOut, r.pending]);
    const ws = XLSX.utils.aoa_to_sheet([header.map((h) => ({ v: h, s: { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "1E3A5F" } } } })), ...data]);
    // highlight rows under 50% of target
    rows.forEach((r, i) => {
      if (r.achievement !== null && r.achievement < 50) {
        header.forEach((_, c) => {
          const cell = ws[XLSX.utils.encode_cell({ r: i + 1, c })];
          if (cell) cell.s = { fill: { fgColor: { rgb: "FEF3C7" } } };
        });
      }
    });
    ws["!cols"] = header.map((h) => ({ wch: Math.max(10, h.length + 2) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, monthLabel(year, month));
    sendXlsx(res, XLSX.write(wb, { type: "buffer", bookType: "xlsx" }), `monthly-report-${year}-${String(month).padStart(2, "0")}.xlsx`);
  }),
);

/* Personal report: last 4 months for one employee (owner or admin) */
router.get(
  "/employee/:employeeId",
  ah(async (req, res) => {
    const { employeeId } = req.params;
    if (!req.isAdmin && req.user.employeeId !== employeeId) return res.status(403).json({ message: "Access denied" });
    const employee = await prisma.employee.findUnique({
      where: { employeeId },
      select: { employeeId: true, fullName: true, email: true, joiningDate: true, target: true },
    });
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    const months = retainedMonths();
    const oldest = months[months.length - 1];
    const leads = await prisma.lead.findMany({
      where: { employeeId, date: { gte: monthRange(oldest.year, oldest.month).start } },
      select: { leadType: true, status: true, date: true },
    });
    const byMonth = Object.fromEntries(months.map((m) => [`${m.year}-${String(m.month).padStart(2, "0")}`, { ...blank(), label: monthLabel(m.year, m.month) }]));
    for (const l of leads) {
      const row = byMonth[dateKey(l.date).slice(0, 7)];
      if (!row) continue;
      row.totalLeads++;
      const cat = leadCategory(l.leadType);
      if (row[cat] !== undefined) row[cat]++;
      row[STATUS_KEY[l.status]]++;
    }
    const total = leads.length;
    const active = leads.filter((l) => l.status === "ACTIVE").length;
    res.json({
      employee,
      stats: { totalLeads: total, active, activeRate: total ? Math.round((active / total) * 100) : 0 },
      months: Object.entries(byMonth).map(([key, v]) => ({ key, ...v })),
    });
  }),
);

export default router;
