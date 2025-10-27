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
import { TrendingUp, Target, Users } from "lucide-react";

export default function PerformanceChart({ employees, performanceData, setSelectedEmployee }) {
  const [todayLeads, setTodayLeads] = useState([]);

  useEffect(() => {
    const dailyData = employees.map((emp) => ({
      id: emp.employeeId || "N/A",
      name: emp.name || "Unknown",
      leads: emp.dailyLeads || 0,
    }));
    setTodayLeads(dailyData);
  }, [employees]);

  const CustomTick = ({ x, y, payload }) => {
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={10}
          textAnchor="end"
          fill="#64748b"
          fontSize={11}
          fontWeight="500"
          transform="rotate(-25)"
        >
          {payload.value}
        </text>
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-xl border border-gray-100">
          <p className="font-semibold text-gray-900 mb-2">{payload[0].payload.name}</p>
          <div className="space-y-1">
            <p className="text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-500"></span>
              <span className="text-gray-600">Leads:</span>
              <span className="font-semibold text-violet-600">{payload[0].value}</span>
            </p>
            {payload[1] && (
              <p className="text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span className="text-gray-600">Target:</span>
                <span className="font-semibold text-amber-600">{payload[1].value}</span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const totalLeadsToday = todayLeads.reduce((sum, emp) => sum + emp.leads, 0);

  return (
    <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-3xl shadow-2xl p-8 border border-gray-200/50 overflow-x-auto w-full">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Performance Overview
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Real-time team analytics</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-violet-50 rounded-xl">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 shadow-sm"></div>
            <span className="text-sm font-medium text-gray-700">Actual</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl">
            <div className="w-3 h-3 rounded-full bg-amber-400 shadow-sm"></div>
            <span className="text-sm font-medium text-gray-700">Target</span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="w-full bg-white rounded-2xl p-6 shadow-inner border border-gray-100 overflow-x-auto">
        <div style={{ width: `${Math.max(performanceData.length * 80, 900)}px`, height: '360px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={performanceData.map(emp => ({
                name: `${emp.fullName || emp.name}`,
                leads: emp.leads || 0,
                target: emp.target || 0,
                id: emp.employeeId,
              }))}
              margin={{ top: 10, right: 10, left: 0, bottom: 80 }}
              barSize={40}
              barGap={8}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="name"
                interval={0}
                height={80}
                tick={<CustomTick />}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }} />
              <Bar
                dataKey="leads"
                fill="url(#colorLeads)"
                radius={[10, 10, 0, 0]}
                cursor="pointer"
                onClick={(data) =>
                  setSelectedEmployee(
                    employees.find((e) => e.employeeId === data.id)
                  )
                }
              />
              <Bar
                dataKey="target"
                fill="url(#colorTarget)"
                radius={[10, 10, 0, 0]}
                opacity={0.7}
              />
              <defs>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Today's Leads Section */}
      <div className="mt-8 p-6 bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-100">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Today's Leads</h3>
              <p className="text-xs text-gray-600">Last 24 hours performance</p>
            </div>
          </div>
          <div className="px-5 py-2.5 bg-white rounded-xl shadow-sm border border-violet-200">
            <div className="text-xs text-gray-500 font-medium">Total</div>
            <div className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              {totalLeadsToday}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {todayLeads.map((emp) => (
            <div
              key={emp.id}
              className="group flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-violet-300 transition-all duration-200 cursor-pointer"
            >
              <span className="font-semibold text-gray-800 group-hover:text-violet-600 transition-colors">
                {emp.name}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-violet-600 font-bold text-lg">{emp.leads}</span>
                <Target className="w-4 h-4 text-violet-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}