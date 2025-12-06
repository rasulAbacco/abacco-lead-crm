import React from "react";
import { toZonedTime } from "date-fns-tz";
import { getDaysInMonth } from "date-fns";
import { FiZap, FiTrendingUp, FiTarget, FiAward } from "react-icons/fi";

const USA_TZ = "America/Chicago";

// ---------- SMALL HELPERS ----------
const getFirstName = (name) => {
    if (!name) return "buddy";
    const trimmed = name.trim();
    if (!trimmed) return "buddy";
    return trimmed.split(" ")[0]; // use first word as "first name"
};

// deterministic index so text doesn't flicker randomly
const pickVariant = (variants, seedNumber) => {
    if (!variants || variants.length === 0) return "";
    const idx = Math.abs(seedNumber) % variants.length;
    return variants[idx];
};

// ---------- US HOLIDAYS HELPERS ----------
const getNthWeekdayOfMonth = (year, month, weekday, n) => {
    const date = new Date(year, month, 1);
    while (date.getDay() !== weekday) {
        date.setDate(date.getDate() + 1);
    }
    date.setDate(date.getDate() + (n - 1) * 7);
    return date;
};

const getLastWeekdayOfMonth = (year, month, weekday) => {
    const date = new Date(year, month + 1, 0); // last day of month
    while (date.getDay() !== weekday) {
        date.setDate(date.getDate() - 1);
    }
    return date;
};

const isSameDate = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

const isObservedFixedHoliday = (date, month, day) => {
    const year = date.getFullYear();
    const actual = new Date(year, month, day);
    let observed = new Date(actual);

    if (actual.getDay() === 0) {
        // Sunday -> Monday
        observed = new Date(year, month, day + 1);
    } else if (actual.getDay() === 6) {
        // Saturday -> Friday
        observed = new Date(year, month, day - 1);
    }

    return isSameDate(date, observed);
};

const isUSHoliday = (date) => {
    const month = date.getMonth(); // 0-based

    // Fixed/observed holidays
    if (isObservedFixedHoliday(date, 0, 1)) return true; // New Year (Jan 1)
    if (isObservedFixedHoliday(date, 5, 19)) return true; // Juneteenth (Jun 19)
    if (isObservedFixedHoliday(date, 6, 4)) return true; // Independence Day (Jul 4)
    if (isObservedFixedHoliday(date, 10, 11)) return true; // Veterans Day (Nov 11)
    if (isObservedFixedHoliday(date, 11, 25)) return true; // Christmas (Dec 25)

    const year = date.getFullYear();

    // MLK Day (3rd Monday in Jan)
    if (month === 0) {
        const mlk = getNthWeekdayOfMonth(year, 0, 1, 3);
        if (isSameDate(date, mlk)) return true;
    }

    // Presidents' Day (3rd Monday in Feb)
    if (month === 1) {
        const pres = getNthWeekdayOfMonth(year, 1, 1, 3);
        if (isSameDate(date, pres)) return true;
    }

    // Memorial Day (last Monday in May)
    if (month === 4) {
        const memorial = getLastWeekdayOfMonth(year, 4, 1);
        if (isSameDate(date, memorial)) return true;
    }

    // Labor Day (1st Monday in Sep)
    if (month === 8) {
        const labor = getNthWeekdayOfMonth(year, 8, 1, 1);
        if (isSameDate(date, labor)) return true;
    }

    // Columbus / Indigenous Peoples' Day (2nd Monday in Oct)
    if (month === 9) {
        const col = getNthWeekdayOfMonth(year, 9, 1, 2);
        if (isSameDate(date, col)) return true;
    }

    // Thanksgiving (4th Thursday in Nov)
    if (month === 10) {
        const thanks = getNthWeekdayOfMonth(year, 10, 4, 4);
        if (isSameDate(date, thanks)) return true;
    }

    return false;
};

const isWorkingDay = (date) => {
    const dayOfWeek = date.getDay(); // 0 Sun, 6 Sat

    // Sunday off
    if (dayOfWeek === 0) return false;

    // 2nd & 4th Saturday off
    if (dayOfWeek === 6) {
        const day = date.getDate();
        const nth = Math.floor((day - 1) / 7) + 1; // 1..5
        if (nth === 2 || nth === 4) return false;
    }

    // US holiday off (Mon–Sat)
    if (isUSHoliday(date)) return false;

    return true;
};

const countWorkingDaysInMonth = (baseDate) => {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const daysInMonth = getDaysInMonth(baseDate);
    let count = 0;

    for (let d = 1; d <= daysInMonth; d++) {
        const current = new Date(year, month, d);
        if (isWorkingDay(current)) count++;
    }

    return count;
};

const countRemainingWorkingDays = (baseDate) => {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const daysInMonth = getDaysInMonth(baseDate);
    const today = baseDate.getDate();

    let count = 0;
    for (let d = today + 1; d <= daysInMonth; d++) {
        const current = new Date(year, month, d);
        if (isWorkingDay(current)) count++;
    }

    return count;
};

// ---------- STATUS CHIP ----------
const getStatusLabel = (p) => {
    if (p <= 20) return "Warming Up";
    if (p <= 60) return "On The Move";
    if (p <= 90) return "Hot Streak";
    if (p <= 120) return "Target Hunter";
    return "Double Target Mode";
};

// ---------- MAIN MOTIVATION (5% BUCKETS, SAVAGE) ----------
const getMainMotivationMessage = ({
    percent,
    workingDaysLeft,
    doubleTarget,
    firstName,
    seed,
}) => {
    const p = Math.round(percent);
    const remainingPercent = Math.max(0, 100 - p);

    const wdText =
        workingDaysLeft === 0
            ? "after today you are out of working days, so no excuses."
            : `you still have ${workingDaysLeft} working day${workingDaysLeft === 1 ? "" : "s"
            } to fix this.`;

    const name = firstName || "buddy";

    const bucketVariants = [];

    if (p <= 0) {
        bucketVariants.push(
            `${name}, your progress bar is in ICU right now. 0% done, ${wdText}`,
            `Fresh month, zero output. Time to prove HR did not hire you by mistake, ${name}. ${wdText}`
        );
        return pickVariant(bucketVariants, seed);
    }

    // 1–5
    if (p > 0 && p <= 5) {
        bucketVariants.push(
            `${p}%? That is not progress, that is a test ping. Wake up, ${name} - ${wdText}`,
            `${name}, you have just poked the target with ${p}%. Now actually hit it. ${wdText}`
        );
        return pickVariant(bucketVariants, seed);
    }

    // 6–10
    if (p > 5 && p <= 10) {
        bucketVariants.push(
            `${p}% done. Decent warm-up, but the target is still laughing. Level up, ${name}. ${wdText}`,
            `Slow fire, ${name}. ${p}% is cute, not scary. Push harder - ${wdText}`
        );
        return pickVariant(bucketVariants, seed);
    }

    // 11–15
    if (p > 10 && p <= 15) {
        bucketVariants.push(
            `${p}% on the board. Good... but nobody gets incentives for being "kinda trying", ${name}. ${wdText}`,
            `You have left the starting line, ${name}, but ${p}% will not impress anyone yet. ${wdText}`
        );
        return pickVariant(bucketVariants, seed);
    }

    // 16–20
    if (p > 15 && p <= 20) {
        bucketVariants.push(
            `${p}% hit. You are moving, but not dangerous yet. Turn beast mode on, ${name}. ${wdText}`,
            `At ${p}% you are officially "warming up". The real grind starts now, ${name}. ${wdText}`
        );
        return pickVariant(bucketVariants, seed);
    }

    // 21–25
    if (p > 20 && p <= 25) {
        bucketVariants.push(
            `Around ${p}% is "I am trying" territory. Let us push it to "I am serious" territory, ${name}. ${wdText}`,
            `${name}, 25% gang is nice, but 50%+ is where legends start. ${wdText}`
        );
        return pickVariant(bucketVariants, seed);
    }

    // 26–30
    if (p > 25 && p <= 30) {
        bucketVariants.push(
            `${p}% - one third soldier. Do not get comfortable here, ${name}, climb. ${wdText}`,
            `You are sitting around ${p}% like it is a final score. Spoiler: it is not. ${wdText}`
        );
        return pickVariant(bucketVariants, seed);
    }

    // 31–35
    if (p > 30 && p <= 35) {
        bucketVariants.push(
            `${p}% done. Good base, now stack some serious numbers, ${name}. ${wdText}`,
            `You are in the boring middle at ${p}%. Time to make the graph interesting. ${wdText}`
        );
        return pickVariant(bucketVariants, seed);
    }

    // 36–40
    if (p > 35 && p <= 40) {
        bucketVariants.push(
            `${p}% - very close to halfway, do not start acting tired now, ${name}. ${wdText}`,
            `You are sniffing 50% at ${p}%. Stop sniffing and cross it, ${name}. ${wdText}`
        );
        return pickVariant(bucketVariants, seed);
    }

    // 41–45
    if (p > 40 && p <= 45) {
        bucketVariants.push(
            `${p}% looks promising, ${name}, but until you hit 50% it is just potential, not performance. ${wdText}`,
            `Nice climb to ${p}%, now do not go into "I did enough for today" mode. ${wdText}`
        );
        return pickVariant(bucketVariants, seed);
    }

    // 46–50
    if (p > 45 && p <= 50) {
        bucketVariants.push(
            `Halfway warrior. ${p}% done - now prove the first half was not luck, ${name}. ${wdText}`,
            `${name}, at ${p}% you are officially on track. Do not use that as an excuse to chill. ${wdText}`
        );
        return pickVariant(bucketVariants, seed);
    }

    // 51–55
    if (p > 50 && p <= 55) {
        bucketVariants.push(
            `${p}% - more done than left. Do not start celebrating mid-match, ${name}. ${wdText}`,
            `You crossed 50%. Good. Now act like someone aiming for 120%, not 51%, ${name}. ${wdText}`
        );
        return pickVariant(bucketVariants, seed);
    }

    // 56–60
    if (p > 55 && p <= 60) {
        bucketVariants.push(
            `${p}% - your target is officially nervous now. Keep the pressure on, ${name}. ${wdText}`,
            `You are cruising at ${p}%. Do not turn cruise control on, this is not a road trip. ${wdText}`
        );
        return pickVariant(bucketVariants, seed);
    }

    // 61–65
    if (p > 60 && p <= 65) {
        bucketVariants.push(
            `${p}% - this is grind territory. No time for drama, only dials, ${name}. ${wdText}`,
            `You have come too far to start slacking at ${p}%. Finish what you started, ${name}. ${wdText}`
        );
        return pickVariant(bucketVariants, seed);
    }

    // 66–70
    if (p > 65 && p <= 70) {
        bucketVariants.push(
            `${p}% - almost in "dangerously good" zone. One strong push, ${name}. ${wdText}`,
            `${name}, at ${p}% you are closer to glory than excuses. Choose wisely. ${wdText}`
        );
        return pickVariant(bucketVariants, seed);
    }

    // 71–75
    if (p > 70 && p <= 75) {
        bucketVariants.push(
            `${p}% - your future self will roast you if you do not finish strong now, ${name}. ${wdText}`,
            `You are at ${p}%. This is where closers separate from complainers, ${name}. ${wdText}`
        );
        return pickVariant(bucketVariants, seed);
    }

    // 76–80
    if (p > 75 && p <= 80) {
        bucketVariants.push(
            `${p}% - target is basically shaking. Go finish it, ${name}. ${wdText}`,
            `You are too close at ${p}% to play safe now. Go all in, ${name}. ${wdText}`
        );
        return pickVariant(bucketVariants, seed);
    }

    // 81–85
    if (p > 80 && p <= 85) {
        bucketVariants.push(
            `${p}% - if you stop now, it is self-sabotage, ${name}. ${wdText}`,
            `You are at ${p}%. Do not be that person who reaches the finish line and sits down. ${wdText}`
        );
        return pickVariant(bucketVariants, seed);
    }

    // 86–90
    if (p > 85 && p <= 90) {
        bucketVariants.push(
            `${p}% - only ${remainingPercent}% left. If you do not finish, we are judging you, ${name}. ${wdText}`,
            `You are basically done at ${p}%. Now actually be done, not "almost". ${wdText}`
        );
        return pickVariant(bucketVariants, seed);
    }

    // 91–95
    if (p > 90 && p <= 95) {
        bucketVariants.push(
            `${p}% - at this point, not finishing 100% should be illegal, ${name}. ${wdText}`,
            `You have bullied the target to ${p}%. Now land the final punch, ${name}. ${wdText}`
        );
        return pickVariant(bucketVariants, seed);
    }

    // 96–99
    if (p > 95 && p < 100) {
        bucketVariants.push(
            `${p}% - this is not "almost", this is "just do it", ${name}. ${wdText}`,
            `You are one micro-step away at ${p}%. Lock in and stop dragging it, ${name}. ${wdText}`
        );
        return pickVariant(bucketVariants, seed);
    }

    // 100–120 (target hit)
    if (p >= 100 && p <= 120 && !doubleTarget) {
        bucketVariants.push(
            `Target smashed at ${p}%. Nice. Now double it, ${name}, do not retire mid-month. ${wdText}`,
            `You hit ${p}% - congrats, but we both know you can bully double target too, ${name}. ${wdText}`
        );
        return pickVariant(bucketVariants, seed);
    }

    // 121–150 (chasing double)
    if (p > 120 && p <= 150 && !doubleTarget) {
        bucketVariants.push(
            `${p}% - overachiever unlocked. Double target is not a dream anymore, ${name}. ${wdText}`,
            `You are swinging above ${p}%. This is where leaderboards get interesting, ${name}. ${wdText}`
        );
        return pickVariant(bucketVariants, seed);
    }

    // 151–200
    if (p > 150 && p <= 200 && !doubleTarget) {
        bucketVariants.push(
            `${p}% - this is "who even works like this?" level. Keep farming, ${name}. ${wdText}`,
            `You are living in bonus land at ${p}%. Make this month a legend, ${name}. ${wdText}`
        );
        return pickVariant(bucketVariants, seed);
    }

    // 100+ and double target already marked
    if (p >= 100 && doubleTarget) {
        bucketVariants.push(
            `Double target warrior mode on. You have proved your point; now write a stupidly big number, ${name}. ${wdText}`,
            `You already broke the game with double target. Now you are just farming stats, ${name}. ${wdText}`
        );
        return pickVariant(bucketVariants, seed);
    }

    // 200+ safeguard
    bucketVariants.push(
        `${p}% - okay relax, save some targets for next month also, ${name}. ${wdText}`
    );
    return pickVariant(bucketVariants, seed);
};

// ---------- ONE-LINE INCENTIVE MOTIVATION ----------
const getIncentiveTierLabel = (incentive) => {
    if (incentive >= 1500) return "Gold";
    if (incentive >= 1000) return "Silver";
    if (incentive >= 500) return "Bronze";
    return null;
};

const getIncentiveMotivation = (
    breakdown = {},
    incentive = 0,
    firstName,
    todayLeads = 0
) => {
    const { usAttendees = 0, mixedLeads = 0, usAssociation = 0 } =
        breakdown || {};
    const totalIncentiveLeads = usAttendees + mixedLeads + usAssociation;
    const name = firstName || "bro";

    // 0 leads, 0 incentive
    if (todayLeads === 0 && totalIncentiveLeads === 0) {
        return `${name}, no leads, no incentive. Laptop on, but work off mode. Start with at least 1 lead.`;
    }

    // Some leads today, but no incentive-qualified ones
    if (totalIncentiveLeads === 0) {
        return `${name}, you already dropped ${todayLeads} lead(s) today but none are incentive grade yet. Tighten the quality and make at least a few count for money.`;
    }

    const leadsAwayUS = usAttendees >= 7 ? 0 : 7 - usAttendees;
    const leadsAwayMixed = mixedLeads >= 10 ? 0 : 10 - mixedLeads;
    const leadsAwayAssoc = usAssociation >= 12 ? 0 : 12 - usAssociation;

    const distances = [leadsAwayUS, leadsAwayMixed, leadsAwayAssoc].filter(
        (d) => d > 0
    );
    const closest = distances.length ? Math.min(...distances) : 0;

    // Incentive not yet hit but some incentive-style leads present
    if (!incentive || incentive <= 0) {
        if (closest > 0) {
            return `${name}, you already have ${totalIncentiveLeads} serious lead(s) today. Just ${closest} more solid ones and step 1 incentive will unlock. Do not leave that money on the table.`;
        }
        return `Leads are coming, ${name}, but incentive is still shy. Clean up your pitch and convert these into proper paid numbers.`;
    }

    // Incentive achieved -> 3 step messaging, use todayLeads in joke
    const tier = getIncentiveTierLabel(incentive);
    const leadsText =
        todayLeads > 0 ? `${todayLeads} lead(s)` : "all the leads you touched";

    if (tier === "Bronze") {
        return `Hahaha ${name}, step 1 incentive unlocked today with ₹${incentive.toLocaleString()}. Now just pray that ${leadsText} stay qualified and then push for Silver step.`;
    }

    if (tier === "Silver") {
        return `Nice one ${name}, you are on step 2 incentive (Silver) with ₹${incentive.toLocaleString()} today. Pray today's ${leadsText} do not get rejected and then hunt for that Gold step.`;
    }

    if (tier === "Gold") {
        return `Full send, ${name}! You maxed out step 3 incentive (Gold) with ₹${incentive.toLocaleString()} today. Now just pray QA does not break your heart on these ${leadsText}.`;
    }

    // Fallback if some weird custom amount
    return `${name}, ₹${incentive.toLocaleString()} in incentive today. You have already made the day profitable - now overkill it.`;
};

// ---------- DAILY PROGRESS (4-HOURLY) ----------
const getDailyProgressMessage = (
    totalToday,
    dailyTarget,
    slotIndex,
    firstName
) => {
    const name = firstName || "buddy";
    if (!dailyTarget || dailyTarget <= 0) return "";

    const ratio = totalToday / dailyTarget;

    const slotLabels = [
        "Morning update",
        "Midday update",
        "Afternoon update",
        "Evening update",
        "Late evening update",
        "Night update",
    ];
    const moods = [
        "Perfect time to decide whether today is chill or killer.",
        "Prime hustle hours. Do not waste them scrolling.",
        "Energy dip time, do not let your numbers sleep too.",
        "Scoreboard check before you log off mentally.",
        "Last window to fix today's story.",
        "If you are still online now, at least make it worth it.",
    ];

    const label = slotLabels[slotIndex] || "Today";
    const mood = moods[slotIndex] || "";

    if (totalToday === 0) {
        return `${label}: 0 leads so far, ${name}. Target is chilling, you are chilling... only HR is crying. ${mood}`;
    }

    if (ratio < 0.5) {
        return `${label}: ${totalToday} lead(s) logged. You are playing safe, ${name}. Push closer to the daily target of ${dailyTarget}. ${mood}`;
    }

    if (ratio >= 0.5 && ratio < 1) {
        return `${label}: ${totalToday} lead(s). You are past halfway but not done. Do not stop at "almost", ${name}. Daily target is ${dailyTarget}. ${mood}`;
    }

    if (ratio >= 1 && ratio < 1.5) {
        return `${label}: Daily target ${dailyTarget} already cracked with ${totalToday} lead(s). Now you are in bonus land, ${name} - farm more. ${mood}`;
    }

    return `${label}: ${totalToday} lead(s) today. You are bullying the daily target, ${name}. Keep that same energy tomorrow. ${mood}`;
};

// ---------- NEW COMPONENT: CIRCULAR PROGRESS ----------
const CircularProgress = ({ percent }) => {
    const size = 95;
    const strokeWidth = 8;
    const center = size / 2;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    // Cap visual fill at 100% so it doesn't look broken, but text shows real %
    const visualPercent = Math.min(percent, 100);
    const strokeDashoffset = circumference - (visualPercent / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="rotate-[-90deg]">
                <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" /> {/* Indigo-500 */}
                        <stop offset="100%" stopColor="#ec4899" /> {/* Pink-500 */}
                    </linearGradient>
                </defs>
                {/* Track */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="transparent"
                    stroke="#e5e7eb"
                    strokeWidth={strokeWidth}
                />
                {/* Indicator */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="transparent"
                    stroke="url(#progressGradient)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold text-gray-800">
                    {Math.round(percent)}%
                </span>
            </div>
        </div>
    );
};

// ---------- MAIN COMPONENT ----------
const MotivationBanner = ({
    target,
    qualifiedMonthly = 0,
    doubleTarget = false,
    incentiveBreakdown = {},
    incentive = 0,
    employeeName, // full name from Employee table
    todayLeads = 0, // total leads today (qualified + not qualified)
}) => {
    if (!target || target <= 0) return null;

    const nowInUSA = toZonedTime(new Date(), USA_TZ);
    const firstName = getFirstName(employeeName);

    // Working days
    const totalWorkingDaysThisMonth = countWorkingDaysInMonth(nowInUSA);
    const workingDaysLeft = countRemainingWorkingDays(nowInUSA);

    // Today leads (all)
    const totalToday = todayLeads;

    // Daily target based on working days
    const dailyTarget =
        totalWorkingDaysThisMonth > 0
            ? Math.max(1, Math.round(target / totalWorkingDaysThisMonth))
            : 0;

    // Monthly % (main driver for motivation line)
    const monthlyPercent =
        target > 0 ? Math.min((qualifiedMonthly / target) * 100, 250) : 0;

    // seed for text variation (changes hourly)
    const day = nowInUSA.getDate();
    const hour = nowInUSA.getHours();
    const seed = day * 10 + hour;

    // MAIN MOTIVATION: MONTHLY-BASED
    const mainMotivation = getMainMotivationMessage({
        percent: monthlyPercent,
        workingDaysLeft,
        doubleTarget,
        firstName,
        seed,
    });

    // INCENTIVE: TODAY-BASED
    const incentiveLine = getIncentiveMotivation(
        incentiveBreakdown,
        incentive,
        firstName,
        totalToday
    );

    // DAILY LINE: TODAY-BASED
    const slotIndex = Math.floor(hour / 4); // 0–5
    const dailyProgressLine = getDailyProgressMessage(
        totalToday,
        dailyTarget,
        slotIndex,
        firstName
    );

    // STATUS + BAR: MONTHLY-BASED
    const statusLabel = getStatusLabel(monthlyPercent);

    return (
        <div className="w-full">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-[1px] shadow-md mb-3">
                {/* Changed flex-col to flex-row to put Circle on right */}
                <div className="flex flex-row items-center justify-between rounded-2xl bg-white/95 px-4 py-3">

                    {/* LEFT SIDE: Text Content */}
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0 pr-4">
                        {/* HEADER ROW */}
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50">
                                <FiZap className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <p className="text-[14px] font-bold uppercase tracking-wide text-indigo-500">
                                        Today&apos;s Motivation
                                    </p>
                                    <span className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">
                                        <FiTrendingUp className="w-3 h-3 mr-1" />
                                        {statusLabel}
                                    </span>
                                </div>
                                <p className="text-sm sm:text-[15px] font-semibold text-gray-900 leading-snug">
                                    {mainMotivation}
                                </p>
                            </div>
                        </div>

                        {/* STATS CHIPS */}
                        <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-gray-600">
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 font-bold">
                                <FiTarget className="w-3 h-3 text-indigo-500" />
                                <span>Monthly:</span>
                                <span className="text-indigo-700">
                                    {Math.round(monthlyPercent)}%
                                </span>
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 font-bold">
                                <span>Leads:</span>
                                <span className="text-gray-800">
                                    {qualifiedMonthly}/{target}
                                </span>
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 font-bold">
                                <span>Working days left:</span>
                                <span className="text-gray-800">{workingDaysLeft}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 font-bold">
                                <span>Today&apos;s leads:</span>
                                <span className="text-gray-800">{todayLeads}</span>
                            </span>
                        </div>

                        {/* PROGRESS + INCENTIVE CHIPS */}
                        {(dailyProgressLine || incentiveLine) && (
                            <div className="mt-1.5 flex flex-wrap gap-2 text-[11px]">
                                {dailyProgressLine && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-800 text-[13px]">
                                        <FiTrendingUp className="w-3 h-3" />
                                        <span className="font-medium">{dailyProgressLine}</span>
                                    </span>
                                )}
                                {incentiveLine && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-0.5 text-yellow-900 text-[13px]">
                                        <FiAward className="w-3 h-3" />
                                        <span className="font-medium">{incentiveLine}</span>
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* RIGHT SIDE: Circular Progress */}
                    <div className="shrink-0 border-l border-gray-100 pl-3 ml-2">
                        <CircularProgress percent={monthlyPercent} />
                    </div>

                </div>
            </div>
        </div>
    );
};

export default MotivationBanner;