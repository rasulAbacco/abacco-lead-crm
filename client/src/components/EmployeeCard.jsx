export default function EmployeeCard({ employee, onClose }) {
  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-indigo-100 text-sm mb-1">Selected Employee</p>
          <h3 className="text-2xl font-bold mb-4">{employee.name}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-indigo-100 text-sm">Today's Leads</p>
              <p className="text-2xl font-bold">{employee.dailyLeads}</p>
            </div>
            <div>
              <p className="text-indigo-100 text-sm">Monthly Leads</p>
              <p className="text-2xl font-bold">{employee.monthlyLeads}</p>
            </div>
            <div>
              <p className="text-indigo-100 text-sm">Target</p>
              <p className="text-2xl font-bold">{employee.target}</p>
            </div>
            <div>
              <p className="text-indigo-100 text-sm">Achievement</p>
              <p className="text-2xl font-bold">
                {Math.round((employee.monthlyLeads / employee.target) * 100)}%
              </p>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors">
          ✕
        </button>
      </div>
    </div>
  );
}
