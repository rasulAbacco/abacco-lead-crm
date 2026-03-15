// src/components/TodayProgress.jsx
import React from "react";
import * as Icons from "lucide-react";

/**
 * Allocate incentives for tiers.
 */
function allocateTiersForCount(count = 0, tiers = []) {
    const result = { total: 0, breakdown: {} };
    if (!Array.isArray(tiers) || tiers.length === 0 || count <= 0) return result;

    const active = tiers
        .filter((t) => t && t.isActive !== false && t.leadsRequired > 0 && t.amount > 0)
        .sort((a, b) => b.leadsRequired - a.leadsRequired || b.amount - a.amount);

    let remaining = count;

    for (const t of active) {
        const times = Math.floor(remaining / t.leadsRequired);
        if (times <= 0) continue;

        result.total += times * t.amount;
        result.breakdown[t.amount] = (result.breakdown[t.amount] || 0) + times;

        remaining -= times * t.leadsRequired;
        if (remaining <= 0) break;
    }

    return result;
}

/**
 * TierList component
 */
function TierList({ tiers = [], count = 0 }) {
    const active = tiers.filter((t) => t.isActive !== false);

    if (active.length === 0) {
        return <div className="mt-3 text-xs text-gray-400">No active plan</div>;
    }

    const asc = active.sort((a, b) => a.leadsRequired - b.leadsRequired);
    const allocation = allocateTiersForCount(count, active);
    const achievedAmounts = new Set(Object.keys(allocation.breakdown));

    return (
        <div className="mt-3 space-y-1">
            {asc.map((t, idx) => {
                const achieved = achievedAmounts.has(String(t.amount));
                return (
                    <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                            <div
                                className={`w-6 h-6 rounded-md flex items-center justify-center ${achieved ? "bg-green-50" : "bg-gray-100"
                                    }`}
                            >
                                <span
                                    className={`text-xs font-semibold ${achieved ? "text-green-700" : "text-gray-600"
                                        }`}
                                >
                                    {t.leadsRequired}
                                </span>
                            </div>
                            <div className="text-xs text-gray-600">{t.leadsRequired} qualified</div>
                        </div>

                        <div
                            className={`text-xs font-semibold ${achieved ? "text-green-700" : "text-gray-700"
                                }`}
                        >
                            ₹{t.amount}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/**
 * ProgressItemCard — dynamic based on DB values
 */
const ProgressItemCard = ({
    title,
    count = 0,
    target = 0,
    accentColor = "from-indigo-400 to-indigo-600",
    iconName = null,
    bgAccent = "bg-gray-100",
    tiers = [],
}) => {
    const pct = target ? Math.min(100, Math.round((count / target) * 100)) : 0;
    const gradientClass = `bg-gradient-to-r ${accentColor}`;
    const remaining = Math.max(0, target - count);

    const allocation = allocateTiersForCount(count, tiers);
    const awardedTotal = allocation.total || 0;

    const IconComponent = iconName && Icons[iconName] ? Icons[iconName] : Icons["Layers"];

    return (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl ${bgAccent}`}>
                    <IconComponent className="w-4 h-4 text-gray-700" />
                </div>

                <div className="text-right">
                    <div className="text-lg font-extrabold text-gray-900">{count}</div>
                    <div className="text-xs text-gray-500">/{target} Target</div>
                </div>
            </div>

            <div className="text-xs font-semibold text-gray-700">{title}</div>

            <div className="h-2 bg-gray-100 rounded-full mt-3 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${gradientClass}`}
                    style={{ width: `${pct}%` }}
                />
            </div>

            <div className="flex justify-between items-center mt-2">
                <div className="text-xs text-gray-500">
                    {pct >= 100 ? (
                        <span className="text-green-600 font-medium">Target Hit</span>
                    ) : (
                        <span>{remaining} remaining</span>
                    )}
                </div>

                <div className={`text-xs font-bold ${pct >= 100 ? "text-green-600" : "text-indigo-600"}`}>
                    {pct}% • <span className="text-sm">₹{awardedTotal}</span>
                </div>
            </div>

            <TierList tiers={tiers} count={count} />
        </div>
    );
};

/**
 * TodayProgress main component (Fully Dynamic)
 */
export default function TodayProgress({ breakdown = {}, useDefaults = false }) {
    const { totalToday = 0, plans = {} } = breakdown;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Today's Summary Card */}
            <div className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-green-100 rounded-xl text-green-700">
                        <Icons.TrendingUp className="w-5 h-5" />
                    </div>
                </div>

                <div>
                    <div className="text-xs font-semibold text-gray-500">Today's Qualified Leads</div>
                    <div className="text-4xl font-extrabold text-gray-900 mt-1">{totalToday}</div>
                </div>
            </div>

            {/* Dynamic cards for each DB plan */}
            {Object.entries(plans).map(([id, p]) => (
                <ProgressItemCard
                    key={id}
                    title={p.title}
                    count={p.count}
                    target={p.target}
                    tiers={p.tiers}
                    iconName={p.icon}
                    accentColor={p.accentColor || "from-indigo-400 to-indigo-600"}
                    bgAccent={p.bgAccent || "bg-gray-100"}
                />
            ))}
        </div>
    );
}
