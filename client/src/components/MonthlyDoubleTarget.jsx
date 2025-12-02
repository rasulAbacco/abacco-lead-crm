// src/components/MonthlyDoubleTarget.jsx
import React from "react";
import { Target, Trophy, TrendingUp, AlertCircle, Crown } from "lucide-react";

export default function MonthlyDoubleTarget({
    target = 0,
    qualifiedMonthly = 0,
    doubleAchieved = false,
}) {
    const doubleGoal = target * 2;
    // Calculate percentage relative to the DOUBLE goal
    // (e.g. if target is 10, double is 20. If we have 10 leads, that is 50% of the double goal)
    const pct = doubleGoal
        ? Math.min(100, Math.round((qualifiedMonthly / doubleGoal) * 100))
        : 0;

    // Visual marker for the base target (always at 50% of the double goal)
    const baseTargetPct = 50;
    const remaining = Math.max(0, doubleGoal - qualifiedMonthly);

    return (
        <div className="h-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between relative">
            {/* Background Decorative Gradient */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            {/* Header */}
            <div className="p-6 pb-2 relative z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center space-x-2 mb-1">
                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                <Target className="w-5 h-5" />
                            </div>
                            <h4 className="font-bold text-lg text-gray-900">
                                Monthly Double Target
                            </h4>
                        </div>
                        <p className="text-sm text-gray-500 ml-1">
                            Hit 200% of your target to unlock the bonus.
                        </p>
                    </div>
                    {doubleAchieved && (
                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center shadow-sm">
                            <Crown className="w-3 h-3 mr-1" />
                            BONUS UNLOCKED
                        </div>
                    )}
                </div>
            </div>

            {/* Main Stats */}
            <div className="px-6 py-4 flex items-end space-x-3 relative z-10">
                <span className="text-5xl font-extrabold text-gray-900 tracking-tight">
                    {qualifiedMonthly}
                </span>
                <div className="pb-2 text-gray-500 font-medium text-sm">
                    / {doubleGoal} Qualified Leads
                </div>
            </div>

            {/* Progress Area */}
            <div className="px-6 pb-6 relative z-10">
                {/* Labels above bar */}
                <div className="flex justify-between text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                    <span>Start</span>
                    <span className="text-indigo-600">Base Target ({target})</span>
                    <span className="text-purple-600">Double Goal ({doubleGoal})</span>
                </div>

                {/* The Bar */}
                <div className="h-4 bg-gray-100 rounded-full relative w-full">
                    {/* Base Target Marker Line (at 50%) */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white z-20 border-l border-r border-gray-300/50 h-full" />

                    {/* Fill */}
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${doubleAchieved
                                ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                                : "bg-gradient-to-r from-blue-500 to-purple-600"
                            }`}
                        style={{ width: `${pct}%` }}
                    >
                        {/* Shimmer Effect on Bar */}
                        <div className="absolute top-0 left-0 bottom-0 right-0 bg-white/20 w-full animate-pulse" />
                    </div>

                    {/* Marker Dot at 50% */}
                    <div
                        className={`absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white shadow-sm z-30 transition-colors ${qualifiedMonthly >= target ? "bg-indigo-600" : "bg-gray-300"}`}
                    />
                </div>

                {/* Dynamic Footer Message */}
                <div className="mt-5 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    {doubleAchieved ? (
                        <div className="flex items-start space-x-3">
                            <div className="p-1.5 bg-green-100 rounded-full text-green-600 mt-0.5">
                                <Trophy className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-800">
                                    Congratulations! ₹5,000 Bonus Achieved
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    You have surpassed the 200% milestone. Great work!
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start space-x-3">
                            <div className="p-1.5 bg-blue-100 rounded-full text-blue-600 mt-0.5">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-800">
                                    {remaining} leads away from Double Target
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Keep pushing! You are currently at {pct}% of the double goal.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}