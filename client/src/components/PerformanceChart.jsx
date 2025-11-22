import { useEffect, useState } from "react";
import PerformanceAnalytics from "./PerformanceChartComponents/PerformanceAnalytics";
import IndividualPerformance from "./PerformanceChartComponents/IndividualPerformance";
import TopPerformers from "./PerformanceChartComponents/TopPerformers";
import TodaysLeadsActivity from "./PerformanceChartComponents/TodaysLeadsActivity";

export default function PerformanceChart({ employees, performanceData, setSelectedEmployee }) {
  const [todayLeads, setTodayLeads] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [activeMetric, setActiveMetric] = useState('all');

  const [showBlast, setShowBlast] = useState(false);
  const [blastKey, setBlastKey] = useState(0);

  const sortedLeads = [...todayLeads].sort((a, b) => b.leads - a.leads);

  // Calculate total
  const totalLeadsTodays = sortedLeads.reduce((sum, emp) => sum + emp.leads, 0);

  // Find the highest lead count
  const highestLeads = sortedLeads.length > 0 ? sortedLeads[0].leads : 0;

  useEffect(() => {
    // Trigger blast every 2 minutes
    const interval = setInterval(() => {
      setShowBlast(true);
      setBlastKey(prev => prev + 1);

      // Hide blast after animation completes
      setTimeout(() => {
        setShowBlast(false);
      }, 3000);
    }, 4000); // 2 minutes

    // Initial blast on mount
    setShowBlast(true);
    setTimeout(() => {
      setShowBlast(false);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const dailyData = employees.map((emp) => ({
      id: emp.employeeId || "N/A",
      name: emp.name || "Unknown",
      leads: emp.dailyLeads || 0,
    }));
    setTodayLeads(dailyData);
  }, [employees]);

  useEffect(() => {
    const enrichedData = performanceData.map(emp => {
      const empData = employees.find(e =>
        e.employeeId === emp.employeeId || e.id === emp.employeeId
      );

      const total = emp.leads || emp.monthlyLeads || 0;
      const qualified = empData?.qualifiedLeads || 0;
      const disqualified = empData?.disqualifiedLeads || 0;

      const netLeads = qualified; // ✅ real leads after disqualification

      return {
        name: emp.fullName || emp.name,
        id: emp.employeeId,
        totalLeads: total,
        target: emp.target || 0,
        qualified,
        disqualified,
        pending: total - qualified - disqualified,
        netLeads, // ✅ added
        achievement: emp.target
          ? Math.round((netLeads / emp.target) * 100) // ✅ FIXED
          : 0,
      };
    });


    setChartData(enrichedData);
  }, [performanceData, employees]);

  const totalLeadsToday = todayLeads.reduce((sum, emp) => sum + emp.leads, 0);
  const totalQualified = chartData.reduce((sum, emp) => sum + emp.qualified, 0);
  const totalDisqualified = chartData.reduce((sum, emp) => sum + emp.disqualified, 0);
  const totalPending = chartData.reduce((sum, emp) => sum + emp.pending, 0);
  const totalTarget = chartData.reduce((sum, emp) => sum + emp.target, 0);
  const overallAchievement = totalTarget ? Math.round((chartData.reduce((sum, emp) => sum + emp.totalLeads, 0) / totalTarget) * 100) : 0;

  // ✅ Fair Top Performer Ranking
  const topPerformers = chartData
    .map(emp => {
      const netLeads = emp.qualified || 0; // real leads after disqualification
      const achievement = emp.target
        ? Math.round((netLeads / emp.target) * 100)
        : 0;

      return {
        ...emp,
        netLeads,
        achievement,
      };
    })
    .sort((a, b) => {
      // 1️⃣ Primary: highest achievement %
      const diff = b.achievement - a.achievement;
      if (diff !== 0) return diff;

      // 2️⃣ Tie-breaker: highest net leads
      return b.netLeads - a.netLeads;
    })
    .slice(0, 3);


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 w-full">
      <div className="w-full mx-auto space-y-4 md:space-y-6">
        <PerformanceAnalytics
          activeMetric={activeMetric}
          setActiveMetric={setActiveMetric}
          totalLeads={chartData.reduce((sum, emp) => sum + emp.totalLeads, 0)}
          totalQualified={totalQualified}
          totalDisqualified={totalDisqualified}
          totalPending={totalPending}
          totalTarget={totalTarget}
          overallAchievement={overallAchievement}
        />

        <IndividualPerformance
          activeMetric={activeMetric}
          chartData={chartData}
          employees={employees}
          setSelectedEmployee={setSelectedEmployee}
        />

        <TopPerformers
          topPerformers={topPerformers}
          showBlast={showBlast}
          blastKey={blastKey}
        />

        <TodaysLeadsActivity
          sortedLeads={sortedLeads}
          totalLeadsToday={totalLeadsToday}
          highestLeads={highestLeads}
        />
      </div>

      <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #6528F7 #e5e7eb;
        }
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to right, #06b6d4, #2563eb);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to right, #22d3ee, #3b82f6);
        }
      `}</style>
    </div>
  );
}