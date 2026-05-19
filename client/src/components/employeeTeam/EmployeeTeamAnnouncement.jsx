// src/components/reports/EmployeeTeamAnnouncement.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Trophy, TrendingUp, Calendar } from "lucide-react";

const EmployeeTeamAnnouncement = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("token");
  const currentDate = new Date();

  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [teamData, setTeamData] = useState(null);

  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  // =========================================
  // FETCH TEAM
  // =========================================
  const fetchMyTeam = async () => {
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
  // FETCH ANNOUNCEMENTS
  // =========================================
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/employee-team/announcements?month=${selectedMonth}&year=${selectedYear}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await response.json();
      if (data.success) {
        setAnnouncements(data.announcements || []);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTeam();
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [selectedMonth, selectedYear]);

  // =========================================
  // CALCULATE MATRIX VALUES
  // =========================================
  const totalAmount = useMemo(() => {
    return announcements.reduce(
      (acc, item) => acc + Number(item.amount || 0),
      0,
    );
  }, [announcements]);

  const rankings = useMemo(() => {
    return [...announcements].sort((a, b) => b.amount - a.amount);
  }, [announcements]);

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
      {/* SECTION FILTER HEADER CONTROLS            */}
      {/* ========================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-[#E8E8ED] gap-4">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-[#86868B] uppercase block">
            Broadcast Registry
          </span>
          <h2 className="text-sm font-semibold text-[#1D1D1F] mt-0.5">
            Team Deal Announcements
          </h2>
        </div>

        {/* CONTROLS TIME DROP GRIDS */}
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
      {/* SUBTLE HORIZONTAL VALUE STAT TILES        */}
      {/* ========================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
        {/* STATS CARD: TOTAL PIPELINE */}
        <div className="bg-[#FBFBFD] border border-[#E8E8ED] rounded-lg p-4">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1.5">
            <TrendingUp size={12} />
            Total Team Gross Volume
          </div>
          <h3 className="text-lg font-semibold text-[#1D1D1F]">
            ₹{totalAmount.toLocaleString()}
          </h3>
          <p className="text-[11px] text-[#6E6E73] mt-0.5 font-medium truncate">
            {teamData?.name || "Active Unit"} • {months[selectedMonth - 1]}{" "}
            {selectedYear}
          </p>
        </div>

        {/* STATS CARD: RANKING DISTRIBUTION */}
        <div className="bg-[#FBFBFD] border border-[#E8E8ED] rounded-lg p-4">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1.5">
            <Trophy size={12} />
            Active Standings
          </div>
          <h3 className="text-lg font-semibold text-[#1D1D1F]">
            {rankings.length} Logged
          </h3>
          <p className="text-[11px] text-[#6E6E73] mt-0.5 font-medium">
            Verified dynamic team entries listed
          </p>
        </div>
      </div>

      {/* ========================================= */}
      {/* HIGH-DENSITY LEADERBOARD LIST DIRECTORY   */}
      {/* ========================================= */}
      <div className="mt-5 border border-[#E8E8ED] rounded-lg overflow-hidden bg-white">
        {/* LEADERBOARD VIEW CONTROL HEADER SUBTEXT */}
        <div className="px-4 py-3 border-b border-[#E8E8ED] bg-[#FBFBFD] flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-[#1D1D1F]">
              Performance Standings Rank
            </h3>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-medium text-[#86868B]">
            <Calendar size={12} />
            <span>
              {months[selectedMonth - 1]} {selectedYear}
            </span>
          </div>
        </div>

        {/* LIST DATA MATRIX VIEWPORT */}
        <div className="divide-y divide-[#E8E8ED]">
          {loading ? (
            <div className="py-12 text-center text-xs font-medium text-[#86868B] tracking-wide">
              Syncing live network announcements...
            </div>
          ) : rankings.length === 0 ? (
            <div className="py-12 text-center text-xs font-medium text-[#86868B] tracking-wide">
              No matching deal announcements registered under this period
              timeframe.
            </div>
          ) : (
            rankings.map((item, index) => (
              <div
                key={item.id}
                className="px-4 py-2.5 flex items-center justify-between hover:bg-[#FBFBFD] transition-colors text-xs"
              >
                {/* RANK ID SELECTION ROW */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-md bg-[#F5F5F7] text-[#1D1D1F] flex items-center justify-center font-bold text-[10px] shrink-0">
                    #{index + 1}
                  </span>

                  <div className="min-w-0">
                    <p className="font-medium text-[#1D1D1F] truncate">
                      {item.employee?.fullName}
                    </p>
                    <p className="text-[10px] text-[#86868B] truncate mt-0.5">
                      {teamData?.name || "Structural Node"}
                    </p>
                  </div>
                </div>

                {/* ROW STATEMENT VALUE QUANTIFICATION */}
                <div className="text-right shrink-0 pl-4">
                  <span className="font-semibold text-[#1D1D1F]">
                    ₹{Number(item.amount || 0).toLocaleString()}
                  </span>
                  <span className="block text-[9px] text-[#86868B] font-medium mt-0.5">
                    Announced Vol
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeTeamAnnouncement;
