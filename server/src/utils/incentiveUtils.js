// server/src/utils/incentiveUtils.js
import { toZonedTime, format } from "date-fns-tz";

const USA_TZ = "America/Chicago";

/**
 * Normalize country strings to canonical "USA" or "OTHER"
 * (kept for backward compatibility)
 */
export function normalizeCountry(country = "") {
    if (!country) return "OTHER";
    const c = String(country).trim().toLowerCase();
    if (
        c.includes("usa") ||
        c === "us" ||
        c.includes("u.s") ||
        c.includes("united state") ||
        c.includes("america")
    ) {
        return "USA";
    }
    return "OTHER";
}

/**
 * Normalize country to a stable key used for matching lists.
 * - lowercases, trims, removes punctuation
 * - maps many common synonyms to short canonical keys (e.g. 'us', 'uk', 'canada', 'new zealand')
 * - returns a normalized string (e.g. 'us', 'canada', 'new zealand') or lowercased raw token if unknown
 */
export function normalizeCountryKey(country = "") {
    if (!country) return "";
    const raw = String(country).trim().toLowerCase();

    // remove punctuation dots and repeated whitespace
    const cleaned = raw.replace(/\./g, "").replace(/\s+/g, " ").trim();

    // canonical map for common countries / synonyms
    const map = {
        // United States
        "us": "us",
        "usa": "us",
        "united states": "us",
        "united states of america": "us",
        "u s": "us",
        "u s a": "us",
        "u.s": "us",
        "u.s.a": "us",

        // United Kingdom variations
        "uk": "uk",
        "united kingdom": "uk",
        "great britain": "uk",
        "england": "uk",
        "scotland": "uk",
        "wales": "uk",

        // Others (common ones you mentioned + extras)
        "canada": "canada",
        "australia": "australia",
        "ireland": "ireland",
        "germany": "germany",
        "russia": "russia",
        "mexico": "mexico",
        "netherlands": "netherlands",
        "neither land": "netherlands", // handle typo if it appears
        "france": "france",
        "argentina": "argentina",
        "new zealand": "new zealand",
        "newzealand": "new zealand",
        "nz": "new zealand",
        "india": "india",
        "china": "china",
        "japan": "japan",
        "brazil": "brazil",
    };

    // try direct match
    if (map[cleaned]) return map[cleaned];

    // try mapping tokens (e.g., "united kingdom (uk)" or "canada, ca")
    // split on common separators and try to find a known token
    const tokens = cleaned.split(/[,()\/\\-]+| and /).map(t => t.trim()).filter(Boolean);
    for (const t of tokens) {
        if (map[t]) return map[t];
    }

    // fallback: return cleaned string (best-effort)
    return cleaned;
}

/**
 * return yyyy-MM-dd key for a date (in America/Chicago timezone)
 */
export function toDateKey(dateInput) {
    if (!dateInput) return null;
    try {
        const d = toZonedTime(new Date(dateInput), USA_TZ);
        return format(d, "yyyy-MM-dd", { timeZone: USA_TZ });
    } catch (e) {
        return null;
    }
}

/**
 * Find an incentive plan valid for a particular date.
 * (Kept for backward compatibility — returns the single most-recent plan)
 */
export function findPlanForDate(plans = [], dateInput) {
    const key = toDateKey(dateInput);
    if (!key) return null;

    const matching = plans.filter((p) => {
        const vf = toDateKey(p.validFrom);
        const vt = p.validTo ? toDateKey(p.validTo) : null;
        if (!vf) return false;
        const startsBeforeOrOn = vf <= key;
        const endsAfter = !vt || key < vt;
        return startsBeforeOrOn && endsAfter;
    });

    if (matching.length === 0) return null;

    matching.sort((a, b) => new Date(b.validFrom) - new Date(a.validFrom));
    return matching[0];
}

/**
 * Find ALL incentive plans valid for a particular date.
 * Returns array of matching plans (may be 0, 1, or many).
 *
 * Use this when you want rules from every active plan on that date to be evaluated.
 */
export function findPlansForDate(plans = [], dateInput) {
    const key = toDateKey(dateInput);
    if (!key) return [];

    return (plans || []).filter((p) => {
        const vf = toDateKey(p.validFrom);
        if (!vf) return false;
        const vt = p.validTo ? toDateKey(p.validTo) : null;
        const startsBeforeOrOn = vf <= key;
        const endsAfter = !vt || key < vt;
        return startsBeforeOrOn && endsAfter;
    });
}

/**
 * Normalize leadType strings for tolerant comparisons.
 * - lowercases
 * - collapses whitespace
 * - removes words like "lead", "type" (and plurals)
 * - trims
 *
 * Examples:
 *   "Attendees Lead" -> "attendees"
 *   "attendees type"  -> "attendees"
 *   "Attendees"       -> "attendees"
 */
export function normalizeLeadTypeString(s = "") {
    return String(s || "")
        .toLowerCase()
        .replace(/\s+/g, " ")                 // collapse multiple spaces
        .replace(/\b(lead|type)s?\b/g, "")    // remove "lead", "type", "leads", "types"
        .trim();
}

/**
 * Determine if a rule matches a single lead
 * rule: IncentiveRule
 * lead: Lead
 *
 * Updated country logic:
 * - rule.country may be null/empty => matches any country
 * - rule.country may be a comma-separated list ("US,Canada,UK")
 * - matching is case-insensitive and tolerant to variants (we normalize both sides)
 */
export function doesRuleMatchLead(rule, lead) {
    if (!rule || !lead) return false;

    // Normalize leadType text for tolerant matching (e.g. "Attendees Lead" vs "attendees type" vs "attendees")
    const leadTypeNorm = normalizeLeadTypeString(lead.leadType);
    const ruleLeadTypeNorm = normalizeLeadTypeString(rule.leadType || "");

    if (leadTypeNorm !== ruleLeadTypeNorm) return false;

    // Country check (if rule specified)
    if (rule.country) {
        // rule.country may be comma-separated
        const ruleCountries = String(rule.country || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .map(normalizeCountryKey);

        // if after parsing there are no tokens, treat as wildcard
        if (ruleCountries.length > 0) {
            const leadCountryKey = normalizeCountryKey(lead.country || "");
            // match if leadCountryKey equals any of the rule countries
            const matched = ruleCountries.some((rc) => {
                // exact key match
                if (rc === leadCountryKey) return true;
                // Some rules may specify short keys like 'us' while leadCountryKey might be 'united states'
                // normalizeCountryKey already maps common synonyms; we keep simple equality here.
                return false;
            });

            if (!matched) return false;
        }
    }

    // Attendees-specific: attendeesMinCount
    if (ruleLeadTypeNorm.includes("attend")) {
        if (rule.attendeesMinCount) {
            const count = Number(lead.attendeesCount || 0);
            if (count < Number(rule.attendeesMinCount)) return false;
        }
    }

    // Industry-specific
    if (ruleLeadTypeNorm.includes("industry")) {
        if (rule.industryDomain) {
            const leadDomain = (lead.industryDomain || "").trim().toLowerCase();
            const ruleDomain = (rule.industryDomain || "").trim().toLowerCase();
            if (!leadDomain || leadDomain !== ruleDomain) return false;
        }
    }

    return true;
}

/**
 * Compute daily incentive amounts for a given employee's list of leads.
 * (unchanged behaviour, uses doesRuleMatchLead)
 */
export function computeDailyIncentivesForLeads(leads = [], plans = []) {
    const byDay = {};
    const details = {};

    // group leads by yyyy-MM-dd (America/Chicago)
    for (const lead of leads) {
        const key = toDateKey(lead.date);
        if (!key) continue;
        byDay[key] = byDay[key] || [];
        byDay[key].push(lead);
    }

    let total = 0;
    const dailyDetails = {};

    for (const [dateKey, dayLeads] of Object.entries(byDay)) {
        // We may have leads from the same day that fall under different historical plans;
        // so we group dayLeads by the plan they map to.
        const groups = {}; // planId or "__NO_PLAN__" => array
        for (const ld of dayLeads) {
            const plan = findPlanForDate(plans, ld.date);
            const key = plan ? String(plan.id) : "__NO_PLAN__";
            groups[key] = groups[key] || { plan, leads: [] };
            groups[key].leads.push(ld);
        }

        let dayAmount = 0;
        const dayDetailList = [];

        // For each plan-group compute which rules are matched
        for (const { plan, leads: grpLeads } of Object.values(groups)) {
            if (!plan || !Array.isArray(plan.rules) || plan.rules.length === 0) continue;

            const activeRules = plan.rules.filter((r) => r.isActive);

            for (const rule of activeRules) {
                // count matches for this rule in this group
                const matchedCount = grpLeads.reduce((acc, l) => {
                    return doesRuleMatchLead(rule, l) ? acc + 1 : acc;
                }, 0);

                if (matchedCount >= (rule.leadsRequired || 0) && rule.leadsRequired > 0) {
                    dayAmount += Number(rule.amount || 0);
                    dayDetailList.push({
                        planId: plan.id,
                        planTitle: plan.title,
                        ruleId: rule.id,
                        leadsRequired: rule.leadsRequired,
                        matchedCount,
                        amount: rule.amount,
                    });
                }
            }
        }

        if (dayAmount > 0) {
            total += dayAmount;
            dailyDetails[dateKey] = dayDetailList;
        }
    }

    return {
        byDate: Object.fromEntries(Object.entries(dailyDetails).map(([d, arr]) => [d, arr.reduce((s, r) => s + r.amount, 0)])),
        total,
        dailyDetails,
    };
}
