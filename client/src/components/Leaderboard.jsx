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

/* -------------------------
   RankRow — dynamic columns
   ------------------------- */
const RankRow = ({ rank, employee, columns = [], isCompact = false }) => {
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
    const counts = employee.countsByAmount || {};

    return (
        <li className={`flex items-center p-4 rounded-xl mb-3 transition-all duration-300 ${rowClass} transform hover:scale-[1.02] hover:shadow-md`}>
            <div className="w-16 flex justify-center">
                <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${container} transition-all duration-300`}>
                    {icon}
                </div>
            </div>

            <div className="flex-1 min-w-[150px]">
                <div className="font-bold text-gray-900 text-base leading-tight">{employee.name}</div>
                <div className="text-xs text-gray-500 font-medium">ID: {String(employee.employeeId || "").trim()}</div>
            </div>

            {/* dynamic amount columns */}
            {!isCompact && columns.map((amt) => (
                <div key={amt} className="w-20 text-center mx-3">
                    <div className="bg-gray-50 text-gray-800 rounded-lg py-2 px-1 font-bold text-sm">
                        {counts[String(amt)] || 0}
                    </div>
                    <div className="text-xs text-gray-400 font-medium mt-1">₹{Number(amt).toLocaleString()}</div>
                </div>
            ))}

            <div className={`${isCompact ? 'w-28 ml-6' : 'w-32'} text-center`}>
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg py-2 px-2 font-bold text-base shadow-sm">
                    ₹{(employee.totalAmount || 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-400 font-medium mt-1">Total</div>
            </div>

            <div className={`${isCompact ? 'w-20' : 'w-24'} text-center`}>
                <div className="bg-gray-100 text-gray-700 rounded-lg py-2 px-2 font-bold text-sm flex items-center justify-center">
                    <Target className="w-4 h-4 mr-1" />
                    {employee.totalLeads || 0}
                </div>
                <div className="text-xs text-gray-400 font-medium mt-1">Leads</div>
            </div>
        </li>
    );
};

/* -------------------------
   SummaryPanel — grouped by rule
   ------------------------- */
const SummaryPanel = ({ rule }) => {
    const [open, setOpen] = useState(true);
    const achievers = (rule && rule.achievers) || [];

    return (
        <div className="border rounded-xl overflow-hidden shadow-md mb-4">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex justify-between items-center p-4 bg-white"
            >
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gray-100 text-gray-700">
                        {rule.leadType === "Attendees" ? <Users className="w-5 h-5" /> : rule.leadType === "Association" ? <Briefcase className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
                    </div>
                    <div className="text-left">
                        <div className="font-bold text-sm">{rule.planTitle} — ₹{rule.amount}</div>
                        <div className="text-xs text-gray-500">{rule.leadType} • {rule.description || ''} • {rule.leadsRequired} leads</div>
                    </div>
                </div>
                <ChevronDown className={`w-6 h-6 transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div className="p-4 bg-gray-50 space-y-3">
                    {achievers.length === 0 ? (
                        <div className="text-sm text-gray-500 italic">No achievers for this rule.</div>
                    ) : achievers.map((a, i) => (
                        <div key={i} className="bg-white p-3 rounded-lg border">
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="font-semibold">{a.name} <span className="text-xs text-gray-400">({a.employeeId})</span></div>
                                    <div className="text-xs text-gray-500">{a.date} • {a.count} leads</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-green-700">₹{(a.total || 0).toLocaleString()}</div>
                                    <div className="text-xs text-gray-500">{a.times}x</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

/* -------------------------
   Main component
   ------------------------- */
export default function Leaderboard({ apiBase }) {
    // timeframe controls
    const [timeMode, setTimeMode] = useState("month"); // today | month | year | range
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [rangeFrom, setRangeFrom] = useState("");
    const [rangeTo, setRangeTo] = useState("");

    // filters
    const [sortBy, setSortBy] = useState("amount_desc");
    const [leadType, setLeadType] = useState("All");
    const [limit, setLimit] = useState(50);

    // view & data
    const [view, setView] = useState("leaderboard"); // leaderboard | summary
    const [columns, setColumns] = useState([]); // amounts (numbers)
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState(null);

    // ui state
    const [loading, setLoading] = useState(true);
    const [isCompact, setIsCompact] = useState(false);
    const [error, setError] = useState(null);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    /* Build URL for leaderboard endpoint with query params */
    const buildLeaderboardUrl = () => {
        const qs = new URLSearchParams();
        qs.set("sort", sortBy);
        qs.set("leadType", leadType);
        qs.set("limit", String(limit));

        if (timeMode === "today") {
            qs.set("period", "today");
        } else if (timeMode === "month") {
            qs.set("period", "month");
            if (selectedMonth) qs.set("month", selectedMonth);
        } else if (timeMode === "year") {
            qs.set("period", "year");
            if (selectedYear) qs.set("year", String(selectedYear));
        } else if (timeMode === "range") {
            if (rangeFrom) qs.set("from", rangeFrom);
            if (rangeTo) qs.set("to", rangeTo);
        } else {
            qs.set("period", "month");
            if (selectedMonth) qs.set("month", selectedMonth);
        }

        return `${apiBase}/api/employee/leaderboard?${qs.toString()}`;
    };

    /* Fetch leaderboard */
    const fetchLeaderboard = async () => {
        setLoading(true);
        setError(null);
        try {
            const url = buildLeaderboardUrl();
            const res = await axios.get(url, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            const respColumns = Array.isArray(res.data.columns) ? res.data.columns.map(Number).filter(n => !isNaN(n)) : [];
            // Option A: Always include 5000 column (monthly double-target) as fixed column.
            // Place 5000 as the first column (left-most) to match admin design.
            const colSet = new Set(respColumns);
            colSet.add(5000); // ensure present

            // We want ordered columns: 5000 first, then remaining columns descending numeric order (high → low)
            const remaining = Array.from(colSet).filter(c => c !== 5000).sort((a, b) => b - a);
            const finalColumns = [5000, ...remaining];

            setColumns(finalColumns);

            // results: expect res.data.results array
            setData(res.data.results || []);
        } catch (err) {
            console.error("Failed to fetch leaderboard:", err);
            setError("Failed to fetch leaderboard");
            setColumns([]);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    /* Fetch summary */
    const fetchSummary = async () => {
        setLoading(true);
        setError(null);
        try {
            const month = selectedMonth;
            const url = `${apiBase}/api/employee/incentive-summary?month=${encodeURIComponent(month)}`;
            const res = await axios.get(url, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            // Expect backend to return structured summary:
            // { rules: [{ ruleId, planTitle, leadType, description, leadsRequired, amount, achievers: [...] }], monthlyDoubleTarget: [...] }
            setSummary(res.data || null);
        } catch (err) {
            console.error("Failed to fetch summary:", err);
            setError("Failed to fetch summary");
            setSummary(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // initial fetch for leaderboard
        if (view === "leaderboard") fetchLeaderboard();
        else fetchSummary();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view]);

    /* Called when Apply clicked */
    const handleApply = () => {
        if (view === "leaderboard") fetchLeaderboard();
        else fetchSummary();
    };

    const renderTimeControls = () => {
        if (timeMode === "month") {
            return <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="px-3 py-2 border rounded-lg" />;
        }
        if (timeMode === "year") {
            return <input type="number" min="2000" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="px-3 py-2 border rounded-lg w-32" />;
        }
        if (timeMode === "range") {
            return (
                <div className="flex items-center gap-2">
                    <input type="date" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} className="px-3 py-2 border rounded-lg" />
                    <span className="text-sm text-gray-400">to</span>
                    <input type="date" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} className="px-3 py-2 border rounded-lg" />
                </div>
            );
        }
        return null;
    };

    /* Main content renderer */
    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <div className="relative">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
                    </div>
                    <span className="text-sm font-medium mt-4">Syncing data...</span>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-64 text-red-400">
                    <div className="p-4 bg-red-50 rounded-full mb-4">
                        <Filter className="w-16 h-16" />
                    </div>
                    <span className="text-base font-medium">{error}</span>
                </div>
            );
        }

        if (view === "leaderboard") {
            if (!data || data.length === 0) {
                return (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <div className="p-4 bg-gray-100 rounded-full mb-4">
                            <Trophy className="w-16 h-16 opacity-20" />
                        </div>
                        <p className="text-base font-medium">No rankings available for this period.</p>
                    </div>
                );
            }

            return (
                <div>
                    <div className="flex items-center p-4 mb-4 text-xs font-bold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-t-xl">
                        <div className="w-16 text-center">Rank</div>
                        <div className="flex-1 min-w-[150px]">Employee</div>
                        {!isCompact && columns.map((amt) => (
                            <div key={amt} className="w-20 text-center mx-3">₹{Number(amt).toLocaleString()}</div>
                        ))}
                        <div className={`${isCompact ? 'w-28' : 'w-32'} text-center`}>Total Amount</div>
                        <div className={`${isCompact ? 'w-20' : 'w-24'} text-center`}>Leads</div>
                    </div>

                    <ol className="pr-1">
                        {data.map((r, idx) => (
                            <RankRow key={r.employeeId || `${idx}`} rank={idx + 1} employee={r} columns={columns} isCompact={isCompact} />
                        ))}
                    </ol>
                </div>
            );
        }

        // Summary view
        if (!summary) {
            return (
                <div className="flex flex-col items-center justify-center h-64 text-red-400">
                    <div className="p-4 bg-red-50 rounded-full mb-4">
                        <Filter className="w-16 h-16" />
                    </div>
                    <span className="text-base font-medium">Failed to load incentive data.</span>
                </div>
            );
        }

        return (
            <div className="pb-2">
                {/* Expecting summary.rules: array ordered by admin preference */}
                {summary.rules && summary.rules.length > 0 ? (
                    summary.rules.map((r) => <SummaryPanel key={r.ruleId || `${r.planId}-${r.leadType}-${r.leadsRequired}`} rule={r} />)
                ) : (
                    <div className="text-sm text-gray-500 italic mb-4">No rule summary available for selected month.</div>
                )}

                <div className="mt-6">
                    <h4 className="font-bold mb-3">Monthly Double Target Achievers</h4>
                    {summary.monthlyDoubleTarget && summary.monthlyDoubleTarget.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {summary.monthlyDoubleTarget.map((m) => (
                                <div key={m.employeeId} className="bg-white p-3 rounded-lg border">
                                    <div className="flex justify-between">
                                        <div>
                                            <div className="font-semibold">{m.name}</div>
                                            <div className="text-xs text-gray-500">{m.monthlyLeads} leads</div>
                                        </div>
                                        <div className="font-bold text-green-700">₹{(m.total || 0).toLocaleString()}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500 italic">No double-target achievers for selected month.</div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="h-full bg-gradient-to-br from-gray-50 to-indigo-50 rounded-2xl border border-gray-200 shadow-xl flex flex-col overflow-hidden font-sans">
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-white to-indigo-50/50 z-10">
                <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-800 text-xl flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${view === "leaderboard" ? "bg-indigo-100" : "bg-purple-100"}`}>
                            {view === "leaderboard" ? <Users className="w-6 h-6 text-indigo-600" /> : <Briefcase className="w-6 h-6 text-purple-600" />}
                        </div>
                        {view === "leaderboard" ? "Leaderboard" : "Incentives"}
                    </h4>

                    <div className="flex bg-gray-100/80 p-1 rounded-xl shadow-sm">
                        <button onClick={() => setView("leaderboard")} className={`px-5 py-2 rounded-lg text-sm font-semibold ${view === "leaderboard" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500"}`}>Rankings</button>
                        <button onClick={() => setView("summary")} className={`px-5 py-2 rounded-lg text-sm font-semibold ${view === "summary" ? "bg-white text-purple-600 shadow-sm" : "text-gray-500"}`}>Summary</button>
                    </div>
                </div>

                <div className="mt-4 bg-white/70 rounded-xl p-3 border border-gray-200 flex flex-wrap items-center justify-between gap-3">
                    {view === "leaderboard" ? (
                        <>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center text-sm text-gray-600 font-medium px-3">
                                    <Clock className="w-4 h-4 mr-2 text-indigo-500" />
                                    Timeframe:
                                </div>

                                <select value={timeMode} onChange={(e) => setTimeMode(e.target.value)} className="px-3 py-2 border rounded-lg">
                                    <option value="today">Today</option>
                                    <option value="month">This Month</option>
                                    <option value="year">Year</option>
                                    <option value="range">Custom Range</option>
                                </select>

                                {renderTimeControls()}

                                <select value={leadType} onChange={(e) => setLeadType(e.target.value)} className="px-3 py-2 border rounded-lg">
                                    <option value="All">All Leads</option>
                                    <option value="Attendees">Attendees</option>
                                    <option value="Association">Association</option>
                                    <option value="Industry">Industry</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-3">
                                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 border rounded-lg">
                                    <option value="amount_desc">Amount High → Low</option>
                                    <option value="amount_asc">Amount Low → High</option>
                                    <option value="leads_desc">Leads High → Low</option>
                                    <option value="name_asc">Name A → Z</option>
                                </select>

                                <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="px-3 py-2 border rounded-lg">
                                    <option value={10}>Top 10</option>
                                    <option value={25}>Top 25</option>
                                    <option value={50}>Top 50</option>
                                    <option value={100}>Top 100</option>
                                </select>

                                <button onClick={handleApply} className="bg-indigo-600 text-white px-4 py-2 rounded-lg">Apply</button>
                                <button onClick={() => setIsCompact(!isCompact)} className="px-3 py-2 border rounded-lg">{isCompact ? "Expanded" : "Compact"}</button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center text-sm text-gray-600 font-medium px-3">
                                <Filter className="w-4 h-4 mr-2 text-purple-500" />
                                Select Month:
                            </div>

                            <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="px-3 py-2 border rounded-lg" />
                            <button onClick={() => fetchSummary()} className="bg-purple-600 text-white px-4 py-2 rounded-lg">Load Summary</button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {renderContent()}
            </div>
        </div>
    );
}
