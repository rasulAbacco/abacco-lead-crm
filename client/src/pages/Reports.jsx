// src/pages/Reports.jsx
import React, { useState } from "react";
import MainReport from "../components/reports/MainReport";
import TeamsReport from "../components/reports/TeamsReport";

const Reports = () => {
  const [activeTab, setActiveTab] = useState("reports");

  const tabs = [
    { id: "reports", label: "Analytics Overview" },
    { id: "teamReports", label: "Teams Performance" },
  ];

  return (
    <div className="w-full min-h-screen bg-[#FBFBFD] text-[#1D1D1F] font-sans antialiased">
      {/* ======================================== */}
      {/* MINIMALIST SECONDARY NAVIGATION HEADER   */}
      {/* ======================================== */}
      <div className="bg-white border-b border-[#E8E8ED] sticky top-0 z-30 backdrop-blur-md bg-white/80">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-8 h-14 overflow-x-auto scrollbar-none whitespace-nowrap">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative h-full text-xs sm:text-sm font-medium tracking-wide transition-all duration-200 outline-none select-none
                    ${
                      isActive
                        ? "text-[#1D1D1F] font-semibold"
                        : "text-[#6E6E73] hover:text-[#1D1D1F]"
                    }
                  `}
                >
                  {tab.label}

                  {/* Refined Active Indicator Line */}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1D1D1F] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ======================================== */}
      {/* PRIMARY TAB WORKSPACE CONTENT            */}
      {/* ======================================== */}
      <div className="w-full transition-all duration-300">
        {activeTab === "reports" && (
          <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5">
            <div className="w-full bg-white rounded-xl border border-[#E8E8ED] shadow-[0_1px_2px_rgba(0,0,0,0.01)] overflow-hidden p-4 sm:p-5 text-sm">
              <MainReport />
            </div>
          </main>
        )}

        {/* 
          TeamsReport already handles its own workspace card containment 
          internally based on our locked system design.
        */}
        {activeTab === "teamReports" && <TeamsReport />}
      </div>
    </div>
  );
};

export default Reports;
