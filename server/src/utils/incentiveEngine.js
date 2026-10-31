// Single incentive calculation used by the leaderboard, the incentive summary
// and the employee dashboard (v1 had four different versions).
//
// Rules (unchanged from v1 leaderboard):
//  - Leads are grouped per employee per Central-time day (by contact date).
//  - Every plan valid on that day contributes its active rules.
//  - Rules are grouped in "buckets" (same lead type + country + industry);
//    if two plans define the same tier, the newest plan wins.
//  - Each lead counts once per bucket it matches.
//  - Tiers are paid greedily, biggest tier first, as many times as they fit.
//  - v2: ALL uploaded leads count (no qualification step any more).
import { dateKey } from "./time.js";

export function normalizeCountryKey(country = "") {
  if (!country) return "";
  const cleaned = String(country).trim().toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
  const map = {
    us: "us", usa: "us", "united states": "us", "united states of america": "us", "u s": "us", "u s a": "us",
    uk: "uk", "united kingdom": "uk", "great britain": "uk", england: "uk", scotland: "uk", wales: "uk",
    canada: "canada", australia: "australia", ireland: "ireland", germany: "germany", russia: "russia",
    mexico: "mexico", netherlands: "netherlands", "neither land": "netherlands", france: "france",
    argentina: "argentina", "new zealand": "new zealand", newzealand: "new zealand", nz: "new zealand",
    india: "india", china: "china", japan: "japan", brazil: "brazil",
  };
  if (map[cleaned]) return map[cleaned];
  for (const t of cleaned.split(/[,()/\\-]+| and /).map((s) => s.trim()).filter(Boolean)) {
    if (map[t]) return map[t];
  }
  return cleaned;
}

/** "Attendees Lead" -> "attendees", "Member Attendees" -> "member attendees" */
export function normalizeLeadTypeString(s = "") {
  return String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\b(lead|type)s?\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function doesRuleMatchLead(rule, lead) {
  if (!rule || !lead) return false;
  const ruleType = normalizeLeadTypeString(rule.leadType);
  if (normalizeLeadTypeString(lead.leadType) !== ruleType) return false;

  if (rule.country) {
    const allowed = String(rule.country).split(",").map((s) => s.trim()).filter(Boolean).map(normalizeCountryKey);
    if (allowed.length && !allowed.includes(normalizeCountryKey(lead.country || ""))) return false;
  }
  if (ruleType.includes("attend") && rule.attendeesMinCount) {
    if (Number(lead.attendeesCount || 0) < Number(rule.attendeesMinCount)) return false;
  }
  if (ruleType.includes("industry") && rule.industryDomain) {
    const leadDomain = String(lead.industryDomain || "").trim().toLowerCase();
    if (!leadDomain || leadDomain !== String(rule.industryDomain).trim().toLowerCase()) return false;
  }
  return true;
}

/** Plans valid on a given day (validFrom <= day < validTo) */
export function plansForDate(plans, date) {
  const key = dateKey(date);
  if (!key) return [];
  return plans.filter((p) => {
    const from = dateKey(p.validFrom);
    const to = p.validTo ? dateKey(p.validTo) : null;
    return from && from <= key && (!to || key < to);
  });
}

function bucketKey(rule) {
  return `${normalizeLeadTypeString(rule.leadType)}||${(rule.country || "").trim().toLowerCase()}||${(rule.industryDomain || "").trim().toLowerCase()}`;
}

/**
 * Incentive for one employee's leads of ONE day.
 * Returns { amount, awards: [{ruleId, planId, planTitle, leadType, leadsRequired, amount, times, total, matched}] }
 */
export function computeDay(dayLeads, plans, { leadTypeFilter } = {}) {
  if (!dayLeads.length) return { amount: 0, awards: [] };
  const valid = plansForDate(plans, dayLeads[0].date);
  if (!valid.length) return { amount: 0, awards: [] };
  const wanted = leadTypeFilter ? normalizeLeadTypeString(leadTypeFilter) : null;

  const buckets = {};
  for (const plan of valid) {
    const planFrom = new Date(plan.validFrom).getTime() || 0;
    for (const rule of plan.rules || []) {
      if (!rule.isActive) continue;
      if (wanted && normalizeLeadTypeString(rule.leadType) !== wanted) continue;
      const k = bucketKey(rule);
      buckets[k] ||= { tiers: {} };
      const tier = String(rule.leadsRequired || 0);
      const existing = buckets[k].tiers[tier];
      if (!existing || planFrom > existing.planFrom) buckets[k].tiers[tier] = { rule, plan, planFrom };
    }
  }

  let amount = 0;
  const awards = [];
  for (const b of Object.values(buckets)) {
    const entries = Object.values(b.tiers);
    const matched = dayLeads.filter((l) => entries.some((e) => doesRuleMatchLead(e.rule, l))).length;
    let remaining = matched;
    entries.sort((a, z) => (z.rule.leadsRequired - a.rule.leadsRequired) || (z.rule.amount - a.rule.amount));
    for (const { rule, plan } of entries) {
      const req = Number(rule.leadsRequired || 0);
      const amt = Number(rule.amount || 0);
      if (req <= 0 || amt <= 0 || remaining <= 0) continue;
      const times = Math.floor(remaining / req);
      if (times <= 0) continue;
      amount += times * amt;
      remaining -= times * req;
      awards.push({
        ruleId: rule.id, planId: plan.id, planTitle: plan.title, leadType: rule.leadType,
        leadsRequired: req, amount: amt, times, total: times * amt, matched,
      });
    }
  }
  return { amount, awards };
}

/** Group leads by Central day and compute the total for one employee */
export function computeForLeads(leads, plans, opts) {
  const byDay = {};
  for (const l of leads) {
    const k = dateKey(l.date);
    if (k) (byDay[k] ||= []).push(l);
  }
  let total = 0;
  const countsByAmount = {};
  const days = {};
  for (const [day, dayLeads] of Object.entries(byDay)) {
    const r = computeDay(dayLeads, plans, opts);
    if (r.amount > 0) {
      total += r.amount;
      days[day] = r;
      for (const a of r.awards) countsByAmount[a.amount] = (countsByAmount[a.amount] || 0) + a.times;
    }
  }
  return { total, countsByAmount, days };
}
