// server/src/routes/leaderboardRoutes.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import { toZonedTime, format } from "date-fns-tz";
import {
    startOfDay,
    endOfDay,
    startOfMonth,
    endOfMonth,
    parseISO
} from "date-fns";

import {
    toDateKey,
    findPlanForDate,
    findPlansForDate,
    doesRuleMatchLead,
    normalizeLeadTypeString
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
            if ((b.leadsRequired || 0) !== (a.leadsRequired || 0)) return (b.leadsRequired || 0) - (a.leadsRequired || 0);
            return (b.amount || 0) - (a.amount || 0);
        });

        for (const rule of sorted) {
            const required = Number(rule.leadsRequired || 0);
            const amount = Number(rule.amount || 0);
            if (required <= 0 || amount <= 0) continue;

            const times = Math.floor(remaining / required);
            if (times <= 0) continue;

            totalAmount += times * amount;
            countsByAmount[String(amount)] = (countsByAmount[String(amount)] || 0) + times;

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

        // load all incentive plans (active + historical) and their rules
        const plans = await prisma.incentivePlan.findMany({
            include: { rules: true },
            orderBy: { validFrom: "desc" }
        });

        // fetch all active non-admin employees
        const employees = await prisma.employee.findMany({
            where: {
                isActive: true,
                role: { not: "ADMIN" }
            },
            select: { employeeId: true, fullName: true, target: true, role: true }
        });

        // fetch qualified leads in the requested range once
        const allLeads = await prisma.lead.findMany({
            where: {
                qualified: true,
                date: { gte: range.from, lte: range.to }
            },
            orderBy: { date: "asc" }
        });

        const leadsByEmployee = new Map();
        for (const ld of allLeads) {
            const emp = ld.employeeId;
            if (!leadsByEmployee.has(emp)) leadsByEmployee.set(emp, []);
            leadsByEmployee.get(emp).push(ld);
        }

        const results = [];

        // Build ruleMap (not strictly required here but kept for compatibility)
        const ruleMap = new Map();
        for (const plan of plans) {
            for (const r of plan.rules || []) {
                ruleMap.set(r.id, { rule: r, planId: plan.id, planTitle: plan.title, planValidFrom: plan.validFrom });
            }
        }

        const requestedLeadTypeNorm = leadTypeFilter !== "All" ? normalizeLeadTypeString(leadTypeFilter) : null;

        for (const emp of employees) {
            const empLeads = leadsByEmployee.get(emp.employeeId) || [];

            // group by day
            const byDay = {};
            for (const ld of empLeads) {
                const ds = toDateKey(ld.date);
                if (!ds) continue;
                if (!byDay[ds]) byDay[ds] = [];
                byDay[ds].push(ld);
            }

            let totalAmount = 0;
            let totalLeads = empLeads.length;
            const countsByAmount = {};

            for (const [dayKey, dayLeads] of Object.entries(byDay)) {
                if (!dayLeads || dayLeads.length === 0) continue;

                // get plans that apply to this day (based on lead date)
                // use the first lead date as representative for the day
                const dayDate = dayLeads[0].date;
                const plansForDay = findPlansForDate(plans, dayDate);

                if (!plansForDay || plansForDay.length === 0) continue;

                // Build combined buckets across all matching plans for the day.
                // If multiple plans define the SAME bucket and SAME leadsRequired, we keep the rule
                // from the plan with the latest validFrom (most recent) to avoid duplicate awards.
                const combinedBuckets = {}; // bucketKey -> { rules: [rule], matchedCount: 0 }

                for (const plan of plansForDay) {
                    const planValidFrom = plan.validFrom ? new Date(plan.validFrom).getTime() : 0;

                    for (const rule of plan.rules || []) {
                        if (!rule.isActive) continue;

                        // respect front-end leadType filter
                        if (requestedLeadTypeNorm) {
                            const rTypeNorm = normalizeLeadTypeString(rule.leadType || "");
                            if (rTypeNorm !== requestedLeadTypeNorm) continue;
                        }

                        const ruleTypeNorm = normalizeLeadTypeString(rule.leadType || "");
                        const countryNorm = (rule.country || "").trim().toLowerCase();
                        const industryNorm = (rule.industryDomain || "").trim().toLowerCase();
                        const bucketKey = `${ruleTypeNorm}||${countryNorm}||${industryNorm}`;

                        combinedBuckets[bucketKey] = combinedBuckets[bucketKey] || { rulesByTier: {}, matchedCount: 0 };

                        // use tierKey as the leadsRequired value to dedupe same-tier rules across plans
                        const tierKey = String(Number(rule.leadsRequired || 0)) || "0";

                        // If there's an existing rule in this bucket+tier, keep the one with later validFrom
                        const existing = combinedBuckets[bucketKey].rulesByTier[tierKey];
                        if (!existing) {
                            // store rule plus planValidFrom so we can compare later
                            combinedBuckets[bucketKey].rulesByTier[tierKey] = { rule, planValidFrom };
                        } else {
                            if (planValidFrom > (existing.planValidFrom || 0)) {
                                combinedBuckets[bucketKey].rulesByTier[tierKey] = { rule, planValidFrom };
                            }
                        }
                    }
                }

                // Flatten rulesByTier into an array for each bucket
                for (const [bk, data] of Object.entries(combinedBuckets)) {
                    const rulesArr = Object.values(data.rulesByTier).map((x) => x.rule);
                    combinedBuckets[bk].rules = rulesArr;
                    combinedBuckets[bk].matchedCount = 0;
                    delete combinedBuckets[bk].rulesByTier;
                }

                // Count matches per combined bucket
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

                // Allocate awards from the combined buckets
                const { totalAmount: addAmt, countsByAmount: addCounts } = allocateTieredAwards(
                    Object.fromEntries(Object.entries(combinedBuckets).map(([k, v]) => [k, { rules: v.rules, matchedCount: v.matchedCount }]))
                );

                totalAmount += addAmt;
                for (const [amt, cnt] of Object.entries(addCounts)) {
                    countsByAmount[amt] = (countsByAmount[amt] || 0) + cnt;
                }
            }

            // monthly double target
            const doubleTargetThreshold = (emp.target || 0) * 2;
            if (doubleTargetThreshold > 0 && totalLeads >= doubleTargetThreshold) {
                totalAmount += 5000;
                countsByAmount["5000"] = (countsByAmount["5000"] || 0) + 1;
            }

            results.push({
                employeeId: emp.employeeId,
                name: emp.fullName,
                totalLeads,
                monthlyLeads: totalLeads,
                totalAmount,
                countsByAmount
            });
        }

        // Build columns
        const amountSet = new Set();
        for (const plan of plans) {
            for (const r of plan.rules || []) {
                const a = Number(r.amount || 0);
                if (a > 0) amountSet.add(a);
            }
        }
        if (results.some(r => r.countsByAmount && r.countsByAmount["5000"])) amountSet.add(5000);

        const columns = Array.from(amountSet).sort((a, b) => b - a);

        // sorting
        let sorted = results.slice();
        if (sort === "amount_desc") sorted.sort((a, b) => b.totalAmount - a.totalAmount);
        else if (sort === "amount_asc") sorted.sort((a, b) => a.totalAmount - b.totalAmount);
        else if (sort === "leads_desc") sorted.sort((a, b) => b.totalLeads - a.totalLeads);
        else if (sort === "name_asc") sorted.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

        const limited = sorted.slice(0, limit);

        return res.json({ columns, results: limited });
    } catch (err) {
        console.error("Leaderboard error:", err);
        return res.status(500).json({ message: "Failed to build leaderboard" });
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
            orderBy: { validFrom: "desc" }
        });

        const leads = await prisma.lead.findMany({
            where: { qualified: true, date: { gte: from, lte: to } },
            orderBy: { date: "asc" }
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
                    description: (r.country ? `${r.country} ` : "") + (r.attendeesMinCount ? `Min:${r.attendeesMinCount}` : (r.industryDomain || "")),
                    leadsRequired: r.leadsRequired,
                    amount: r.amount,
                    achievers: []
                };
            }
        }

        // Walk employees/days -> detect achievers per rule per day
        for (const [employeeId, days] of Object.entries(leadsByEmpDay)) {
            const user = await prisma.employee.findUnique({ where: { employeeId }, select: { fullName: true, target: true } });

            for (const [dateStr, dayLeads] of Object.entries(days)) {
                if (!dayLeads || dayLeads.length === 0) continue;

                const dayDate = dayLeads[0].date;
                const plansForDay = findPlansForDate(plans, dayDate);
                if (!plansForDay || plansForDay.length === 0) continue;

                // combined buckets across plans (de-dupe same-tier rules by keeping most recent plan rule)
                const combinedBuckets = {}; // bucketKey -> { rulesByTier: { tierKey: { rule, planValidFrom } }, matchedCount }

                for (const plan of plansForDay) {
                    const planValidFrom = plan.validFrom ? new Date(plan.validFrom).getTime() : 0;
                    for (const rule of plan.rules || []) {
                        if (!rule.isActive) continue;

                        const ruleTypeNorm = normalizeLeadTypeString(rule.leadType || "");
                        const countryNorm = (rule.country || "").trim().toLowerCase();
                        const industryNorm = (rule.industryDomain || "").trim().toLowerCase();
                        const bucketKey = `${ruleTypeNorm}||${countryNorm}||${industryNorm}`;
                        const tierKey = String(Number(rule.leadsRequired || 0)) || "0";

                        combinedBuckets[bucketKey] = combinedBuckets[bucketKey] || { rulesByTier: {}, matchedCount: 0 };

                        const existing = combinedBuckets[bucketKey].rulesByTier[tierKey];
                        if (!existing) {
                            combinedBuckets[bucketKey].rulesByTier[tierKey] = { rule, planValidFrom };
                        } else {
                            if (planValidFrom > (existing.planValidFrom || 0)) {
                                combinedBuckets[bucketKey].rulesByTier[tierKey] = { rule, planValidFrom };
                            }
                        }
                    }
                }

                // flatten
                for (const [bk, data] of Object.entries(combinedBuckets)) {
                    const rulesArr = Object.values(data.rulesByTier).map(x => x.rule);
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
                        if ((b.leadsRequired || 0) !== (a.leadsRequired || 0)) return (b.leadsRequired || 0) - (a.leadsRequired || 0);
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
                            count: remaining
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
            const user = await prisma.employee.findUnique({ where: { employeeId }, select: { fullName: true, target: true } });
            const threshold = (user?.target || 0) * 2;
            if (threshold > 0 && count >= threshold) {
                monthlyDoubleTarget.push({
                    employeeId,
                    name: user?.fullName || employeeId,
                    total: 5000,
                    monthlyLeads: count
                });
            }
        }

        return res.json({ rules: orderedRules, monthlyDoubleTarget });
    } catch (err) {
        console.error("incentive-summary error:", err);
        return res.status(500).json({ message: "Failed to build incentive summary" });
    }
});

export default router;
