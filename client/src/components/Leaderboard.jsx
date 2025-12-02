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
    Loader2
} from "lucide-react";

// --- SUB-COMPONENTS ---

// 1. RankRow: Displays employee ranking row
const RankRow = ({ rank, employee }) => {
    let rankContainerStyle = "bg-gray-50 text-gray-600 border border-gray-100";
    let rankIcon = <span className="font-bold text-sm">{rank}</span>;
    let rowClass = "hover:bg-gray-50 border-gray-100";

    if (rank === 1) {
        rankContainerStyle = "bg-gradient-to-br from-yellow-100 to-yellow-300 text-yellow-800 border-yellow-200 shadow-sm";
        rankIcon = <Trophy className="w-4 h-4" />;
        rowClass = "bg-yellow-50/30 border-yellow-100";
    } else if (rank === 2) {
        rankContainerStyle = "bg-gradient-to-br from-gray-100 to-gray-300 text-gray-700 border-gray-300 shadow-sm";
        rankIcon = <Medal className="w-4 h-4" />;
        rowClass = "bg-gray-50/30 border-gray-200";
    } else if (rank === 3) {
        rankContainerStyle = "bg-gradient-to-br from-orange-100 to-orange-300 text-orange-800 border-orange-200 shadow-sm";
        rankIcon = <Award className="w-4 h-4" />;
        rowClass = "bg-orange-50/30 border-orange-100";
    }

    return (
        <li className={`flex justify-between items-center p-3 rounded-xl border mb-2 transition-all duration-200 ${rowClass}`}>
            <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${rankContainerStyle}`}>
                    {rankIcon}
                </div>
                <div>
                    <div className="font-semibold text-gray-900 leading-tight">{employee.fullName}</div>
                    <div className="text-xs text-gray-400 font-medium">ID: {employee.employeeId}</div>
                </div>
            </div>
            <div className="text-right">
                <div className="font-bold text-lg text-indigo-600 leading-none">{employee.qualifiedCount}</div>
                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Leads</div>
            </div>
        </li>
    );
};

// 2. SummaryPanel: Collapsible section for each incentive category
// 2. SummaryPanel: Accordion for Incentive Categories (Updated with date details)
const SummaryPanel = ({ title, icon, data, colorClass = "text-indigo-600", bgClass = "bg-indigo-50", borderClass = "border-indigo-100" }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div
            className={`border rounded-xl overflow-hidden shadow-sm transition-all duration-300 mb-3 
                ${isOpen ? 'ring-1 ring-offset-1 ' + borderClass.replace('border', 'ring') : 'border-gray-100'}`}
        >
            {/* HEADER */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex justify-between items-center p-4 transition-colors 
                    ${isOpen ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}`}
            >
                <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${bgClass}`}>{icon}</div>
                    <h5 className={`font-bold text-sm ${colorClass}`}>{title}</h5>
                </div>
                <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 
                        ${isOpen ? "rotate-180" : "rotate-0"}`}
                />
            </button>

            {/* CONTENT */}
            {isOpen && (
                <div className="px-4 pb-4 bg-white space-y-4">
                    {/* Divider */}
                    <div className="h-px bg-gray-100 w-full mb-3" />

                    {/* TIER SECTIONS */}
                    {Object.entries(data).map(([tierKey, tierAchievers]) => {
                        const labelMap = {
                            L7: "7 Leads (₹500)",
                            L10: "10 Leads (₹1000 / ₹500)",
                            L12: "12 Leads (₹500)",
                            L15: "15 Leads (₹1500 / ₹1000)",
                            L18: "18 Leads (₹1000)",
                        };

                        const tierLabel = labelMap[tierKey] || tierKey;

                        return (
                            <div key={tierKey} className="animate-fadeIn group">
                                {/* Tier Name */}
                                <div className="flex items-center mb-2">
                                    <div
                                        className={`w-1 h-4 rounded-full mr-2 
                                            ${tierAchievers.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}
                                    ></div>
                                    <p className="font-semibold text-xs text-gray-600 uppercase tracking-wider">
                                        {tierLabel}
                                    </p>
                                </div>

                                {/* CONTENT */}
                                <div className="ml-3 pl-3 border-l border-gray-100">
                                    {tierAchievers.length === 0 ? (
                                        <div className="text-[11px] text-gray-400 italic py-1">
                                            No employees qualified for this tier yet.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {tierAchievers.map((emp) => (
                                                <div
                                                    key={emp.employeeId}
                                                    className="bg-green-50/50 border border-green-100/70 rounded-lg p-3 shadow-sm"
                                                >
                                                    {/* EMPLOYEE HEADER */}
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-700 text-sm font-semibold">
                                                            {emp.name}
                                                        </span>
                                                        <span className="text-green-700 text-sm font-bold">
                                                            ₹{emp.total.toLocaleString()}
                                                        </span>
                                                    </div>

                                                    <div className="mt-1">
                                                        <span className="text-[11px] text-green-700/80 font-medium">
                                                            Achieved {emp.times} time{emp.times > 1 ? "s" : ""}
                                                        </span>
                                                    </div>

                                                    {/* DATE DETAILS */}
                                                    <div className="mt-2 space-y-1">
                                                        {emp.dates.map((d, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="flex justify-between items-center bg-white/80 px-2 py-1 rounded-md border border-gray-100"
                                                            >
                                                                <span className="text-[12px] text-gray-600 flex items-center gap-2">
                                                                    📅 {d.date}
                                                                </span>

                                                                <span className="text-[12px] font-semibold text-gray-700">
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
    const [period, setPeriod] = useState("month");  // default remains same
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [view, setView] = useState("summary"); // default keeps your UI same
    const [loading, setLoading] = useState(true);

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
                    <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-500" />
                    <span className="text-sm font-medium">Syncing data...</span>
                </div>
            );
        }

        if (view === "leaderboard") {
            if (data.length === 0) {
                return (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <Trophy className="w-12 h-12 mb-2 opacity-20" />
                        <p className="text-sm">No rankings available for this period.</p>
                    </div>
                );
            }
            return (
                <ol className="pr-1">
                    {data.map((r, idx) => (
                        <RankRow key={r.employeeId} rank={idx + 1} employee={r} />
                    ))}
                </ol>
            );
        }

        if (view === "summary") {
            if (!summary) {
                return (
                    <div className="flex flex-col items-center justify-center h-64 text-red-400">
                        <span className="text-sm">Failed to load incentive data.</span>
                    </div>
                );
            }

            return (
                <div className="pb-2">
                    {/* US Attendees */}
                    <SummaryPanel
                        title="US Attendees (1500+)"
                        icon={<Users className="w-4 h-4 text-blue-600" />}
                        data={summary.usAttendees}
                        colorClass="text-blue-700"
                        bgClass="bg-blue-100"
                        borderClass="border-blue-200"
                    />

                    {/* Mixed Leads */}
                    <SummaryPanel
                        title="Mixed Leads (Other + US <1500)"
                        icon={<Layers className="w-4 h-4 text-purple-600" />}
                        data={summary.mixed}
                        colorClass="text-purple-700"
                        bgClass="bg-purple-100"
                        borderClass="border-purple-200"
                    />

                    {/* US Association */}
                    <SummaryPanel
                        title="US Association Leads"
                        icon={<Briefcase className="w-4 h-4 text-orange-600" />}
                        data={summary.association}
                        colorClass="text-orange-700"
                        bgClass="bg-orange-100"
                        borderClass="border-orange-200"
                    />

                    {/* Double Target */}
                    <div className="relative overflow-hidden rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm mt-4">
                        <div className="p-4 flex items-center space-x-3 border-b border-green-100/50">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Trophy className="w-4 h-4 text-green-700" />
                            </div>
                            <div>
                                <h5 className="font-bold text-sm text-green-800">Monthly Double Target</h5>
                                <p className="text-[10px] text-green-600 font-medium">Bonus: ₹5,000 (Calculated Monthly)</p>
                            </div>
                        </div>

                        <div className="p-4">
                            {summary.monthlyDoubleTarget.length === 0 ? (
                                <div className="text-center py-2">
                                    <p className="text-xs text-green-600/70">No achievers for the selected month yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {summary.monthlyDoubleTarget.map((emp) => (
                                        <div
                                            key={emp.employeeId}
                                            className="flex justify-between items-center bg-white/60 p-2 rounded-lg border border-green-100 shadow-sm"
                                        >
                                            <span className="text-sm font-medium text-gray-800">{emp.name}</span>
                                            <span className="font-bold text-green-700">
                                                ₹{emp.total.toLocaleString()}
                                            </span>
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
        <div className="h-full bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 flex flex-col overflow-hidden font-sans">

            {/* --- HEADER --- */}
            <div className="px-5 py-4 border-b border-gray-100 bg-white z-10">
                <div className="flex flex-col gap-4">

                    <div className="flex items-center justify-between">
                        <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                            {view === "leaderboard"
                                ? <Users className="w-5 h-5 text-indigo-500" />
                                : <Briefcase className="w-5 h-5 text-indigo-500" />}
                            {view === "leaderboard" ? "Leaderboard" : "Incentives"}
                        </h4>

                        {/* Toggle Tabs */}
                        <div className="flex bg-gray-100/80 p-1 rounded-xl">
                            <button
                                onClick={() => setView("leaderboard")}
                                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 
                                    ${view === "leaderboard"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"}`}
                            >
                                Rankings
                            </button>

                            <button
                                onClick={() => setView("summary")}
                                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 
                                    ${view === "summary"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"}`}
                            >
                                Summary
                            </button>
                        </div>
                    </div>

                    {/* FILTER BAR */}
                    <div className="bg-gray-50/50 rounded-xl p-2 border border-gray-100 flex items-center justify-between">
                        {view === "leaderboard" ? (
                            <>
                                <div className="flex items-center text-xs text-gray-500 font-medium px-2">
                                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                                    Timeframe:
                                </div>
                                <select
                                    value={period}
                                    onChange={(e) => setPeriod(e.target.value)}
                                    className="text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-1.5"
                                >
                                    <option value="today">Today</option>
                                    <option value="month">Current Month</option>
                                </select>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center text-xs text-gray-500 font-medium px-2">
                                    <Filter className="w-3.5 h-3.5 mr-1.5" />
                                    Select Month:
                                </div>

                                <input
                                    type="month"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-1.5"
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* SCROLL AREA */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                {renderContent()}
            </div>
        </div>
    );
}
