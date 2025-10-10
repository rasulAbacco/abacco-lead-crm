import React, { useEffect, useState } from "react";
import { Plus, Building2, TrendingUp, User, Calendar, Search, Globe } from "lucide-react";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const IndustryPage = () => {
  const [industryName, setIndustryName] = useState("");
  const [leadType, setLeadType] = useState("");
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [fullName, setFullName] = useState("");
  const [countryName, setCountryName] = useState(""); // ✅ New field

  // ✅ Get logged-in employee info from localStorage (or your auth context)
  useEffect(() => {
    const storedEmployeeId = localStorage.getItem("employeeId");
    const storedFullName = localStorage.getItem("fullName");

    if (storedEmployeeId && storedFullName) {
      setEmployeeId(storedEmployeeId);
      setFullName(storedFullName);
    } else {
      console.warn("Employee info not found in localStorage");
    }
  }, []);

  // ✅ Fetch all industries
  const fetchIndustries = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/industry`);
      const data = await res.json();
      if (data.success) setIndustries(data.industries);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchIndustries();
  }, []);

  // ✅ Handle form submission
  const handleSubmit = async () => {
    if (!employeeId || !fullName) {
      alert("Employee info missing. Please log in again.");
      return;
    }

    if (!industryName || !leadType) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/industry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          fullName,
          industryName,
          leadType,
          countryName, // ✅ Added here
        }),
      });

      const data = await res.json();

      if (data.success) {
        setIndustryName("");
        setLeadType("");
        fetchIndustries();
        setCountryName(""); // ✅ Reset field
      } else {
        alert(data.message || "Something went wrong");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  const filteredIndustries = industries.filter(
    (ind) =>
      ind.industryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ind.leadType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ind.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ind.countryName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <Building2 className="text-indigo-600" size={32} />
                Industry Management
              </h1>
              <p className="text-slate-600 mt-1">Manage and track your industry leads</p>
            </div>

            {/* ✅ Display employee info */}
            {employeeId && fullName && (
              <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-lg">
                <User className="text-indigo-600" size={20} />
                <div className="text-sm">
                  <p className="font-semibold text-slate-900">{fullName}</p>
                  <p className="text-slate-600">{employeeId}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Plus size={24} />
              Add New Industry Lead
            </h2>
          </div>

          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Building2 size={16} className="text-indigo-600" />
                  Industry Name
                </label>
                <input
                  type="text"
                  value={industryName}
                  onChange={(e) => setIndustryName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                  placeholder="e.g., Healthcare, Technology"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <TrendingUp size={16} className="text-indigo-600" />
                  Lead Type
                </label>
                <select
                  value={leadType}
                  onChange={(e) => setLeadType(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none bg-white"
                >
                  <option value="">Select Lead Type</option>
                  <option value="Association Lead">Association Lead</option>
                  <option value="Attendees Lead">Attendees Lead</option>
                  <option value="Industry Lead">Industry Lead</option>
                </select>
              </div>
              {/* ✅ Country Name */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Globe size={16} className="text-indigo-600" />
                  Country Name
                </label>
                <input
                  type="text"
                  value={countryName}
                  onChange={(e) => setCountryName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                  placeholder="e.g., India, USA, Germany"
                />
              </div>
            </div>




            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Plus size={20} />
                    Add Industry Lead
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-bold text-slate-900">
                All Industry Leads
                <span className="ml-3 text-sm font-normal text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                  {filteredIndustries.length}{" "}
                  {filteredIndustries.length === 1 ? "entry" : "entries"}
                </span>
              </h2>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search industries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none w-full sm:w-64"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Employee ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Full Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Industry Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Lead Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Country</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredIndustries.length > 0 ? (
                  filteredIndustries.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{d.employeeId}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{d.fullName}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        <span className="flex items-center gap-2">
                          <Building2 size={16} className="text-indigo-600" />
                          {d.industryName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${d.leadType === "Hot"
                              ? "bg-red-100 text-red-700"
                              : d.leadType === "Warm"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                        >
                          {d.leadType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">{d.countryName}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <span className="flex items-center gap-2">
                          <Calendar size={16} className="text-slate-400" />
                          {new Date(d.createdAt).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                      {searchTerm ? "No matching results found" : "No industry leads yet. Add your first one above!"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndustryPage;
