// EmployeeDashboard.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { toZonedTime, format } from "date-fns-tz";

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
  const USA_TZ = "America/Chicago"; // ✅ Central USA timezone

  // ✅ Dynamic Central USA time clock
  const [usaTime, setUsaTime] = useState(() => {
    const now = toZonedTime(new Date(), USA_TZ);
    return format(now, "hh:mm a zzz");
  });

  const nowUSA = toZonedTime(new Date(), USA_TZ);
  const usaDate = format(nowUSA, "EEE, MMM dd, yyyy", { timeZone: USA_TZ });
  useEffect(() => {
    const interval = setInterval(() => {
      const now = toZonedTime(new Date(), USA_TZ);
      setUsaTime(format(now, "hh:mm a zzz"));
    }, 60000); // update every minute
    return () => clearInterval(interval);
  }, []);

  // ✅ Fetch employees and their performance
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
        const currentEmployee = employeesData.find(
          (emp) => String(emp.id) === String(employeeId)
        );

        if (currentEmployee) {
          setEmployeeTarget(currentEmployee.target); // ✅ Set target dynamically
          console.log("Target for logged-in employee:", currentEmployee.target);
        } else {
          console.warn("Logged-in employee not found in employee list.");
        }

        // 🔁 Populate performance chart
        // ✅ Include qualified/disqualified/pending lead counts in performance data
        const perfData = employeesData.map((emp) => ({
          employeeId: emp.employeeId,
          name: emp.fullName || emp.name,
          leads: emp.monthlyLeads || emp.leads || 0,
          target: emp.target || 0,
          qualifiedLeads: emp.qualifiedLeads || 0,
          disqualifiedLeads: emp.disqualifiedLeads || 0,
          pendingLeads: emp.pendingLeads || 0,
          dailyLeads: emp.dailyLeads || 0,
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

  // ✅ Fetch leads of the logged-in employee
  useEffect(() => {
    async function fetchLeads() {
      try {
        const employeeId = localStorage.getItem("employeeId");
        if (!employeeId) throw new Error("Employee not logged in");

        const res = await axios.get(
          `${API_BASE_URL}/api/employees/${employeeId}/leads`
        );
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
        {/* ========================= HEADER ========================= */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
              My Performance Dashboard
            </h1>
            <p className="text-gray-600">
              Track your daily and monthly lead generation progress
            </p>
          </div>

          {/* 🕐 Elegant Central USA Time Widget (Glassmorphism Style) */}
          <div className="text-right">
            <div className="relative inline-flex flex-col items-end px-6 py-4 rounded-2xl backdrop-blur-xl bg-white/20 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
              {/* Gradient Glow Accent */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 via-blue-400/20 to-indigo-400/20 opacity-40 blur-xl rounded-2xl" />

              {/* Label */}
              <span className="text-[12px] uppercase tracking-wider font-semibold text-gray-700 z-10">
                Central USA (CST/CDT)
              </span>

              {/* Time */}
              <span className="text-[18px] font-bold text-gray-900 tracking-tight mt-1 z-10">
                {usaTime}
              </span>

              {/* Date */}
              <span className="text-[14px] text-gray-700 font-medium mt-1 z-10">
                {usaDate}
              </span>
            </div>

            <p className="text-[11px] text-gray-500 mt-2 pr-1">
              🕐 Stats shown in <strong>Central USA Time Zone</strong>
            </p>
          </div>



        </div>

        {/* ========================= STATS SECTION ========================= */}
        <DashboardStats leads={leads} />

        {/* ========================= CHARTS SECTION ========================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardDailyChart leads={leads} />
          <DashboardWeeklyChart leads={leads} />
        </div>

        {/* ========================= PERFORMANCE CHART ========================= */}
        <div className="p-6">
          <PerformanceChart
            employees={employees}
            performanceData={performanceData}
            setSelectedEmployee={setSelectedEmployee}
          />
        </div>

        {/* ========================= MONTHLY CHART ========================= */}
        <DashboardMonthlyChart leads={leads} target={employeeTarget} />
      </div>
    </div>
  );
};

export default EmployeeDashboard;
