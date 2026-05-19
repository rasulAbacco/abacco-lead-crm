//src/components/employeeTeam/EmployeeMyPerformance.jsx
import React, { useState, useEffect } from "react";
import {
  Calendar,
  User,
  Mail,
  Target,
  Building,
  Briefcase,
  Layers,
  TrendingUp,
  FileText,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  LogOut,
} from "lucide-react";
import { format } from "date-fns";
import Loader from "../Loader";

const EmployeeMyPerformance = () => {
  const [reportData, setReportData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const employeeId = localStorage.getItem("employeeId");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (employeeId && token) {
      fetchReportData();
    } else {
      setError("Session expired. Please log in again.");
      setLoading(false);
    }
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/reports/employee/${employeeId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.status === 403) {
        setAuthError(true);
        return;
      }
      const data = await response.json();
      setReportData(data);
      const monthsWithData = Object.keys(data.monthlyData);
      if (monthsWithData.length > 0) setSelectedMonth(monthsWithData[0]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  const { employee, stats, monthlyData } = reportData || {};
  const currentMonthData = selectedMonth ? monthlyData[selectedMonth] : null;

  const getLeadTypeCount = (type) => {
    if (!currentMonthData) return 0;
    return currentMonthData.leads.filter((l) => l.leadType === type).length;
  };

  return (
    <div className="w-full text-[#1D1D1F]">
      {/* ====================================================== */}
      {/* SECTION WORKSPACE CONTROL HEADER                      */}
      {/* ====================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-[#E8E8ED] gap-4">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-[#86868B] uppercase block">
            Personal Analytics
          </span>
          <div className="flex flex-wrap items-baseline gap-x-2 mt-0.5">
            <h2 className="text-sm font-semibold text-[#1D1D1F]">
              {employee?.fullName} Performance
            </h2>
            <span className="text-xs text-[#86868B] font-medium hidden sm:inline">
              | Profile Audit
            </span>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[11px] font-medium text-[#6E6E73]">
            <span className="inline-flex items-center gap-1">
              <Mail size={12} className="text-[#86868B]" /> {employee?.email}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar size={12} className="text-[#86868B]" /> Tenure:{" "}
              {employee?.joiningDate
                ? format(new Date(employee.joiningDate), "MMM yyyy")
                : "N/A"}
            </span>
          </div>
        </div>

        {/* TIME STAMP SELECTOR CONTROL */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="appearance-none bg-[#F5F5F7] border border-[#E8E8ED] text-xs font-semibold rounded-lg pl-3 pr-8 py-1.5 outline-none transition-colors cursor-pointer text-[#1D1D1F] focus:border-[#1D1D1F]"
            >
              {Object.keys(monthlyData || {}).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-2.5 top-2 text-[#86868B] pointer-events-none"
              size={13}
            />
          </div>
        </div>
      </div>

      {/* ====================================================== */}
      {/* METRIC SUB-GRID LAYOUT                                 */}
      {/* ====================================================== */}
      <div className="mt-5">
        <span className="text-[10px] font-bold tracking-widest text-[#86868B] uppercase block mb-2.5 pl-0.5">
          Lifetime Aggregate Metrics
        </span>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Aggregate Leads",
              val: stats?.totalLeads,
              style: "text-[#1D1D1F]",
            },
            {
              label: "Qualified",
              val: stats?.totalQualified,
              style: "text-[#008060]",
            },
            {
              label: "Disqualified",
              val: stats?.totalDisqualified,
              style: "text-[#D02E2E]",
            },
            {
              label: "Forwarded",
              val: stats?.totalForwarded,
              style: "text-[#0071E3]",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-[#FBFBFD] border border-[#E8E8ED] rounded-lg p-4 transition-colors"
            >
              <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wide block">
                {stat.label}
              </span>
              <p
                className={`text-xl font-semibold tracking-tight mt-1 ${stat.style}`}
              >
                {stat.val}
              </p>
            </div>
          ))}
        </div>
      </div>

      {currentMonthData ? (
        <div className="mt-6 space-y-6">
          {/* ACCURACY CONTEXT STATS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* PROGRESS REGISTRY BAR TRACKERS */}
            <div className="md:col-span-6 space-y-4 pt-1">
              <div>
                <div className="flex justify-between items-center mb-1.5 text-xs font-medium">
                  <span className="text-[#6E6E73]">Qualification Accuracy</span>
                  <span className="font-semibold text-[#008060]">
                    {stats?.qualificationRate}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-[#F5F5F7] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#008060] rounded-full transition-all duration-700"
                    style={{ width: `${stats?.qualificationRate}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5 text-xs font-medium">
                  <span className="text-[#6E6E73]">Lead Forwarding Rate</span>
                  <span className="font-semibold text-[#0071E3]">
                    {stats?.forwardingRate}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-[#F5F5F7] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0071E3] rounded-full transition-all duration-700"
                    style={{ width: `${stats?.forwardingRate}%` }}
                  />
                </div>
              </div>
            </div>

            {/* CATEGORIZED LEAD DISTRIBUTION HOUSING */}
            <div className="md:col-span-6 bg-[#FBFBFD] p-4 rounded-xl border border-[#E8E8ED]">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-3">
                <Layers size={12} />
                Categorized Lead Mix
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  {
                    label: "Association",
                    val: getLeadTypeCount("Association Lead"),
                    icon: <Building size={12} />,
                  },
                  {
                    label: "Attendees",
                    val: getLeadTypeCount("Attendees Lead"),
                    icon: <User size={12} />,
                  },
                  {
                    label: "Industry",
                    val: getLeadTypeCount("Industry", "Industry Lead"),
                    icon: <Briefcase size={12} />,
                  },
                ].map((type, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-[#E8E8ED] text-xs"
                  >
                    <div className="flex items-center gap-1.5 text-[#6E6E73] min-w-0">
                      <span className="text-[#86868B] shrink-0">
                        {type.icon}
                      </span>
                      <span className="truncate font-medium">{type.label}</span>
                    </div>
                    <span className="font-bold text-[#1D1D1F] pl-2">
                      {type.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* DETAIL EXPANDER WORKSPACE PANEL */}
          <div className="border border-[#E8E8ED] rounded-lg overflow-hidden bg-white">
            <div
              className="bg-[#FBFBFD] px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[#F5F5F7] transition-colors"
              onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-[#1D1D1F]">
                <FileText size={14} className="text-[#86868B]" />
                <span className="tracking-wide">
                  Detailed Data Breakdown — {selectedMonth}
                </span>
              </div>
              {isDetailsExpanded ? (
                <ChevronUp size={14} className="text-[#86868B]" />
              ) : (
                <ChevronDown size={14} className="text-[#86868B]" />
              )}
            </div>

            {isDetailsExpanded && (
              <div className="p-4 bg-white grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 border-t border-[#E8E8ED] text-xs">
                <div>
                  <span className="text-[10px] font-bold text-[#86868B] uppercase block">
                    Monthly Leads
                  </span>
                  <p className="text-base font-semibold text-[#1D1D1F] mt-0.5">
                    {currentMonthData.totalLeads}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#86868B] uppercase block">
                    Qualified
                  </span>
                  <p className="text-base font-semibold text-[#008060] mt-0.5">
                    {currentMonthData.qualified}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#86868B] uppercase block">
                    Disqualified
                  </span>
                  <p className="text-base font-semibold text-[#D02E2E] mt-0.5">
                    {currentMonthData.disqualified}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#86868B] uppercase block">
                    Forwarded
                  </span>
                  <p className="text-base font-semibold text-[#0071E3] mt-0.5">
                    {currentMonthData.forwarded}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#86868B] uppercase block">
                    Leave Out
                  </span>
                  <p className="text-base font-semibold text-[#6E6E73] mt-0.5">
                    0
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#86868B] uppercase block">
                    No Response
                  </span>
                  <p className="text-base font-semibold text-[#6E6E73] mt-0.5">
                    0
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#86868B] uppercase block">
                    Deal
                  </span>
                  <p className="text-base font-semibold text-[#6E6E73] mt-0.5">
                    0
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#86868B] uppercase block">
                    Invoice Pending
                  </span>
                  <p className="text-base font-semibold text-[#6E6E73] mt-0.5">
                    0
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#86868B] uppercase block">
                    Invoice Canceled
                  </span>
                  <p className="text-base font-semibold text-[#6E6E73] mt-0.5">
                    0
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#86868B] uppercase block">
                    Account Status
                  </span>
                  <span className="inline-block text-[10px] font-bold text-[#008060] bg-[#E6F4EA] px-2 py-0.5 rounded mt-1">
                    ACTIVE
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-[#E8E8ED] rounded-xl mt-6">
          <p className="text-xs text-[#86868B] font-medium">
            No analytical performance data available for this timeframe
            statement.
          </p>
        </div>
      )}

      {/* ====================================================== */}
      {/* SECTION TERMINAL INTERACTION FOOTER ROW                */}
      {/* ====================================================== */}
      <div className="mt-8 pt-4 border-t border-[#E8E8ED] flex flex-col sm:flex-row justify-between items-center gap-3">
        <p className="text-[10px] text-[#86868B] font-medium uppercase tracking-wider">
          Internal Registry Ledger • {new Date().getFullYear()}
        </p>
        <div className="flex gap-4">
          <button
            onClick={fetchReportData}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#0071E3] hover:text-[#004385] transition-colors"
          >
            <RefreshCw size={11} /> Sync Sheet
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#D02E2E] hover:text-[#A01E1E] transition-colors"
          >
            <LogOut size={11} /> End Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeMyPerformance;
