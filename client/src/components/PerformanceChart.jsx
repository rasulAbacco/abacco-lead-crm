import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useEffect, useState } from "react";
import {
  TrendingUp,
  Target,
  Users,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingDown,
  Activity
} from "lucide-react";

export default function PerformanceChart({ employees, performanceData, setSelectedEmployee }) {
  const [todayLeads, setTodayLeads] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [activeMetric, setActiveMetric] = useState('all'); // 'all', 'qualified', 'disqualified'

  useEffect(() => {
    const dailyData = employees.map((emp) => ({
      id: emp.employeeId || "N/A",
      name: emp.name || "Unknown",
      leads: emp.dailyLeads || 0,
    }));
    setTodayLeads(dailyData);
  }, [employees]);

  useEffect(() => {
    // Transform performance data to include all metrics
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

    console.log("Enriched Chart Data:", enrichedData); // Debug log
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
          fill="#64748b"
          fontSize={12}
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
        <div className="bg-white/95 backdrop-blur-xl px-5 py-4 rounded-2xl shadow-2xl border border-gray-200">
          <p className="font-bold text-gray-900 mb-3 text-base">{data.name}</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                Total Leads
              </span>
              <span className="font-bold text-blue-600">{data.totalLeads}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-green-500"></div>
                Qualified
              </span>
              <span className="font-bold text-emerald-600">{data.qualified}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-rose-500 to-red-500"></div>
                Disqualified
              </span>
              <span className="font-bold text-rose-600">{data.disqualified}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-400"></div>
                Pending
              </span>
              <span className="font-bold text-amber-600">{data.pending}</span>
            </div>
            <div className="pt-2 mt-2 border-t border-gray-200">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-600">Target</span>
                <span className="font-bold text-gray-900">{data.target}</span>
              </div>
              <div className="flex items-center justify-between gap-4 mt-1">
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
    <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50/30 rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden">

      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 px-8 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">
                Team Performance Dashboard
              </h2>
              <p className="text-blue-100 mt-1">Comprehensive lead tracking & analytics</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl p-1">
            <button
              onClick={() => setActiveMetric('all')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeMetric === 'all'
                  ? 'bg-white text-indigo-600 shadow-lg'
                  : 'text-white hover:bg-white/10'
                }`}
            >
              All Leads
            </button>
            <button
              onClick={() => setActiveMetric('qualified')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeMetric === 'qualified'
                  ? 'bg-white text-emerald-600 shadow-lg'
                  : 'text-white hover:bg-white/10'
                }`}
            >
              Qualified
            </button>
            <button
              onClick={() => setActiveMetric('disqualified')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeMetric === 'disqualified'
                  ? 'bg-white text-rose-600 shadow-lg'
                  : 'text-white hover:bg-white/10'
                }`}
            >
              Disqualified
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-8">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200/50 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              Total
            </span>
          </div>
          <div className="text-3xl font-bold text-blue-900">{chartData.reduce((sum, emp) => sum + emp.totalLeads, 0)}</div>
          <div className="text-xs text-blue-600 mt-1">All Leads</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-5 border border-emerald-200/50 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
              Success
            </span>
          </div>
          <div className="text-3xl font-bold text-emerald-900">{totalQualified}</div>
          <div className="text-xs text-emerald-600 mt-1">Qualified</div>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-red-50 rounded-2xl p-5 border border-rose-200/50 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-2">
            <XCircle className="w-5 h-5 text-rose-600" />
            <span className="text-xs font-semibold text-rose-600 bg-rose-100 px-2 py-1 rounded-full">
              Lost
            </span>
          </div>
          <div className="text-3xl font-bold text-rose-900">{totalDisqualified}</div>
          <div className="text-xs text-rose-600 mt-1">Disqualified</div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200/50 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
              Review
            </span>
          </div>
          <div className="text-3xl font-bold text-amber-900">{totalPending}</div>
          <div className="text-xs text-amber-600 mt-1">Pending</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-5 border border-purple-200/50 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${overallAchievement >= 100
                ? 'text-emerald-600 bg-emerald-100'
                : 'text-amber-600 bg-amber-100'
              }`}>
              {overallAchievement}%
            </span>
          </div>
          <div className="text-3xl font-bold text-purple-900">{totalTarget}</div>
          <div className="text-xs text-purple-600 mt-1">Target</div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="px-8 pb-8">
        <div className="bg-white rounded-2xl p-6 shadow-inner border border-gray-200 overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Individual Performance</h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                <span className="text-gray-600">Total</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-green-500"></div>
                <span className="text-gray-600">Qualified</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-rose-500 to-red-500"></div>
                <span className="text-gray-600">Disqualified</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <span className="text-gray-600">Target</span>
              </div>
            </div>
          </div>

          <div style={{ width: `${Math.max(chartData.length * 120, 1000)}px`, height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 90 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="name"
                  interval={0}
                  height={90}
                  tick={<CustomTick />}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 12, fontWeight: 600 }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} />

                {activeMetric === 'all' && (
                  <>
                    <Bar
                      dataKey="totalLeads"
                      fill="url(#colorTotal)"
                      radius={[12, 12, 0, 0]}
                      cursor="pointer"
                      onClick={(data) => setSelectedEmployee(employees.find((e) => e.employeeId === data.id))}
                      animationDuration={1000}
                      animationBegin={0}
                      filter="url(#shadow)"
                    />
                    <Bar
                      dataKey="target"
                      fill="url(#colorTarget)"
                      radius={[12, 12, 0, 0]}
                      opacity={0.5}
                      animationDuration={1000}
                      animationBegin={150}
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
                      animationDuration={1000}
                      animationBegin={0}
                      filter="url(#shadow)"
                    />
                    <Bar
                      dataKey="target"
                      fill="url(#colorTargetQualified)"
                      radius={[12, 12, 0, 0]}
                      opacity={0.5}
                      animationDuration={1000}
                      animationBegin={150}
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
                      animationDuration={1000}
                      animationBegin={0}
                      filter="url(#shadow)"
                    />
                    <Bar
                      dataKey="target"
                      fill="url(#colorTargetDisqualified)"
                      radius={[12, 12, 0, 0]}
                      opacity={0.5}
                      animationDuration={1000}
                      animationBegin={150}
                    />
                  </>
                )}

                <defs>
                  {/* Vibrant Total Leads - Ocean Blue to Electric Purple */}
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity={1} />
                    <stop offset="30%" stopColor="#3b82f6" stopOpacity={1} />
                    <stop offset="70%" stopColor="#8b5cf6" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.9} />
                  </linearGradient>

                  {/* Target - Bright Cyan with Shimmer */}
                  <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.9} />
                    <stop offset="50%" stopColor="#06b6d4" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="#0891b2" stopOpacity={0.5} />
                  </linearGradient>

                  {/* Vibrant Qualified - Fresh Green to Deep Emerald */}
                  <linearGradient id="colorQualified" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
                    <stop offset="30%" stopColor="#10b981" stopOpacity={1} />
                    <stop offset="70%" stopColor="#059669" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#047857" stopOpacity={0.9} />
                  </linearGradient>

                  {/* Target for Qualified - Mint to Teal */}
                  <linearGradient id="colorTargetQualified" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5eead4" stopOpacity={0.7} />
                    <stop offset="50%" stopColor="#2dd4bf" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.3} />
                  </linearGradient>

                  {/* Vibrant Disqualified - Hot Pink to Deep Red */}
                  <linearGradient id="colorDisqualified" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb7185" stopOpacity={1} />
                    <stop offset="30%" stopColor="#f43f5e" stopOpacity={1} />
                    <stop offset="70%" stopColor="#e11d48" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#be123c" stopOpacity={0.9} />
                  </linearGradient>

                  {/* Target for Disqualified - Warm Orange */}
                  <linearGradient id="colorTargetDisqualified" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fdba74" stopOpacity={0.7} />
                    <stop offset="50%" stopColor="#fb923c" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0.3} />
                  </linearGradient>

                  {/* Glow Effect */}
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>

                  {/* Shadow Effect */}
                  <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="6" stdDeviation="5" floodOpacity="0.25" floodColor="#000000" />
                  </filter>

                  {/* Soft Shadow for subtle effect */}
                  <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.15" floodColor="#000000" />
                  </filter>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Performers Section */}
      <div className="px-8 pb-6">
        <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200/50">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Top Performers</h3>
              <p className="text-xs text-gray-600">This month's leaders</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topPerformers.map((emp, index) => (
              <div
                key={emp.id}
                className="flex items-center gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shadow-md ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white' :
                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                      'bg-gradient-to-br from-orange-400 to-amber-600 text-white'
                  }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900">{emp.name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {emp.totalLeads} leads
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="text-xs text-emerald-600 font-semibold">
                      ✓ {emp.qualified} qualified
                    </div>
                    <div className="text-xs text-rose-600 font-semibold">
                      ✗ {emp.disqualified} disqualified
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${emp.achievement >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {emp.achievement}%
                  </div>
                  {emp.achievement >= 100 && (
                    <CheckCircle className="w-5 h-5 text-emerald-500 ml-auto mt-1" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's Leads Section - Full Width */}
      <div className="px-8 pb-8">
        <div className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-200/50">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Today's Leads</h3>
                <p className="text-xs text-gray-600">Last 24 hours activity</p>
              </div>
            </div>
            <div className="px-5 py-2.5 bg-white rounded-xl shadow-sm border border-indigo-200">
              <div className="text-xs text-gray-500 font-medium">Total Today</div>
              <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                {totalLeadsToday}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {todayLeads.map((emp) => (
              <div
                key={emp.id}
                className="group flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 cursor-pointer"
              >
                <span className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors text-sm">
                  {emp.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-indigo-600 font-bold text-lg">{emp.leads}</span>
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}