// src/components/reports/EmployeeTeamReport.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Users, TrendingUp, Target } from "lucide-react";

const EmployeeTeamReport = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState(null);
  const [reports, setReports] = useState([]);

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  // =========================================
  // FETCH TEAM
  // =========================================
  const fetchTeamData = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/employee-team/my-team`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await response.json();
      if (data.success) {
        setTeamData(data.team);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // =========================================
  // FETCH REPORTS
  // =========================================
  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/employee-team/reports?month=${selectedMonth}&year=${selectedYear}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await response.json();
      if (data.success) {
        setReports(data.reports || []);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [selectedMonth, selectedYear]);

  // =========================================
  // TOTALS
  // =========================================
  const totals = useMemo(() => {
    return reports.reduce(
      (acc, report) => {
        acc.deals += report.deal || 0;
        acc.invoicePending += report.invoicePending || 0;
        acc.invoiceCancel += report.invoiceCancel || 0;
        acc.activeClients += report.activeClients || 0;
        acc.leaveOutClients += report.leaveOutClients || 0;
        acc.noResponse += report.noResponse || 0;
        acc.totalLeads += report.totalLeads || 0;
        acc.dealValue += report.dealValue || 0;
        return acc;
      },
      {
        deals: 0,
        invoicePending: 0,
        invoiceCancel: 0,
        activeClients: 0,
        leaveOutClients: 0,
        noResponse: 0,
        totalLeads: 0,
        dealValue: 0,
      },
    );
  }, [reports]);

  const targetValue = teamData?.targetValue || 0;
  const achievementPercent =
    targetValue > 0
      ? ((totals.dealValue / targetValue) * 100).toFixed(1)
      : "0.0";

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div className="w-full text-[#1D1D1F]">
      {/* ========================================= */}
      {/* SECTION WORKSPACE CONTROL HEADER          */}
      {/* ========================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-[#E8E8ED] gap-4">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-[#86868B] uppercase block">
            Operational Matrix
          </span>
          <h2 className="text-sm font-semibold text-[#1D1D1F] mt-0.5">
            Team Ledger Performance
          </h2>
        </div>

        {/* TIME SELECTION ROW CONTROLS */}
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-[#F5F5F7] border border-[#E8E8ED] rounded-lg px-3 py-1.5 text-xs font-medium text-[#1D1D1F] outline-none transition-colors cursor-pointer focus:border-[#1D1D1F]"
          >
            {months.map((month, index) => (
              <option key={month} value={index + 1}>
                {month}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-[#F5F5F7] border border-[#E8E8ED] rounded-lg px-3 py-1.5 text-xs font-medium text-[#1D1D1F] outline-none transition-colors cursor-pointer focus:border-[#1D1D1F]"
          >
            {[2025, 2026, 2027].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ========================================= */}
      {/* SLICK HORIZONTAL SUMMARY TILES            */}
      {/* ========================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
        {/* TILE: TEAM ASSIGNMENT */}
        <div className="bg-[#FBFBFD] border border-[#E8E8ED] rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-2">
              <Users size={12} />
              Structural Unit
            </div>
            <h3 className="text-base font-semibold text-[#1D1D1F] truncate">
              {teamData?.name || "Unassigned"}
            </h3>
          </div>
          <p className="text-xs text-[#6E6E73] mt-2 font-medium truncate">
            Leader: {teamData?.leader?.fullName || "-"}
          </p>
        </div>

        {/* TILE: TARGET COMMITTAL */}
        <div className="bg-[#FBFBFD] border border-[#E8E8ED] rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-2">
              <Target size={12} />
              Quota Allocation
            </div>
            <h3 className="text-base font-semibold text-[#1D1D1F]">
              ₹{targetValue.toLocaleString()}
            </h3>
          </div>
          <p className="text-xs text-[#6E6E73] mt-2 font-medium">
            Monthly benchmark baseline
          </p>
        </div>

        {/* TILE: ACHIEVEMENT METRIC (ENHANCED QUANTITY OVERVIEW) */}
        <div className="bg-[#FBFBFD] border border-[#E8E8ED] rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-2">
              <TrendingUp size={12} />
              Statement Achievement
            </div>

            {/* Bold Progress Split Layout */}
            <div className="flex items-baseline flex-wrap gap-x-2">
              <span className="text-lg font-bold text-[#1D1D1F]">
                ₹{totals.dealValue.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-[#86868B]">/</span>
              <span className="text-xs font-semibold text-[#6E6E73]">
                ₹{targetValue.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs font-bold text-[#008060] bg-[#E6F4EA] px-2 py-0.5 rounded">
              {achievementPercent}% Target
            </span>
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* HIGH-DENSITY REPORT TABULAR MATRIX        */}
      {/* ========================================= */}
      <div className="mt-5 border border-[#E8E8ED] rounded-lg overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F5F7] border-b border-[#E8E8ED]">
                {[
                  "Employee",
                  "Deals",
                  "Inv Pending",
                  "Inv Cancel",
                  "Active Clients",
                  "Leave Out",
                  "No Response",
                  "Total Leads",
                ].map((header) => (
                  <th
                    key={header}
                    className="px-4 py-2 text-xs font-semibold text-[#1D1D1F] whitespace-nowrap first:pl-4"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E8E8ED] text-xs">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-12 text-xs font-medium text-[#86868B] tracking-wide"
                  >
                    Syncing live ledger matrices...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-12 text-xs font-medium text-[#86868B] tracking-wide"
                  >
                    No matching ledger statements verified.
                  </td>
                </tr>
              ) : (
                <>
                  {reports.map((report) => (
                    <tr
                      key={report.id}
                      className="hover:bg-[#FBFBFD] transition-colors"
                    >
                      <td className="px-4 py-2.5 font-medium text-[#1D1D1F] whitespace-nowrap">
                        {report.employee?.fullName}
                      </td>
                      <td className="px-4 py-2.5 text-[#6E6E73]">
                        {report.deal}
                      </td>
                      <td className="px-4 py-2.5 text-[#6E6E73]">
                        {report.invoicePending}
                      </td>
                      <td className="px-4 py-2.5 text-[#E0B400] font-medium">
                        {report.invoiceCancel}
                      </td>
                      <td className="px-4 py-2.5 text-[#6E6E73]">
                        {report.activeClients}
                      </td>
                      <td className="px-4 py-2.5 text-[#6E6E73]">
                        {report.leaveOutClients}
                      </td>
                      <td className="px-4 py-2.5 text-[#6E6E73]">
                        {report.noResponse}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-[#1D1D1F]">
                        {report.totalLeads}
                      </td>
                    </tr>
                  ))}

                  {/* TOTAL CONSOLIDATED ACCOUNT ROW */}
                  <tr className="bg-[#F5F5F7] font-semibold text-[#1D1D1F]">
                    <td className="px-4 py-2.5 tracking-wide">TOTAL CONTRIB</td>
                    <td className="px-4 py-2.5">{totals.deals}</td>
                    <td className="px-4 py-2.5">{totals.invoicePending}</td>
                    <td className="px-4 py-2.5 text-[#D02E2E]">
                      {totals.invoiceCancel}
                    </td>
                    <td className="px-4 py-2.5">{totals.activeClients}</td>
                    <td className="px-4 py-2.5">{totals.leaveOutClients}</td>
                    <td className="px-4 py-2.5">{totals.noResponse}</td>
                    <td className="px-4 py-2.5 bg-[#E8E8ED]/50">
                      {totals.totalLeads}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeeTeamReport;
