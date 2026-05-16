//src/components/reports/TeamsReport.jsx

import React, { useState } from "react";

import CreateTeam from "./CreateTeam";
import UpdateReport from "./UpdateReport";
import TeamReportTable from "./TeamReportTable";
import DealAnnouncement from "./DealAnnouncement";

const TeamsReport = () => {
  const [activeTab, setActiveTab] = useState("teamReport");

  const tabs = [
    {
      id: "teamReport",
      label: "Team Report",
    },
    {
      id: "updateReport",
      label: "Update Report",
    },
    {
      id: "dealAnnouncement",
      label: "Deal Amount",
    },
    {
      id: "createTeam",
      label: "Create Team",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ======================================== */}
      {/* CLASSIC NAVBAR */}
      {/* ======================================== */}

      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="px-6">
          {/* Title */}

          <div className="pt-5 pb-3">
            <h1 className="text-2xl font-bold text-gray-800">
              Teams Management
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Manage teams, reports and deal announcements
            </p>
          </div>

          {/* Nav Tabs */}

          <div className="flex items-center gap-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative pb-4 pt-2 text-sm font-semibold whitespace-nowrap transition-all duration-200
                  ${
                    activeTab === tab.id
                      ? "text-indigo-600"
                      : "text-gray-500 hover:text-gray-800"
                  }
                `}
              >
                {tab.label}

                {/* Active Line */}

                {activeTab === tab.id && (
                  <span className="absolute left-0 bottom-0 w-full h-[3px] bg-indigo-600 rounded-full"></span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ======================================== */}
      {/* PAGE CONTENT */}
      {/* ======================================== */}

      <div className="w-full">
        {activeTab === "teamReport" && <TeamReportTable />}

        {activeTab === "updateReport" && <UpdateReport />}

        {activeTab === "dealAnnouncement" && <DealAnnouncement />}

        {activeTab === "createTeam" && <CreateTeam />}
      </div>
    </div>
  );
};

export default TeamsReport;
