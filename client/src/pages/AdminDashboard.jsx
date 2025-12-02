import React, { useState, useEffect } from "react";
import DashboardHeader from "../components/DashboardHeader";
import StatsGrid from "../components/StatsGrid";
import ChartsSection from "../components/ChartsSection";
import EmployeeSection from "../components/EmployeeSection";
import Loader from "../components/Loader";
import Leaderboard from "../components/Leaderboard";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AdminDashboard() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/employees`);
        if (!res.ok) throw new Error("Network response was not ok");
        const data = await res.json();
        console.log("Fetched employees:", data);
        setEmployees(data);
      } catch (err) {
        console.error("Failed to fetch employees:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  if (loading) {
    return (
      <Loader />
    );
  }

  const totalMonthlyLeads = employees.reduce((sum, emp) => sum + emp.monthlyLeads, 0);
  const avgLeads = employees.length ? Math.round(totalMonthlyLeads / employees.length) : 0;
  const achievedCount = employees.filter((emp) => emp.monthlyLeads >= emp.target).length;
  const topPerformer = employees.reduce(
    (max, emp) => (emp.monthlyLeads > max.monthlyLeads ? emp : max),
    employees[0] || { name: "-", monthlyLeads: 0 }
  );

  const getFilteredEmployees = () => {
    let data = [...employees];
    if (filter === "highest") data.sort((a, b) => b.monthlyLeads - a.monthlyLeads);
    else if (filter === "lowest") data.sort((a, b) => a.monthlyLeads - b.monthlyLeads);
    else if (filter === "achieved") data = data.filter((emp) => emp.monthlyLeads >= emp.target);
    else if (filter === "below") data = data.filter((emp) => emp.monthlyLeads < emp.target);
    return data;
  };

  const filteredEmployees = getFilteredEmployees();

  const performanceData = employees.map((emp) => ({
    employeeId: emp.employeeId,
    name: emp.fullName || emp.name,
    leads: emp.monthlyLeads || emp.leads || 0,
    target: emp.target || 0,
    qualifiedLeads: emp.qualifiedLeads || 0,
    disqualifiedLeads: emp.disqualifiedLeads || 0,
    pendingLeads: emp.pendingLeads || 0,
    dailyLeads: emp.dailyLeads || 0,
  }));

  console.log("✅ Prepared Performance Data:", performanceData);


  const pieData = [
    { name: "Achieved", value: achievedCount },
    { name: "Below Target", value: employees.length - achievedCount },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <DashboardHeader />
        <StatsGrid
          totalMonthlyLeads={totalMonthlyLeads}
          avgLeads={avgLeads}
          achievedCount={achievedCount}
          topPerformer={topPerformer}
          employeesLength={employees.length}
        />
        <ChartsSection
          employees={employees}
          setSelectedEmployee={setSelectedEmployee}
          pieData={pieData}
          performanceData={performanceData}
          achievedCount={achievedCount}
        />
        <EmployeeSection
          selectedEmployee={selectedEmployee}
          setSelectedEmployee={setSelectedEmployee}
          filteredEmployees={filteredEmployees}
          filter={filter}
          setFilter={setFilter}
        />
        <div className="h-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <Leaderboard apiBase={API_BASE_URL} />
        </div>

      </div>
    </div>
  );
}
