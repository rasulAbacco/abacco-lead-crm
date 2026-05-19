// src/pages/MyReport.jsx
import React, { useState } from "react";
import EmployeeMyPerformance from "../components/employeeTeam/EmployeeMyPerformance";
import EmployeeTeamReport from "../components/employeeTeam/EmployeeTeamReport";
import EmployeeTeamAnnouncement from "../components/employeeTeam/EmployeeTeamAnnouncement";

const MyReport = () => {
  const [activeTab, setActiveTab] = useState("teamReport");

  const tabs = [
    { id: "teamReport", label: "Team Report" },
    { id: "announcement", label: "Team Announcement" },
    { id: "performance", label: "My Performance" },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] font-sans antialiased">
      {/* ======================================== */}
      {/* PREMIUM HIGH-END MINIMALIST NAVBAR      */}
      {/* ======================================== */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-[#E8E8ED]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between pt-5 pb-0 gap-3">
            {/* Title & Context Meta */}
            <div className="pb-1">
              <span className="text-[10px] font-bold tracking-widest text-[#86868B] uppercase block">
                Workdesk Workspace
              </span>
              <h1 className="text-xl font-semibold tracking-tight text-[#1D1D1F] mt-0.5">
                Employee Team Report
              </h1>
              <p className="text-xs text-[#86868B] mt-0.5 font-medium">
                Track assigned team reports, real-time value broadcast logs, and
                individual KPIs.
              </p>
            </div>

            {/* Navigation Tabs (Responsive & Touch-Friendly) */}
            <nav className="relative -mb-px overflow-x-auto scrollbar-none whitespace-nowrap max-w-full">
              <div className="flex gap-6 sm:gap-8">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative pb-3 text-xs sm:text-sm font-medium tracking-wide transition-all duration-200 outline-none select-none
                        ${
                          isActive
                            ? "text-[#1D1D1F] font-semibold"
                            : "text-[#6E6E73] hover:text-[#1D1D1F]"
                        }
                      `}
                    >
                      {tab.label}

                      {/* Premium Accent Underline */}
                      {isActive && (
                        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1D1D1F] rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* ======================================== */}
      {/* SINGLE UNIFIED DASHBOARD WORKSPACE CARD  */}
      {/* ======================================== */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="w-full bg-white rounded-xl border border-[#E8E8ED] shadow-[0_1px_2px_rgba(0,0,0,0.01)] overflow-hidden">
          {/* Dense unified padding container for subcomponents */}
          <div className="p-4 sm:p-6 lg:p-8">
            {activeTab === "teamReport" && <EmployeeTeamReport />}
            {activeTab === "announcement" && <EmployeeTeamAnnouncement />}
            {activeTab === "performance" && <EmployeeMyPerformance />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MyReport;
