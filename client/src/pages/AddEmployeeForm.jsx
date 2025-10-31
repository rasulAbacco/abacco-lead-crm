import { useState } from "react";
import { UserPlus, Mail, Lock, Target, Calendar, User, CreditCard, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AddEmployeeForm = () => {
  const [formData, setFormData] = useState({
    employeeId: "",
    fullName: "",
    email: "",
    password: "",
    target: "",
    joiningDate: "",
  });
  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch(`${API_BASE_URL}/api/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      let result = {};
      try {
        result = await res.json();
      } catch (err) {
        console.error("Invalid JSON response:", err);
        result = { error: "Server returned invalid response" };
      }

      if (res.ok) {
        setStatus("success");
        setFormData({
          employeeId: "",
          fullName: "",
          email: "",
          password: "",
          target: "",
          joiningDate: "",
        });

        setTimeout(() => setStatus(null), 3000);
      } else {
        setStatus(result.error || "Failed to create employee");
      }
    } catch (err) {
      console.error("Network or server error:", err);
      setStatus("Network error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-3xl">

        <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-gray-200 overflow-hidden mb-6">
          <div className="relative bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 px-6 md:px-8 py-8">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>

            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/20 backdrop-blur-lg flex items-center justify-center shadow-xl border border-white/20">
                <UserPlus className="w-7 h-7 md:w-8 md:h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  Add New Employee
                </h2>
                <p className="text-cyan-100 mt-1 font-medium text-sm">Fill in the details to onboard a new team member</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-gray-200 p-6 md:p-8">
          <div className="space-y-5">

            <div className="group">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <CreditCard className="w-4 h-4 text-cyan-600" />
                Employee ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-200 rounded-xl shadow-sm px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all outline-none"
                  placeholder="Enter employee ID"
                  required
                />
              </div>
            </div>

            <div className="group">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <User className="w-4 h-4 text-blue-600" />
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-200 rounded-xl shadow-sm px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                  placeholder="Enter full name"
                  required
                />
              </div>
            </div>

            <div className="group">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <Mail className="w-4 h-4 text-purple-600" />
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-200 rounded-xl shadow-sm px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
                  placeholder="employee@example.com"
                  required
                />
              </div>
            </div>

            <div className="group">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <Lock className="w-4 h-4 text-rose-600" />
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-200 rounded-xl shadow-sm px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none"
                  placeholder="Create a secure password"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div className="group">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <Target className="w-4 h-4 text-emerald-600" />
                  Leads Target
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="target"
                    value={formData.target}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 rounded-xl shadow-sm px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                    placeholder="e.g., 100"
                    required
                  />
                </div>
              </div>

              <div className="group">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  Joining Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="joiningDate"
                    value={formData.joiningDate}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 rounded-xl shadow-sm px-4 py-3 text-gray-900 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={status === "loading"}
                className="w-full bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 text-white font-bold py-4 px-6 rounded-xl hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3 text-lg"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Employee...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Add Employee
                  </>
                )}
              </button>
            </div>

            {status === "success" && (
              <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl animate-fade-in">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-emerald-900">Success!</p>
                  <p className="text-sm text-emerald-700 mt-0.5">Employee has been added successfully to the system.</p>
                </div>
              </div>
            )}

            {status && status !== "loading" && status !== "success" && (
              <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-rose-50 to-red-50 border-2 border-rose-200 rounded-xl animate-fade-in">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-rose-500/30">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-rose-900">Error</p>
                  <p className="text-sm text-rose-700 mt-0.5">{status}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl border border-cyan-200 p-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Important Information</p>
              <ul className="text-xs text-gray-600 mt-1 list-disc list-inside space-y-1">
                <li>Obtain the employee’s ID and email address from HR before entering the details. Ensure all information is accurate.</li>
                <li>Only administrators can edit this information. Before providing login credentials, verify that the employee’s ID is active in the “All Employees” tab.</li>
              </ul>

            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default AddEmployeeForm;