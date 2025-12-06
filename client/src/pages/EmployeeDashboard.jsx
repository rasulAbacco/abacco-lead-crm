// EmployeeDashboard.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { toZonedTime, format } from "date-fns-tz";
import { getDaysInMonth } from "date-fns";


import DashboardStats from "./DashboardStats";
import DashboardDailyChart from "./DashboardDailyChart";
import DashboardWeeklyChart from "./DashboardWeeklyChart";
import DashboardMonthlyChart from "./DashboardMonthlyChart";
import PerformanceChart from "../components/PerformanceChart";
import Loader from "../components/Loader";
import NotificationBell from "../components/NotificationBell";
import MotivationBanner from "../components/MotivationBanner";

// NEW COMPONENTS
import IncentivePlan from "../components/IncentivePlan";
import TodayProgress from "../components/TodayProgress";
import MonthlyDoubleTarget from "../components/MonthlyDoubleTarget";
import Leaderboard from "../components/Leaderboard";

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
  const USA_TZ = "America/Chicago";

  // CLOCK — stays the same
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
    }, 60000);
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

  // NEW INCENTIVE LOGIC
  const calculateIncentive = (leads = [], employeeTarget = 0) => {
    if (!Array.isArray(leads) || leads.length === 0) {
      return { incentive: 0, breakdown: {} };
    }

    const todayStr = format(toZonedTime(new Date(), USA_TZ), "yyyy-MM-dd");

    const todayLeads = leads.filter((lead) => {
      if (!lead || !lead.date) return false;
      const dateStr = format(
        toZonedTime(new Date(lead.date), USA_TZ),
        "yyyy-MM-dd"
      );
      return dateStr === todayStr && lead.qualified === true;
    });

    const totalToday = todayLeads.length;

    const isAttendeeLead = (l) =>
      l?.leadType?.toLowerCase().includes("attend");

    // US Attendees (USA, attendees >=1500)
    const usAttendees = todayLeads.filter(
      (l) =>
        isAttendeeLead(l) &&
        normalizeCountry(l.country) === "USA" &&
        (l.attendeesCount || 0) >= 1500
    ).length;

    // --- MIXED LEADS FINAL RULE ---
    let mixedLeads = 0;

    if (usAttendees < 7) {
      // Count ALL attendees >=1500 (USA + OTHER)
      mixedLeads = todayLeads.filter(
        (l) =>
          isAttendeeLead(l) &&
          (l.attendeesCount || 0) >= 1500
      ).length;
    } else {
      // Count ONLY OTHER COUNTRY attendees >=1500
      mixedLeads = todayLeads.filter(
        (l) =>
          isAttendeeLead(l) &&
          normalizeCountry(l.country) === "OTHER" &&
          (l.attendeesCount || 0) >= 1500
      ).length;
    }

    // US Association
    const usAssociation = todayLeads.filter(
      (l) =>
        l?.leadType?.toLowerCase().includes("association") &&
        normalizeCountry(l.country) === "USA"
    ).length;

    // Incentive Calculation
    let incentive = 0;

    if (usAttendees >= 15) incentive = 1500;
    else if (usAttendees >= 10) incentive = 1000;
    else if (usAttendees >= 7) incentive = 500;

    if (mixedLeads >= 15) incentive = Math.max(incentive, 1000);
    else if (mixedLeads >= 10) incentive = Math.max(incentive, 500);

    if (usAssociation >= 18) incentive = Math.max(incentive, 1000);
    else if (usAssociation >= 12) incentive = Math.max(incentive, 500);

    const dailyTarget = employeeTarget ? Math.ceil(employeeTarget / 30) : 0;
    const doubleTargetAchievedToday =
      dailyTarget > 0 && totalToday >= dailyTarget * 2;

    return {
      incentive,
      breakdown: {
        totalToday,
        usAttendees,
        mixedLeads,
        usAssociation,
        doubleTargetAchievedToday,
      },
    };
  };




  // FETCH EMPLOYEES
  useEffect(() => {
    const fetchEmployeesAndPerformance = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/employees`);
        if (!res.ok) throw new Error("Network response was not ok");
        const employeesData = await res.json();

        setEmployees(employeesData);

        const empId = localStorage.getItem("employeeId");

        const currentEmployee = employeesData.find(
          (emp) => String(emp.id) === String(empId)
        );

        if (currentEmployee) {
          setEmployeeTarget(currentEmployee.target);
        }

        const perfData = employeesData.map((emp) => ({
          employeeId: emp.employeeId,
          name: emp.fullName || emp.name,
          leads: emp.monthlyLeads,
          target: emp.target,
          qualifiedLeads: emp.qualifiedLeads,
          disqualifiedLeads: emp.disqualifiedLeads,
          pendingLeads: emp.pendingLeads,
          dailyLeads: emp.dailyLeads,
          doubleTargetAchieved: emp.doubleTargetAchieved,
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

  // FETCH LEADS
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const employeeId = localStorage.getItem("employeeId");
        const res = await axios.get(
          `${API_BASE_URL}/api/employees/${employeeId}/leads`
        );
        setLeads(res.data.leads || []);
      } catch (err) {
        console.error("Error fetching leads:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  // RUN DAILY INCENTIVE CALCULATION
  useEffect(() => {
    if (employeeTarget > 0) {
      const result = calculateIncentive(leads, employeeTarget);
      setIncentive(result.incentive);
      setIncentiveBreakdown(result.breakdown);
    }
  }, [employeeTarget, leads]);

  if (loading) return <Loader />;

  const loggedInId = localStorage.getItem("employeeId");
  const loggedPerf = performanceData.find(
    (p) => String(p.employeeId) === String(loggedInId)
  );
  const loggedEmp = employees.find(
    (e) => String(e.employeeId) === String(loggedInId)
  );

  const todayStr = format(toZonedTime(new Date(), USA_TZ), "yyyy-MM-dd");

  const todayLeadsCount = leads.filter((lead) => {
    if (!lead || !lead.date) return false;
    const leadDateStr = format(
      toZonedTime(new Date(lead.date), USA_TZ),
      "yyyy-MM-dd"
    );
    return leadDateStr === todayStr;
  }).length;



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
              My Performance Dashboard
            </h1>
            <p className="text-gray-600">Track your daily & monthly progress</p>
          </div>

          <div className="flex">
            <div className="mr-5 mt-5">
              <NotificationBell />
            </div>

            {/* TIME BOX */}
            {/* TIME BOX - MINIMALIST STYLE */}
            <div className="text-right">
              <div className="relative inline-flex flex-col items-end px-7 py-5 rounded-2xl bg-white/90 backdrop-blur-md border border-gray-100 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
                {/* Timezone indicator */}
                <div className="flex items-center mb-1 z-10">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2"></div>
                  <span className="text-[10px] uppercase tracking-wider font-medium text-gray-500">
                    Central USA
                  </span>
                </div>

                {/* Time display */}
                <div className="flex items-baseline z-10">
                  <span className="text-[26px] font-light text-gray-800 tabular-nums">{usaTime}</span>
                </div>

                {/* Date with subtle styling */}
                <div className="mt-1 z-10">
                  <span className="text-[14px] text-gray-600">
                    {new Date().toLocaleDateString('en-US', { timeZone: 'America/Chicago', weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                </div>

                {/* Accent line */}
                <div className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              </div>
            </div>


          </div>
        </div>

        {/* MOTIVATION BANNER IN DASHBOARD*/}
        <MotivationBanner
          target={employeeTarget}
          qualifiedMonthly={loggedPerf?.leads || 0}
          doubleTarget={loggedEmp?.doubleTargetAchieved || false}
          incentiveBreakdown={incentiveBreakdown}
          incentive={incentive}
          employeeName={loggedEmp?.fullName}
          todayLeads={todayLeadsCount}
        />





        {/* BASIC STATS */}
        <DashboardStats leads={leads} />

        {/* TODAYS PROGRESS + INCENTIVE */}
        <TodayProgress breakdown={incentiveBreakdown} incentive={incentive} />

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardDailyChart leads={leads} />
          <DashboardWeeklyChart leads={leads} />
        </div>

        <div className="p-1">
          <PerformanceChart
            employees={employees}
            performanceData={performanceData}
            setSelectedEmployee={setSelectedEmployee}
          />
        </div>


        {/* INCENTIVE PLAN */}

        <section>
          <IncentivePlan />
        </section>

        {/* ... inside your main page component ... */}

        {/* MONTHLY DOUBLE TARGET + LEADERBOARD SECTION */}
        <section className="mt-2 p-2 flex flex-col gap-6">

          {/* 1. Double Target Component (Span 2) */}
          <div className="">
            <MonthlyDoubleTarget
              target={employeeTarget}
              qualifiedMonthly={loggedPerf?.qualifiedLeads || 0}
              doubleAchieved={loggedEmp?.doubleTargetAchieved || false}
            />
          </div>

          {/* 2. Leaderboard Container (Span 1) */}

          <div className="h-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <Leaderboard apiBase={API_BASE_URL} />
          </div>


        </section>


        <DashboardMonthlyChart leads={leads} target={employeeTarget} />
      </div>
    </div>
  );
};

export default EmployeeDashboard;
