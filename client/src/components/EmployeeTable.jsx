export default function EmployeeTable({ employees, filter, setFilter, setSelectedEmployee }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Employee Rankings</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700"
        >
          <option value="all">All Employees</option>
          <option value="highest">Highest → Lowest</option>
          <option value="lowest">Lowest → Highest</option>
          <option value="achieved">Achieved Target</option>
          <option value="below">Below Target</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Rank</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Employee</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Today</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Monthly</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Target</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {employees.map((emp, index) => (
              <tr key={emp.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedEmployee(emp)}>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-sm">
                    {index + 1}
                  </span>
                </td>
                <td className="px-6 py-4 flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold mr-3">
                    {emp.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <span className="font-medium text-gray-900">{emp.name}</span>
                </td>
                <td className="px-6 py-4 font-semibold">{emp.dailyLeads}</td>
                <td className="px-6 py-4 font-semibold">{emp.monthlyLeads}</td>
                <td className="px-6 py-4 text-gray-600">{emp.target}</td>
                <td className="px-6 py-4">
                  {emp.monthlyLeads >= emp.target ? (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      ✓ Achieved
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                      In Progress
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
