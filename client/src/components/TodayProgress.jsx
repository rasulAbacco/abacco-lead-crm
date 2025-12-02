// src/components/TodayProgress.jsx
import React from "react";
import { DollarSign, Users, Layers, Briefcase, TrendingUp, CheckCircle } from "lucide-react";

// Helper component for the progress bars
const ProgressItemCard = ({ label, count, target, accentColor, icon: Icon, iconColor }) => {
    // If target is 0, set it to 1 to avoid division by zero in pct calculation, but display 0
    const calculatedTarget = target || 1;
    const pct = calculatedTarget ? Math.min(100, Math.round((count / calculatedTarget) * 100)) : 0;

    // Determine gradient based on accentColor prop
    const gradientClass = `bg-gradient-to-r ${accentColor}`;

    // Calculate remaining leads for display
    const remaining = Math.max(0, target - count);

    return (
        // Reduced vertical padding (p-4 instead of p-5)
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition-shadow duration-300">

            {/* Header and Count */}
            {/* Adjusted margin-bottom to mb-3 */}
            <div className="flex items-center justify-between mb-3">
                <div className={`p-1.5 rounded-full ${iconColor} bg-opacity-10`}>
                    <Icon className="w-4 h-4" />
                </div>
                <div className="text-right">
                    {/* Reduced font size for count: text-xl -> text-lg */}
                    <div className="text-lg font-extrabold text-gray-900">{count}</div>
                    <div className="text-xs text-gray-500">/{target} Target</div>
                </div>
            </div>

            {/* Label */}
            {/* Reduced font size for label: text-sm -> text-xs, using mt-0.5 for small top margin */}
            <div className="text-xs font-semibold text-gray-700 leading-snug mt-0.5">{label}</div>

            {/* Progress Bar - mt-3 instead of mt-4 */}
            <div className="h-2 bg-gray-100 rounded-full mt-3 overflow-hidden relative">
                <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${gradientClass}`}
                    style={{ width: `${pct}%` }}
                />
            </div>

            {/* Footer Metrics - mt-2 kept, adjusted text sizes */}
            <div className="flex justify-between items-center mt-2">
                <div className="text-xs text-gray-500">
                    {pct >= 100 ? (
                        <span className="text-green-600 font-medium flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" /> Target Hit
                        </span>
                    ) : (
                        <span>{remaining} remaining</span>
                    )}
                </div>
                {/* Reduced font size for percentage: text-sm -> text-xs */}
                <div className={`text-xs font-bold ${pct >= 100 ? 'text-green-600' : 'text-indigo-600'}`}>
                    {pct}%
                </div>
            </div>
        </div>
    );
};

export default function TodayProgress({ breakdown = {}, incentive = 0 }) {
    const { totalToday = 0, usAttendees = 0, mixedLeads = 0, usAssociation = 0 } = breakdown;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. PRIMARY METRIC CARD: Today's Qualified Leads & Incentive */}
            {/* Reduced vertical padding (p-5 instead of p-6) */}
            <div className="lg:col-span-1 bg-white p-5 rounded-2xl shadow-lg border border-gray-100 overflow-hidden relative group">
                {/* Background Accent */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-xl transition-all duration-500 group-hover:scale-110" />

                {/* Adjusted spacing around icon and text */}
                <div className="flex justify-between items-start mb-2 relative z-10">
                    <div className="p-2 bg-green-100 rounded-xl text-green-700"> {/* Reduced p-3 -> p-2 */}
                        <TrendingUp className="w-5 h-5" /> {/* Reduced w-6 h-6 -> w-5 h-5 */}
                    </div>
                </div>

                <div className="relative z-10">
                    <div className="text-xs font-semibold text-gray-500">Today's Qualified Leads</div> {/* Reduced text-sm -> text-xs */}
                    <div className="text-4xl font-extrabold text-gray-900 tracking-tight mt-0.5"> {/* Reduced text-5xl -> text-4xl, mt-1 -> mt-0.5 */}
                        {totalToday}
                    </div>
                </div>

                {/* Reduced padding in the border-t section (pt-2 instead of pt-3) */}
                <div className="mt-3 pt-2 border-t border-gray-100 relative z-10">
                    <div className="text-xs font-medium text-gray-600 flex items-center"> {/* Reduced text-sm -> text-xs */}
                        <DollarSign className="w-3 h-3 mr-1 text-green-600" /> {/* Reduced w-4 h-4 -> w-3 h-3 */}
                        Today's Incentive:
                        <strong className="text-base text-green-600 ml-1"> {/* Reduced text-lg -> text-base */}
                            ₹{incentive.toLocaleString()}
                        </strong>
                    </div>
                </div>
            </div>

            {/* 2. PROGRESS CARD: US Attendees */}
            <ProgressItemCard
                label="US Attendees (≥1500)"
                count={usAttendees}
                target={15}
                accentColor="from-blue-400 to-indigo-500"
                icon={Users}
                iconColor="text-blue-600"
            />

            {/* 3. PROGRESS CARD: Mixed Leads */}
            <ProgressItemCard
                label="Mixed Leads (Other / Small US)"
                count={mixedLeads}
                target={15}
                accentColor="from-purple-400 to-pink-500"
                icon={Layers}
                iconColor="text-purple-600"
            />

            {/* 4. PROGRESS CARD: US Association */}
            <ProgressItemCard
                label="US Association"
                count={usAssociation}
                target={18}
                accentColor="from-orange-400 to-red-500"
                icon={Briefcase}
                iconColor="text-orange-600"
            />
        </div>
    );
}