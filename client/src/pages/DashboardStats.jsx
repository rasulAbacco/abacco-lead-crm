import { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, Award, Activity, Zap } from "lucide-react";

const DashboardStats = ({ leads }) => {
  const [monthlyTarget, setMonthlyTarget] = useState(60); // default fallback

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const normalizeDate = (dateStr) => {
    const d = new Date(dateStr);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  const today = normalizeDate(new Date());
  const todayLeads = leads.filter(
    (l) => normalizeDate(l.date).getTime() === today.getTime()
  ).length;

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dailyLeads = weekDays.map((_, i) =>
    leads.filter((l) => normalizeDate(l.date).getDay() === i + 1).length
  );
  const weekTotal = dailyLeads.reduce((sum, n) => sum + n, 0);

  const monthlyLeads = leads.filter((l) => {
    const d = normalizeDate(l.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const achievementRate = Math.round((monthlyLeads / monthlyTarget) * 100);
  const avgDaily = weekTotal / weekDays.length;

  // ✅ Fetch employee target from backend
  useEffect(() => {
    async function fetchTarget() {
      try {
        const employeeId = localStorage.getItem("employeeId"); // saved at login
        if (!employeeId) {
          console.warn("Employee ID missing from localStorage");
          return;
        }

        const res = await axios.get(
          `http://localhost:4000/api/employees/${employeeId}/target`
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Today's Leads"
        value={todayLeads}
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
