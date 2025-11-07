import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from "recharts";
import { toZonedTime } from "date-fns-tz";

const USA_TZ = "America/Chicago";

const DashboardDailyChart = ({ leads }) => {
  const normalizeDate = (dateStr) => {
    const d = toZonedTime(new Date(dateStr), USA_TZ);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  const nowUSA = toZonedTime(new Date(), USA_TZ);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const dayOfWeek = nowUSA.getDay();
  const sunday = new Date(nowUSA);
  sunday.setDate(nowUSA.getDate() - dayOfWeek);
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);

  const dailyLeads = weekDays.map((day, i) => {
    const count = leads.filter((l) => {
      const d = normalizeDate(l.date);
      return d.getDay() === i && d >= sunday && d <= saturday;
    }).length;
    return { day, leads: count };
  });

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <h2 className="text-xl font-bold mb-4">This Week's Leads (Central Time)</h2>
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
