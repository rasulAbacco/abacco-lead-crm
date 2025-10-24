import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import { TrendingUp, Target, Calendar, Award } from "lucide-react";

const DashboardMonthlyChart = ({ leads = [], target = 60 }) => {
  // Normalize date to consistent format
  const normalizeDate = (dateStr) => {
    const d = new Date(dateStr);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Prepare monthly lead data
  const monthlyLeads = Array.from({ length: 12 }, (_, i) => {
    const monthName = new Date(currentYear, i, 1).toLocaleString("en-US", {
      month: "short",
    });

    const count = leads.filter((l) => {
      const d = normalizeDate(l.date);
      return d.getFullYear() === currentYear && d.getMonth() === i;
    }).length;

    return {
      month: monthName,
      leads: count,
      target: target,
      isFuture: i > currentMonth
    };
  });

  // Calculate metrics
  const totalLeads = monthlyLeads.reduce((sum, m) => sum + m.leads, 0);
  const avgLeads = Math.round(totalLeads / (currentMonth + 1));
  const monthsAboveTarget = monthlyLeads.filter(m => !m.isFuture && m.leads >= target).length;
  const successRate = Math.round((monthsAboveTarget / (currentMonth + 1)) * 100);
  const currentMonthLeads = monthlyLeads[currentMonth].leads;
  const percentOfTarget = Math.round((currentMonthLeads / target) * 100);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-xl p-4">
          <p className="font-semibold text-gray-900 mb-2">{data.month} {currentYear}</p>
          <div className="space-y-1">
            <p className="text-sm flex items-center justify-between gap-4">
              <span className="text-gray-600">Leads:</span>
              <span className="font-bold text-purple-600">{data.leads}</span>
            </p>
            <p className="text-sm flex items-center justify-between gap-4">
              <span className="text-gray-600">Target:</span>
              <span className="font-bold text-gray-700">{data.target}</span>
            </p>
            {data.leads >= data.target && !data.isFuture && (
              <p className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1">
                <Award className="w-3 h-3" /> Target achieved!
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative bg-gradient-to-br from-slate-50 via-white to-purple-50/30 rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-3xl -z-0" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blue-200/20 to-cyan-200/20 rounded-full blur-3xl -z-0" />

      <div className="relative z-10 p-8">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Monthly Performance
              </h2>
            </div>
            <p className="text-gray-600 ml-12">
              Track your lead generation progress throughout {currentYear}
            </p>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-gray-200">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-gray-700">Central USA</span>
          </div>
        </div>

        {/* Stats Cards */}
        

        {/* Chart Section */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
          <ResponsiveContainer width="100%" height={380}>
            <AreaChart data={monthlyLeads} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />

              <XAxis
                dataKey="month"
                tick={{ fill: "#6b7280", fontSize: 13, fontWeight: 500 }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={false}
                dy={10}
              />

              <YAxis
                allowDecimals={false}
                tick={{ fill: "#6b7280", fontSize: 13, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                dx={-10}
              />

              <Tooltip content={<CustomTooltip />} />

              <Legend
                verticalAlign="top"
                height={50}
                iconType="circle"
                wrapperStyle={{
                  fontSize: "14px",
                  fontWeight: 600,
                  paddingBottom: "20px",
                }}
              />

              <Area
                type="monotone"
                dataKey="leads"
                stroke="#8b5cf6"
                strokeWidth={3}
                fill="url(#colorLeads)"
                name="Leads Generated"
                dot={{ r: 5, fill: "#8b5cf6", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 7, fill: "#7c3aed", strokeWidth: 3, stroke: "#fff" }}
              />

              <Line
                type="monotone"
                dataKey="target"
                stroke="#f59e0b"
                strokeWidth={2.5}
                strokeDasharray="8 4"
                dot={false}
                name="Monthly Target"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between text-sm">
          <p className="text-gray-600">
            <span className="font-semibold text-purple-600">Real-time tracking</span> • Updated automatically
          </p>
          <p className="text-gray-500 italic">
            {currentMonth + 1} of 12 months completed
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardMonthlyChart;