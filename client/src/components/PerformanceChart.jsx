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
        <div className="bg-white/98 backdrop-blur-xl px-6 py-4 rounded-2xl shadow-2xl border border-gray-200">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
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
                className="group relative bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-5 rounded-xl md:rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-xl md:text-2xl shadow-lg ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-yellow-500/30' :
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
                    <div className={`text-2xl md:text-2xl font-black ${
                      emp.achievement >= 100 
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
        </div>

        {/* Today's Activity Section */}
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-gray-200 p-4 md:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 md:mb-6">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Flame className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div>
                <h3 className="font-black text-gray-900 text-xl md:text-2xl">Today’s Leads Activity</h3>
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
            {todayLeads.map((emp) => (
              <div
                key={emp.id}
                className="group relative bg-gradient-to-br from-gray-50 to-blue-100 p-4 rounded-xl border border-gray-200 hover:border-cyan-300 hover:shadow-md transition-all duration-300 cursor-pointer"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800 group-hover:text-gray-900 transition-colors text-sm">
                    {emp.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl md:text-2xl font-black bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent">
                      {emp.leads}
                    </span>
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/50 group-hover:scale-125 transition-transform"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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