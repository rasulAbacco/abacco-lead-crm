import React, { useEffect, useState } from "react";
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
  Target,
  Calendar,
  TrendingUp,
  Sparkles,
  Crown,
  Star,
} from "lucide-react";

/* -------------------------
   RankRow — modern design with proper column structure
   ------------------------- */
const RankRow = ({ rank, employee, columns = [], isCompact = false }) => {
  const getRankStyling = () => {
    switch (rank) {
      case 1:
        return {
          badge:
            "bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 shadow-lg shadow-yellow-500/30",
          icon: <Crown className="w-5 h-5 text-white" />,
          card: "bg-white border-2 border-yellow-400 shadow-lg shadow-yellow-100",
          accent: "bg-gradient-to-r from-yellow-50 to-amber-50",
        };
      case 2:
        return {
          badge:
            "bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 shadow-lg shadow-slate-400/30",
          icon: <Medal className="w-5 h-5 text-white" />,
          card: "bg-white border-2 border-slate-300 shadow-lg shadow-slate-100",
          accent: "bg-gradient-to-r from-slate-50 to-gray-50",
        };
      case 3:
        return {
          badge:
            "bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 shadow-lg shadow-orange-500/30",
          icon: <Award className="w-5 h-5 text-white" />,
          card: "bg-white border-2 border-orange-400 shadow-lg shadow-orange-100",
          accent: "bg-gradient-to-r from-orange-50 to-red-50",
        };
      default:
        return {
          badge: "bg-gradient-to-br from-indigo-100 to-indigo-200 shadow-sm",
          icon: <span className="font-bold text-indigo-700">{rank}</span>,
          card: "bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300",
          accent: "bg-gray-50",
        };
    }
  };

  const { badge, icon, card, accent } = getRankStyling();
  const counts = employee.countsByAmount || {};

  return (
    <div
      className={`${card} rounded-xl mb-2 overflow-hidden transition-all duration-200 transform hover:scale-[1.005]`}
    >
      <div className={`${accent} px-4 py-2 flex items-center gap-3`}>
        <div
          className={`${badge} w-10 h-10 flex items-center justify-center rounded-lg transition-transform hover:scale-110 flex-shrink-0`}
        >
          {icon}
        </div>

        <div
          className="flex-1 min-w-0 flex-shrink-0"
          style={{ minWidth: "180px" }}
        >
          <h3 className="font-bold text-gray-900 text-sm truncate">
            {employee.name}
          </h3>
          <p className="text-xs text-gray-500">
            ID: {String(employee.employeeId || "").trim()}
          </p>
        </div>

        {!isCompact && columns.length > 0 && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {columns.map((amt) => (
              <div
                key={amt}
                className="bg-white rounded-lg px-3 py-1 text-center border border-gray-200 min-w-[60px] flex-shrink-0"
              >
                <div className="text-sm font-bold text-gray-900">
                  {counts[String(amt)] || 0}
                </div>
                <div className="text-xs text-gray-400">
                  ₹{Number(amt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total Amount Column */}
        <div
          className="text-center flex-shrink-0"
          style={{ minWidth: "120px" }}
        >
          <div className="flex items-center gap-1.5 justify-center">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              ₹{(employee.totalAmount || 0).toLocaleString()}
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-1">Total</div>
        </div>

        {/* Leads Column - Now a separate column */}
        <div className="text-center flex-shrink-0" style={{ minWidth: "80px" }}>
          <div className="flex items-center gap-1 justify-center">
            <Target className="w-4 h-4 text-gray-600" />
            <span className="text-lg font-bold text-gray-700">
              {employee.totalLeads || 0}
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-1">Leads</div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------
   SummaryPanel — modern card design
   ------------------------- */
const SummaryPanel = ({ rule }) => {
  const [open, setOpen] = useState(true);
  const achievers = (rule && rule.achievers) || [];

  const getLeadTypeIcon = () => {
    switch (rule.leadType) {
      case "Attendees":
        return <Users className="w-5 h-5" />;
      case "Association":
        return <Briefcase className="w-5 h-5" />;
      default:
        return <Layers className="w-5 h-5" />;
    }
  };

  const getLeadTypeColor = () => {
    switch (rule.leadType) {
      case "Attendees":
        return "from-blue-500 to-cyan-600";
      case "Association":
        return "from-purple-500 to-pink-600";
      default:
        return "from-green-500 to-emerald-600";
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center p-5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-xl bg-gradient-to-br ${getLeadTypeColor()} text-white shadow-lg`}
          >
            {getLeadTypeIcon()}
          </div>
          <div className="text-left">
            <div className="font-bold text-lg text-gray-900">
              {rule.planTitle}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-gray-600">{rule.leadType}</span>
              <span className="text-gray-300">•</span>
              <span className="text-sm font-semibold text-indigo-600">
                ₹{Number(rule.amount).toLocaleString()}
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-sm text-gray-600">
                {rule.leadsRequired} leads required
              </span>
            </div>
            {rule.description && (
              <div className="text-xs text-gray-500 mt-1">
                {rule.description}
              </div>
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-6 h-6 text-gray-400 transform transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="px-5 pb-5 bg-gradient-to-b from-gray-50 to-white">
          {achievers.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Trophy className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No achievers for this rule yet</p>
            </div>
          ) : (
            <div className="space-y-2 pt-3">
              {achievers.map((a, i) => (
                <div
                  key={i}
                  className="bg-white p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm truncate">
                          {a.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {a.employeeId}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{a.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          <span>{a.count} leads</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        ₹{(a.total || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {a.times}x achieved
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* -------------------------
   Main component
   ------------------------- */
export default function Leaderboard({ apiBase = "http://localhost:5000" }) {
  // timeframe controls
  const [timeMode, setTimeMode] = useState("month");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");

  // filters
  const [sortBy, setSortBy] = useState("amount_desc");
  const [leadType, setLeadType] = useState("All");
  const [limit, setLimit] = useState(50);

  // view & data
  const [view, setView] = useState("leaderboard");
  const [columns, setColumns] = useState([]);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);

  // ui state
  const [loading, setLoading] = useState(true);
  const [isCompact, setIsCompact] = useState(false);
  const [error, setError] = useState(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

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

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = buildLeaderboardUrl();
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(url, { headers });
      const json = await res.json();

      const respColumns = Array.isArray(json.columns)
        ? json.columns.map(Number).filter((n) => !isNaN(n))
        : [];
      const colSet = new Set(respColumns);
      colSet.add(5000);

      const remaining = Array.from(colSet)
        .filter((c) => c !== 5000)
        .sort((a, b) => b - a);
      const finalColumns = [5000, ...remaining];

      setColumns(finalColumns);

      const resultsWithIncentives = (json.results || []).filter(
        (emp) => (emp.totalAmount || 0) > 0
      );
      setData(resultsWithIncentives);
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
      setError("Failed to fetch leaderboard");
      setColumns([]);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const month = selectedMonth;
      const url = `${apiBase}/api/employee/incentive-summary?month=${encodeURIComponent(
        month
      )}`;
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(url, { headers });
      const json = await res.json();

      setSummary(json || null);
    } catch (err) {
      console.error("Failed to fetch summary:", err);
      setError("Failed to fetch summary");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view === "leaderboard") fetchLeaderboard();
    else fetchSummary();
  }, [view]);

  const handleApply = () => {
    if (view === "leaderboard") fetchLeaderboard();
    else fetchSummary();
  };

  const renderTimeControls = () => {
    if (timeMode === "month") {
      return (
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        />
      );
    }
    if (timeMode === "year") {
      return (
        <input
          type="number"
          min="2000"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-xl w-32 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        />
      );
    }
    if (timeMode === "range") {
      return (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={rangeFrom}
            onChange={(e) => setRangeFrom(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
          <span className="text-sm text-gray-400 font-medium">to</span>
          <input
            type="date"
            value={rangeTo}
            onChange={(e) => setRangeTo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
      );
    }
    return null;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="relative">
            <Loader2 className="w-16 h-16 animate-spin text-indigo-600" />
            <div className="absolute inset-0 w-16 h-16 rounded-full bg-indigo-100 animate-ping opacity-20"></div>
          </div>
          <span className="text-base font-semibold text-gray-700 mt-6">
            Loading data...
          </span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="p-6 bg-red-50 rounded-full mb-4">
            <Filter className="w-16 h-16 text-red-400" />
          </div>
          <span className="text-lg font-semibold text-red-600">{error}</span>
        </div>
      );
    }

    if (view === "leaderboard") {
      if (!data || data.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="p-6 bg-gray-100 rounded-full mb-4">
              <Trophy className="w-16 h-16 text-gray-300" />
            </div>
            <p className="text-lg font-semibold text-gray-500">
              No achievers for this period
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Only employees with incentives appear on the leaderboard
            </p>
          </div>
        );
      }

      return (
        <div>
          {/* Table header for columns */}
          {!isCompact && columns.length > 0 && (
            <div className="flex items-center px-4 py-2 mb-2 text-xs font-bold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-t-xl">
              <div className="w-10 text-center">Rank</div>
              <div className="flex-1 min-w-[180px]">Employee</div>
              {columns.map((amt) => (
                <div key={amt} className="w-16 text-center mr-1 min-w-[60px]">
                  ₹{Number(amt).toLocaleString()}
                </div>
              ))}
              <div className="w-32 text-center min-w-[120px]">Total</div>
              <div className="w-24 text-center min-w-[80px]">Leads</div>
            </div>
          )}

          {data.map((r, idx) => (
            <RankRow
              key={r.employeeId || `${idx}`}
              rank={idx + 1}
              employee={r}
              columns={columns}
              isCompact={isCompact}
            />
          ))}
        </div>
      );
    }

    // Summary view
    if (!summary) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="p-6 bg-red-50 rounded-full mb-4">
            <Filter className="w-16 h-16 text-red-400" />
          </div>
          <span className="text-lg font-semibold text-red-600">
            Failed to load incentive data
          </span>
        </div>
      );
    }

    return (
      <div className="pb-2">
        {summary.rules && summary.rules.length > 0 ? (
          summary.rules.map((r) => (
            <SummaryPanel
              key={r.ruleId || `${r.planId}-${r.leadType}-${r.leadsRequired}`}
              rule={r}
            />
          ))
        ) : (
          <div className="text-center py-12 text-gray-400">
            <Briefcase className="w-16 h-16 mx-auto mb-3 opacity-20" />
            <p className="text-base">No incentive rules for selected month</p>
          </div>
        )}

        <div className="mt-8 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-6 border-2 border-yellow-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-lg">
              <Star className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-xl text-gray-900">
              Monthly Double Target Achievers
            </h4>
          </div>

          {summary.monthlyDoubleTarget &&
          summary.monthlyDoubleTarget.length > 0 ? (
            <div className="space-y-2">
              {summary.monthlyDoubleTarget.map((m) => (
                <div
                  key={m.employeeId}
                  className="bg-white p-3 rounded-lg border-2 border-yellow-200 hover:border-yellow-400 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 text-sm truncate">
                          {m.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {m.employeeId}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Target className="w-4 h-4" />
                        <span className="font-semibold">
                          {m.monthlyLeads} leads
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        ₹{(m.total || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Trophy className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">
                No double-target achievers for this month
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full bg-white rounded-2xl border border-gray-200 shadow-xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-white via-indigo-50/30 to-purple-50/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-xl ${
                view === "leaderboard"
                  ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                  : "bg-gradient-to-br from-purple-500 to-pink-600"
              } text-white shadow-lg`}
            >
              {view === "leaderboard" ? (
                <TrendingUp className="w-7 h-7" />
              ) : (
                <Briefcase className="w-7 h-7" />
              )}
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-2xl">
                {view === "leaderboard" ? "Leaderboard" : "Incentive Summary"}
              </h4>
              <p className="text-sm text-gray-500">
                {view === "leaderboard"
                  ? "Top performers with incentives"
                  : "Detailed incentive breakdown"}
              </p>
            </div>
          </div>

          <div className="flex bg-white p-1.5 rounded-xl shadow-md border border-gray-200">
            <button
              onClick={() => setView("leaderboard")}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                view === "leaderboard"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Rankings
            </button>
            <button
              onClick={() => setView("summary")}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                view === "summary"
                  ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Summary
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          {view === "leaderboard" ? (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-700 font-semibold">
                <Clock className="w-5 h-5 text-indigo-600" />
                <span>Period:</span>
              </div>

              <select
                value={timeMode}
                onChange={(e) => setTimeMode(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                <option value="today">Today</option>
                <option value="month">This Month</option>
                <option value="year">Year</option>
                <option value="range">Custom Range</option>
              </select>

              {renderTimeControls()}

              <select
                value={leadType}
                onChange={(e) => setLeadType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                <option value="All">All Leads</option>
                <option value="Attendees">Attendees</option>
                <option value="Association">Association</option>
                <option value="Industry">Industry</option>
              </select>

              <div className="flex-1"></div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                <option value="amount_desc">Amount: High → Low</option>
                <option value="amount_asc">Amount: Low → High</option>
                <option value="leads_desc">Leads: High → Low</option>
                <option value="name_asc">Name: A → Z</option>
              </select>

              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                <option value={10}>Top 10</option>
                <option value={25}>Top 25</option>
                <option value={50}>Top 50</option>
                <option value={100}>Top 100</option>
              </select>

              <button
                onClick={handleApply}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105"
              >
                Apply
              </button>

              <button
                onClick={() => setIsCompact(!isCompact)}
                className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-medium"
              >
                {isCompact ? "Expand" : "Compact"}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-700 font-semibold">
                <Calendar className="w-5 h-5 text-purple-600" />
                <span>Select Month:</span>
              </div>

              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />

              <button
                onClick={() => fetchSummary()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105"
              >
                Load Summary
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {renderContent()}
      </div>
    </div>
  );
}
