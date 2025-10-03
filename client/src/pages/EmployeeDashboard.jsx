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


useEffect(() => {
  const fetchEmployeesAndPerformance = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/employees");
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
        name: emp.name.split(" ")[0],
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

        const res = await axios.get(`http://localhost:4000/api/employees/${employeeId}/leads`);
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




// import { useEffect, useState } from "react";
// import axios from "axios";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   Legend,
//   AreaChart,
//   Area,
// } from "recharts";
// import {
//   TrendingUp,
//   TrendingDown,
//   Calendar,
//   Award,
//   Activity,
//   Zap,
// } from "lucide-react";

// const EmployeeDashboard = () => {
//   const [leads, setLeads] = useState([]);
//   const [loading, setLoading] = useState(true);

//   // Fetch leads from backend
//   useEffect(() => {
//     async function fetchLeads() {
//       try {
//         const res = await axios.get("http://localhost:4000/api/leads");
//         setLeads(res.data.leads || []);
//       } catch (err) {
//         console.error("Error fetching leads:", err);
//       } finally {
//         setLoading(false);
//       }
//     }
//     fetchLeads();
//   }, []);

//   const currentYear = new Date().getFullYear();
//   const currentMonth = new Date().getMonth();

//   // Daily (Mon–Sat)
//   const dailyLeads = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => {
//     const count = leads.filter(
//       (l) =>
//         new Date(l.date).getFullYear() === currentYear &&
//         new Date(l.date).toLocaleDateString("en-US", { weekday: "short" }) ===
//           day
//     ).length;
//     return { day, leads: count };
//   });

//   // Monthly (Jan–Dec, filtered by year)
//   const monthlyLeads = Array.from({ length: 12 }, (_, i) => {
//     const month = new Date(currentYear, i, 1).toLocaleString("en-US", {
//       month: "short",
//     });
//     const count = leads.filter(
//       (l) =>
//         new Date(l.date).getMonth() === i &&
//         new Date(l.date).getFullYear() === currentYear
//     ).length;
//     return { month, leads: count, target: 60 };
//   });

//   // Weekly trend (Week 1–4 for current month)
//   const weeklyTrend = ["Week 1", "Week 2", "Week 3", "Week 4"].map(
//     (week, i) => {
//       const count = leads.filter(
//         (l) =>
//           new Date(l.date).getMonth() === currentMonth &&
//           new Date(l.date).getFullYear() === currentYear &&
//           Math.ceil(new Date(l.date).getDate() / 7) === i + 1
//       ).length;
//       return { week, leads: count };
//     }
//   );

//   // Stats
//   const todayLeads = leads.filter(
//     (l) => new Date(l.date).toDateString() === new Date().toDateString()
//   ).length;

//   const weekTotal = dailyLeads.reduce((sum, d) => sum + d.leads, 0);
//   const monthTotal = monthlyLeads[currentMonth]?.leads || 0;
//   const monthlyTarget = 60;
//   const achievementRate = Math.round((monthTotal / monthlyTarget) * 100);
//   const avgDaily =
//     dailyLeads.reduce((s, d) => s + d.leads, 0) / dailyLeads.length;

//   const StatCard = ({
//     title,
//     value,
//     subtitle,
//     icon: Icon,
//     trend,
//     trendValue,
//     bgGradient,
//   }) => (
//     <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100">
//       <div className="flex items-start justify-between mb-4">
//         <div className="flex-1">
//           <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
//           <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
//           {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
//         </div>
//         <div className={`p-3 rounded-xl ${bgGradient}`}>
//           <Icon className="w-6 h-6 text-white" />
//         </div>
//       </div>
//       {trend && (
//         <div className="flex items-center gap-1">
//           {trend === "up" ? (
//             <TrendingUp className="w-4 h-4 text-green-500" />
//           ) : (
//             <TrendingDown className="w-4 h-4 text-red-500" />
//           )}
//           <span
//             className={`text-sm font-semibold ${
//               trend === "up" ? "text-green-600" : "text-red-600"
//             }`}
//           >
//             {trendValue}
//           </span>
//           <span className="text-xs text-gray-500 ml-1">vs last period</span>
//         </div>
//       )}
//     </div>
//   );

//   if (loading) {
//     return <div className="p-8 text-center">Loading leads...</div>;
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 p-8">
//       <div className="max-w-7xl mx-auto space-y-8">
//         {/* Header */}
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
//               My Performance Dashboard
//             </h1>
//             <p className="text-gray-600">
//               Track your daily and monthly lead generation progress
//             </p>
//           </div>
//           <div className="flex items-center gap-3">
//             <div className="px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
//               <span className="text-sm text-gray-600">Last updated: </span>
//               <span className="text-sm font-semibold text-gray-900">
//                 Just now
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* Stats Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//           <StatCard
//             title="Today's Leads"
//             value={todayLeads}
//             subtitle="Excellent work!"
//             icon={Zap}
//             trend="up"
//             trendValue="+25%"
//             bgGradient="bg-gradient-to-br from-purple-500 to-purple-600"
//           />
//           <StatCard
//             title="This Week"
//             value={weekTotal}
//             subtitle={`Avg ${avgDaily.toFixed(1)}/day`}
//             icon={Activity}
//             trend="up"
//             trendValue="+18%"
//             bgGradient="bg-gradient-to-br from-blue-500 to-blue-600"
//           />
//           <StatCard
//             title="This Month"
//             value={monthTotal}
//             subtitle={`${monthlyTarget} target`}
//             icon={Calendar}
//             trend="up"
//             trendValue="+32%"
//             bgGradient="bg-gradient-to-br from-pink-500 to-pink-600"
//           />
//           <StatCard
//             title="Achievement"
//             value={`${achievementRate}%`}
//             subtitle="Monthly target"
//             icon={Award}
//             trend="up"
//             trendValue="+12%"
//             bgGradient="bg-gradient-to-br from-amber-500 to-amber-600"
//           />
//         </div>

//         {/* Charts */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           {/* Daily Bar */}
//           <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
//             <h2 className="text-xl font-bold mb-4">This Week's Leads</h2>
//             <ResponsiveContainer width="100%" height={280}>
//               <BarChart data={dailyLeads}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                 <XAxis dataKey="day" />
//                 <YAxis />
//                 <Tooltip />
//                 <Bar dataKey="leads" fill="#a855f7" radius={[8, 8, 0, 0]} />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>

//           {/* Weekly Area */}
//           <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
//             <h2 className="text-xl font-bold mb-4">Weekly Trend</h2>
//             <ResponsiveContainer width="100%" height={280}>
//               <AreaChart data={weeklyTrend}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                 <XAxis dataKey="week" />
//                 <YAxis />
//                 <Tooltip />
//                 <Area dataKey="leads" stroke="#3b82f6" fill="#93c5fd" />
//               </AreaChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         {/* Monthly Line */}
//         <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
//           <h2 className="text-xl font-bold mb-4">Monthly Performance</h2>
//           <ResponsiveContainer width="100%" height={350}>
//             <LineChart data={monthlyLeads}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="month" />
//               <YAxis />
//               <Tooltip />
//               <Legend />
//               <Line dataKey="leads" stroke="#ec4899" strokeWidth={3} />
//               <Line
//                 dataKey="target"
//                 stroke="#9ca3af"
//                 strokeWidth={2}
//                 strokeDasharray="5 5"
//               />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EmployeeDashboard;
