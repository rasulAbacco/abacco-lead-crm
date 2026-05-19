// src/components/reports/EmployeeTeam.jsx
import React from "react";
import EmployeeTeamReport from "./EmployeeTeamReport";
import EmployeeTeamAnnouncement from "./EmployeeTeamAnnouncement";
import EmployeeMyPerformance from "./EmployeeMyPerformance";

const EmployeeTeam = () => {
  return (
    <div className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] font-sans antialiased">
      {/* ======================================== */}
      {/* PREMIUM HIGH-END MINIMALIST NAVBAR      */}
      {/* ======================================== */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-[#E8E8ED]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-5">
            <span className="text-[10px] font-bold tracking-widest text-[#86868B] uppercase block">
              Personal Workdesk
            </span>
            <h1 className="text-xl font-semibold tracking-tight text-[#1D1D1F] mt-0.5">
              Employee Team Report
            </h1>
            <p className="text-xs text-[#86868B] mt-0.5 font-medium">
              Monitor team ledgers, live deal announcements, and your personal
              performance metrics.
            </p>
          </div>
        </div>
      </header>

      {/* ======================================== */}
      {/* SINGLE UNIFIED WORKSPACE BOX            */}
      {/* ======================================== */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Everything anchors elegantly inside this singular structured card */}
        <div className="w-full bg-white rounded-xl border border-[#E8E8ED] shadow-[0_1px_2px_rgba(0,0,0,0.01)] overflow-hidden">
          <div className="divide-y divide-[#E8E8ED]">
            {/* SECTION 1: TEAM REPORT ROWS */}
            <div className="p-4 sm:p-6 lg:p-8 hover:bg-[#FBFBFD]/50 transition-colors duration-150">
              <EmployeeTeamReport />
            </div>

            {/* SECTION 2: LIVE DEALS & ANNOUNCEMENTS */}
            <div className="p-4 sm:p-6 lg:p-8 hover:bg-[#FBFBFD]/50 transition-colors duration-150">
              <EmployeeTeamAnnouncement />
            </div>

            {/* SECTION 3: PERSONAL PERFORMANCE METRIC REGISTRY */}
            <div className="p-4 sm:p-6 lg:p-8 hover:bg-[#FBFBFD]/50 transition-colors duration-150">
              <EmployeeMyPerformance />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployeeTeam;
