import React, { useState, useEffect } from "react";

// Compact Circular Progress Bar Component
const CircularProgress = ({ percentage, size = 50, strokeWidth = 5 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const dash = (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#f3f4f6"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - dash}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-gray-800">{percentage}%</span>
      </div>
    </div>
  );
};

export default function EmployeeTable({ employees, filter, setFilter, setSelectedEmployee }) {
  const [sortedEmployees, setSortedEmployees] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized && filter !== "highest") {
      setFilter("highest");
      setIsInitialized(true);
      return;
    }

    let sorted = [...employees];

    switch (filter) {
      case "highest":
        sorted.sort((a, b) => b.qualifiedLeads - a.qualifiedLeads);
        break;
      case "lowest":
        sorted.sort((a, b) => a.qualifiedLeads - b.qualifiedLeads);
        break;
      case "achieved":
        sorted = sorted.filter(emp => emp.qualifiedLeads >= emp.target);
        break;
      case "below":
        sorted = sorted.filter(emp => emp.qualifiedLeads < emp.target);
        break;
      default:
        break;
    }

    setSortedEmployees(sorted);
    setIsInitialized(true);
  }, [employees, filter, setFilter, isInitialized]);

  const calcPerc = (qualified, target) =>
    target === 0 ? 0 : Math.min(100, Math.round((qualified / target) * 100));

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-xl border border-gray-200 p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employee Performance</h2>
          <p className="text-gray-600">Rankings based on qualified leads achievement</p>
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="appearance-none bg-white border border-gray-300 rounded-xl py-2 px-4 text-gray-700 font-medium shadow-sm"
        >
          <option value="all">All Employees</option>
          <option value="highest">Highest → Lowest</option>
          <option value="lowest">Lowest → Highest</option>
          <option value="achieved">Achieved Target</option>
          <option value="below">Below Target</option>
        </select>
      </div>

      {/* Employee Rows */}
      <div className="space-y-4">
        {sortedEmployees.map((emp, index) => {
          const percentage = calcPerc(emp.qualifiedLeads, emp.target);
          const achieved = emp.qualifiedLeads >= emp.target;
          const isTopThree = index < 3;

          return (
            <div
              key={emp.id}
              className="bg-white rounded-xl border border-gray-100 hover:border-indigo-300 shadow-sm hover:shadow-md transition cursor-pointer"
              onClick={() => setSelectedEmployee(emp)}
            >
              <div className="p-4">

                {/* FULL WIDTH GRID ROW */}
                <div className="grid grid-cols-12 items-center gap-4">

                  {/* Rank + Avatar */}
                  <div className="col-span-2 flex items-center gap-3">
                    {/* Rank */}
                    <div
                      className={`w-10 h-10 flex items-center justify-center rounded-full font-bold text-sm ${index === 0
                          ? "bg-yellow-500 text-white"
                          : index === 1
                            ? "bg-gray-400 text-white"
                            : index === 2
                              ? "bg-amber-600 text-white"
                              : "bg-indigo-100 text-indigo-800"
                        }`}
                    >
                      {index + 1}
                    </div>

                    {/* Avatar */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${isTopThree
                          ? "bg-indigo-600"
                          : "bg-blue-500"
                        }`}
                    >
                      {emp.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                  </div>

                  {/* Name + ID */}
                  <div className="col-span-3">
                    <h3 className="font-bold text-gray-900">{emp.name}</h3>
                    <p className="text-xs text-gray-500">ID: {emp.id}</p>
                  </div>

                  {/* Today */}
                  <div className="col-span-1 text-center">
                    <div className="text-md font-bold text-indigo-700">{emp.dailyLeads}</div>
                    <div className="text-[11px] text-indigo-500">Today</div>
                  </div>

                  {/* Qualified */}
                  <div className="col-span-1 text-center">
                    <div className="text-md font-bold text-purple-700">{emp.qualifiedLeads}</div>
                    <div className="text-[11px] text-purple-500">Qualified</div>
                  </div>

                  {/* Disqualified (NEW) */}
                  <div className="col-span-1 text-center">
                    <div className="text-md font-bold text-red-600">{emp.disqualifiedLeads}</div>
                    <div className="text-[11px] text-red-500">Disqualified</div>
                  </div>

                  {/* Target */}
                  <div className="col-span-1 text-center">
                    <div className="text-md font-bold text-blue-700">{emp.target}</div>
                    <div className="text-[11px] text-blue-500">Target</div>
                  </div>

                  {/* Progress + Status */}
                  <div className="col-span-3 flex items-center justify-end gap-4 mr-2">
                    <div className="flex items-center">
                      <CircularProgress percentage={percentage} size={50} strokeWidth={5} />
                      <div className="ml-2 text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {emp.qualifiedLeads}/{emp.target}
                        </div>
                        <div className="text-xs text-gray-500">
                          {percentage === 100
                            ? "Achieved!"
                            : `${100 - percentage}% left`}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${achieved
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                        }`}
                    >
                      {achieved ? "Achieved" : "In Progress"}
                    </span>
                  </div>

                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
