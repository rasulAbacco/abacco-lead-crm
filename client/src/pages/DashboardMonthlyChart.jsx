//client/src/pages/DashboardMonthlyChart.jsx
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";

const DashboardMonthlyChart = ({ leads, target  }) => {
  const normalizeDate = (dateStr) => {
    const d = new Date(dateStr);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  const currentYear = new Date().getFullYear();
  const monthlyLeads = Array.from({ length: 12 }, (_, i) => {
  const month = new Date(currentYear, i, 1).toLocaleString("en-US", { month: "short" });
  const count = leads.filter(l => {
    const d = normalizeDate(l.date);
    return d.getMonth() === i && d.getFullYear() === currentYear;
  }).length;
  return { month, leads: count, target: target };
});


  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <h2 className="text-xl font-bold mb-4">Monthly Performance</h2>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={monthlyLeads}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line dataKey="leads" stroke="#ec4899" strokeWidth={3} />
          <Line dataKey="target" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DashboardMonthlyChart;
