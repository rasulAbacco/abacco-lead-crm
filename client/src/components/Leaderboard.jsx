// src/components/Leaderboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Trophy,
    Users,
    Briefcase,
    Layers,
    ChevronDown,
    Clock,
    Medal,
    Award,
    Filter,
    Loader2,
    TrendingUp,
    Star,
    Calendar,
    Target,
    Zap
} from "lucide-react";

// --- SUB-COMPONENTS ---

// 1. RankRow: Displays employee ranking row with improved styling
const RankRow = ({ rank, employee, isCompact = false }) => {
    const getRankStyling = () => {
        switch (rank) {
            case 1:
                return {
                    container: "bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg",
                    icon: <Trophy className="w-5 h-5" />,
                    rowClass: "bg-gradient-to-r from-yellow-50/30 to-amber-50/20 border-l-4 border-yellow-400"
                };
            case 2:
                return {
                    container: "bg-gradient-to-r from-gray-300 to-gray-400 text-white shadow-lg",
                    icon: <Medal className="w-5 h-5" />,
                    rowClass: "bg-gradient-to-r from-gray-50/30 to-gray-50/20 border-l-4 border-gray-300"
                };
            case 3:
                return {
                    container: "bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg",
                    icon: <Award className="w-5 h-5" />,
                    rowClass: "bg-gradient-to-r from-orange-50/30 to-orange-50/20 border-l-4 border-orange-400"
                };
            default:
                return {
                    container: "bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 border border-indigo-200",
                    icon: <span className="font-bold text-sm">{rank}</span>,
                    rowClass: "hover:bg-indigo-50/30 border-l-4 border-transparent hover:border-indigo-200"
                };
        }
    };

    const { container, icon, rowClass } = getRankStyling();

    return (
        <li className={`flex items-center p-4 rounded-xl mb-3 transition-all duration-300 ${rowClass} transform hover:scale-[1.02] hover:shadow-md`}>
            {/* Column 1: Ranking */}
            <div className="w-16 flex justify-center">
                <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${container} transition-all duration-300`}>
                    {icon}
                </div>
            </div>

            {/* Column 2: Employee Name */}
            <div className="flex-1 min-w-[150px]">
                <div className="font-bold text-gray-900 text-base leading-tight">{employee.name}</div>
                <div className="text-xs text-gray-500 font-medium">ID: {employee.employeeId.trim()}</div>
            </div>

            {/* Column 3-6: Incentive Counts */}
            {!isCompact && (
                <>
                    <div className="w-20 text-center mx-3">
                        <div className="bg-blue-50 text-blue-700 rounded-lg py-2 px-1 font-bold text-sm">
                            {employee.c500}
                        </div>
                        <div className="text-xs text-gray-400 font-medium mt-1">₹500</div>
                    </div>

                    <div className="w-20 text-center mx-3">
                        <div className="bg-purple-50 text-purple-700 rounded-lg py-2 px-1 font-bold text-sm">
                            {employee.c1000}
                        </div>
                        <div className="text-xs text-gray-400 font-medium mt-1">₹1000</div>
                    </div>

                    <div className="w-20 text-center mx-3">
                        <div className="bg-green-50 text-green-700 rounded-lg py-2 px-1 font-bold text-sm">
                            {employee.c1500}
                        </div>
                        <div className="text-xs text-gray-400 font-medium mt-1">₹1500</div>
                    </div>

                    {/* NEW COLUMN: ₹5000 Double Target */}
                    <div className="w-20 text-center mx-3">
                        <div className="bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-800 rounded-lg py-2 px-1 font-bold text-sm border border-amber-300 shadow-sm">
                            {employee.c5000}
                        </div>
                        <div className="text-xs text-gray-400 font-medium mt-1">₹5000</div>
                    </div>
                </>
            )}

            {/* Column 7: Total Amount */}
            {/* CHANGE: Added ml-6 for more gap in compact view */}
            <div className={`${isCompact ? 'w-28 ml-6' : 'w-32'} text-center`}>
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg py-2 px-2 font-bold text-base shadow-sm">
                    ₹{employee.totalAmount.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400 font-medium mt-1">Total</div>
            </div>

            {/* Column 8: Total Leads */}
            <div className={`${isCompact ? 'w-20' : 'w-24'} text-center`}>
                <div className="bg-gray-100 text-gray-700 rounded-lg py-2 px-2 font-bold text-sm flex items-center justify-center">
                    <Target className="w-4 h-4 mr-1" />
                    {employee.totalLeads}
                </div>
                <div className="text-xs text-gray-400 font-medium mt-1">Leads</div>
            </div>
        </li>
    );
};

// 2. SummaryPanel: Enhanced collapsible section for each incentive category
const SummaryPanel = ({
    title,
    icon,
    data,
    colorClass = "text-indigo-600",
    bgClass = "bg-indigo-50",
    borderClass = "border-indigo-100",
    accentColor = "indigo"
}) => {
    const [isOpen, setIsOpen] = useState(true);
    const hasAchievers = Object.values(data).some(tier => tier.length > 0);

    return (
        <div
            className={`border rounded-xl overflow-hidden shadow-md transition-all duration-300 mb-4 transform hover:shadow-lg
                ${isOpen ? `ring-2 ring-offset-1 ${borderClass.replace('border', 'ring')}` : 'border-gray-200'}`}
        >
            {/* HEADER */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex justify-between items-center p-4 transition-all duration-300
                    ${isOpen ? `bg-gradient-to-r from-white to-${accentColor}-50` : 'bg-gray-50 hover:bg-gray-100'}`}
            >
                <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-xl ${bgClass} shadow-sm`}>{icon}</div>
                    <div className="text-left">
                        <h5 className={`font-bold text-base ${colorClass}`}>{title}</h5>
                        <p className="text-xs text-gray-500 font-medium">
                            {hasAchievers ? `${Object.values(data).flat().length} achievers` : 'No achievers yet'}
                        </p>
                    </div>
                </div>
                <ChevronDown
                    className={`w-6 h-6 text-gray-400 transition-transform duration-300 
                        ${isOpen ? "rotate-180" : "rotate-0"}`}
                />
            </button>

            {/* CONTENT */}
            {isOpen && (
                <div className="px-4 pb-4 bg-gradient-to-b from-white to-gray-50 space-y-4">
                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent w-full" />

                    {/* TIER SECTIONS */}
                    {Object.entries(data).map(([tierKey, tierAchievers]) => {
                        const labelMap = {
                            L7: "7 Leads (₹500)",
                            L10: "10 Leads (₹1000)",
                            L12: "12 Leads (₹500)",
                            L15: "15 Leads (₹1500)",
                            L18: "18 Leads (₹1000)",
                        };

                        const tierLabel = labelMap[tierKey] || tierKey;

                        return (
                            <div key={tierKey} className="animate-fadeIn">
                                {/* Tier Name */}
                                <div className="flex items-center mb-3">
                                    <div
                                        className={`w-2 h-5 rounded-full mr-3 shadow-sm
                                            ${tierAchievers.length > 0 ? 'bg-gradient-to-b from-green-400 to-green-600' : 'bg-gray-300'}`}
                                    ></div>
                                    <p className="font-bold text-sm text-gray-700 uppercase tracking-wider">
                                        {tierLabel}
                                    </p>
                                    {tierAchievers.length > 0 && (
                                        <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                            {tierAchievers.length}
                                        </span>
                                    )}
                                </div>

                                {/* CONTENT */}
                                <div className="ml-5 pl-4 border-l-2 border-dashed border-gray-200">
                                    {tierAchievers.length === 0 ? (
                                        <div className="text-sm text-gray-400 italic py-2 px-3 bg-gray-50 rounded-lg">
                                            No employees qualified for this tier yet.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {tierAchievers.map((emp) => (
                                                <div
                                                    key={emp.employeeId}
                                                    className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
                                                >
                                                    {/* EMPLOYEE HEADER */}
                                                    <div className="flex justify-between items-center mb-2">
                                                        <div className="flex items-center">
                                                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mr-3">
                                                                <span className="text-xs font-bold text-indigo-700">
                                                                    {emp.name.charAt(0)}
                                                                </span>
                                                            </div>
                                                            <span className="text-gray-800 font-semibold">
                                                                {emp.name}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <Zap className="w-4 h-4 text-yellow-500 mr-1" />
                                                            <span className="text-green-700 font-bold text-base">
                                                                ₹{emp.total.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center">
                                                        <span className="text-xs text-gray-500 font-medium">
                                                            Achieved {emp.times} time{emp.times > 1 ? "s" : ""}
                                                        </span>
                                                    </div>

                                                    {/* DATE DETAILS */}
                                                    <div className="mt-3 space-y-2">
                                                        {emp.dates.map((d, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-100"
                                                            >
                                                                <span className="text-sm text-gray-600 flex items-center gap-2">
                                                                    <Calendar className="w-3 h-3 text-gray-400" />
                                                                    {d.date}
                                                                </span>

                                                                <span className="text-sm font-semibold text-gray-700 bg-white px-2 py-1 rounded-md">
                                                                    {d.count} leads
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// --- MAIN COMPONENT ---
export default function Leaderboard({ apiBase }) {
    const [period, setPeriod] = useState("month");
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [view, setView] = useState("leaderboard");
    const [loading, setLoading] = useState(true);
    const [isCompact, setIsCompact] = useState(false);

    // Safe month function to avoid invalid dates
    const getSafeMonthDate = () => {
        const safeMonth =
            selectedMonth && selectedMonth.length === 7
                ? selectedMonth
                : new Date().toISOString().slice(0, 7);

        return `${safeMonth}-01`;
    };

    // --- API Calls ---
    const fetchLeaderboard = () => {
        setLoading(true);
        axios
            .get(`${apiBase}/api/employees/leaderboard?period=${period}`)
            .then((res) => setData(res.data.results || []))
            .catch(() => setData([]))
            .finally(() => setLoading(false));
    };

    const fetchSummary = () => {
        setLoading(true);
        axios
            .get(`${apiBase}/api/employees/incentive-summary?month=${selectedMonth}`)
            .then((res) => setSummary(res.data))
            .catch(() => setSummary(null))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (view === "leaderboard") fetchLeaderboard();
        else fetchSummary();
    }, [period, view, selectedMonth]);

    // --- RENDER CONTENT ---
    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <div className="relative">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-200 animate-ping"></div>
                    </div>
                    <span className="text-sm font-medium mt-4">Syncing data...</span>
                </div>
            );
        }

        if (view === "leaderboard") {
            if (data.length === 0) {
                return (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <div className="p-4 bg-gray-100 rounded-full mb-4">
                            <Trophy className="w-16 h-16 opacity-20" />
                        </div>
                        <p className="text-base font-medium">No rankings available for this period.</p>
                        <p className="text-sm text-gray-500 mt-1">Try selecting a different timeframe</p>
                    </div>
                );
            }

            return (
                <div>
                    {/* Table Header */}
                    <div className={`flex items-center p-4 mb-4 text-xs font-bold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-t-xl`}>
                        <div className="w-16 text-center">Rank</div>
                        <div className="flex-1 min-w-[150px]">Employee</div>
                        {!isCompact && (
                            <>
                                <div className="w-20 text-center mx-3">₹500</div>
                                <div className="w-20 text-center mx-3">₹1000</div>
                                <div className="w-20 text-center mx-3">₹1500</div>
                                {/* NEW HEADER: ₹5000 Double Target */}
                                <div className="w-20 text-center mx-3">₹5000</div>
                            </>
                        )}
                        <div className={`${isCompact ? 'w-28' : 'w-32'} text-center`}>Total Amount</div>
                        <div className={`${isCompact ? 'w-20' : 'w-24'} text-center`}>Leads</div>
                    </div>

                    {/* Table Rows */}
                    <ol className="pr-1">
                        {data.map((r, idx) => (
                            <RankRow key={r.employeeId} rank={idx + 1} employee={r} isCompact={isCompact} />
                        ))}
                    </ol>
                </div>
            );
        }

        if (view === "summary") {
            if (!summary) {
                return (
                    <div className="flex flex-col items-center justify-center h-64 text-red-400">
                        <div className="p-4 bg-red-50 rounded-full mb-4">
                            <Filter className="w-16 h-16" />
                        </div>
                        <span className="text-base font-medium">Failed to load incentive data.</span>
                        <span className="text-sm text-gray-500 mt-1">Please try again later</span>
                    </div>
                );
            }

            return (
                <div className="pb-2">
                    {/* US Attendees */}
                    <SummaryPanel
                        title="US Attendees (1500+)"
                        icon={<Users className="w-5 h-5 text-blue-600" />}
                        data={summary.usAttendees}
                        colorClass="text-blue-700"
                        bgClass="bg-blue-100"
                        borderClass="border-blue-200"
                        accentColor="blue"
                    />

                    {/* Mixed Leads */}
                    <SummaryPanel
                        title="Mixed Leads (Other + US <1500)"
                        icon={<Layers className="w-5 h-5 text-purple-600" />}
                        data={summary.mixed}
                        colorClass="text-purple-700"
                        bgClass="bg-purple-100"
                        borderClass="border-purple-200"
                        accentColor="purple"
                    />

                    {/* US Association */}
                    <SummaryPanel
                        title="US Association Leads"
                        icon={<Briefcase className="w-5 h-5 text-orange-600" />}
                        data={summary.association}
                        colorClass="text-orange-700"
                        bgClass="bg-orange-100"
                        borderClass="border-orange-200"
                        accentColor="orange"
                    />

                    {/* Double Target */}
                    <div className="relative overflow-hidden rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md mt-6 transform hover:shadow-lg transition-all duration-300">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full filter blur-3xl opacity-20"></div>
                        <div className="relative p-5 flex items-center justify-between border-b border-green-100/50">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl shadow-sm">
                                    <Trophy className="w-6 h-6 text-green-700" />
                                </div>
                                <div>
                                    <h5 className="font-bold text-lg text-green-800">Monthly Double Target</h5>
                                    <p className="text-sm text-green-600 font-medium flex items-center mt-1">
                                        <Star className="w-4 h-4 mr-1" />
                                        Bonus: ₹5,000 (Calculated Monthly)
                                    </p>
                                </div>
                            </div>
                            <div className="hidden sm:block">
                                <div className="text-3xl font-bold text-green-700">
                                    {summary.monthlyDoubleTarget.length}
                                </div>
                                <div className="text-xs text-green-600 font-medium">Achievers</div>
                            </div>
                        </div>

                        <div className="p-5">
                            {summary.monthlyDoubleTarget.length === 0 ? (
                                <div className="text-center py-4">
                                    <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                                        <Target className="w-6 h-6 text-green-600" />
                                    </div>
                                    <p className="text-sm text-green-600/70 font-medium">No achievers for the selected month yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {summary.monthlyDoubleTarget.map((emp) => (
                                        <div
                                            key={emp.employeeId}
                                            className="flex justify-between items-center bg-white/80 p-3 rounded-lg border border-green-100 shadow-sm hover:shadow-md transition-all duration-200"
                                        >
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mr-3">
                                                    <span className="text-xs font-bold text-green-700">
                                                        {emp.name.charAt(0)}
                                                    </span>
                                                </div>
                                                <span className="text-sm font-medium text-gray-800">{emp.name}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                                                <span className="font-bold text-green-700">
                                                    ₹{emp.total.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="h-full bg-gradient-to-br from-gray-50 to-indigo-50 rounded-2xl border border-gray-200 shadow-xl flex flex-col overflow-hidden font-sans">
            {/* --- HEADER --- */}
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-white to-indigo-50/50 z-10">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-bold text-gray-800 text-xl flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${view === "leaderboard" ? "bg-indigo-100" : "bg-purple-100"}`}>
                                {view === "leaderboard"
                                    ? <Users className="w-6 h-6 text-indigo-600" />
                                    : <Briefcase className="w-6 h-6 text-purple-600" />}
                            </div>
                            {view === "leaderboard" ? "Leaderboard" : "Incentives"}
                        </h4>

                        {/* Toggle Tabs */}
                        <div className="flex bg-gray-100/80 p-1 rounded-xl shadow-sm">
                            <button
                                onClick={() => setView("leaderboard")}
                                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 
                                    ${view === "leaderboard"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"}`}
                            >
                                Rankings
                            </button>

                            <button
                                onClick={() => setView("summary")}
                                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 
                                    ${view === "summary"
                                        ? "bg-white text-purple-600 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"}`}
                            >
                                Summary
                            </button>
                        </div>
                    </div>

                    {/* FILTER BAR */}
                    <div className="bg-white/70 rounded-xl p-3 border border-gray-200 flex items-center justify-between shadow-sm">
                        {view === "leaderboard" ? (
                            <>
                                <div className="flex items-center text-sm text-gray-600 font-medium px-3">
                                    <Clock className="w-4 h-4 mr-2 text-indigo-500" />
                                    Timeframe:
                                </div>
                                <div className="flex items-center gap-3">
                                    <select
                                        value={period}
                                        onChange={(e) => setPeriod(e.target.value)}
                                        className="text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="today">Today</option>
                                        <option value="month">Current Month</option>
                                    </select>
                                    <button
                                        onClick={() => setIsCompact(!isCompact)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${isCompact
                                            ? "bg-indigo-100 text-indigo-700"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                    >
                                        {isCompact ? "Expanded" : "Compact"}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center text-sm text-gray-600 font-medium px-3">
                                    <Filter className="w-4 h-4 mr-2 text-purple-500" />
                                    Select Month:
                                </div>

                                <input
                                    type="month"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* SCROLL AREA */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {renderContent()}
            </div>
        </div>
    );
}