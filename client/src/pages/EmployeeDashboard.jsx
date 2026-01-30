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
import MotivationBanner from "../components/MotivationBanner";

import IncentivePlan from "../components/IncentivePlan";
import TodayProgress from "../components/TodayProgress";
import MonthlyDoubleTarget from "../components/MonthlyDoubleTarget";
import Leaderboard from "../components/Leaderboard";

const EmployeeDashboard = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const USA_TZ = "America/Chicago";

  const urlBase64ToUint8Array = (base64String) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
  };

  /* ---------------------------------------
   🔔 PUSH NOTIFICATION REGISTRATION
   (Runs once after employee login)
---------------------------------------- */
  useEffect(() => {
    const registerForPush = async () => {
      try {
        // Browser support check
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
          console.warn("Push notifications not supported");
          return;
        }

        // Ask permission (only once)
        if (Notification.permission === "default") {
          const permission = await Notification.requestPermission();
          if (permission !== "granted") return;
        }

        if (Notification.permission !== "granted") return;

        // Get service worker
        const registration = await navigator.serviceWorker.ready;

        // Avoid duplicate subscriptions
        const existingSub = await registration.pushManager.getSubscription();
        if (existingSub) return;

        // Subscribe
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            import.meta.env.VITE_VAPID_PUBLIC_KEY
          ),
        });

        // Save subscription to backend
        const token = localStorage.getItem("token");
        await axios.post(
          `${API_BASE_URL}/api/notifications/subscribe`,
          subscription,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("✅ Push notification subscribed");
      } catch (err) {
        console.error("Push registration failed:", err);
      }
    };

    registerForPush();
  }, []);

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const [employees, setEmployees] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [employeeTarget, setEmployeeTarget] = useState(0);

  const [incentiveBreakdown, setIncentiveBreakdown] = useState({});
  const [incentive, setIncentive] = useState(0);
  const [achievedIncentive, setAchievedIncentive] = useState(null);
  const [plans, setPlans] = useState([]);

  /* ---------------------------
     Clock — Always in USA time
  ----------------------------- */
  const [usaTime, setUsaTime] = useState(() => {
    const now = toZonedTime(new Date(), USA_TZ);
    return format(now, "hh:mm a zzz");
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = toZonedTime(new Date(), USA_TZ);
      setUsaTime(format(now, "hh:mm a zzz"));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  /* ---------------------------
     Convert Lead → USA Date
  ----------------------------- */
  const getUSADateKey = (dateInput) => {
    if (!dateInput) return null;
    const usaDate = toZonedTime(dateInput, USA_TZ);
    return format(usaDate, "yyyy-MM-dd", { timeZone: USA_TZ });
  };

  /* ---------------------------
     Fetch employees
  ----------------------------- */
  useEffect(() => {
    const fetchEmployeesAndPerformance = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/employees`);
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

  /* ---------------------------
     Fetch Leads
  ----------------------------- */
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

  /* ---------------------------
     Fetch Active Incentive Plans
  ----------------------------- */
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/api/incentives`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const activePlans = res.data.filter((p) => p.isActive);
        setPlans(activePlans);
      } catch (err) {
        console.error("Error fetching incentive plans:", err);
      }
    };

    fetchPlans();
  }, []);

  /* ---------------------------
     Count Matches Per Rule
  ----------------------------- */
  const doesRuleMatchLead = (rule, lead) => {
    const lt = (lead.leadType || "").toLowerCase();
    const rt = (rule.leadType || "").toLowerCase();

    if (!lt.includes(rt)) return false;

    if (rule.country) {
      const allowed = rule.country
        .split(",")
        .map((c) => c.trim().toLowerCase());
      const leadCountry = (lead.country || "").trim().toLowerCase();
      if (!allowed.includes(leadCountry)) return false;
    }

    if (rule.attendeesMinCount) {
      if ((lead.attendeesCount || 0) < rule.attendeesMinCount) return false;
    }

    if (rule.industryDomain) {
      if (
        (lead.industryDomain || "").toLowerCase() !==
        rule.industryDomain.toLowerCase()
      )
        return false;
    }

    return true;
  };

  /* ---------------------------
     Compute Counts Per Plan
  ----------------------------- */
  const computeDailyPlanCounts = (plans, leads) => {
    const todayKey = getUSADateKey(new Date());
    const todayLeads = leads.filter(
      (l) => getUSADateKey(l.date) === todayKey && l.qualified
    );

    const output = {};

    for (const plan of plans) {
      let count = 0;

      for (const lead of todayLeads) {
        if (plan.rules.some((r) => r.isActive && doesRuleMatchLead(r, lead))) {
          count++;
        }
      }

      output[plan.id] = count;
    }
    return output;
  };

  /* ---------------------------
     Compute Incentive Breakdown
  ----------------------------- */
  useEffect(() => {
    if (plans.length === 0) return;

    const dailyCounts = computeDailyPlanCounts(plans, leads);

    const breakdown = {
      totalToday: leads.filter(
        (l) =>
          getUSADateKey(l.date) === getUSADateKey(new Date()) && l.qualified
      ).length,

      plans: {},
    };

    for (const plan of plans) {
      breakdown.plans[plan.id] = {
        title: plan.title,
        count: dailyCounts[plan.id] || 0,
        tiers: plan.rules.map((r) => ({
          leadsRequired: r.leadsRequired,
          amount: r.amount,
          isActive: r.isActive,
        })),
        target: Math.max(...plan.rules.map((r) => r.leadsRequired)),
      };
    }

    setIncentiveBreakdown(breakdown);
  }, [plans, leads]);

  /* ---------------------------
     Fetch Today's Achieved Incentive
  ----------------------------- */
  useEffect(() => {
    const fetchIncentiveProgress = async () => {
      try {
        const employeeId = localStorage.getItem("employeeId");
        const res = await axios.get(
          `${API_BASE_URL}/api/incentives/progress/${employeeId}`
        );
        setAchievedIncentive(res.data.achieved || null);
      } catch (err) {
        console.error("Incentive progress error:", err);
      }
    };

    fetchIncentiveProgress();
  }, [leads]);
  // useEffect(() => {
  //   const fetchIncentiveProgress = async () => {
  //     try {
  //       const employeeId = localStorage.getItem("employeeId");
  //       const token = localStorage.getItem("token");

  //       // Defensive guards (important for empty / fresh DB)
  //       if (!employeeId || !token) {
  //         setAchievedIncentive(null);
  //         return;
  //       }

  if (loading) return <Loader />;

  const loggedInId = localStorage.getItem("employeeId");
  const loggedPerf = performanceData.find(
    (p) => String(p.employeeId) === String(loggedInId)
  );
  const loggedEmp = employees.find(
    (e) => String(e.employeeId) === String(loggedInId)
  );

  const todayKey = getUSADateKey(new Date());
  const todayLeadsCount = leads.filter(
    (l) => getUSADateKey(l.date) === todayKey
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text">
            My Performance Dashboard
          </h1>

          <div className="flex items-center gap-6">
            <NotificationBell />

            <div className="text-right">
              <div className="p-4 bg-white rounded-xl shadow">
                <div className="text-xs text-gray-500">Central USA</div>
                <div className="text-lg font-semibold">{usaTime}</div>
              </div>
            </div>
          </div>
        </div>

        {/* MOTIVATION BANNER */}
        <MotivationBanner
          target={employeeTarget}
          qualifiedMonthly={loggedPerf?.leads || 0}
          doubleTarget={loggedEmp?.doubleTargetAchieved || false}
          incentiveBreakdown={incentiveBreakdown}
          incentive={incentive} // NEW: required by new engine
          employeeName={loggedEmp?.fullName}
          todayLeads={todayLeadsCount} // NEW: required for daily motivation
          streak={loggedPerf?.streak || 0} // OPTIONAL: if you track streaks
        />

        <DashboardStats leads={leads} />

        {/* TODAY PROGRESS (Dynamic Plans) */}
        <TodayProgress breakdown={incentiveBreakdown} useDefaults={false} />

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardDailyChart leads={leads} />
          <DashboardWeeklyChart leads={leads} />
        </div>

        <PerformanceChart
          employees={employees}
          performanceData={performanceData}
        />

        <IncentivePlan />

        <section className="flex flex-col gap-6">
          <MonthlyDoubleTarget
            target={employeeTarget}
            qualifiedMonthly={loggedPerf?.qualifiedLeads || 0}
            doubleAchieved={loggedEmp?.doubleTargetAchieved || false}
          />

          <div className="bg-white rounded-xl shadow">
            <Leaderboard apiBase={API_BASE_URL} />
          </div>
        </section>

        <DashboardMonthlyChart leads={leads} target={employeeTarget} />
      </div>
    </div>
  );
};

export default EmployeeDashboard;
