import React, { useState, useEffect } from "react";
import {
  Calendar,
  User,
  Mail,
  Target,
  CheckCircle,
  XCircle,
  Send,
  RefreshCw,
  AlertCircle,
  LogOut,
  FileText,
  Clock,
  Briefcase,
  Building,
  Activity,
  ChevronDown,
  ChevronUp,
  Layers,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import Loader from "../components/Loader";

const MyReport = () => {
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

  // Helper to count lead types for the selected month
  const getLeadTypeCount = (type) => {
    if (!currentMonthData) return 0;
    return currentMonthData.leads.filter((l) => l.leadType === type).length;
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased">
      <div className="mx-auto p-6 md:p-12">
        {/* TOP NAVIGATION / HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-8 mb-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
              <TrendingUp size={16} strokeWidth={3} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                Performance Dashboard
              </span>
            </div>
            <h1 className="text-3xl font-light text-slate-900">
              {employee?.fullName}{" "}
              <span className="text-slate-300 font-extralight">|</span>{" "}
              <span className="font-medium text-indigo-600">Report</span>
            </h1>
            <div className="flex gap-4 mt-3">
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
                <Mail size={12} /> {employee?.email}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
                <Calendar size={12} /> Joined{" "}
                {employee?.joiningDate
                  ? format(new Date(employee.joiningDate), "MMM yyyy")
                  : "N/A"}
              </span>
            </div>
          </div>

          <div className="mt-6 md:mt-0 flex items-center gap-4">
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none bg-white border border-slate-200 text-sm font-semibold rounded-lg pl-4 pr-10 py-2.5 outline-none hover:border-indigo-500 transition-all cursor-pointer shadow-sm"
              >
                {Object.keys(monthlyData || {}).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-3 top-3 text-slate-400 pointer-events-none"
                size={16}
              />
            </div>
          </div>
        </header>

        {/* LIFETIME TOTALS - Minimalist Grid */}
        <section className="mb-12">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 ml-1">
            LIFETIME METRICS
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-100 border border-slate-100 rounded-xl overflow-hidden shadow-sm">
            {[
              {
                label: "Aggregate Leads",
                val: stats?.totalLeads,
                color: "text-slate-900",
              },
              {
                label: "Qualified",
                val: stats?.totalQualified,
                color: "text-emerald-600",
              },
              {
                label: "Disqualified",
                val: stats?.totalDisqualified,
                color: "text-rose-500",
              },
              {
                label: "Forwarded",
                val: stats?.totalForwarded,
                color: "text-indigo-600",
              },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                  {stat.label}
                </p>
                <p className={`text-3xl font-light ${stat.color}`}>
                  {stat.val}
                </p>
              </div>
            ))}
          </div>
        </section>

        {currentMonthData ? (
          <div className="space-y-10">
            {/* PROGRESS SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">
                      Qualification Accuracy
                    </span>
                    <span className="text-sm font-bold text-emerald-600">
                      {stats?.qualificationRate}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-1000"
                      style={{ width: `${stats?.qualificationRate}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">
                      Lead Forwarding Rate
                    </span>
                    <span className="text-sm font-bold text-indigo-600">
                      {stats?.forwardingRate}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-1000"
                      style={{ width: `${stats?.forwardingRate}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* LEAD TYPES Architecture */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                  <Layers size={16} className="text-indigo-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    Categorized Lead Mix
                  </h4>
                </div>
                <div className="space-y-3">
                  {[
                    {
                      label: "Association Type",
                      val: getLeadTypeCount("Association Lead"),
                      icon: <Building size={14} />,
                    },
                    {
                      label: "Attendees Type",
                      val: getLeadTypeCount("Attendees Lead"),
                      icon: <User size={14} />,
                    },
                    {
                      label: "Industry Type",
                      val: getLeadTypeCount("Industry Lead"),
                      icon: <Briefcase size={14} />,
                    },
                  ].map((type, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-white px-4 py-2.5 rounded-lg border border-slate-200/50 shadow-sm"
                    >
                      <div className="flex items-center gap-3 text-slate-600">
                        {type.icon}
                        <span className="text-xs font-medium">
                          {type.label}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-slate-800">
                        {type.val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* FULL DATA BREAKDOWN (Restored All Sections) */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div
                className="bg-slate-50 px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
              >
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-indigo-600" />
                  <span className="text-sm font-bold uppercase tracking-widest text-slate-700">
                    Detailed Data Breakdown — {selectedMonth}
                  </span>
                </div>
                {isDetailsExpanded ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </div>

              {isDetailsExpanded && (
                <div className="p-6 md:p-8 bg-white grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 border-t border-slate-200">
                  {/* Column 1 */}
                  <div className="space-y-4">
                    <div className="group">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        Monthly Leads
                      </p>
                      <p className="text-2xl font-semibold text-slate-900">
                        {currentMonthData.totalLeads}
                      </p>
                    </div>
                    <div className="group">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        Qualified
                      </p>
                      <p className="text-2xl font-semibold text-emerald-600">
                        {currentMonthData.qualified}
                      </p>
                    </div>
                  </div>
                  {/* Column 2 */}
                  <div className="space-y-4">
                    <div className="group">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        Disqualified
                      </p>
                      <p className="text-2xl font-semibold text-rose-500">
                        {currentMonthData.disqualified}
                      </p>
                    </div>
                    <div className="group">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        Forwarded
                      </p>
                      <p className="text-2xl font-semibold text-indigo-600">
                        {currentMonthData.forwarded}
                      </p>
                    </div>
                  </div>
                  {/* Column 3 (Restored) */}
                  <div className="space-y-4">
                    <div className="group">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        Leave Out
                      </p>
                      <p className="text-2xl font-semibold text-slate-400">0</p>
                    </div>
                    <div className="group">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        No Response
                      </p>
                      <p className="text-2xl font-semibold text-amber-500">0</p>
                    </div>
                  </div>
                  {/* Column 4 (Restored) */}
                  <div className="space-y-4">
                    <div className="group">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        Deal
                      </p>
                      <p className="text-2xl font-semibold text-teal-600">0</p>
                    </div>
                    <div className="group">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        Invoice Pending
                      </p>
                      <p className="text-2xl font-semibold text-indigo-400">
                        0
                      </p>
                    </div>
                  </div>
                  {/* Column 5 (Restored) */}
                  <div className="space-y-4">
                    <div className="group">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        Invoice Canceled
                      </p>
                      <p className="text-2xl font-semibold text-pink-500">0</p>
                    </div>
                    <div className="group">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        Account Status
                      </p>
                      <p className="text-lg font-bold text-emerald-500 mt-1">
                        ACTIVE
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-24 border-2 border-dashed border-slate-100 rounded-3xl">
            <Calendar
              size={48}
              strokeWidth={1}
              className="mx-auto text-slate-200 mb-4"
            />
            <p className="text-slate-400 font-medium">
              No analytical data available for this period.
            </p>
          </div>
        )}

        {/* FOOTER */}
        <footer className="mt-20 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-[0.2em]">
            Generated for internal use only • {new Date().getFullYear()}
          </p>
          <div className="flex gap-6">
            <button
              onClick={fetchReportData}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <RefreshCw size={12} strokeWidth={3} /> Refresh Report
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = "/login";
              }}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-rose-500 hover:text-rose-700 transition-colors"
            >
              <LogOut size={12} strokeWidth={3} /> Sign Out
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MyReport;
