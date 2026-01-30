import { useEffect, useState } from "react";
import axios from "axios";
import { toZonedTime } from "date-fns-tz";
import { Calendar, Award, Activity, Zap } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const USA_TZ = "America/Chicago"; // ✅ Central USA timezone

const DashboardStats = ({ leads }) => {
  const [monthlyTarget, setMonthlyTarget] = useState(60); // default fallback
  const [todayCount, setTodayCount] = useState(0); // fetched from backend (accurate Central Time)

  // ✅ Convert any date string into Central USA date (no time component)
  const normalizeDate = (dateStr) => {
    const d = toZonedTime(new Date(dateStr), USA_TZ);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  // ✅ Get today's date in Central USA
  const nowUSA = toZonedTime(new Date(), USA_TZ);
  const today = new Date(
    nowUSA.getFullYear(),
    nowUSA.getMonth(),
    nowUSA.getDate()
  );

  // ✅ Year and month in Central Time
  const currentYear = nowUSA.getFullYear();
  const currentMonth = nowUSA.getMonth();

  // ✅ Calculate today's leads (fallback local filter)
  const todayLeads = leads.filter(
    (l) => normalizeDate(l.date).getTime() === today.getTime()
  ).length;

  // ✅ Calculate week stats (Mon–Sat based on Central Time)
  // ✅ Calculate week stats correctly (current week only, Mon–Sat)
  // ✅ Get Monday (start of week) in US Central
  const getStartOfWeekUSA = (date) => {
    const d = toZonedTime(date, "America/Chicago");
    const day = d.getDay(); // Sunday = 0
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Move to Monday
    const start = new Date(d);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const startOfWeekUSA = getStartOfWeekUSA(new Date());
  const endOfWeekUSA = new Date(startOfWeekUSA);
  endOfWeekUSA.setDate(startOfWeekUSA.getDate() + 7); // end Sunday 23:59

  // ✅ Include all leads whose "date" in UTC falls within the U.S. week range
  const weekLeads = leads.filter((l) => {
    const local = toZonedTime(new Date(l.date), "America/Chicago");
    return local >= startOfWeekUSA && local < endOfWeekUSA;
  });

  const weekTotal = weekLeads.length;
  const avgDaily = weekTotal / 6;

  // ✅ Calculate month stats based on Central Time
  const monthlyLeads = leads.filter((l) => {
    const d = normalizeDate(l.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  // ✅ Stats calculations
  const achievementRate = Math.round((monthlyLeads / monthlyTarget) * 100);

  // ✅ Fetch employee monthly target
  useEffect(() => {
    async function fetchTarget() {
      try {
        const employeeId = localStorage.getItem("employeeId");
        if (!employeeId) {
          console.warn("Employee ID missing from localStorage");
          return;
        }

        const res = await axios.get(
          `${API_BASE_URL}/api/employees/${employeeId}/target`
        );

        if (res.data?.target) {
          setMonthlyTarget(res.data.target);
        }
      } catch (err) {
        console.error("Error fetching target:", err);
      }
    }

    fetchTarget();
  }, []);

  // ✅ Fetch “Today’s Leads” directly from backend (accurate Central Time)
  // useEffect(() => {
  //   async function fetchTodayLeads() {
  //     try {
  //       const res = await axios.get(`${API_BASE_URL}/api/leads/today`);
  //       if (res.data?.success) {
  //         setTodayCount(res.data.leads.length);
  //       }
  //     } catch (err) {
  //       console.error("Error fetching today's leads:", err);
  //     }
  //   }

  //   fetchTodayLeads();
  // }, []);
  // ✅ Fetch “Today’s Leads” directly from backend (accurate Central Time)
  useEffect(() => {
    async function fetchTodayLeads() {
      try {
        const token = localStorage.getItem("token");
        const employeeId = localStorage.getItem("employeeId");

        if (!token || !employeeId) {
          setTodayCount(0);
          return;
        }

        const res = await axios.get(
          `${API_BASE_URL}/api/leads/today/${employeeId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.data?.leads && Array.isArray(res.data.leads)) {
          setTodayCount(res.data.leads.length);
        } else {
          setTodayCount(0);
        }
      } catch (err) {
        console.warn("Today's leads unavailable, using fallback");
        setTodayCount(0);
      }
    }

    fetchTodayLeads();
  }, []);

  // 🧩 Stat Card Component (UI unchanged)
  const StatCard = ({ title, value, subtitle, icon: Icon, bgGradient }) => (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${bgGradient}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  // ✅ Final Render (UI same as original)
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Today's Leads"
        value={todayCount || todayLeads}
        subtitle="Excellent work!"
        icon={Zap}
        bgGradient="bg-gradient-to-br from-purple-500 to-purple-600"
      />
      <StatCard
        title="This Week"
        value={weekTotal}
        subtitle={`Avg ${avgDaily.toFixed(1)}/day`}
        icon={Activity}
        bgGradient="bg-gradient-to-br from-blue-500 to-blue-600"
      />
      <StatCard
        title="This Month"
        value={monthlyLeads}
        subtitle={`${monthlyTarget} target`}
        icon={Calendar}
        bgGradient="bg-gradient-to-br from-pink-500 to-pink-600"
      />
      <StatCard
        title="Achievement"
        value={`${achievementRate}%`}
        subtitle="Monthly target"
        icon={Award}
        bgGradient="bg-gradient-to-br from-amber-500 to-amber-600"
      />
    </div>
  );
};

export default DashboardStats;
