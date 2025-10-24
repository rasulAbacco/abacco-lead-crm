import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { toZonedTime } from "date-fns-tz";

const USA_TZ = "America/Chicago";

const DashboardMonthlyChart = ({ leads, target }) => {
  // ✅ Normalize each lead date to Central USA timezone
  const normalizeDate = (dateStr) => {
    const d = toZonedTime(new Date(dateStr), USA_TZ);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  const nowUSA = toZonedTime(new Date(), USA_TZ);
  const currentYear = nowUSA.getFullYear();

  // ✅ Prepare monthly lead data (Jan–Dec)
  const monthlyLeads = Array.from({ length: 12 }, (_, i) => {
    const monthName = new Date(currentYear, i, 1).toLocaleString("en-US", {
      month: "short",
    });

    const count = leads.filter((l) => {
      const d = normalizeDate(l.date);
      return d.getFullYear() === currentYear && d.getMonth() === i;
    }).length;

    return { month: monthName, leads: count, target: target || 60 };
  });

  return (
    <div className="relative bg-gradient-to-br from-white/60 via-purple-50/50 to-pink-50/50 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-white/40">
      {/* === Header Section === */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Monthly Performance</h2>
          <p className="text-sm text-gray-500">
            Lead progress vs monthly targets ({currentYear})
          </p>
        </div>
        <div className="px-3 py-1.5 text-xs font-semibold bg-[#6d59ff] text-white rounded-lg shadow">
          Central USA Time
        </div>
      </div>

      {/* === Chart Section === */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={monthlyLeads} margin={{ top: 15, right: 25, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="15%" stopColor="#ec4899" stopOpacity={0.9} />
                <stop offset="85%" stopColor="#00c753" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="15%" stopColor="#000000" stopOpacity={0.9} />
                <stop offset="85%" stopColor="#960ff7" stopOpacity={0.2} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fill: "#000000", fontSize: 12 }} />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#000000", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3", stroke: "#c084fc" }}
              contentStyle={{
                backgroundColor: "rgba(255,255,255,0.85)",
                border: "1px solid #f0f0f0",
                borderRadius: "10px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
              formatter={(value, name) => [
                value,
                name === "leads" ? "Leads" : "Target",
              ]}
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              wrapperStyle={{
                fontSize: "13px",
                fontWeight: 500,
                color: "#000000",
              }}
            />

            {/* Leads line (pink gradient) */}
            <Line
              type="monotone"
              dataKey="leads"
              stroke="url(#leadGradient)"
              strokeWidth={3}
              dot={{ r: 4, fill: "#ec4899" }}
              activeDot={{ r: 6, fill: "#6d59ff" }}
              name="Leads"
            />

            {/* Target line (dotted gray) */}
            <Line
              type="monotone"
              dataKey="target"
              stroke="url(#targetGradient)"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Target"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* === Footer Metrics === */}
      <div className="flex justify-between items-center mt-6 text-sm text-gray-600">
        <p>
          <span className="font-semibold text-[#6d59ff]">
            {monthlyLeads.reduce((sum, m) => sum + m.leads, 0)}
          </span>{" "}
          total leads this year
        </p>
        <p className="italic text-gray-500">📊 Updated automatically each month</p>
      </div>
    </div>
  );
};

export default DashboardMonthlyChart;
