import React from "react";

export default function DashboardHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Performance Dashboard
        </h1>
        <p className="text-gray-600">Real-time insights and analytics for your team</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <span className="text-sm text-gray-600">Last updated: </span>
          <span className="text-sm font-semibold text-gray-900">Just now</span>
        </div>
      </div>
    </div>
  );
}
