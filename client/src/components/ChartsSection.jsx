import React from "react";
import TodayLeadsChart from "./TodayLeadsChart";
import PerformanceChart from "./PerformanceChart";
import AchievementPieChart from "./AchievementPieChart";

export default function ChartsSection({ employees, setSelectedEmployee, pieData, performanceData, achievedCount }) {
  return (
    <>
      <TodayLeadsChart employees={employees} setSelectedEmployee={setSelectedEmployee} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PerformanceChart
          employees={employees}
          performanceData={performanceData}
          setSelectedEmployee={setSelectedEmployee}
        />
        <AchievementPieChart
          pieData={pieData}
          achievedCount={achievedCount}
          totalEmployees={employees.length}
        />
      </div>
    </>
  );
}
