import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import {
  TrendingUp,
  Target,
  Users,
  Award,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Zap,
  Flame,
} from "lucide-react";

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
      const empData = employees.find(e => e.employeeId === emp.employeeId || e.id === emp.employeeId);

      return {
        name: `${emp.fullName || emp.name}`,
        totalLeads: emp.leads || emp.monthlyLeads || 0,
        target: emp.target || 0,
        qualified: empData?.qualifiedLeads || 0,
        disqualified: empData?.disqualifiedLeads || 0,
        pending: empData?.pendingLeads || ((emp.leads || emp.monthlyLeads || 0) - (empData?.qualifiedLeads || 0) - (empData?.disqualifiedLeads || 0)),
        id: emp.employeeId,
        achievement: emp.target ? Math.round(((emp.leads || emp.monthlyLeads || 0) / emp.target) * 100) : 0,
      };
    });

    setChartData(enrichedData);
  }, [performanceData, employees]);

  const CustomTick = ({ x, y, payload }) => {
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={10}
          textAnchor="end"
          fill="#475569"
          fontSize={11}
          fontWeight="600"
          transform="rotate(-35)"
        >
          {payload.value}
        </text>
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white backdrop-blur-xl px-6 py-4 rounded-2xl shadow-2xl border border-gray-200 w-full">
          <p className="font-bold text-gray-900 mb-3 text-base">{data.name}</p>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"></div>
                Total Leads
              </span>
              <span className="font-bold text-cyan-600">{data.totalLeads}</span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-green-600"></div>
                Qualified
              </span>
              <span className="font-bold text-emerald-600">{data.qualified}</span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-600"></div>
                Disqualified
              </span>
              <span className="font-bold text-rose-600">{data.disqualified}</span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600"></div>
                Pending
              </span>
              <span className="font-bold text-amber-600">{data.pending}</span>
            </div>
            <div className="pt-2.5 mt-2.5 border-t border-gray-200">
              <div className="flex items-center justify-between gap-6 mb-1.5">
                <span className="text-sm text-gray-600">Target</span>
                <span className="font-bold text-gray-900">{data.target}</span>
              </div>
              <div className="flex items-center justify-between gap-6">
                <span className="text-sm text-gray-600">Achievement</span>
                <span className={`font-bold ${data.achievement >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {data.achievement}%
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const totalLeadsToday = todayLeads.reduce((sum, emp) => sum + emp.leads, 0);
  const totalQualified = chartData.reduce((sum, emp) => sum + emp.qualified, 0);
  const totalDisqualified = chartData.reduce((sum, emp) => sum + emp.disqualified, 0);
  const totalPending = chartData.reduce((sum, emp) => sum + emp.pending, 0);
  const totalTarget = chartData.reduce((sum, emp) => sum + emp.target, 0);
  const overallAchievement = totalTarget ? Math.round((chartData.reduce((sum, emp) => sum + emp.totalLeads, 0) / totalTarget) * 100) : 0;

  const topPerformers = [...chartData]
    .sort((a, b) => b.totalLeads - a.totalLeads)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 w-full">
      <div className="w-full mx-auto space-y-4 md:space-y-6">
        
        {/* Header Section */}
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="relative bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 px-4 md:px-8 py-6 md:py-8">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
            
            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 md:gap-6">
              <div className="flex items-center gap-3 md:gap-5">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-white/20 backdrop-blur-lg flex items-center justify-center shadow-xl border border-white/20">
                  <Zap className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">
                    Performance Analytics
                  </h2>
                  <p className="text-cyan-100 mt-1 md:mt-1.5 font-medium text-xs md:text-sm">Real-time team insights & lead tracking</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-xl md:rounded-2xl p-1 md:p-1.5 border border-white/10 shadow-xl">
                <button
                  onClick={() => setActiveMetric('all')}
                  className={`px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all duration-200 ${
                    activeMetric === 'all'
                      ? 'bg-white text-blue-600 shadow-lg'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  All Leads
                </button>
                <button
                  onClick={() => setActiveMetric('qualified')}
                  className={`px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all duration-200 ${
                    activeMetric === 'qualified'
                      ? 'bg-white text-emerald-600 shadow-lg'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Qualified
                </button>
                <button
                  onClick={() => setActiveMetric('disqualified')}
                  className={`px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all duration-200 ${
                    activeMetric === 'disqualified'
                      ? 'bg-white text-rose-600 shadow-lg'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Disqualified
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 p-4 md:p-6 lg:p-8">
            <div className="group relative bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl md:rounded-2xl p-4 md:p-5 border border-cyan-200 hover:border-cyan-300 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Target className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <span className="text-xs font-bold text-cyan-600 bg-cyan-100 px-2 md:px-3 py-1 rounded-full">
                  Total
                </span>
              </div>
              <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent">
                {chartData.reduce((sum, emp) => sum + emp.totalLeads, 0)}
              </div>
              <div className="text-xs text-gray-600 mt-1 md:mt-1.5 font-semibold">All Leads</div>
            </div>

            <div className="group relative bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl md:rounded-2xl p-4 md:p-5 border border-emerald-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 md:px-3 py-1 rounded-full">
                  Success
                </span>
              </div>
              <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
                {totalQualified}
              </div>
              <div className="text-xs text-gray-600 mt-1 md:mt-1.5 font-semibold">Qualified</div>
            </div>

            <div className="group relative bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl md:rounded-2xl p-4 md:p-5 border border-rose-200 hover:border-rose-300 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
                  <XCircle className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 md:px-3 py-1 rounded-full">
                  Lost
                </span>
              </div>
              <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-rose-600 to-pink-700 bg-clip-text text-transparent">
                {totalDisqualified}
              </div>
              <div className="text-xs text-gray-600 mt-1 md:mt-1.5 font-semibold">Disqualified</div>
            </div>

            <div className="group relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl md:rounded-2xl p-4 md:p-5 border border-amber-200 hover:border-amber-300 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Clock className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 md:px-3 py-1 rounded-full">
                  Review
                </span>
              </div>
              <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-amber-600 to-orange-700 bg-clip-text text-transparent">
                {totalPending}
              </div>
              <div className="text-xs text-gray-600 mt-1 md:mt-1.5 font-semibold">Pending</div>
            </div>

            <div className="group relative bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl md:rounded-2xl p-4 md:p-5 border border-purple-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 col-span-2 md:col-span-1">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <span className={`text-xs font-bold px-2 md:px-3 py-1 rounded-full ${
                  overallAchievement >= 100
                    ? 'text-emerald-600 bg-emerald-100'
                    : 'text-amber-600 bg-amber-100'
                }`}>
                  {overallAchievement}%
                </span>
              </div>
              <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-purple-600 to-violet-700 bg-clip-text text-transparent">
                {totalTarget}
              </div>
              <div className="text-xs text-gray-600 mt-1 md:mt-1.5 font-semibold">Target</div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white w-full rounded-2xl md:rounded-3xl shadow-xl border border-gray-200 p-4 md:p-6 lg:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 mb-4 md:mb-6">
            <div>
              <h3 className="text-xl md:text-2xl font-black text-gray-900">Individual Performance</h3>
              <p className="text-gray-600 text-xs md:text-sm mt-1">Click on bars to view details</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"></div>
                <span className="text-gray-700 font-semibold">Total</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-green-600"></div>
                <span className="text-gray-700 font-semibold">Qualified</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-rose-500 to-pink-600"></div>
                <span className="text-gray-700 font-semibold">Disqualified</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span className="text-gray-700 font-semibold">Target</span>
              </div>
            </div>
          </div>

          <div className=" bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl md:rounded-2xl p-3 md:p-6 border border-gray-200 overflow-x-auto custom-scrollbar">
            <div style={{ minWidth: '700px', height: '350px' }}>
              <ResponsiveContainer>
                <BarChart
                  data={chartData}
                  barCategoryGap="10%"
                  margin={{ top: 20, right: 10, left: 0, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e4" vertical={false} opacity={0.5} />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    height={5}
                    tick={<CustomTick />}
                    axisLine={{ stroke: '#000000' }}
                  />
                  <YAxis
                    tick={{ fill: "#000000", fontSize: 12, fontWeight: 600 }}
                    axisLine={{ stroke: '#000000' }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(6, 182, 212, 0.08)' }} />

                  {activeMetric === 'all' && (
                    <>
                      <Bar
                        dataKey="totalLeads"
                        fill="url(#colorTotal)"
                        radius={[12, 12, 0, 0]}
                        cursor="pointer"
                        onClick={(data) => setSelectedEmployee(employees.find((e) => e.employeeId === data.id))}
                        animationDuration={1200}
                        barSize={25}
                      />
                      <Bar
                        dataKey="target"
                        fill="url(#colorTarget)"
                        radius={[12, 12, 0, 0]}
                        barSize={25}
                        animationDuration={1200}
                        animationBegin={200}
                      />
                    </>
                  )}

                  {activeMetric === 'qualified' && (
                    <>
                      <Bar
                        dataKey="qualified"
                        fill="url(#colorQualified)"
                        radius={[12, 12, 0, 0]}
                        cursor="pointer"
                        onClick={(data) => setSelectedEmployee(employees.find((e) => e.employeeId === data.id))}
                        animationDuration={1200}
                        barSize={25}
                      />
                      <Bar
                        dataKey="target"
                        fill="url(#colorTargetQualified)"
                        radius={[12, 12, 0, 0]}
                        barSize={25}
                        animationDuration={1200}
                        animationBegin={200}
                      />
                    </>
                  )}

                  {activeMetric === 'disqualified' && (
                    <>
                      <Bar
                        dataKey="disqualified"
                        fill="url(#colorDisqualified)"
                        radius={[12, 12, 0, 0]}
                        cursor="pointer"
                        onClick={(data) => setSelectedEmployee(employees.find((e) => e.employeeId === data.id))}
                        animationDuration={1200}
                        barSize={25}
                      />
                      <Bar
                        dataKey="target"
                        fill="url(#colorTargetDisqualified)"
                        radius={[12, 12, 0, 0]}
                        barSize={25}
                        animationDuration={1200}
                        animationBegin={200}
                      />
                    </>
                  )}

                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7F27FF" stopOpacity={1} />
                      <stop offset="50%" stopColor="#7F27FF" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#a927ff" stopOpacity={0.9} />
                    </linearGradient>

                    <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00D4FF" stopOpacity={1} />
                      <stop offset="100%" stopColor="#020024" stopOpacity={1} />
                    </linearGradient>

                    <linearGradient id="colorQualified" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#08CB00" stopOpacity={1} />
                      <stop offset="100%" stopColor="#08CB00" stopOpacity={0.3} />
                    </linearGradient>

                    <linearGradient id="colorTargetQualified" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7F27FF" stopOpacity={1} />
                      <stop offset="50%" stopColor="#7F27FF" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#a927ff" stopOpacity={0.9} />
                    </linearGradient>

                    <linearGradient id="colorDisqualified" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
                      <stop offset="50%" stopColor="#e11d48" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#be123c" stopOpacity={0.9} />
                    </linearGradient>

                    <linearGradient id="colorTargetDisqualified" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7F27FF" stopOpacity={1} />
                      <stop offset="50%" stopColor="#7F27FF" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#a927ff" stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Performers Section */}
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-gray-200 p-4 md:p-6 lg:p-8">
          <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Award className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-xl md:text-2xl">Top Performers</h3>
              <p className="text-xs text-gray-600 font-medium mt-0.5">This month's champions</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {topPerformers.map((emp, index) => (
              <div
                key={emp.id}
                className="group relative bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-5 rounded-xl md:rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 overflow-visible"
              >
                {/* First Place Crown and Blast Effect */}
                {index === 0 && (
                  <>
                    {/* 3D Crown */}
                    <div className="absolute -top-6 md:-top-8 left-1/2 -translate-x-1/2 z-20">
                      <div className="relative animate-float">
                        {/* Crown glow */}
                        <div className="absolute inset-0 blur-2xl bg-yellow-400 opacity-60 animate-pulse rounded-full"></div>

                        {/* 3D Crown using SVG for better rendering */}
                        <div className="relative w-10 h-10 md:w-12 md:h-12">
                          {/* Shadow layers for 3D effect */}
                          <svg className="absolute top-1 left-1 w-full h-full opacity-20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L15 8L21 9L16.5 13.5L18 20L12 16L6 20L7.5 13.5L3 9L9 8L12 2Z" fill="#78350f" />
                          </svg>
                          <svg className="absolute top-0.5 left-0.5 w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L15 8L21 9L16.5 13.5L18 20L12 16L6 20L7.5 13.5L3 9L9 8L12 2Z" fill="url(#crownGradient)" />
                            <defs>
                              <linearGradient id="crownGradient" x1="12" y1="2" x2="12" y2="20" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="#fbbf24" />
                                <stop offset="50%" stopColor="#f59e0b" />
                                <stop offset="100%" stopColor="#d97706" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <svg className="relative w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.8)) drop-shadow(0 2px 8px rgba(217, 119, 6, 0.6))' }}>
                            <path d="M12 2L15 8L21 9L16.5 13.5L18 20L12 16L6 20L7.5 13.5L3 9L9 8L12 2Z" fill="#fde047" />
                          </svg>

                          {/* Shine effects */}
                          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full opacity-90 animate-ping"></div>
                          <div className="absolute top-2 right-2 w-1 h-1 bg-white rounded-full opacity-80"></div>
                        </div>
                      </div>
                    </div>

                    {/* Blast Animation - Spotlight Style */}
                    {showBlast && (
                      <div key={blastKey} className="absolute inset-0 pointer-events-none z-30 overflow-visible">
                        {/* Large spotlight burst from top */}
                        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-64 h-64 animate-spotlight-burst">
                          <div className="w-full h-full bg-gradient-radial from-yellow-300 via-orange-300 to-transparent opacity-80 rounded-full blur-2xl"></div>
                        </div>

                        {/* Side spotlights */}
                        <div className="absolute top-1/2 -left-20 w-40 h-40 animate-spotlight-left">
                          <div className="w-full h-full bg-gradient-radial from-amber-300 via-yellow-200 to-transparent opacity-60 rounded-full blur-xl"></div>
                        </div>

                        <div className="absolute top-1/2 -right-20 w-40 h-40 animate-spotlight-right">
                          <div className="w-full h-full bg-gradient-radial from-amber-300 via-yellow-200 to-transparent opacity-60 rounded-full blur-xl"></div>
                        </div>

                        {/* Colorful confetti explosion from center */}
                        {[...Array(25)].map((_, i) => {
                          const angle = (i * 360) / 25;
                          const distance = 120 + Math.random() * 80;
                          const colors = ['bg-yellow-400', 'bg-orange-500', 'bg-red-500', 'bg-pink-500', 'bg-purple-500', 'bg-blue-500', 'bg-green-500'];
                          const color = colors[i % colors.length];

                          return (
                            <div
                              key={`confetti-${i}`}
                              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-confetti-burst"
                              style={{
                                '--angle': `${angle}deg`,
                                '--distance': `${distance}px`,
                                '--duration': `${1.2 + Math.random() * 0.5}s`,
                                '--delay': `${Math.random() * 0.2}s`,
                                animationDelay: `var(--delay)`,
                              }}
                            >
                              <div className={`w-2 h-3 ${color} shadow-lg transform rotate-45`}></div>
                            </div>
                          );
                        })}

                        {/* Sparkles */}
                        {[...Array(15)].map((_, i) => {
                          const angle = (i * 360) / 15;
                          const distance = 100;

                          return (
                            <div
                              key={`sparkle-${i}`}
                              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-sparkle-burst"
                              style={{
                                '--angle': `${angle}deg`,
                                '--distance': `${distance}px`,
                                '--delay': `${i * 0.05}s`,
                                animationDelay: `var(--delay)`,
                              }}
                            >
                              <div className="text-yellow-400 text-xl animate-twinkle">✨</div>
                            </div>
                          );
                        })}

                        {/* Glowing rings expanding outward */}
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={`ring-${i}`}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-ring-wave"
                            style={{
                              '--delay': `${i * 0.2}s`,
                              animationDelay: `var(--delay)`,
                              border: '3px solid rgba(251, 191, 36, 0.6)',
                            }}
                          ></div>
                        ))}

                        {/* Golden shimmer overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/20 via-transparent to-orange-200/20 animate-shimmer"></div>
                      </div>
                    )}

                    {/* Star of the Month badge */}
                    <div className="absolute top-2 right-2 bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-[10px] md:text-xs font-black px-2 md:px-3 py-1 rounded-full shadow-lg animate-bounce-slow z-20 whitespace-nowrap">
                      ⭐ STAR OF THE MONTH
                    </div>
                  </>
                )}

                <div className="flex items-center gap-3 md:gap-4 relative z-10">
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-xl md:text-2xl shadow-lg ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-yellow-500/30 animate-pulse-slow' :
                      index === 1 ? 'bg-gradient-to-br from-blue-500 to-blue-900 shadow-blue-900/30' :
                        'bg-gradient-to-br from-orange-500 to-amber-600 shadow-orange-500/30'
                    } text-white`}>
                    {index === 0 ? '1' : index === 1 ? '2' : '3'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 text-base md:text-lg truncate">{emp.name}</div>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1.5">
                      <div className="text-sm text-gray-600">
                        <span className="font-bold text-cyan-600">{emp.totalLeads}</span> leads
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-emerald-600 font-semibold bg-emerald-100 px-2 py-0.5 rounded-md">
                          ✓ {emp.qualified}
                        </span>
                        <span className="text-xs text-rose-600 font-semibold bg-rose-100 px-2 py-0.5 rounded-md">
                          ✗ {emp.disqualified}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-2xl md:text-2xl font-black ${emp.achievement >= 100
                        ? 'bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent'
                        : 'bg-gradient-to-r from-amber-600 to-orange-700 bg-clip-text text-transparent'
                      }`}>
                      {emp.achievement}%
                    </div>
                    {emp.achievement >= 100 && (
                      <div className="flex justify-end mt-1">
                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-5deg); }
          50% { transform: translateY(-8px) rotate(5deg); }
        }

        @keyframes spotlight-burst {
          0% {
            transform: translate(-50%, 0) scale(0.3);
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
          100% {
            transform: translate(-50%, 50px) scale(1.5);
            opacity: 0;
          }
        }

        @keyframes spotlight-left {
          0% {
            transform: translateX(0) scale(0.5);
            opacity: 0;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translateX(-30px) scale(1);
            opacity: 0;
          }
        }

        @keyframes spotlight-right {
          0% {
            transform: translateX(0) scale(0.5);
            opacity: 0;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translateX(30px) scale(1);
            opacity: 0;
          }
        }

        @keyframes confetti-burst {
          0% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0) scale(0) rotate(0deg);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateY(calc(-1 * var(--distance))) scale(1) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes sparkle-burst {
          0% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0) scale(0);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateY(calc(-1 * var(--distance))) scale(1);
            opacity: 0;
          }
        }

        @keyframes ring-wave {
          0% {
            width: 30px;
            height: 30px;
            opacity: 1;
          }
          100% {
            width: 250px;
            height: 250px;
            opacity: 0;
          }
        }

        @keyframes shimmer {
          0% {
            opacity: 0;
          }
          50% {
            opacity: 0.3;
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes twinkle {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: scale(1.3) rotate(180deg);
            opacity: 0.7;
          }
        }

        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-spotlight-burst {
          animation: spotlight-burst 1.5s ease-out forwards;
        }

        .animate-spotlight-left {
          animation: spotlight-left 1.2s ease-out forwards;
        }

        .animate-spotlight-right {
          animation: spotlight-right 1.2s ease-out forwards;
        }

        .animate-confetti-burst {
          animation: confetti-burst var(--duration) ease-out forwards;
        }

        .animate-sparkle-burst {
          animation: sparkle-burst 1.5s ease-out forwards;
        }

        .animate-ring-wave {
          animation: ring-wave 1.8s ease-out forwards;
        }

        .animate-shimmer {
          animation: shimmer 1.5s ease-in-out forwards;
        }

        .animate-twinkle {
          animation: twinkle 1s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }

        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
      `}</style>
        </div>

        {/* Today's Activity Section */}
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-gray-200 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 md:mb-6">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Flame className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </div>
          <div>
            <h3 className="font-black text-gray-900 text-xl md:text-2xl">Today's Leads Activity</h3>
            <p className="text-xs text-gray-600 font-medium mt-0.5">Last 24 hours</p>
          </div>
        </div>
        <div className="px-4 md:px-5 py-2.5 md:py-3 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl md:rounded-2xl border border-cyan-200 shadow-md">
          <div className="text-xs text-cyan-700 font-bold uppercase tracking-wide">Total</div>
          <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent">
            {totalLeadsToday}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {sortedLeads.map((emp, index) => {
          const isHighest = emp.leads === highestLeads && emp.leads > 0;
          const isTop3 = index < 3 && emp.leads > 0;
          
          return (
            <div
              key={emp.id}
              className={`group relative p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                isHighest 
                  ? 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-amber-300 hover:border-amber-400 hover:shadow-xl shadow-lg shadow-amber-200/50 animate-pulse-glow'
                  : isTop3
                  ? 'bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200 hover:border-cyan-300 hover:shadow-lg'
                  : 'bg-gradient-to-br from-gray-50 to-blue-50 border-gray-200 hover:border-blue-300 hover:shadow-md'
              }`}
            >
              {/* Highest performer special effects */}
              {isHighest && (
                <>
                  {/* Glowing border animation */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 opacity-0 group-hover:opacity-20 blur-xl animate-glow-pulse"></div>
                  
                  {/* Top badge */}
                  <div className="absolute -top-2 -right-2 bg-gradient-to-br from-amber-400 to-orange-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg animate-bounce-gentle z-10">
                    🔥 TOP
                  </div>
                  
                  {/* Sparkle effects */}
                  <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-amber-400 rounded-full animate-sparkle-1"></div>
                  <div className="absolute top-2 right-3 w-1 h-1 bg-yellow-400 rounded-full animate-sparkle-2"></div>
                  <div className="absolute bottom-2 left-2 w-1 h-1 bg-orange-400 rounded-full animate-sparkle-3"></div>
                  
                  {/* Shine sweep */}
                  <div className="absolute inset-0 rounded-xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-shine-sweep"></div>
                  </div>
                </>
              )}

              {/* Top 3 badge (for 2nd and 3rd place) */}
              {isTop3 && !isHighest && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-br from-amber-400 to-orange-500 text-black text-[10px] font-black px-2 py-1 rounded-full shadow-md z-10">
                  #{index + 1}
                </div>
              )}

              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {/* Trending icon for top performers */}
                  {isTop3 && (
                    <div className={`${
                      isHighest 
                        ? 'text-amber-500 animate-bounce-gentle' 
                        : 'text-cyan-500'
                    }`}>
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  )}
                  
                  <span className={`font-bold transition-colors text-sm truncate ${
                    isHighest 
                      ? 'text-amber-900 group-hover:text-orange-900' 
                      : 'text-gray-800 group-hover:text-gray-900'
                  }`}>
                    {emp.name}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xl md:text-2xl font-black ${
                    isHighest
                      ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent animate-gradient-shift'
                      : isTop3
                      ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent'
                  }`}>
                    {emp.leads}
                  </span>
                  
                  <div className={`w-2 h-2 rounded-full shadow-lg transition-transform ${
                    isHighest
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-amber-500/50 animate-pulse-dot'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-cyan-500/50 group-hover:scale-125'
                  }`}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(251, 191, 36, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(251, 191, 36, 0.5), 0 0 40px rgba(251, 191, 36, 0.2);
          }
        }

        @keyframes glow-pulse {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 0.3;
          }
        }

        @keyframes bounce-gentle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }

        @keyframes sparkle-1 {
          0%, 100% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1.5);
          }
        }

        @keyframes sparkle-2 {
          0%, 100% {
            opacity: 0;
            transform: scale(0);
          }
          33% {
            opacity: 1;
            transform: scale(1.5);
          }
        }

        @keyframes sparkle-3 {
          0%, 100% {
            opacity: 0;
            transform: scale(0);
          }
          66% {
            opacity: 1;
            transform: scale(1.5);
          }
        }

        @keyframes shine-sweep {
          0% {
            transform: translateX(-100%) skewX(-20deg);
          }
          100% {
            transform: translateX(200%) skewX(-20deg);
          }
        }

        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes pulse-dot {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.3);
            opacity: 0.8;
          }
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .animate-glow-pulse {
          animation: glow-pulse 2s ease-in-out infinite;
        }

        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }

        .animate-sparkle-1 {
          animation: sparkle-1 2s ease-in-out infinite;
        }

        .animate-sparkle-2 {
          animation: sparkle-2 2s ease-in-out infinite 0.3s;
        }

        .animate-sparkle-3 {
          animation: sparkle-3 2s ease-in-out infinite 0.6s;
        }

        .animate-shine-sweep {
          animation: shine-sweep 3s ease-in-out infinite;
        }

        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite;
        }

        .animate-pulse-dot {
          animation: pulse-dot 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>

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