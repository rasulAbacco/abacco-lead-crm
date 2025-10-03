import React, { useEffect, useState } from "react";
import { Building2, User, Calendar, Search } from "lucide-react";

const IndustryPage = () => {
  const [industries, setIndustries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ get logged-in employee info from in-memory storage
  
  // Fetch all industries
  const fetchIndustries = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/industry");
      const data = await res.json();
      if (data.success) setIndustries(data.industries);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchIndustries();
  }, []);

  const filteredIndustries = industries.filter(
    (ind) =>
      ind.industryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ind.leadType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ind.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
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
            {/* <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-lg">
              <User className="text-indigo-600" size={20} />
              <div className="text-sm">
                <p className="font-semibold text-slate-900">{fullName}</p>
                <p className="text-slate-600">{employeeId}</p>
              </div>
            </div> */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Table Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-bold text-slate-900">
                All Industry Leads
                <span className="ml-3 text-sm font-normal text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                  {filteredIndustries.length} {filteredIndustries.length === 1 ? 'entry' : 'entries'}
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
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Employee ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Full Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Industry Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Lead Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Created At
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredIndustries.length > 0 ? (
                  filteredIndustries.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {d.employeeId}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {d.fullName}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        <span className="flex items-center gap-2">
                          <Building2 size={16} className="text-indigo-600" />
                          {d.industryName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          d.leadType === 'Hot' 
                            ? 'bg-red-100 text-red-700' 
                            : d.leadType === 'Warm' 
                            ? 'bg-orange-100 text-orange-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {d.leadType}
                        </span>
                      </td>
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
                      {searchTerm ? 'No matching results found' : 'No industry leads available'}
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