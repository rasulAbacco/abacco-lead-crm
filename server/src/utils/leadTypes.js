// One single place that decides a lead's category from its free-text leadType.
// Upload form values: "Association Lead", "Attendees Lead", "Industry Lead", "Member Attendees".

export const LEAD_CATEGORIES = ["association", "attendees", "industry", "memberAttendees"];

export function leadCategory(leadType = "") {
  const t = String(leadType).toLowerCase();
  if (t.includes("member")) return "memberAttendees";
  if (t.includes("association")) return "association";
  if (t.includes("industry")) return "industry";
  if (t.includes("attend")) return "attendees";
  return "other";
}

export function emptyCategoryCounts() {
  return { total: 0, association: 0, attendees: 0, industry: 0, memberAttendees: 0, other: 0 };
}

export function countByCategory(leads) {
  const c = emptyCategoryCounts();
  for (const l of leads) {
    c.total++;
    c[leadCategory(l.leadType)]++;
  }
  return c;
}

/**
 * Target achievement for one employee in a month.
 * Achieved = sum over categories of min(actual, categoryTarget).
 * If no distribution is set, achievement is simply total vs target.
 */
export function targetProgress(counts, target, dist) {
  const pct = (p) => Number(p || 0);
  const hasDist =
    dist && pct(dist.associationPercent) + pct(dist.attendeesPercent) + pct(dist.industryPercent) + pct(dist.memberAttendeesPercent) > 0;
  if (!target || target <= 0) {
    return { target: 0, achieved: counts.total, rate: 0, categories: null };
  }
  if (!hasDist) {
    const achieved = Math.min(counts.total, target);
    return { target, achieved, rate: Math.round((achieved / target) * 100), categories: null };
  }
  const categories = {
    association: Math.round((target * pct(dist.associationPercent)) / 100),
    attendees: Math.round((target * pct(dist.attendeesPercent)) / 100),
    industry: Math.round((target * pct(dist.industryPercent)) / 100),
    memberAttendees: Math.round((target * pct(dist.memberAttendeesPercent)) / 100),
  };
  let achieved = 0;
  for (const k of Object.keys(categories)) achieved += Math.min(counts[k] || 0, categories[k]);
  return { target, achieved, rate: Math.round((achieved / target) * 100), categories };
}
