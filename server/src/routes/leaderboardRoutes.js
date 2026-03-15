// server/src/routes/leaderboardRoutes.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import { toZonedTime, format } from "date-fns-tz";
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  parseISO,
} from "date-fns";

import {
  toDateKey,
  findPlanForDate,
  findPlansForDate,
  doesRuleMatchLead,
  normalizeLeadTypeString,
} from "../utils/incentiveUtils.js";

const router = express.Router();
const prisma = new PrismaClient();

const USA_TZ = "America/Chicago";

/**
 * buildRangeFromQuery(q)
 */
function buildRangeFromQuery(q = {}) {
  const nowZ = toZonedTime(new Date(), USA_TZ);

  if (q.from && q.to) {
    const f = parseISO(q.from);
    const t = parseISO(q.to);
    return { from: startOfDay(f), to: endOfDay(t) };
  }

  const period = (q.period || "month").toLowerCase();

  if (period === "today") {
    const d = toZonedTime(new Date(), USA_TZ);
    return { from: startOfDay(d), to: endOfDay(d) };
  }

  if (period === "month") {
    const month = q.month || format(nowZ, "yyyy-MM", { timeZone: USA_TZ });
    const [y, m] = month.split("-");
    const from = new Date(Number(y), Number(m) - 1, 1);
    const to = endOfMonth(new Date(Number(y), Number(m) - 1, 1));
    return { from: startOfDay(from), to: endOfDay(to) };
  }

  if (period === "year") {
    const year = q.year || format(nowZ, "yyyy", { timeZone: USA_TZ });
    const from = new Date(Number(year), 0, 1);
    const to = new Date(Number(year), 11, 31, 23, 59, 59);
    return { from: startOfDay(from), to: endOfDay(to) };
  }

  return { from: new Date(0), to: new Date() };
}

/* Helper: allocateTieredAwards (unchanged) */
function allocateTieredAwards(buckets) {
  let totalAmount = 0;
  const countsByAmount = {};

  for (const bucketKey of Object.keys(buckets)) {
    const { rules, matchedCount } = buckets[bucketKey];
    if (!Array.isArray(rules) || rules.length === 0) continue;
    let remaining = Number(matchedCount || 0);
    if (remaining <= 0) continue;

    const sorted = rules.slice().sort((a, b) => {
      if ((b.leadsRequired || 0) !== (a.leadsRequired || 0))
        return (b.leadsRequired || 0) - (a.leadsRequired || 0);
      return (b.amount || 0) - (a.amount || 0);
    });

    for (const rule of sorted) {
      const required = Number(rule.leadsRequired || 0);
      const amount = Number(rule.amount || 0);
      if (required <= 0 || amount <= 0) continue;

      const times = Math.floor(remaining / required);
      if (times <= 0) continue;

      totalAmount += times * amount;
      countsByAmount[String(amount)] =
        (countsByAmount[String(amount)] || 0) + times;

      remaining -= times * required;
      if (remaining <= 0) break;
    }
  }

  return { totalAmount, countsByAmount };
}

/* ============================
   /api/employee/leaderboard
   ============================ */

router.get("/leaderboard", async (req, res) => {
  try {
    const q = req.query || {};
    const sort = q.sort || "amount_desc";
    const leadTypeFilter = q.leadType || "All";
    const limit = Number(q.limit) || 50;

    const range = buildRangeFromQuery(q);

    // load incentive plans
    const plans = await prisma.incentivePlan.findMany({
      include: { rules: true },
      orderBy: { validFrom: "desc" },
    });

    // employees
    const employees = await prisma.employee.findMany({
      where: { isActive: true, role: { not: "ADMIN" } },
      select: { employeeId: true, fullName: true, target: true },
    });

    // qualified leads in range
    const allLeads = await prisma.lead.findMany({
      where: { qualified: true, date: { gte: range.from, lte: range.to } },
      orderBy: { date: "asc" },
    });

    const leadsByEmployee = new Map();
    for (const ld of allLeads) {
      if (!leadsByEmployee.has(ld.employeeId)) {
        leadsByEmployee.set(ld.employeeId, []);
      }
      leadsByEmployee.get(ld.employeeId).push(ld);
    }

    const requestedLeadTypeNorm =
      leadTypeFilter !== "All" ? normalizeLeadTypeString(leadTypeFilter) : null;

    const results = [];

    // 🔑 Detect true monthly mode
    const isMonthly =
      !q.from && !q.to && (q.period || "month").toLowerCase() === "month";

    for (const emp of employees) {
      const empLeads = leadsByEmployee.get(emp.employeeId) || [];

      // group by day
      const byDay = {};
      for (const ld of empLeads) {
        const d = toDateKey(ld.date);
        if (!d) continue;
        if (!byDay[d]) byDay[d] = [];
        byDay[d].push(ld);
      }

      let totalAmount = 0;
      let totalLeads = empLeads.length;
      const countsByAmount = {};

      for (const dayLeads of Object.values(byDay)) {
        const dayDate = dayLeads[0].date;
        const plansForDay = findPlansForDate(plans, dayDate);
        if (!plansForDay.length) continue;

        const combinedBuckets = {};

        for (const plan of plansForDay) {
          const planValidFrom = plan.validFrom
            ? new Date(plan.validFrom).getTime()
            : 0;

          for (const rule of plan.rules || []) {
            if (!rule.isActive) continue;

            if (requestedLeadTypeNorm) {
              const rt = normalizeLeadTypeString(rule.leadType || "");
              if (rt !== requestedLeadTypeNorm) continue;
            }

            const key = `${normalizeLeadTypeString(rule.leadType || "")}||${(
              rule.country || ""
            ).toLowerCase()}||${(rule.industryDomain || "").toLowerCase()}`;
            combinedBuckets[key] ||= { rulesByTier: {}, matchedCount: 0 };

            const tier = String(rule.leadsRequired || 0);
            const existing = combinedBuckets[key].rulesByTier[tier];

            if (!existing || planValidFrom > existing.planValidFrom) {
              combinedBuckets[key].rulesByTier[tier] = { rule, planValidFrom };
            }
          }
        }

        for (const bucket of Object.values(combinedBuckets)) {
          bucket.rules = Object.values(bucket.rulesByTier).map((r) => r.rule);
          bucket.matchedCount = 0;
          delete bucket.rulesByTier;
        }

        for (const ld of dayLeads) {
          for (const bucket of Object.values(combinedBuckets)) {
            if (bucket.rules.some((r) => doesRuleMatchLead(r, ld))) {
              bucket.matchedCount++;
            }
          }
        }

        const { totalAmount: addAmt, countsByAmount: addCounts } =
          allocateTieredAwards(
            Object.fromEntries(
              Object.entries(combinedBuckets).map(([k, v]) => [
                k,
                { rules: v.rules, matchedCount: v.matchedCount },
              ]),
            ),
          );

        totalAmount += addAmt;
        for (const [amt, cnt] of Object.entries(addCounts)) {
          countsByAmount[amt] = (countsByAmount[amt] || 0) + cnt;
        }
      }

      // ✅ DOUBLE TARGET — MONTH ONLY
      if (isMonthly) {
        const threshold = (emp.target || 0) * 2;
        if (threshold > 0 && totalLeads >= threshold) {
          totalAmount += 5000;
          countsByAmount["5000"] = (countsByAmount["5000"] || 0) + 1;
        }
      }

      results.push({
        employeeId: emp.employeeId,
        name: emp.fullName,
        totalLeads,
        totalAmount,
        countsByAmount,
      });
    }

    // columns (₹5000 always visible)
    const amountSet = new Set([5000]);
    for (const plan of plans) {
      for (const r of plan.rules || []) {
        if (r.amount > 0) amountSet.add(Number(r.amount));
      }
    }

    const columns = Array.from(amountSet).sort((a, b) => b - a);

    // sorting
    results.sort((a, b) => {
      if (sort === "leads_desc") return b.totalLeads - a.totalLeads;
      if (sort === "amount_asc") return a.totalAmount - b.totalAmount;
      if (sort === "name_asc") return a.name.localeCompare(b.name);
      return b.totalAmount - a.totalAmount;
    });

    return res.json({ columns, results: results.slice(0, limit) });
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ message: "Failed to build leaderboard" });
  }
});

/* ============================
   /api/employee/incentive-summary
   ============================ */
router.get("/incentive-summary", async (req, res) => {
  try {
    const q = req.query || {};
    let from, to;

    if (q.month) {
      const [y, m] = q.month.split("-");
      const f = new Date(Number(y), Number(m) - 1, 1);
      const next = new Date(Number(y), Number(m), 1);
      from = startOfDay(f);
      to = endOfDay(new Date(next.getTime() - 1));
    } else {
      const nowZ = toZonedTime(new Date(), USA_TZ);
      const ym = format(nowZ, "yyyy-MM", { timeZone: USA_TZ }).split("-");
      const f = new Date(Number(ym[0]), Number(ym[1]) - 1, 1);
      const next = new Date(Number(ym[0]), Number(ym[1]), 1);
      from = startOfDay(f);
      to = endOfDay(new Date(next.getTime() - 1));
    }

    const plans = await prisma.incentivePlan.findMany({
      include: { rules: true },
      orderBy: { validFrom: "desc" },
    });

    const leads = await prisma.lead.findMany({
      where: { qualified: true, date: { gte: from, lte: to } },
      orderBy: { date: "asc" },
    });

    const leadsByEmpDay = {};
    for (const l of leads) {
      const emp = l.employeeId;
      const key = toDateKey(l.date);
      if (!key) continue;
      if (!leadsByEmpDay[emp]) leadsByEmpDay[emp] = {};
      if (!leadsByEmpDay[emp][key]) leadsByEmpDay[emp][key] = [];
      leadsByEmpDay[emp][key].push(l);
    }

    const ruleIndex = {};
    for (const plan of plans) {
      for (const r of plan.rules || []) {
        ruleIndex[r.id] = {
          ruleId: r.id,
          planId: plan.id,
          planTitle: plan.title,
          leadType: r.leadType,
          description:
            (r.country ? `${r.country} ` : "") +
            (r.attendeesMinCount
              ? `Min:${r.attendeesMinCount}`
              : r.industryDomain || ""),
          leadsRequired: r.leadsRequired,
          amount: r.amount,
          achievers: [],
        };
      }
    }

    // Walk employees/days -> detect achievers per rule per day
    for (const [employeeId, days] of Object.entries(leadsByEmpDay)) {
      const user = await prisma.employee.findUnique({
        where: { employeeId },
        select: { fullName: true, target: true },
      });

      for (const [dateStr, dayLeads] of Object.entries(days)) {
        if (!dayLeads || dayLeads.length === 0) continue;

        const dayDate = dayLeads[0].date;
        const plansForDay = findPlansForDate(plans, dayDate);
        if (!plansForDay || plansForDay.length === 0) continue;

        // combined buckets across plans (de-dupe same-tier rules by keeping most recent plan rule)
        const combinedBuckets = {}; // bucketKey -> { rulesByTier: { tierKey: { rule, planValidFrom } }, matchedCount }

        for (const plan of plansForDay) {
          const planValidFrom = plan.validFrom
            ? new Date(plan.validFrom).getTime()
            : 0;
          for (const rule of plan.rules || []) {
            if (!rule.isActive) continue;

            const ruleTypeNorm = normalizeLeadTypeString(rule.leadType || "");
            const countryNorm = (rule.country || "").trim().toLowerCase();
            const industryNorm = (rule.industryDomain || "")
              .trim()
              .toLowerCase();
            const bucketKey = `${ruleTypeNorm}||${countryNorm}||${industryNorm}`;
            const tierKey = String(Number(rule.leadsRequired || 0)) || "0";

            combinedBuckets[bucketKey] = combinedBuckets[bucketKey] || {
              rulesByTier: {},
              matchedCount: 0,
            };

            const existing = combinedBuckets[bucketKey].rulesByTier[tierKey];
            if (!existing) {
              combinedBuckets[bucketKey].rulesByTier[tierKey] = {
                rule,
                planValidFrom,
              };
            } else {
              if (planValidFrom > (existing.planValidFrom || 0)) {
                combinedBuckets[bucketKey].rulesByTier[tierKey] = {
                  rule,
                  planValidFrom,
                };
              }
            }
          }
        }

        // flatten
        for (const [bk, data] of Object.entries(combinedBuckets)) {
          const rulesArr = Object.values(data.rulesByTier).map((x) => x.rule);
          combinedBuckets[bk].rules = rulesArr;
          combinedBuckets[bk].matchedCount = 0;
          delete combinedBuckets[bk].rulesByTier;
        }

        // count matches per bucket
        for (const ld of dayLeads) {
          for (const bucketKey of Object.keys(combinedBuckets)) {
            const bucket = combinedBuckets[bucketKey];
            let matchedThisLead = false;
            for (const rule of bucket.rules) {
              if (doesRuleMatchLead(rule, ld)) {
                matchedThisLead = true;
                break;
              }
            }
            if (matchedThisLead) {
              bucket.matchedCount = (bucket.matchedCount || 0) + 1;
            }
          }
        }

        // allocate per bucket and push achievers to ruleIndex
        for (const [bucketKey, bucket] of Object.entries(combinedBuckets)) {
          const remaining = bucket.matchedCount || 0;
          if (remaining <= 0) continue;

          // sort tiers desc and allocate greedily
          const sortedRules = bucket.rules.slice().sort((a, b) => {
            if ((b.leadsRequired || 0) !== (a.leadsRequired || 0))
              return (b.leadsRequired || 0) - (a.leadsRequired || 0);
            return (b.amount || 0) - (a.amount || 0);
          });

          let rem = remaining;
          for (const rule of sortedRules) {
            const req = Number(rule.leadsRequired || 0);
            const amt = Number(rule.amount || 0);
            if (req <= 0 || amt <= 0) continue;
            const times = Math.floor(rem / req);
            if (times <= 0) continue;

            const meta = ruleIndex[rule.id];
            if (!meta) continue;
            meta.achievers.push({
              employeeId,
              name: user?.fullName || employeeId,
              date: dateStr,
              times,
              total: times * amt,
              count: remaining,
            });

            rem -= times * req;
            if (rem <= 0) break;
          }
        }
      }
    }

    // ordered rules output
    const leadPriority = { attendees: 1, association: 2, industry: 3 };
    const orderedRules = [];
    for (const plan of plans) {
      const planRules = (plan.rules || []).slice().sort((a, b) => {
        const pa = leadPriority[String(a.leadType || "").toLowerCase()] || 99;
        const pb = leadPriority[String(b.leadType || "").toLowerCase()] || 99;
        if (pa !== pb) return pa - pb;
        return a.id - b.id;
      });
      for (const r of planRules) {
        const meta = ruleIndex[r.id];
        if (meta) orderedRules.push(meta);
      }
    }

    // monthly double-target
    const leadsByEmp = {};
    for (const l of leads) {
      leadsByEmp[l.employeeId] = (leadsByEmp[l.employeeId] || 0) + 1;
    }
    const monthlyDoubleTarget = [];
    for (const [employeeId, count] of Object.entries(leadsByEmp)) {
      const user = await prisma.employee.findUnique({
        where: { employeeId },
        select: { fullName: true, target: true },
      });
      const threshold = (user?.target || 0) * 2;
      if (threshold > 0 && count >= threshold) {
        monthlyDoubleTarget.push({
          employeeId,
          name: user?.fullName || employeeId,
          total: 5000,
          monthlyLeads: count,
        });
      }
    }

    return res.json({ rules: orderedRules, monthlyDoubleTarget });
  } catch (err) {
    console.error("incentive-summary error:", err);
    return res
      .status(500)
      .json({ message: "Failed to build incentive summary" });
  }
});

export default router;
