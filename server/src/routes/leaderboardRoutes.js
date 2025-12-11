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
 * Accepts query object and returns { from: Date, to: Date }
 * Supports:
 *  - from & to (ISO YYYY-MM-DD)
 *  - period=today|month|year
 *  - month=YYYY-MM
 *  - year=YYYY
 */
function buildRangeFromQuery(q = {}) {
    const nowZ = toZonedTime(new Date(), USA_TZ);

    if (q.from && q.to) {
        // parse inclusive from & to (assumes 'YYYY-MM-DD' or ISO)
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
        const month = q.month || format(nowZ, "yyyy-MM", { timeZone: USA_TZ }); // "YYYY-MM"
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

    // fallback: all time
    return { from: new Date(0), to: new Date() };
}

/* ============================
   Helper: allocateTieredAwards
   - buckets: { bucketKey: { rules: [rule,...], matchedCount } }
   - returns { totalAmount, countsByAmount }
   Behavior: greedy allocation by descending leadsRequired
*/
function allocateTieredAwards(buckets) {
    let totalAmount = 0;
    const countsByAmount = {};

    for (const bucketKey of Object.keys(buckets)) {
        const { rules, matchedCount } = buckets[bucketKey];
        if (!Array.isArray(rules) || rules.length === 0) continue;
        let remaining = Number(matchedCount || 0);
        if (remaining <= 0) continue;

        // Sort rules by leadsRequired descending (higher tiers first). If equal leadsRequired prefer higher amount.
        const sorted = rules.slice().sort((a, b) => {
            if (b.leadsRequired !== a.leadsRequired) return b.leadsRequired - a.leadsRequired;
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

            // consume used leads
            remaining -= times * required;
            if (remaining <= 0) break;
        }
    }

    return { totalAmount, countsByAmount };
}

/* ============================
   /api/employee/leaderboard
   ============================ */
/**
 * Query params supported:
 *  - period (today|month|year) or from & to
 *  - month=YYYY-MM
 *  - year=YYYY
 *  - sort=amount_desc|amount_asc|leads_desc|name_asc
 *  - leadType=All|Attendees|Association|Industry (tolerant matching)
 *  - limit=N
 *
 * Response:
 *  { columns: [amounts..], results: [ { employeeId, name, totalLeads, monthlyLeads, totalAmount, countsByAmount } ] }
 */
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

        // fetch all active employees
        const employees = await prisma.employee.findMany({
            where: { isActive: true },
            select: { employeeId: true, fullName: true, target: true }
        });

        // fetch qualified leads in the requested range once (reduce DB calls)
        const allLeads = await prisma.lead.findMany({
            where: {
                qualified: true,
                date: { gte: range.from, lte: range.to }
            },
            orderBy: { date: "asc" }
        });

        // index leads by employeeId for quick lookup
        const leadsByEmployee = new Map();
        for (const ld of allLeads) {
            const emp = ld.employeeId;
            if (!leadsByEmployee.has(emp)) leadsByEmployee.set(emp, []);
            leadsByEmployee.get(emp).push(ld);
        }

        const results = [];

        // Pre-build a rule map: ruleId -> { rule, planId, planTitle }
        const ruleMap = new Map();
        for (const plan of plans) {
            for (const r of plan.rules || []) {
                ruleMap.set(r.id, { rule: r, planId: plan.id, planTitle: plan.title });
            }
        }

        // normalize requested leadType once
        const requestedLeadTypeNorm = leadTypeFilter !== "All" ? normalizeLeadTypeString(leadTypeFilter) : null;

        for (const emp of employees) {
            const empLeads = leadsByEmployee.get(emp.employeeId) || [];

            // group by date key (yyyy-MM-dd in USA_TZ)
            const byDay = {};
            for (const ld of empLeads) {
                const ds = toDateKey(ld.date);
                if (!ds) continue;
                if (!byDay[ds]) byDay[ds] = [];
                byDay[ds].push(ld);
            }

            let totalAmount = 0;
            let totalLeads = empLeads.length;
            const countsByAmount = {}; // amount -> times awarded

            // process each day separately
            for (const [dayKey, dayLeads] of Object.entries(byDay)) {
                // For each day we will build PLAN groups, and within each plan group build BUCKETS.
                // Bucket identifies a set of rules that should be considered together (e.g. same leadType+country+industry).
                const planGroups = new Map(); // planId -> { plan, leads: [] }
                for (const ld of dayLeads) {
                    const planList = findPlansForDate(plans, ld.date);
                    if (!planList || planList.length === 0) {
                        const key = "__NO_PLAN__";
                        if (!planGroups.has(key)) planGroups.set(key, { plan: null, leads: [] });
                        planGroups.get(key).leads.push(ld);
                    } else {
                        for (const p of planList) {
                            const key = String(p.id);
                            if (!planGroups.has(key)) planGroups.set(key, { plan: p, leads: [] });
                            planGroups.get(key).leads.push(ld);
                        }
                    }
                }

                // For each plan group, build buckets and compute matched counts per-bucket
                for (const { plan, leads: groupLeads } of planGroups.values()) {
                    if (!plan || !Array.isArray(plan.rules) || plan.rules.length === 0) continue;

                    // Build buckets: key -> { rules: [rule,...], matchedCount }
                    // bucket key uses normalized leadType + normalized country + industryDomain (lowercase)
                    const buckets = {};

                    // initialize buckets with rules that pass front-end filter and are active
                    for (const rule of plan.rules) {
                        if (!rule.isActive) continue;

                        // apply front-end leadType filter (tolerant)
                        if (requestedLeadTypeNorm) {
                            const ruleTypeNorm = normalizeLeadTypeString(rule.leadType || "");
                            if (ruleTypeNorm !== requestedLeadTypeNorm) continue;
                        }

                        const ruleTypeNorm = normalizeLeadTypeString(rule.leadType || "");
                        const countryNorm = (rule.country || "").trim().toLowerCase();
                        const industryNorm = (rule.industryDomain || "").trim().toLowerCase();
                        const bucketKey = `${ruleTypeNorm}||${countryNorm}||${industryNorm}`;

                        buckets[bucketKey] = buckets[bucketKey] || { rules: [], matchedCount: 0 };
                        buckets[bucketKey].rules.push(rule);
                    }

                    if (Object.keys(buckets).length === 0) continue;

                    // Count matches per bucket by checking each lead against each rule in that bucket.
                    // If a lead matches any rule in the bucket, it contributes to the bucket's matchedCount.
                    // IMPORTANT: we count leads per bucket by testing doesRuleMatchLead(rule, lead) per-rule
                    // and incrementing match counts for that rule's bucket. This provides the matchedCount used
                    // for greedy allocation below.
                    for (const ld of groupLeads) {
                        for (const bucketKey of Object.keys(buckets)) {
                            const bucket = buckets[bucketKey];
                            // if any rule in this bucket matches the lead, increment matchedCount for bucket
                            let matchedThisLead = false;
                            for (const rule of bucket.rules) {
                                // country/attendees/industry checks are in doesRuleMatchLead
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

                    // Now allocate awards per bucket using greedy tier allocation
                    const { totalAmount: addAmt, countsByAmount: addCounts } = allocateTieredAwards(
                        Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, { rules: v.rules, matchedCount: v.matchedCount }]))
                    );

                    totalAmount += addAmt;
                    for (const [amt, cnt] of Object.entries(addCounts)) {
                        countsByAmount[amt] = (countsByAmount[amt] || 0) + cnt;
                    }
                }
            }

            // monthly double target: if range covers a month(s) check threshold using total leads in the range
            const doubleTargetThreshold = (emp.target || 0) * 2;
            if (doubleTargetThreshold > 0 && totalLeads >= doubleTargetThreshold) {
                // award single 5000 bonus (per your business rule)
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

        // Build columns from unique rule amounts present in plans + 5000 if any
        const amountSet = new Set();
        for (const plan of plans) {
            for (const r of plan.rules || []) {
                const a = Number(r.amount || 0);
                if (a > 0) amountSet.add(a);
            }
        }
        // include 5000 if any result has that
        if (results.some(r => r.countsByAmount && r.countsByAmount["5000"])) amountSet.add(5000);

        const columns = Array.from(amountSet).sort((a, b) => b - a);

        // apply sorting
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
   grouped by rule
   ============================ */
/**
 * Query: month=YYYY-MM  (optional)
 * Response:
 *  { rules: [ { ruleId, planId, planTitle, leadType, description, leadsRequired, amount, achievers: [ { employeeId, name, date, times, total, count } ] } ], monthlyDoubleTarget: [ { employeeId, name, total, monthlyLeads } ] }
 */
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
            // default: current month in USA_TZ
            const nowZ = toZonedTime(new Date(), USA_TZ);
            const ym = format(nowZ, "yyyy-MM", { timeZone: USA_TZ }).split("-");
            const f = new Date(Number(ym[0]), Number(ym[1]) - 1, 1);
            const next = new Date(Number(ym[0]), Number(ym[1]), 1);
            from = startOfDay(f);
            to = endOfDay(new Date(next.getTime() - 1));
        }

        // load plans + rules
        const plans = await prisma.incentivePlan.findMany({
            include: { rules: true },
            orderBy: { validFrom: "desc" }
        });

        // fetch qualified leads in range
        const leads = await prisma.lead.findMany({
            where: { qualified: true, date: { gte: from, lte: to } },
            orderBy: { date: "asc" }
        });

        // index leads per employee per day
        const leadsByEmpDay = {}; // { employeeId: { 'yyyy-MM-dd': [lead, ...] } }
        for (const l of leads) {
            const emp = l.employeeId;
            const key = toDateKey(l.date);
            if (!key) continue;
            if (!leadsByEmpDay[emp]) leadsByEmpDay[emp] = {};
            if (!leadsByEmpDay[emp][key]) leadsByEmpDay[emp][key] = [];
            leadsByEmpDay[emp][key].push(l);
        }

        // build ruleIndex (ruleId -> meta)
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

        // Walk employees/days -> detect achievers per rule per day (but award using greedy tier allocation)
        for (const [employeeId, days] of Object.entries(leadsByEmpDay)) {
            const user = await prisma.employee.findUnique({ where: { employeeId }, select: { fullName: true, target: true } });

            for (const [dateStr, dayLeads] of Object.entries(days)) {
                // group day leads by all plans that apply to their date
                const groupsByPlan = new Map();
                for (const ld of dayLeads) {
                    const planList = findPlansForDate(plans, ld.date);
                    if (!planList || planList.length === 0) {
                        const key = "__NO_PLAN__";
                        if (!groupsByPlan.has(key)) groupsByPlan.set(key, { plan: null, leads: [] });
                        groupsByPlan.get(key).leads.push(ld);
                    } else {
                        for (const p of planList) {
                            const key = String(p.id);
                            if (!groupsByPlan.has(key)) groupsByPlan.set(key, { plan: p, leads: [] });
                            groupsByPlan.get(key).leads.push(ld);
                        }
                    }
                }

                // for each plan group process rules into buckets and allocate
                for (const { plan, leads: grpLeads } of groupsByPlan.values()) {
                    if (!plan || !(plan.rules || []).length) continue;

                    // Build buckets similar to leaderboard: rule-scope grouped by normalized leadType+country+industry
                    const buckets = {};
                    for (const rule of plan.rules) {
                        if (!rule.isActive) continue;
                        const ruleTypeNorm = normalizeLeadTypeString(rule.leadType || "");
                        const countryNorm = (rule.country || "").trim().toLowerCase();
                        const industryNorm = (rule.industryDomain || "").trim().toLowerCase();
                        const bucketKey = `${ruleTypeNorm}||${countryNorm}||${industryNorm}`;
                        buckets[bucketKey] = buckets[bucketKey] || { rules: [], matchedCount: 0 };
                        buckets[bucketKey].rules.push(rule);
                    }

                    // count matches per bucket
                    for (const ld of grpLeads) {
                        for (const bucketKey of Object.keys(buckets)) {
                            const bucket = buckets[bucketKey];
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

                    // allocate per bucket
                    for (const [bucketKey, bucket] of Object.entries(buckets)) {
                        const remaining = bucket.matchedCount || 0;
                        if (remaining <= 0) continue;

                        // Greedy allocation
                        const sortedRules = bucket.rules.slice().sort((a, b) => {
                            if (b.leadsRequired !== a.leadsRequired) return b.leadsRequired - a.leadsRequired;
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

            // monthly double-target detect later
        }

        // Prepare ordered rules: newest plans first (we queried that way), and within plan: attendees, association, industry ordering
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

        // compute monthlyDoubleTarget list
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
