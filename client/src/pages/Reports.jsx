import React, { useState, useEffect, useRef } from "react";
import {
  Download,
  RefreshCw,
  Calendar,
  ChevronDown,
  ChevronUp,
  Users,
  TrendingUp,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  DollarSign,
  Activity,
  Filter,
  Search,
  Briefcase,
  Building,
} from "lucide-react";
import Loader from "../components/Loader";

const Reports = () => {
  const [reportData, setReportData] = useState({});
  const [selectedMonth, setSelectedMonth] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("totalLeads"); // Default sort by leads
  const [sortDirection, setSortDirection] = useState("desc"); // Default desc
  const dropdownRef = useRef(null);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Fetch data
  useEffect(() => {
    fetchReportData();
  }, [selectedYear]);

  useEffect(() => {
    setSelectedMonth("");
  }, [selectedYear]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE_URL}/api/reports/admin/monthly?year=${selectedYear}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch report data");

      const data = await res.json();
      setReportData(data);

      const currentMonth = new Date().toLocaleString("default", {
        month: "long",
      });
      setSelectedMonth(
        data[currentMonth] && data[currentMonth].length > 0
          ? currentMonth
          : Object.keys(data).find((m) => data[m].length > 0) || ""
      );
    } catch (err) {
      setError("Unable to load report data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Dropdown close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = () => {
    if (!selectedMonth || !reportData[selectedMonth]?.length) {
      alert("No data available to export for the selected month");
      return;
    }

    const data = reportData[selectedMonth];
    const headers = [
      "Employee Name",
      "Email",
      "Association Leads", // Added
      "Industry Leads", // Added
      "Target", // Added
      "Total Leads",
      "Qualified",
      "Disqualified",
      "Leave Out",
      "No Response",
      "Deal",
      "Invoice Pending",
      "Invoice Canceled",
      "Active",
      "Attendees Type",
    ];

    const csvContent = [
      headers.join(","),
      ...data.map((r) =>
        [
          r.name,
          r.email,
          r.associationLeads || 0, // Added
          r.industryLeads || 0, // Added
          r.attendeesLeads || 0, // Added
          r.target || 0, // Added
          r.totalLeads,
          r.qualified,
          r.disqualified,
          r.leaveOut,
          r.noResponse,
          r.deal,
          r.invoicePending,
          r.invoiceCanceled,
          r.active,
          r.attendees,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedMonth}_Full_Report.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const getStats = () => {
    if (!selectedMonth || !reportData[selectedMonth]) return {};
    const data = reportData[selectedMonth];
    return {
      employees: data.length,
      totalLeads: data.reduce((s, e) => s + e.totalLeads, 0),
      qualified: data.reduce((s, e) => s + e.qualified, 0),
      disqualified: data.reduce((s, e) => s + e.disqualified, 0),
      deals: data.reduce((s, e) => s + e.deal, 0),
      active: data.reduce((s, e) => s + e.active, 0),
    };
  };

  const stats = getStats();

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc"); // Default to high-to-low for numbers
    }
  };

  const getFilteredAndSortedData = () => {
    if (!selectedMonth || !reportData[selectedMonth]) return [];

    let data = [...reportData[selectedMonth]];

    if (searchTerm) {
      data = data.filter(
        (emp) =>
          emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    data.sort((a, b) => {
      let valueA = a[sortField];
      let valueB = b[sortField];

      if (typeof valueA === "string") {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }

      if (sortDirection === "asc") {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

    return data;
  };

  const filteredData = getFilteredAndSortedData();

  // Helper Component for Table Headers
  const SortableHeader = ({ label, field, align = "left", onClick }) => (
    <th
      className={`px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-200`}
      onClick={() => onClick(field)}
    >
      <div
        className={`flex items-center gap-2 ${
          align === "center"
            ? "justify-center"
            : align === "right"
            ? "justify-end"
            : "justify-start"
        }`}
      >
        <span>{label}</span>
        <div className="flex flex-col">
          {sortField === field && sortDirection === "asc" ? (
            <ChevronUp size={12} className="text-indigo-600" />
          ) : (
            <ChevronUp size={12} className="text-gray-300" />
          )}
          {sortField === field && sortDirection === "desc" ? (
            <ChevronDown size={12} className="text-indigo-600" />
          ) : (
            <ChevronDown size={12} className="text-gray-300" />
          )}
        </div>
      </div>
    </th>
  );

  if (loading) return <Loader />;

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="font-bold text-xl text-gray-800 mb-2">
            Error Loading Reports
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchReportData}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 mx-auto transition-colors"
          >
            <RefreshCw size={18} />
            Retry
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation / Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Activity className="text-indigo-600" />
                Performance Reports
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Analytics for {selectedMonth} {selectedYear}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Year Selector */}
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="pl-3 pr-8 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-3 text-gray-500 pointer-events-none"
                />
              </div>

              {/* Month Selector */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center justify-between w-40 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  <span className="truncate">
                    {selectedMonth || "Select Month"}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-gray-500 transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full mt-1 right-0 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 max-h-80 overflow-y-auto">
                    {Object.keys(reportData).map((month) => {
                      const hasData = reportData[month]?.length > 0;
                      return (
                        <button
                          key={month}
                          disabled={!hasData}
                          onClick={() => {
                            if (hasData) {
                              setSelectedMonth(month);
                              setIsDropdownOpen(false);
                            }
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between
                                                ${
                                                  selectedMonth === month
                                                    ? "bg-indigo-50 text-indigo-700 font-medium"
                                                    : "text-gray-700"
                                                }
                                                ${
                                                  hasData
                                                    ? "hover:bg-gray-50 cursor-pointer"
                                                    : "opacity-50 cursor-not-allowed"
                                                }
                                            `}
                        >
                          {month}
                          {!hasData && (
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">
                              Empty
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Search */}
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-2.5 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search employee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none w-64"
                />
              </div>

              {/* Export */}
              <button
                onClick={handleExport}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <Download size={16} />
                Export Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Compact Summary Cards */}
        {selectedMonth && reportData[selectedMonth]?.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
            <StatCard
              icon={Users}
              label="Total Staff"
              value={stats.employees}
              color="blue"
            />
            <StatCard
              icon={TrendingUp}
              label="Total Leads"
              value={stats.totalLeads}
              color="indigo"
            />
            <StatCard
              icon={CheckCircle}
              label="Qualified"
              value={stats.qualified}
              color="emerald"
            />
            <StatCard
              icon={Activity}
              label="Active Leads"
              value={stats.active}
              color="amber"
            />
            <StatCard
              icon={DollarSign}
              label="Deals Closed"
              value={stats.deals}
              color="purple"
            />
            <StatCard
              icon={XCircle}
              label="Disqualified"
              value={stats.disqualified}
              color="red"
            />
          </div>
        )}

        {/* Main Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          {!selectedMonth || !reportData[selectedMonth]?.length ? (
            <div className="p-12 text-center">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                No Data Available
              </h3>
              <p className="text-gray-500 mt-1">
                Please select a different month or year to view reports.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    {/* Employee Name - Left Aligned */}
                    <SortableHeader
                      label="Employee"
                      field="name"
                      align="left"
                      onClick={handleSort}
                    />

                    {/* --- NEW HEADERS START --- */}

                    <SortableHeader
                      label="Target"
                      field="target"
                      align="center"
                      onClick={handleSort}
                    />
                    {/* --- NEW HEADERS END --- */}

                    {/* Metrics - All Center Aligned for perfect stacking */}
                    <SortableHeader
                      label="Total Leads"
                      field="totalLeads"
                      align="center"
                      onClick={handleSort}
                    />
                    <SortableHeader
                      label="Qualified"
                      field="qualified"
                      align="center"
                      onClick={handleSort}
                    />
                    <SortableHeader
                      label="Association Leads"
                      field="associationLeads"
                      align="center"
                      onClick={handleSort}
                    />

                    <SortableHeader
                      label="Industry Leads"
                      field="industryLeads"
                      align="center"
                      onClick={handleSort}
                    />
                    <SortableHeader
                      label="Attendees Leads"
                      field="attendeesLeads"
                      align="center"
                      onClick={handleSort}
                    />
                    <SortableHeader
                      label="Active"
                      field="active"
                      align="center"
                      onClick={handleSort}
                    />
                    <SortableHeader
                      label="Deals"
                      field="deal"
                      align="center"
                      onClick={handleSort}
                    />
                    <SortableHeader
                      label="Disqualified"
                      field="disqualified"
                      align="center"
                      onClick={handleSort}
                    />
                    <SortableHeader
                      label="No Resp"
                      field="noResponse"
                      align="center"
                      onClick={handleSort}
                    />
                    <SortableHeader
                      label="Leave"
                      field="leaveOut"
                      align="center"
                      onClick={handleSort}
                    />
                    <SortableHeader
                      label="Inv. Pending"
                      field="invoicePending"
                      align="center"
                      onClick={handleSort}
                    />
                    <SortableHeader
                      label="Inv. Cancel"
                      field="invoiceCanceled"
                      align="center"
                      onClick={handleSort}
                    />
                    <SortableHeader
                      label="Attendees"
                      field="attendees"
                      align="center"
                      onClick={handleSort}
                    />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredData.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-indigo-50/30 transition-colors group"
                    >
                      {/* Name Column - Left Aligned */}
                      <td className="px-4 py-3 max-w-[250px] text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold border border-indigo-200 shrink-0">
                            {row.name.charAt(0)}
                          </div>
                          <div className="truncate">
                            <div
                              className="text-sm font-semibold text-gray-900 truncate"
                              title={row.name}
                            >
                              {row.name}
                            </div>
                            <div
                              className="text-xs text-gray-500 truncate"
                              title={row.email}
                            >
                              {row.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* --- NEW CELLS START --- */}

                      {/* Association Leads */}

                      {/* Target with Progress Calculation */}
                      <td className="px-4 py-3 text-center align-middle">
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-emerald-600">
                            {row.totalLeads}/{row.target ?? "-"}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {row.target
                              ? `${Math.round(
                                  (row.totalLeads / row.target) * 100
                                )}%`
                              : "-"}
                          </span>
                        </div>
                      </td>
                      {/* --- NEW CELLS END --- */}

                      {/* Metrics - Center Aligned */}
                      <td className="px-4 py-3 text-center align-middle">
                        <span className="font-bold text-gray-700">
                          {row.totalLeads}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center align-middle">
                        <span
                          className={`font-semibold ${
                            row.qualified > 0
                              ? "text-emerald-600"
                              : "text-gray-300"
                          }`}
                        >
                          {row.qualified}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center align-middle font-semibold text-blue-600">
                        {row.associationLeads ?? 0}
                      </td>

                      {/* Industry Leads */}
                      <td className="px-4 py-3 text-center align-middle font-semibold text-indigo-600">
                        {row.industryLeads ?? 0}
                      </td>
                      <td className="px-4 py-3 text-center align-middle font-semibold text-indigo-600">
                        {row.attendeeLeads ?? 0}
                      </td>
                      <td className="px-4 py-3 text-center align-middle">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                            row.active > 0
                              ? "bg-amber-100 text-amber-800"
                              : "text-gray-300"
                          }`}
                        >
                          {row.active}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center align-middle">
                        <span
                          className={`font-bold ${
                            row.deal > 0 ? "text-purple-600" : "text-gray-300"
                          }`}
                        >
                          {row.deal}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center align-middle text-gray-500">
                        {row.disqualified || (
                          <span className="text-gray-200">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center align-middle text-gray-500 text-sm">
                        {row.noResponse || (
                          <span className="text-gray-200">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center align-middle text-gray-400 text-sm">
                        {row.leaveOut || (
                          <span className="text-gray-200">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center align-middle text-sm">
                        {row.invoicePending > 0 ? (
                          <span className="text-orange-600 font-medium">
                            {row.invoicePending}
                          </span>
                        ) : (
                          <span className="text-gray-200">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center align-middle text-sm">
                        {row.invoiceCanceled > 0 ? (
                          <span className="text-red-500 font-medium">
                            {row.invoiceCanceled}
                          </span>
                        ) : (
                          <span className="text-gray-200">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center align-middle text-sm text-gray-600">
                        {row.attendees || (
                          <span className="text-gray-200">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper Component for the top summary stats
const StatCard = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-200",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    red: "bg-red-50 text-red-600 border-red-200",
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
        <Icon size={20} />
      </div>
    </div>
  );
};

export default Reports;
