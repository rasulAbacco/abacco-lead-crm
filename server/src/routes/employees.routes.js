// Employees: performance stats (dashboards), admin management, targets.
import express from "express";
import bcrypt from "bcryptjs";
import prisma from "../prismaClient.js";
import { config } from "../config.js";
import { authenticate, requireAdmin, ah } from "../middlewares/auth.js";
import { remember, invalidate, CK } from "../utils/cache.js";
import { currentMonthRange, todayRange, dateKey, centralParts } from "../utils/time.js";
import { leadCategory, emptyCategoryCounts, targetProgress } from "../utils/leadTypes.js";

const router = express.Router();
router.use(authenticate);

const PUBLIC_FIELDS = {
  id: true, employeeId: true, fullName: true, email: true, role: true,
  target: true, joiningDate: true, isActive: true, createdAt: true, saturdayRule: true,
};

function distOf(lt) {
  return {
    associationPercent: lt?.associationPercent ?? 0,
    attendeesPercent: lt?.attendeesPercent ?? 0,
    industryPercent: lt?.industryPercent ?? 0,
    memberAttendeesPercent: lt?.memberAttendeesPercent ?? 0,
  };
}

/** Month performance for every active employee — ONE leads query instead of 5 per employee. */
export async function getMonthStats() {
  const p = centralParts();
  return remember(`${CK.leads}stats:${p.year}-${p.month}:${dateKey(new Date())}`, async () => {
    const month = currentMonthRange();
    const today = todayRange();
    const [employees, leads] = await Promise.all([
      prisma.employee.findMany({
        where: { role: "EMPLOYEE", isActive: true },
        select: { employeeId: true, fullName: true, target: true, leadTarget: true },
        orderBy: { fullName: "asc" },
      }),
      prisma.lead.findMany({
        where: { date: { gte: month.start, lt: month.end } },
        select: { employeeId: true, leadType: true, date: true, status: true },
      }),
    ]);
    const byEmp = {};
    for (const l of leads) {
      const e = (byEmp[l.employeeId] ||= { counts: emptyCategoryCounts(), today: 0, statuses: { PENDING: 0, ACTIVE: 0, NO_RESPONSE: 0, LEAVE_OUT: 0 } });
      e.counts.total++;
      e.counts[leadCategory(l.leadType)]++;
      e.statuses[l.status]++;
      if (l.date >= today.start && l.date < today.end) e.today++;
    }
    return employees.map((emp) => {
      const s = byEmp[emp.employeeId] || { counts: emptyCategoryCounts(), today: 0, statuses: { PENDING: 0, ACTIVE: 0, NO_RESPONSE: 0, LEAVE_OUT: 0 } };
      const dist = distOf(emp.leadTarget);
      const progress = targetProgress(s.counts, emp.target, dist);
      return {
        employeeId: emp.employeeId,
        name: emp.fullName,
        target: emp.target || 0,
        monthlyLeads: s.counts.total,
        dailyLeads: s.today,
        categories: s.counts,
        statuses: s.statuses,
        distribution: dist,
        achieved: progress.achieved,
        achievementRate: progress.rate,
        categoryTargets: progress.categories,
        doubleTargetAchieved: emp.target > 0 && s.counts.total >= emp.target * 2,
      };
    });
  });
}

/* Dashboard stats (admin + employees see the team table / leaderboard) */
router.get(
  "/stats",
  ah(async (req, res) => {
    res.json(await getMonthStats());
  }),
);

/* My own month progress (employee dashboard) */
router.get(
  "/me/progress",
  ah(async (req, res) => {
    const stats = await getMonthStats();
    const mine = stats.find((s) => s.employeeId === req.user.employeeId) || null;
    // last 7 days (uploads per day) for the small trend lines on the dashboard
    const since = new Date(Date.now() - 7 * 86400000);
    const recent = await prisma.lead.findMany({ where: { employeeId: req.user.employeeId, date: { gte: since } }, select: { date: true } });
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const k = dateKey(new Date(Date.now() - i * 86400000));
      last7.push({ day: k, count: recent.filter((l) => dateKey(l.date) === k).length });
    }
    res.json({ ...mine, last7, doubleTargetBonus: config.doubleTargetBonus });
  }),
);

/* ===================== ADMIN MANAGEMENT ===================== */

router.get(
  "/",
  requireAdmin,
  ah(async (req, res) => {
    const list = await remember(`${CK.employees}list`, () =>
      prisma.employee.findMany({ select: PUBLIC_FIELDS, orderBy: [{ isActive: "desc" }, { fullName: "asc" }] }),
    );
    res.json(list);
  }),
);

function validateEmployee(body, { requirePassword }) {
  const errors = [];
  if (!body.employeeId?.trim()) errors.push("Employee ID is required");
  if (!body.fullName?.trim()) errors.push("Full name is required");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email || "")) errors.push("Valid email is required");
  if (requirePassword && (!body.password || body.password.length < 6)) errors.push("Password must be at least 6 characters");
  if (body.password && body.password.length > 0 && body.password.length < 6) errors.push("Password must be at least 6 characters");
  return errors;
}

router.post(
  "/",
  requireAdmin,
  ah(async (req, res) => {
    const b = req.body;
    const errors = validateEmployee(b, { requirePassword: true });
    if (errors.length) return res.status(400).json({ message: errors.join(", ") });

    const dupe = await prisma.employee.findFirst({
      where: { OR: [{ employeeId: b.employeeId.trim() }, { email: { equals: b.email.trim(), mode: "insensitive" } }] },
    });
    if (dupe) return res.status(400).json({ message: "Employee ID or email already exists" });

    const created = await prisma.employee.create({
      data: {
        employeeId: b.employeeId.trim().toUpperCase(),
        fullName: b.fullName.trim(),
        email: b.email.trim().toLowerCase(),
        password: await bcrypt.hash(b.password, 10),
        role: b.role === "ADMIN" ? "ADMIN" : "EMPLOYEE",
        target: Number(b.target) || 0,
        joiningDate: b.joiningDate ? new Date(b.joiningDate) : new Date(),
        saturdayRule: ["WORKING", "OFF", "ALTERNATE"].includes(b.saturdayRule) ? b.saturdayRule : "ALTERNATE",
      },
      select: PUBLIC_FIELDS,
    });
    invalidate(CK.employees, CK.leads);
    res.status(201).json(created);
  }),
);

router.put(
  "/:id",
  requireAdmin,
  ah(async (req, res) => {
    const id = Number(req.params.id);
    const b = req.body;
    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Employee not found" });
    const errors = validateEmployee({ ...b, employeeId: existing.employeeId }, { requirePassword: false });
    if (errors.length) return res.status(400).json({ message: errors.join(", ") });

    const emailTaken = await prisma.employee.findFirst({
      where: { email: { equals: b.email.trim(), mode: "insensitive" }, NOT: { id } },
    });
    if (emailTaken) return res.status(400).json({ message: "Email already used by another employee" });

    const data = {
      fullName: b.fullName.trim(),
      email: b.email.trim().toLowerCase(),
      role: b.role === "ADMIN" ? "ADMIN" : "EMPLOYEE",
      target: Number(b.target) || 0,
    };
    if (b.joiningDate) data.joiningDate = new Date(b.joiningDate);
    if (["WORKING", "OFF", "ALTERNATE"].includes(b.saturdayRule)) data.saturdayRule = b.saturdayRule;
    if (b.password) data.password = await bcrypt.hash(b.password, 10);

    const updated = await prisma.employee.update({ where: { id }, data, select: PUBLIC_FIELDS });
    if (b.password || data.role !== existing.role) {
      // force re-login after password/role change
      await prisma.session.updateMany({ where: { userId: id, isActive: true }, data: { isActive: false } });
    }
    invalidate(CK.employees, CK.leads);
    res.json(updated);
  }),
);

router.patch(
  "/:id/toggle-active",
  requireAdmin,
  ah(async (req, res) => {
    const id = Number(req.params.id);
    if (id === req.user.id) return res.status(400).json({ message: "You cannot deactivate yourself" });
    const emp = await prisma.employee.findUnique({ where: { id } });
    if (!emp) return res.status(404).json({ message: "Employee not found" });
    const updated = await prisma.employee.update({ where: { id }, data: { isActive: !emp.isActive }, select: PUBLIC_FIELDS });
    if (!updated.isActive) await prisma.session.updateMany({ where: { userId: id }, data: { isActive: false } });
    invalidate(CK.employees, CK.leads);
    res.json(updated);
  }),
);

/* ===================== TARGETS ===================== */

router.get(
  "/targets",
  requireAdmin,
  ah(async (req, res) => {
    const list = await remember(`${CK.employees}targets`, async () => {
      const employees = await prisma.employee.findMany({
        where: { role: "EMPLOYEE", isActive: true },
        include: { leadTarget: true },
        orderBy: { joiningDate: "asc" },
      });
      return employees.map((e) => {
        const months = Math.max(0, Math.floor((Date.now() - new Date(e.joiningDate).getTime()) / (30.44 * 86400000)));
        return {
          id: e.id,
          employeeId: e.employeeId,
          fullName: e.fullName,
          target: e.target,
          joiningDate: e.joiningDate,
          experience: `${Math.floor(months / 12)}y ${months % 12}m`,
          expInMonths: months,
          ...distOf(e.leadTarget),
        };
      });
    });
    res.json(list);
  }),
);

router.put(
  "/targets/:employeeId",
  requireAdmin,
  ah(async (req, res) => {
    const { employeeId } = req.params;
    const target = Number(req.body.target);
    if (!Number.isFinite(target) || target < 0) return res.status(400).json({ message: "Invalid target" });
    const d = {
      associationPercent: Number(req.body.associationPercent) || 0,
      attendeesPercent: Number(req.body.attendeesPercent) || 0,
      industryPercent: Number(req.body.industryPercent) || 0,
      memberAttendeesPercent: Number(req.body.memberAttendeesPercent) || 0,
    };
    const total = Object.values(d).reduce((a, b) => a + b, 0);
    if (total !== 100 && total !== 0) return res.status(400).json({ message: "Lead distribution must total 100%" });

    await prisma.$transaction([
      prisma.employee.update({ where: { employeeId }, data: { target: Math.round(target) } }),
      prisma.employeeLeadTarget.upsert({ where: { employeeId }, update: d, create: { employeeId, ...d } }),
    ]);
    invalidate(CK.employees, CK.leads);
    res.json({ success: true });
  }),
);

export default router;
