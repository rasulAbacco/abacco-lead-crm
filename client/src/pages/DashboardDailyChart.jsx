import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from "recharts";

const DashboardDailyChart = ({ leads }) => {
  const normalizeDate = (dateStr) => {
    const d = new Date(dateStr);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  const today = new Date();
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const dailyLeads = weekDays.map((day, i) => {
    const count = leads.filter(l => normalizeDate(l.date).getDay() === i + 1).length;
    return { day, leads: count };
  });

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <h2 className="text-xl font-bold mb-4">This Week's Leads</h2>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={dailyLeads}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="leads" fill="#a855f7" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DashboardDailyChart;
