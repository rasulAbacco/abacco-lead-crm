import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

const DashboardWeeklyChart = ({ leads }) => {
  const normalizeDate = (dateStr) => {
    const d = new Date(dateStr);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Filter leads only for current month
  const monthlyLeads = leads.filter((l) => {
    const d = normalizeDate(l.date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  // Start from 1st day of current month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

  const weeks = [];
  let weekStart = new Date(firstDayOfMonth);

  while (weekStart <= lastDayOfMonth) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    // Prevent overflow into next month
    if (weekEnd > lastDayOfMonth) {
      weekEnd.setDate(lastDayOfMonth.getDate());
    }

    // Count leads only within this week range
    const count = monthlyLeads.filter((l) => {
      const d = normalizeDate(l.date);
      return d >= weekStart && d <= weekEnd;
    }).length;

    // ✅ Reset weeks every month (starts from Week 1 again)
    weeks.push({
      week: `Week ${weeks.length + 1}`,
      leads: count,
    });

    // Move to next week
    weekStart.setDate(weekStart.getDate() + 7);
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <h2 className="text-xl font-bold mb-4">Weekly Trend (Current Month)</h2>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={weeks}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="week" />
          <YAxis />
          <Tooltip />
          <Area dataKey="leads" stroke="#3b82f6" fill="#93c5fd" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DashboardWeeklyChart;
