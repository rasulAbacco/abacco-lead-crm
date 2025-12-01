// EmployeeDashboard.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { toZonedTime, format } from "date-fns-tz";

import DashboardStats from "./DashboardStats";
import DashboardDailyChart from "./DashboardDailyChart";
import DashboardWeeklyChart from "./DashboardWeeklyChart";
import DashboardMonthlyChart from "./DashboardMonthlyChart";
import PerformanceChart from "../components/PerformanceChart";
import Loader from "../components/Loader";
import NotificationBell from "../components/NotificationBell";

const EmployeeDashboard = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const [employees, setEmployees] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeTarget, setEmployeeTarget] = useState(0);
  const [incentive, setIncentive] = useState(0);
  const [incentiveBreakdown, setIncentiveBreakdown] = useState({});

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

  const normalizeCountry = (country = "") => {
    const c = country.trim().toLowerCase();

    if (
      c.includes("usa") ||
      c === "us" ||
      c.includes("u.s") ||
      c.includes("united state") ||
      c.includes("america")
    ) {
      return "USA";
    }

    return "OTHER";
  };


  const calculateIncentive = (leads, employeeTarget) => {
    if (!leads || leads.length === 0) return { incentive: 0, breakdown: {} };

    const todayStr = format(toZonedTime(new Date(), USA_TZ), "yyyy-MM-dd");

    const todayLeads = leads.filter((lead) => {
      const dateStr = format(
        toZonedTime(new Date(lead.date), USA_TZ),
        "yyyy-MM-dd"
      );
      return dateStr === todayStr;
    });

    const totalToday = todayLeads.length;

    const usAttendees = todayLeads.filter(
      (l) =>
        l.leadType === "Attendees Lead" &&
        normalizeCountry(l.country) === "USA" &&
        (l.attendeesCount || 0) >= 1500
    ).length;

    const mixedLeads = todayLeads.filter(
      (l) =>
        normalizeCountry(l.country) === "OTHER" ||
        l.leadType === "Attendees Lead"
    ).length;

    const usAssociation = todayLeads.filter(
      (l) =>
        l.leadType === "Association Lead" &&
        normalizeCountry(l.country) === "USA"
    ).length;

    let incentive = 0;

    // 1️⃣ US Attendees Leads 1500+
    if (usAttendees >= 15) incentive = 1500;
    else if (usAttendees >= 10) incentive = 1000;
    else if (usAttendees >= 7) incentive = 500;

    // 2️⃣ Mixed Leads
    if (mixedLeads >= 15) incentive = Math.max(incentive, 1000);
    else if (mixedLeads >= 10) incentive = Math.max(incentive, 500);

    // 3️⃣ US Association Leads
    if (usAssociation >= 18) incentive = Math.max(incentive, 1000);
    else if (usAssociation >= 12) incentive = Math.max(incentive, 500);

    // 4️⃣ Double Target (daily target = monthlyTarget / 30)
    const dailyTarget = Math.ceil(employeeTarget / 30);
    const doubleTargetAchieved = totalToday >= dailyTarget * 2;

    if (doubleTargetAchieved) {
      incentive = Math.max(incentive, 5000);
    }


    return {
      incentive,
      breakdown: {
        totalToday,
        usAttendees,
        mixedLeads,
        usAssociation,
        doubleTargetAchieved,
      },
    };
  };

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

  useEffect(() => {
    if (leads.length > 0 && employeeTarget > 0) {
      const result = calculateIncentive(leads, employeeTarget);
      setIncentive(result.incentive);
      setIncentiveBreakdown(result.breakdown);
    }
  }, [employeeTarget, leads]);


  if (loading) return (<Loader />);

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

          <div className="flex" >
            <div className="mr-5 mt-5"><NotificationBell /></div>
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



        </div>

        {/* ========================= STATS SECTION ========================= */}
        <DashboardStats leads={leads} />

        {/* ========================= DAILY INCENTIVE KPI ========================= */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-gray-500 text-sm font-medium mb-1">Today's Incentive</p>
            <h3 className="text-4xl font-extrabold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
              ₹{incentive}
            </h3>
            <p className="text-xs text-gray-400 mt-2">Based on daily performance</p>
          </div>

          {/* US Attendees KPI */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-gray-500 text-sm font-medium mb-1">US Attendees (1500+)</p>
            <h3 className="text-3xl font-bold text-blue-600">
              {incentiveBreakdown.usAttendees || 0}
            </h3>
            <p className="text-xs text-gray-400 mt-2">
              Attendees Leads (≥1500 attendees)
            </p>
          </div>

          {/* Mixed Leads KPI */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-gray-500 text-sm font-medium mb-1">Mixed Leads</p>
            <h3 className="text-3xl font-bold text-indigo-600">
              {incentiveBreakdown.mixedLeads || 0}
            </h3>
            <p className="text-xs text-gray-400 mt-2">
              Other Country + US Attendees Leads
            </p>
          </div>

          {/* US Association KPI */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-gray-500 text-sm font-medium mb-1">US Association Leads</p>
            <h3 className="text-3xl font-bold text-rose-600">
              {incentiveBreakdown.usAssociation || 0}
            </h3>
            <p className="text-xs text-gray-400 mt-2">
              Only USA Association Leads
            </p>
          </div>

        </div>

        {/* Double Target Banner */}
        {incentiveBreakdown.doubleTargetAchieved && (
          <div className="mt-6 bg-green-50 border-l-4 border-green-600 p-5 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold text-green-700">
              🎉 Double Target Achieved!
            </h3>
            <p className="text-green-600 text-sm">
              You achieved double of your daily target. You earned a bonus of ₹5000!
            </p>
          </div>
        )}

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
