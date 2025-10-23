// EmployeeDashboard.jsx
import { useEffect, useState } from "react";
import axios from "axios";

import DashboardStats from "./DashboardStats";
import DashboardDailyChart from "./DashboardDailyChart";
import DashboardWeeklyChart from "./DashboardWeeklyChart";
import DashboardMonthlyChart from "./DashboardMonthlyChart";
import PerformanceChart from "../components/PerformanceChart";

const EmployeeDashboard = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

   const [employees, setEmployees] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeTarget, setEmployeeTarget] = useState(0);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


useEffect(() => {
  const fetchEmployeesAndPerformance = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/employees`);
      if (!res.ok) throw new Error("Network response was not ok");
      const employeesData = await res.json();

      setEmployees(employeesData);

      // 🔑 Get current logged-in employee ID from localStorage
      const employeeId = localStorage.getItem("employeeId");

      // 🔍 Find logged-in employee from the fetched data
      const currentEmployee = employeesData.find(emp => String(emp.id) === String(employeeId));

      if (currentEmployee) {
        setEmployeeTarget(currentEmployee.target); // ✅ Set target dynamically
        console.log("Target for logged-in employee:", currentEmployee.target);
      } else {
        console.warn("Logged-in employee not found in employee list.");
      }

      // 🔁 Populate performance chart
      const perfData = employeesData.map(emp => ({
        name: emp.name,
        leads: emp.monthlyLeads,
        target: emp.target,
      }));

      setPerformanceData(perfData);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchEmployeesAndPerformance();
}, []);



  useEffect(() => {
    async function fetchLeads() {
      try {
        const employeeId = localStorage.getItem("employeeId");
        if (!employeeId) throw new Error("Employee not logged in");

        const res = await axios.get(`${API_BASE_URL}/api/employees/${employeeId}/leads`);
        setLeads(res.data.leads || []);

      } catch (err) {
        console.error("Error fetching leads:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeads();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading leads...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              My Performance Dashboard
            </h1>
            <p className="text-gray-600">Track your daily and monthly lead generation progress</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
              <span className="text-sm text-gray-600">Last updated: </span>
              <span className="text-sm font-semibold text-gray-900">Just now</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <DashboardStats leads={leads} />

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardDailyChart leads={leads} />
          <DashboardWeeklyChart leads={leads} />
        </div>
        <div className="p-6">
          <PerformanceChart
            employees={employees}
            performanceData={performanceData}
            setSelectedEmployee={setSelectedEmployee}
          />
        </div>


        {/* Monthly Chart */}
        <DashboardMonthlyChart leads={leads} target={employeeTarget} />
      </div>
    </div>
  );
};

export default EmployeeDashboard;


