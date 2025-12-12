/**
 * MotivationBanner.jsx
 *
 * Template-based, name-first, English-dominant motivational banner with light Hindi.
 * - Buckets: 0 -> 150%
 * - Template tokens: {name}, {slotLine}, {sunnyLine}, {percent}, {todayLeads}, {dailyTarget}, {remainingDays}, {unlockedAmount}, {nextRemaining}
 * - Message variations deterministic per-employee / per-hour (stable during the hour).
 * - Tone: balanced roast + motivation (medium roast).
 */

import React, { useMemo } from "react";
import { toZonedTime } from "date-fns-tz";
import { getDaysInMonth } from "date-fns";
import {
    FiZap,
    FiTarget,
    FiTrendingUp,
    FiCalendar,
    FiClock,
    FiCheckCircle,
    FiAward,
    FiBriefcase,
    FiArrowRight,
    FiActivity,
} from "react-icons/fi";

const USA_TZ = "America/Chicago";

/* -----------------------
   UTILITIES
   ----------------------- */
const safeNum = (v, d = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
};
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const firstName = (full) =>
    !full ? "Friend" : String(full).trim().split(/\s+/)[0];

/**
 * simple stable hash for seed generation (not crypto)
 * mixes employee identifier and current date/hour so each user gets unique but stable
 */
function makeSeed(identity = "", dateObj = new Date()) {
    const base = `${identity}|${dateObj.getFullYear()}-${dateObj.getMonth() + 1}-${dateObj.getDate()}|${dateObj.getHours()}`;
    let h = 2166136261 >>> 0;
    for (let i = 0; i < base.length; i++) {
        h ^= base.charCodeAt(i);
        h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return Math.abs(h >>> 0);
}

/* -----------------------
   TIME HELPERS
   ----------------------- */
const nowInUSA = () => toZonedTime(new Date(), USA_TZ);

const isSameDate = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

const getNthWeekday = (y, m, wday, n) => {
    const d = new Date(y, m, 1);
    while (d.getDay() !== wday) d.setDate(d.getDate() + 1);
    d.setDate(d.getDate() + (n - 1) * 7);
    return d;
};
const getLastWeekday = (y, m, wday) => {
    const d = new Date(y, m + 1, 0);
    while (d.getDay() !== wday) d.setDate(d.getDate() - 1);
    return d;
};
const observed = (date, m, d) => {
    const y = date.getFullYear();
    const actual = new Date(y, m, d);
    let obs = new Date(actual);
    if (actual.getDay() === 0) obs = new Date(y, m, d + 1);
    if (actual.getDay() === 6) obs = new Date(y, m, d - 1);
    return isSameDate(date, obs);
};
const isUSHoliday = (date) => {
    const y = date.getFullYear();
    const m = date.getMonth();
    if (observed(date, 0, 1)) return true; // New Year
    if (observed(date, 5, 19)) return true; // Juneteenth
    if (observed(date, 6, 4)) return true; // Independence
    if (observed(date, 10, 11)) return true; // Veterans
    if (observed(date, 11, 25)) return true; // Christmas
    if (m === 0 && isSameDate(date, getNthWeekday(y, 0, 1, 3))) return true; // MLK
    if (m === 1 && isSameDate(date, getNthWeekday(y, 1, 1, 3))) return true; // Pres
    if (m === 4 && isSameDate(date, getLastWeekday(y, 4, 1))) return true; // Memorial
    if (m === 8 && isSameDate(date, getNthWeekday(y, 8, 1, 1))) return true; // Labor
    if (m === 9 && isSameDate(date, getNthWeekday(y, 9, 1, 2))) return true; // Columbus
    if (m === 10 && isSameDate(date, getNthWeekday(y, 10, 4, 4))) return true; // Thanksgiving
    return false;
};
const isWorkingDay = (d) => {
    const dow = d.getDay();
    if (dow === 0) return false;
    if (dow === 6) {
        const nth = Math.floor((d.getDate() - 1) / 7) + 1;
        if (nth === 2 || nth === 4) return false;
    }
    return !isUSHoliday(d);
};
const workingDaysInMonth = (d) => {
    const y = d.getFullYear();
    const m = d.getMonth();
    const days = getDaysInMonth(d);
    let cnt = 0;
    for (let dd = 1; dd <= days; dd++) {
        if (isWorkingDay(new Date(y, m, dd))) cnt++;
    }
    return cnt;
};
const remainingWorkingDays = (d) => {
    const y = d.getFullYear();
    const m = d.getMonth();
    const days = getDaysInMonth(d);
    let cnt = 0;
    for (let dd = d.getDate() + 1; dd <= days; dd++) {
        if (isWorkingDay(new Date(y, m, dd))) cnt++;
    }
    return cnt;
};

/* -----------------------
   SLOT LINES & SUNNY LINES
   (English first + 1–2 Hindi softly)
   ----------------------- */
const SUNNY_LINES = [
    "Bright day — time to give your numbers some udaan.",
    "Weather perfect — make your graph shine a bit, bhai.",
    "Sun's out — turn today into a scoreboard win.",
    "Clear skies — clear goals, now execution.",
    "Today looks strong — bring that same energy to the pipeline.",
];

const SLOT_LINES = {
    morning: [
        "{name}, fresh morning — drop the first lead and set the tone.",
        "{name}, early hours are yours — start with a confident reach.",
        "{name}, morning momentum really helps — take the first shot.",
        "{name}, first lead sets a rhythm — make it count.",
    ],
    midday: [
        "{name}, midday check — prime hours, prime opportunities.",
        "{name}, lunch done — now push for meaningful progress.",
        "{name}, mid-shift is where closers take action.",
        "{name}, half-day passed — convert effort into numbers.",
    ],
    afternoon: [
        "{name}, afternoon zone — closers shine here, step up.",
        "{name}, PM push matters — energy now, reward later.",
        "{name}, this window decides the daily story — act.",
        "{name}, steady grind in afternoon pays off big.",
    ],
    evening: [
        "{name}, evening push — wrap the day with impact.",
        "{name}, last lap — finish strong and proud.",
        "{name}, final hour can flip the scoreboard — go for it.",
        "{name}, close the day with a notable win.",
    ],
};

/* -----------------------
   BUCKET TEMPLATES (0 → 150)
   Template tokens supported: {name}, {slotLine}, {sunnyLine}, {percent}, {todayLeads}, {dailyTarget}, {remainingDays}, {unlockedAmount}, {nextRemaining}
   Tone: medium roast (balanced)
   ----------------------- */

const BUCKET_TEMPLATES = {
    "0": [
        "{name}, it's quiet today — start with one small action and build.",
        "{name}, zero is just the start — make the first outreach now.",
        "{name}, no leads yet — a single strong call can change the day.",
    ],
    "1-5": [
        "{name}, you have begun — keep the pace, add one more push.",
        "{name}, early steps are visible — don't stop at warm-up.",
        "{name}, a few leads landed — convert one into momentum.",
    ],
    "6-10": [
        "{name}, warming up nicely — ab thoda acceleration dikhado.",
        "{name}, good start — add a focused push and see results.",
        "{name}, you're on the board — keep the pressure, bhai.",
    ],
    "11-15": [
        "{name}, steady progress — now sharpen your outreach and close.",
        "{name}, this range shows intent — move it to conversion.",
        "{name}, good traction — a couple strong moves will help.",
    ],
    "16-20": [
        "{name}, momentum building — push for meaningful wins now.",
        "{name}, a solid run — show some finishing effort.",
        "{name}, you're making progress — don't let it idle.",
    ],
    "21-30": [
        "{name}, clear momentum — time to stack high-quality leads.",
        "{name}, good rhythm — step it up with deliberate actions.",
        "{name}, pipeline moving — aim for consistent conversions.",
    ],
    "31-40": [
        "{name}, strong stretch — your day can become memorable.",
        "{name}, numbers look healthy — make them irrefutable.",
        "{name}, nice surge — be clinical with follow-ups now.",
    ],
    "41-50": [
        "{name}, getting close to halfway — keep disciplined activity.",
        "{name}, solid performance — a little more focus seals more wins.",
        "{name}, your pace is credible — push to widen the gap.",
    ],
    "51-60": [
        "{name}, above halfway — great rhythm. Double down on quality.",
        "{name}, strong board — finish this phase with purpose.",
        "{name}, you've got traction — now harvest the results.",
    ],
    "61-70": [
        "{name}, this is serious momentum — raise the intensity thoda.",
        "{name}, you are in the power band — don't let it slip.",
        "{name}, strong push now will make the month shine.",
    ],
    "71-80": [
        "{name}, excellent run — keep the fire and close confidently.",
        "{name}, top performers show up here — be among them.",
        "{name}, you're in the fast lane — hold and accelerate.",
    ],
    "81-90": [
        "{name}, closing in — this is where closers earn their name.",
        "{name}, great position — put in the decisive actions now.",
        "{name}, high momentum — maintain discipline till the finish.",
    ],
    "91-99": [
        "{name}, almost there — one or two strong moves and it's yours.",
        "{name}, this is the final stretch — finish with focus.",
        "{name}, final touches make the difference — wrap them up.",
    ],
    "100-120": [
        "{name}, target achieved — welcome to bonus zone. Keep farming!",
        "{name}, you crossed 100% — now convert extra attention into gains.",
        "{name}, great milestone — extra wins are now easier to get.",
    ],
    "121-150": [
        "{name}, exceptional performance — you're shaping the leaderboard.",
        "{name}, you're outperforming — keep the elite consistency.",
        "{name}, outstanding run — legacy-level numbers this month.",
    ],
};

/* -----------------------
   PICKING / RENDERING
   ----------------------- */

function pickFrom(arr, seed) {
    if (!Array.isArray(arr) || arr.length === 0) return "";
    return arr[seed % arr.length];
}

/**
 * renderTemplate(template, context)
 * Replaces tokens with values from context
 */
function renderTemplate(tpl = "", ctx = {}) {
    return tpl.replace(/\{(\w+)\}/g, (m, key) => {
        if (Object.prototype.hasOwnProperty.call(ctx, key)) {
            return String(ctx[key]);
        }
        return m;
    });
}

/* -----------------------
   ANALYZE INCENTIVE BREAKDOWN (simple)
   ----------------------- */
function analyzeIncentiveBreakdown(breakdown = {}) {
    if (!breakdown || !breakdown.plans) return { unlocked: null, next: null };
    let bestUnlocked = null;
    let bestNext = null;
    for (const planId of Object.keys(breakdown.plans)) {
        const plan = breakdown.plans[planId];
        const count = safeNum(plan.count, 0);
        const tiers = Array.isArray(plan.tiers) ? plan.tiers : [];
        // unlocked
        const unlockedTiers = tiers.filter((t) => t.isActive && count >= t.leadsRequired);
        if (unlockedTiers.length) {
            const top = unlockedTiers.reduce((a, b) => (a.amount >= b.amount ? a : b));
            if (!bestUnlocked || top.amount > bestUnlocked.amount) {
                bestUnlocked = { plan: plan.title || "Plan", amount: top.amount, count };
            }
        }
        // next
        const nextTiers = tiers.filter((t) => t.isActive && count < t.leadsRequired).sort((a, b) => a.leadsRequired - b.leadsRequired);
        if (nextTiers.length) {
            const n = nextTiers[0];
            const remaining = Math.max(0, n.leadsRequired - count);
            if (!bestNext || remaining < bestNext.remaining) {
                bestNext = { plan: plan.title || "Plan", amount: n.amount, req: n.leadsRequired, remaining };
            }
        }
    }
    return { unlocked: bestUnlocked, next: bestNext };
}

/* -----------------------
   MAIN COMPONENT
   ----------------------- */

export default function MotivationBanner({
    target,
    qualifiedMonthly = 0,
    doubleTarget = false,
    incentiveBreakdown = {},
    incentive = 0,
    employeeName,
    todayLeads = 0,
    streak = 0,
}) {
    // Minimal guard
    if (!target || target <= 0) return null;

    // Now/time/seed context
    const now = nowInUSA();
    const ident = (employeeName || "") + "|"; // you can append employeeId if you pass it
    const seed = makeSeed(ident, now);

    // Derived metrics
    const fname = firstName(employeeName);
    const pct = clamp(Math.round((safeNum(qualifiedMonthly, 0) / safeNum(target, 1)) * 100), 0, 10000);
    const wLeft = remainingWorkingDays(now);
    const wTotal = workingDaysInMonth(now);
    const dailyTarget = wTotal > 0 ? Math.ceil(target / wTotal) : 0;

    // slot selection
    const hour = now.getHours();
    const slot = hour < 11 ? "morning" : hour < 14 ? "midday" : hour < 17 ? "afternoon" : "evening";

    // build lines
    const sunnyLine = pickFrom(SUNNY_LINES, seed + 3);
    const slotLineTemplate = pickFrom(SLOT_LINES[slot], seed + 5);

    // pick bucket key
    const bucketKey = useMemo(() => {
        if (pct === 0) return "0";
        if (pct <= 5) return "1-5";
        if (pct <= 10) return "6-10";
        if (pct <= 15) return "11-15";
        if (pct <= 20) return "16-20";
        if (pct <= 30) return "21-30";
        if (pct <= 40) return "31-40";
        if (pct <= 50) return "41-50";
        if (pct <= 60) return "51-60";
        if (pct <= 70) return "61-70";
        if (pct <= 80) return "71-80";
        if (pct <= 90) return "81-90";
        if (pct <= 99) return "91-99";
        if (pct <= 120) return "100-120";
        return "121-150";
    }, [pct]);

    // pick main template
    const bucketArr = BUCKET_TEMPLATES[bucketKey] || BUCKET_TEMPLATES["0"];
    const mainTpl = pickFrom(bucketArr, seed + 7);

    // incentive analysis
    const { unlocked, next } = analyzeIncentiveBreakdown(incentiveBreakdown);

    // build context for rendering templates
    const ctx = {
        name: fname,
        slotLine: renderTemplate(slotLineTemplate, { name: fname }),
        sunnyLine,
        percent: pct,
        todayLeads: safeNum(todayLeads, 0),
        dailyTarget,
        remainingDays: wLeft,
        unlockedAmount: unlocked ? unlocked.amount : 0,
        nextRemaining: next ? next.remaining : 0,
    };

    const mainLine = renderTemplate(mainTpl, ctx);

    // also create a longer attractive motivational variant for when pct >= 60 (user asked longer lines)
    const longMotivation = (() => {
        if (pct >= 90) {
            const base = `${fname}, incredible pace so far — ab thoda acceleration dikhado. The scoreboard is waiting for that final push that only you can deliver.`;
            return base;
        }
        if (pct >= 70) {
            return `${fname}, strong momentum — you're in the final stretch. Focused outreach now will convert momentum into meaningful wins.`;
        }
        if (pct >= 50) {
            return `${fname}, good headway — keep the pressure and aim for a clean finish. A small, focused step can add real value.`;
        }
        return `${fname}, keep building — one deliberate action now compounds later. Start with a targeted reach-out.`;
    })();

    // Choose which motivational block to show (longer if strong progress)
    const showLong = pct >= 50;

    /* -----------------------
       RENDER
       ----------------------- */
    return (
        <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden font-sans">
            <div className="flex flex-col md:flex-row">

                {/* Left: Narrative */}
                <div className="flex-1 p-5 flex flex-col justify-between">
                    {/* Top row: date + small status */}
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                            <FiCalendar className="w-3.5 h-3.5" />
                            <span>{now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                            <span className="text-slate-300">|</span>
                            <FiClock className="w-3.5 h-3.5" />
                            <span>{now.toLocaleTimeString("en-US", { hour: "numeric", minute: "numeric" })}</span>
                        </div>

                        {doubleTarget && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-full border border-purple-100">
                                <FiZap className="w-3 h-3" /> Double Target
                            </div>
                        )}
                    </div>

                    {/* Main message */}
                    <div className="mb-3">
                        <h2 className="text-slate-800 font-semibold text-base md:text-lg leading-tight mb-1">
                            {mainLine}
                        </h2>

                        <p className="text-slate-500 text-sm font-medium">
                            {renderTemplate("{slotLine} {sunnyLine}", ctx)}
                        </p>

                        {showLong && (
                            <p className="mt-2 text-slate-600 text-sm">
                                {longMotivation}
                            </p>
                        )}
                    </div>

                    {/* Quick chips */}
                    <div className="flex flex-wrap gap-3 mt-auto">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${wLeft < 5 ? "bg-amber-50 border-amber-100 text-amber-800" : "bg-slate-50 border-slate-100 text-slate-600"}`}>
                            <FiBriefcase className="w-3.5 h-3.5" />
                            {wLeft === 0 ? "Final day" : `${wLeft} days left`}
                        </div>

                        {streak > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-blue-50 border-blue-100 text-blue-700 text-xs font-medium">
                                <FiActivity className="w-3.5 h-3.5" />
                                {streak} day streak
                            </div>
                        )}

                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-slate-50 border-slate-100 text-slate-600 text-xs font-medium">
                            <FiTarget className="w-3.5 h-3.5" />
                            Today: {ctx.todayLeads} / {dailyTarget}
                        </div>
                    </div>
                </div>

                {/* Right: Metrics & incentives */}
                <div className="md:w-72 bg-slate-50/50 border-t md:border-t-0 md:border-l border-slate-100 p-5 flex flex-col justify-center">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative w-14 h-14">
                            <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 36 36">
                                <path className="text-slate-200" d="M18 2.0845a15.9 15.9 0 1 1 0 31.8a15.9 15.9 0 1 1 0-31.8" fill="none" stroke="currentColor" strokeWidth="3" />
                                <path className={pct >= 100 ? "text-green-500" : "text-indigo-500"} strokeDasharray={`${Math.min(pct, 100)},100`} d="M18 2.0845a15.9 15.9 0 1 1 0 31.8a15.9 15.9 0 1 1 0-31.8" fill="none" stroke="currentColor" strokeWidth="3" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-slate-700">
                                {Math.round(pct)}%
                            </div>
                        </div>

                        <div>
                            <div className="text-xs font-semibold text-slate-400 uppercase">Status</div>
                            <div className="text-sm font-bold text-slate-800">
                                {pct >= 200 ? "God Mode" : pct >= 100 ? "Bonus Zone" : pct >= 80 ? "Finishing Strong" : pct >= 50 ? "On Track" : "Building Momentum"}
                            </div>
                            <div className="text-xs text-slate-500">{qualifiedMonthly} of {target} leads</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border p-3 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase text-slate-400">Incentive Track</span>
                            {unlocked && (
                                <span className="flex items-center text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                    <FiCheckCircle className="w-3 h-3 mr-1" />
                                    ₹{unlocked.amount.toLocaleString()}
                                </span>
                            )}
                        </div>

                        {next ? (
                            <div className="flex items-start gap-2">
                                <div className="mt-0.5 bg-indigo-50 p-1 rounded-md text-indigo-600">
                                    <FiArrowRight className="w-3 h-3" />
                                </div>
                                <div>
                                    <div className="text-xs text-slate-800 font-medium">Unlock <span className="text-indigo-600 font-bold">₹{next.amount.toLocaleString()}</span></div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">Plan: {next.plan} • Need <span className="font-semibold text-slate-700">{next.remaining}</span> more</div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-xs text-slate-500 italic">
                                <FiAward className="w-4 h-4 text-slate-300" />
                                {unlocked ? "Max tier reached — incredible!" : "No active tiers yet."}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
