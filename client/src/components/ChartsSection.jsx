import React from "react";
import TodayLeadsChart from "./TodayLeadsChart";
import PerformanceChart from "./PerformanceChart";
import AchievementPieChart from "./AchievementPieChart";

export default function ChartsSection({ employees, setSelectedEmployee, pieData, performanceData, achievedCount }) {
  return (
    <>
      <TodayLeadsChart employees={employees} setSelectedEmployee={setSelectedEmployee} />
      <div className="flex flex-col lg:flex-row gap-6 mt-6">
        <PerformanceChart
          employees={employees}
          performanceData={performanceData}
          setSelectedEmployee={setSelectedEmployee}
        />
        
      </div>
      {/* <div className="flex flex-col lg:flex-row gap-6 mt-6">
        <AchievementPieChart
          pieData={pieData}
          achievedCount={achievedCount}
          totalEmployees={employees.length}
        />
      </div> */}
    </>
  );
}
