// src/pages/Reports.jsx

import React, { useState } from "react";
import MainReport from "../components/reports/MainReport";
import TeamsReport from "../components/reports/TeamsReport";

const Reports = () => {
  const [activeTab, setActiveTab] = useState("reports");

  return (
    <div className="w-full">
      {/* Tabs Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          {/* Reports Tab */}
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === "reports"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Reports
          </button>

          {/* Teams Report Tab */}
          <button
            onClick={() => setActiveTab("teamReports")}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === "teamReports"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Teams Report
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "reports" && <MainReport />}

        {activeTab === "teamReports" && <TeamsReport />}
      </div>
    </div>
  );
};

export default Reports;
