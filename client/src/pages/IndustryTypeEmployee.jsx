import React, { useEffect, useState } from "react";
import { Plus, Building2, TrendingUp, User, Calendar, Search, Globe, Filter, ChevronDown, Sparkles, MapPin, Clock, X } from "lucide-react";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const IndustryPage = () => {
  const [industryName, setIndustryName] = useState("");
  const [leadType, setLeadType] = useState("");
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [fullName, setFullName] = useState("");
  const [countryName, setCountryName] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedLeadType, setSelectedLeadType] = useState("All");
  const [showForm, setShowForm] = useState(false);

  // Get logged-in employee info from localStorage
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

  // Fetch all industries
  const fetchIndustries = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/industry`);
      const data = await res.json();
      if (data.success) {
        // Sort by createdAt (newest first)
        const sortedIndustries = data.industries.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setIndustries(sortedIndustries);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchIndustries();
  }, []);

  // Handle form submission
  const handleSubmit = async () => {
    if (!employeeId || !fullName) {
      alert("Employee info missing. Please log in again.");
      return;
    }

    if (!industryName || !leadType || !countryName) {
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
          countryName,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setIndustryName("");
        setLeadType("");
        setCountryName("");
        fetchIndustries();
        setShowForm(false); // Close form after successful submission
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

  // Filter industries based on search term and lead type
  const filteredIndustries = industries.filter((ind) => {
    const matchesSearch = 
      ind.industryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ind.leadType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ind.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ind.countryName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLeadType = selectedLeadType === "All" || ind.leadType === selectedLeadType;
    
    return matchesSearch && matchesLeadType;
  });

  const leadTypes = ["All", "Association Lead", "Attendees Lead", "Industry Lead"];

  const getLeadTypeColor = (type) => {
    switch(type) {
      case "Association Lead":
        return { bg: "bg-gradient-to-r from-purple-500 to-pink-500", text: "text-white" };
      case "Attendees Lead":
        return { bg: "bg-gradient-to-r from-emerald-500 to-teal-500", text: "text-white" };
      case "Industry Lead":
        return { bg: "bg-gradient-to-r from-blue-500 to-cyan-500", text: "text-white" };
      default:
        return { bg: "bg-gradient-to-r from-gray-500 to-gray-600", text: "text-white" };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <div className="relative backdrop-blur-lg bg-white/70 border-b border-white/20 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                  <Building2 className="text-white" size={28} />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Working Industry Management
                  </h1>
                  <p className="text-slate-600 mt-1 flex items-center gap-2">
                    <Sparkles className="text-yellow-500" size={16} />
                    Manage and track your working industry leads
                  </p>
                </div>
              </div>
            </div>

            {employeeId && fullName && (
              <div className="flex items-center gap-3 bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-3 rounded-2xl border border-indigo-200 shadow-lg">
                <div className="p-2 bg-white rounded-xl">
                  <User className="text-indigo-600" size={20} />
                </div>
                <div className="text-sm">
                  <p className="font-bold text-slate-900">{fullName}</p>
                  <p className="text-slate-600">{employeeId}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="relative max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Add Industry Button */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center gap-3 transform hover:scale-105"
          >
            {showForm ? (
              <>
                <X size={20} />
                Cancel
              </>
            ) : (
              <>
                <Plus size={20} />
                Add Working Industry
              </>
            )}
          </button>
        </div>

        {/* Form Card - Only visible when showForm is true */}
        {showForm && (
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 overflow-hidden transform transition-all duration-500 ease-in-out">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur">
                  <Plus size={24} />
                </div>
                Add New Working Industry
              </h2>
            </div>

            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                    <div className="p-1 bg-indigo-100 rounded-lg">
                      <Building2 size={16} className="text-indigo-600" />
                    </div>
                    Industry Name
                  </label>
                  <input
                    type="text"
                    value={industryName}
                    onChange={(e) => setIndustryName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none bg-gradient-to-r from-indigo-50 to-purple-50"
                    placeholder="e.g., Healthcare, Technology"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                    <div className="p-1 bg-indigo-100 rounded-lg">
                      <TrendingUp size={16} className="text-indigo-600" />
                    </div>
                    Lead Type
                  </label>
                  <select
                    value={leadType}
                    onChange={(e) => setLeadType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none bg-gradient-to-r from-indigo-50 to-purple-50"
                  >
                    <option value="">Select Lead Type</option>
                    <option value="Association Lead">Association Lead</option>
                    <option value="Attendees Lead">Attendees Lead</option>
                    <option value="Industry Lead">Industry Lead</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                    <div className="p-1 bg-indigo-100 rounded-lg">
                      <Globe size={16} className="text-indigo-600" />
                    </div>
                    Country Name
                  </label>
                  <input
                    type="text"
                    value={countryName}
                    onChange={(e) => setCountryName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none bg-gradient-to-r from-indigo-50 to-purple-50"
                    placeholder="e.g., India, USA, Germany"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 transform hover:scale-105"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Plus size={20} />
                      Add Working Industry
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter and Search Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-6 relative z-10">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              {/* Search */}
              <div className="relative flex-grow sm:flex-grow-0">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-indigo-400" size={20} />
                <input
                  type="text"
                  placeholder="Search industries, names, countries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all outline-none w-full sm:w-80 placeholder:text-slate-500"
                />
              </div>

              {/* Lead Type Filter */}
              <div className="relative">
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  <Filter size={20} />
                  <span className="font-medium">Lead Type: {selectedLeadType}</span>
                  <ChevronDown size={20} className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {filterOpen && (
                  <div className="absolute top-full mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-indigo-100 z-50 overflow-hidden">
                    <div className="p-2">
                      {leadTypes.map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            setSelectedLeadType(type);
                            setFilterOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                            selectedLeadType === type
                              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                              : 'hover:bg-indigo-50 text-slate-700'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-200/50 bg-gradient-to-r from-indigo-50 to-purple-50">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-md">
                <Building2 className="text-indigo-600" size={20} />
              </div>
              All Working Industry
              <span className="ml-3 text-sm font-normal text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                {filteredIndustries.length} {filteredIndustries.length === 1 ? "result" : "results"}
              </span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-indigo-50 border-b border-slate-200/50">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Employee</th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Industry</th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Lead Type</th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Location</th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50">
                {filteredIndustries.length > 0 ? (
                  filteredIndustries.map((d, index) => (
                    <tr key={d.id} className={`hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 ${index === 0 ? 'border-t-2 border-indigo-200' : ''}`}>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl">
                            <User className="text-indigo-600" size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{d.fullName}</p>
                            <p className="text-xs text-slate-500">{d.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl">
                            <Building2 size={16} className="text-blue-600" />
                          </div>
                          <p className="text-sm font-semibold text-slate-800">{d.industryName}</p>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-bold shadow-md ${getLeadTypeColor(d.leadType).bg} ${getLeadTypeColor(d.leadType).text}`}>
                          {d.leadType}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-slate-700">
                          <MapPin size={16} className="text-indigo-400" />
                          <span className="text-sm font-medium">{d.countryName}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock size={16} className="text-indigo-400" />
                          <span className="text-sm">{new Date(d.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl">
                          <Search className="text-indigo-600" size={48} />
                        </div>
                        <p className="text-xl font-semibold text-slate-700">
                          {searchTerm || selectedLeadType !== "All" ? "No matching results found" : "No working industry leads yet."}
                        </p>
                        <p className="text-sm text-slate-500">
                          {searchTerm || selectedLeadType !== "All" ? "Try adjusting your filters" : "Start by adding your first industry lead"}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default IndustryPage;