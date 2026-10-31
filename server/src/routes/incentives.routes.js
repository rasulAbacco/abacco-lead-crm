// Incentive plans (admin), employee progress, leaderboard and incentive summary.
import express from "express";
import prisma from "../prismaClient.js";
import { config } from "../config.js";
import { authenticate, requireAdmin, ah } from "../middlewares/auth.js";
import { remember, invalidate, CK } from "../utils/cache.js";
import { computeDay, computeForLeads, normalizeLeadTypeString } from "../utils/incentiveEngine.js";
import { notifyEveryone } from "../services/notify.js";
import { todayRange, monthRange, dayRange, centralParts, parseMonthParam, dateKey } from "../utils/time.js";

const router = express.Router();
router.use(authenticate);

const allPlans = () =>
  remember(`${CK.incentives}plans`, () =>
    prisma.incentivePlan.findMany({ include: { rules: { orderBy: { id: "asc" } } }, orderBy: { validFrom: "desc" } }),
  );

function ruleData(r) {
  return {
    leadType: r.leadType,
    country: r.country || null,
    attendeesMinCount: r.attendeesMinCount ? Number(r.attendeesMinCount) : null,
    industryDomain: r.industryDomain || null,
    leadsRequired: Number(r.leadsRequired || 0),
    amount: Number(r.amount || 0),
    isActive: r.isActive !== undefined ? Boolean(r.isActive) : true,
  };
}

/* ---------------- plans ---------------- */
router.get(
  "/plans",
  ah(async (req, res) => {
    const plans = await allPlans();
    res.json(req.isAdmin ? plans : plans.filter((p) => p.isActive));
  }),
);

router.post(
  "/plans",
  requireAdmin,
  ah(async (req, res) => {
    const { title, description, icon, accentColor, bgAccent, validFrom, rules = [] } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: "Title is required" });
    const plan = await prisma.incentivePlan.create({
      data: {
        title: title.trim(),
        description: description || "",
        icon: icon || "award",
        accentColor: accentColor || "blue",
        bgAccent: bgAccent || "blue",
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        rules: { create: rules.filter((r) => r.leadsRequired > 0 && r.amount > 0).map(ruleData) },
      },
      include: { rules: true },
    });
    invalidate(CK.incentives, CK.leads);
    notifyEveryone({ type: "incentive", title: `New incentive plan: ${plan.title}`, body: "See today's incentive progress on your dashboard.", link: "/employee-dashboard" });
    res.status(201).json(plan);
  }),
);

router.put(
  "/plans/:id",
  requireAdmin,
  ah(async (req, res) => {
    const id = Number(req.params.id);
    const existing = await prisma.incentivePlan.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Plan not found" });
    const { title, description, icon, accentColor, bgAccent, validFrom, rules = [] } = req.body;
    await prisma.$transaction([
      prisma.incentivePlan.update({
        where: { id },
        data: {
          title: title ?? existing.title,
          description: description ?? existing.description,
          icon: icon ?? existing.icon,
          accentColor: accentColor ?? existing.accentColor,
          bgAccent: bgAccent ?? existing.bgAccent,
          validFrom: validFrom ? new Date(validFrom) : existing.validFrom,
        },
      }),
      prisma.incentiveRule.deleteMany({ where: { incentivePlanId: id } }),
      prisma.incentiveRule.createMany({
        data: rules.filter((r) => r.leadsRequired > 0 && r.amount > 0).map((r) => ({ ...ruleData(r), incentivePlanId: id })),
      }),
    ]);
    invalidate(CK.incentives, CK.leads);
    res.json(await prisma.incentivePlan.findUnique({ where: { id }, include: { rules: { orderBy: { id: "asc" } } } }));
  }),
);

router.post(
  "/plans/:id/activate",
  requireAdmin,
  ah(async (req, res) => {
    const plan = await prisma.incentivePlan.update({ where: { id: Number(req.params.id) }, data: { isActive: true, validTo: null } });
    invalidate(CK.incentives, CK.leads);
    res.json(plan);
  }),
);

router.post(
  "/plans/:id/deactivate",
  requireAdmin,
  ah(async (req, res) => {
    const plan = await prisma.incentivePlan.update({ where: { id: Number(req.params.id) }, data: { isActive: false, validTo: new Date() } });
    invalidate(CK.incentives, CK.leads);
    res.json(plan);
  }),
);

/* ---------------- my progress (employee dashboard) ---------------- */
router.get(
  "/progress/me",
  ah(async (req, res) => {
    const plans = await allPlans();
    const p = centralParts();
    const month = monthRange(p.year, p.month);
    const today = todayRange();
    const leads = await prisma.lead.findMany({
      where: { employeeId: req.user.employeeId, date: { gte: month.start, lt: month.end } },
      select: { leadType: true, country: true, attendeesCount: true, date: true },
    });
    const todayLeads = leads.filter((l) => l.date >= today.start && l.date < today.end);
    const todayResult = computeDay(todayLeads, plans);
    const monthResult = computeForLeads(leads, plans);

    // progress towards each active tier today (per plan)
    const activePlans = plans.filter((pl) => pl.isActive);
    const tiers = activePlans.map((plan) => {
      const types = [...new Set(plan.rules.filter((r) => r.isActive).map((r) => normalizeLeadTypeString(r.leadType)))];
      return {
        planId: plan.id,
        title: plan.title,
        rules: plan.rules.filter((r) => r.isActive).map((r) => {
          const count = todayLeads.filter((l) => normalizeLeadTypeString(l.leadType) === normalizeLeadTypeString(r.leadType)).length;
          return { id: r.id, leadType: r.leadType, country: r.country, attendeesMinCount: r.attendeesMinCount, leadsRequired: r.leadsRequired, amount: r.amount, count };
        }),
        leadTypes: types,
      };
    });

    res.json({
      today: { leads: todayLeads.length, amount: todayResult.amount, awards: todayResult.awards },
      month: { leads: leads.length, amount: monthResult.total },
      plans: tiers,
    });
  }),
);

/* ---------------- leaderboard ---------------- */
function rangeFromQuery(q) {
  if (q.from && q.to && /^\d{4}-\d{2}-\d{2}$/.test(q.from) && /^\d{4}-\d{2}-\d{2}$/.test(q.to)) {
    const [fy, fm, fd] = q.from.split("-").map(Number);
    const [ty, tm, td] = q.to.split("-").map(Number);
    return { from: dayRange(fy, fm, fd).start, to: dayRange(ty, tm, td).end, isMonth: false };
  }
  if ((q.period || "month") === "today") {
    const t = todayRange();
    return { from: t.start, to: t.end, isMonth: false };
  }
  const { year, month } = parseMonthParam(q);
  const r = monthRange(year, month);
  return { from: r.start, to: r.end, isMonth: true };
}

router.get(
  "/leaderboard",
  ah(async (req, res) => {
    const q = req.query;
    const range = rangeFromQuery(q);
    const leadType = q.leadType && q.leadType !== "All" ? q.leadType : null;
    const key = `${CK.leads}lb:${range.from.toISOString()}:${range.to.toISOString()}:${leadType}:${q.sort}`;
    const data = await remember(key, async () => {
      const [plans, employees, leads] = await Promise.all([
        allPlans(),
        prisma.employee.findMany({ where: { isActive: true, role: "EMPLOYEE" }, select: { employeeId: true, fullName: true, target: true } }),
        prisma.lead.findMany({
          where: { date: { gte: range.from, lt: range.to } },
          select: { employeeId: true, leadType: true, country: true, attendeesCount: true, date: true },
        }),
      ]);
      const byEmp = {};
      for (const l of leads) (byEmp[l.employeeId] ||= []).push(l);

      const results = employees.map((emp) => {
        const mine = byEmp[emp.employeeId] || [];
        const r = computeForLeads(mine, plans, { leadTypeFilter: leadType });
        let totalAmount = r.total;
        const countsByAmount = { ...r.countsByAmount };
        if (range.isMonth && emp.target > 0 && mine.length >= emp.target * 2) {
          totalAmount += config.doubleTargetBonus;
          countsByAmount[config.doubleTargetBonus] = (countsByAmount[config.doubleTargetBonus] || 0) + 1;
        }
        return { employeeId: emp.employeeId, name: emp.fullName, totalLeads: mine.length, totalAmount, countsByAmount };
      });

      const amounts = new Set([config.doubleTargetBonus]);
      plans.forEach((p) => p.rules.forEach((r) => r.amount > 0 && amounts.add(r.amount)));
      const sort = q.sort || "amount_desc";
      results.sort((a, b) => {
        if (sort === "leads_desc") return b.totalLeads - a.totalLeads || b.totalAmount - a.totalAmount;
        if (sort === "name_asc") return a.name.localeCompare(b.name);
        return b.totalAmount - a.totalAmount || b.totalLeads - a.totalLeads;
      });
      return { columns: [...amounts].sort((a, b) => b - a), results };
    }, 120);
    res.json(data);
  }),
);

/* ---------------- incentive summary (who achieved which rule) ---------------- */
router.get(
  "/summary",
  ah(async (req, res) => {
    const { year, month } = parseMonthParam(req.query);
    const r = monthRange(year, month);
    const data = await remember(`${CK.leads}incsum:${year}-${month}`, async () => {
      const [plans, employees, leads] = await Promise.all([
        allPlans(),
        prisma.employee.findMany({ where: { role: "EMPLOYEE" }, select: { employeeId: true, fullName: true, target: true } }),
        prisma.lead.findMany({
          where: { date: { gte: r.start, lt: r.end } },
          select: { employeeId: true, leadType: true, country: true, attendeesCount: true, date: true },
        }),
      ]);
      const names = Object.fromEntries(employees.map((e) => [e.employeeId, e]));
      const ruleIndex = {};
      for (const plan of plans) {
        for (const rule of plan.rules) {
          ruleIndex[rule.id] = {
            ruleId: rule.id, planId: plan.id, planTitle: plan.title, leadType: rule.leadType,
            description: [rule.country, rule.attendeesMinCount ? `Min ${rule.attendeesMinCount} attendees` : rule.industryDomain].filter(Boolean).join(" · "),
            leadsRequired: rule.leadsRequired, amount: rule.amount, achievers: [],
          };
        }
      }
      const byEmpDay = {};
      for (const l of leads) ((byEmpDay[l.employeeId] ||= {})[dateKey(l.date)] ||= []).push(l);
      for (const [employeeId, days] of Object.entries(byEmpDay)) {
        for (const [day, dayLeads] of Object.entries(days)) {
          for (const a of computeDay(dayLeads, plans).awards) {
            ruleIndex[a.ruleId]?.achievers.push({
              employeeId, name: names[employeeId]?.fullName || employeeId, date: day, times: a.times, total: a.total, count: a.matched,
            });
          }
        }
      }
      const monthlyDoubleTarget = [];
      const counts = {};
      for (const l of leads) counts[l.employeeId] = (counts[l.employeeId] || 0) + 1;
      for (const [employeeId, n] of Object.entries(counts)) {
        const t = names[employeeId]?.target || 0;
        if (t > 0 && n >= t * 2) {
          monthlyDoubleTarget.push({ employeeId, name: names[employeeId]?.fullName || employeeId, total: config.doubleTargetBonus, monthlyLeads: n });
        }
      }
      return { rules: Object.values(ruleIndex).filter((x) => x.achievers.length), monthlyDoubleTarget };
    });
    res.json(data);
  }),
);

export default router;
