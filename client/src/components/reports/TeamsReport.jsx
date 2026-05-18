//src/components/reports/TeamsReport.jsx
import React, { useState } from "react";
import CreateTeam from "./CreateTeam";
import UpdateReport from "./UpdateReport";
import TeamReportTable from "./TeamReportTable";
import DealAnnouncement from "./DealAnnouncement";

const TeamsReport = () => {
  const [activeTab, setActiveTab] = useState("teamReport");

  const tabs = [
    { id: "teamReport", label: "Team Report" },
    { id: "updateReport", label: "Update Report" },
    { id: "dealAnnouncement", label: "Deal Amount" },
    { id: "createTeam", label: "Create Team" },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] font-sans antialiased">
      {/* ======================================== */}
      {/* PREMIUM HIGH-END MINIMALIST NAVBAR      */}
      {/* ======================================== */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-[#E8E8ED]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between pt-5 pb-0 gap-3">
            {/* Title & Description */}
            <div className="pb-1">
              <h1 className="text-xl font-semibold tracking-tight text-[#1D1D1F]">
                Teams Management
              </h1>
              <p className="text-xs text-[#86868B] mt-0.5 font-medium">
                Manage your professional teams, track reports, and view
                configurations.
              </p>
            </div>

            {/* Navigation Tabs */}
            <nav className="relative -mb-px overflow-x-auto scrollbar-none whitespace-nowrap">
              <div className="flex gap-6">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative pb-3 text-xs sm:text-sm font-medium tracking-wide transition-all duration-200 outline-none
                        ${
                          isActive
                            ? "text-[#1D1D1F] font-semibold"
                            : "text-[#6E6E73] hover:text-[#1D1D1F]"
                        }
                      `}
                    >
                      {tab.label}

                      {/* Active Indicator */}
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
      {/* SINGLE UNIFIED WORKSPACE BOX            */}
      {/* ======================================== */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5">
        {/* All content renders inside this single, optimized canvas wrapper */}
        <div className="w-full bg-white rounded-xl border border-[#E8E8ED] shadow-[0_1px_2px_rgba(0,0,0,0.01)] overflow-hidden">
          {/* 
            Optimized, tighter padding container. 
            This forces all dynamic child data/tables to look cohesive, 
            preventing them from nesting multiple distinct boxes inside.
          */}
          <div className="p-4 sm:p-5 text-sm">
            {activeTab === "teamReport" && <TeamReportTable />}
            {activeTab === "updateReport" && <UpdateReport />}
            {activeTab === "dealAnnouncement" && <DealAnnouncement />}
            {activeTab === "createTeam" && <CreateTeam />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeamsReport;
