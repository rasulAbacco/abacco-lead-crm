import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export default function AchievementPieChart({ pieData, achievedCount, totalEmployees }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Target Achievement</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={index === 0 ? "#10b981" : "#ef4444"} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Achieved</span>
          <span className="text-sm font-semibold">{achievedCount} employees</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Below Target</span>
          <span className="text-sm font-semibold">{totalEmployees - achievedCount} employees</span>
        </div>
      </div>
    </div>
  );
}
