import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Download, Calendar, Filter, TrendingUp, Mail, Phone, Globe, MapPin, ExternalLink, Search } from "lucide-react";

export default function EmployeeLeadsPage() {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("today");
  const [monthFilter, setMonthFilter] = useState("all");
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchEmployeeLeads = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/employees/${id}/leads`);
        if (!res.ok) throw new Error("Failed to fetch leads");
        const data = await res.json();
        setEmployee(data);
      } catch (error) {
        console.error("❌ Error fetching employee leads:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployeeLeads();
  }, [id]);

  const groupLeadsByMonth = (leads) => {
    const grouped = {};
    months.forEach((m) => (grouped[m] = []));
    leads.forEach((lead) => {
      const date = new Date(lead.date);
      if (date.getFullYear() === currentYear) {
        const monthName = months[date.getMonth()];
        grouped[monthName].push(lead);
      }
    });
    return grouped;
  };

  useEffect(() => {
    if (!employee?.leads) return;
    const today = new Date();

    if (filter === "today") {
      setFilteredLeads(
        employee.leads.filter(
          (lead) => new Date(lead.date).toDateString() === today.toDateString()
        )
      );
    } else if (filter === "month") {
      const grouped = groupLeadsByMonth(employee.leads);
      if (monthFilter === "all") {
        setFilteredLeads(grouped);
      } else {
        setFilteredLeads({ [monthFilter]: grouped[monthFilter] || [] });
      }
    }
  }, [filter, employee, monthFilter]);

  const downloadCSV = () => {
    let leadsToDownload = [];

    if (filter === "today") {
      leadsToDownload = filteredLeads;
    } else if (filter === "month") {
      if (monthFilter === "all") {
        leadsToDownload = Object.entries(filteredLeads).flatMap(([month, leads]) => {
          return leads.length
            ? leads
            : [{ id: "", subjectLine: "", leadEmail: "", clientEmail: "", phone: "", website: "", country: "", date: month, emailPitch: "", emailResponce: "", link: "" }];
        });
      } else {
        leadsToDownload = filteredLeads[monthFilter].length
          ? filteredLeads[monthFilter]
          : [{ id: "", subjectLine: "", leadEmail: "", clientEmail: "", phone: "", website: "", country: "", date: monthFilter, emailPitch: "", emailResponce: "", link: "" }];
      }
    }

    if (!leadsToDownload.length) return;

    const headers = ["Lead ID,Subject Line,Lead Email,Client Email,Phone,Website,Country,Date,Email Pitch,Email Resopnce, Lead Link"];
    const rows = leadsToDownload.map(
      (lead) =>
        `${lead.id},"${lead.subjectLine}",${lead.leadEmail},${lead.clientEmail},${lead.phone},${lead.website},${lead.country},${lead.date},"${lead.emailPitch}","${lead.emailResponce}",${lead.link}`
    );

    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${employee?.name}_${filter}_${monthFilter}_leads.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getLeadsCount = () => {
    if (filter === "today") return filteredLeads.length;
    return Object.values(filteredLeads).flat().length;
  };

  const filterLeadsBySearch = (leads) => {
    if (!searchTerm) return leads;
    return leads.filter(lead =>
      lead.subjectLine?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.leadEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.clientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.website?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.country?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-600 font-medium">Loading leads...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <p className="text-slate-700 font-semibold text-lg">Employee not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              {employee?.fullName ? (
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  {employee.fullName}'s Lead Dashboard
                </h1>
              ) : (
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  Lead Dashboard
                </h1>
              )}


              <p className="text-slate-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Performance Overview • {currentYear}
              </p>
            </div>

            <div className="flex items-center gap-3 bg-blue-50 px-6 py-3 rounded-xl border border-blue-100">
              <div className="text-center">
                <p className="text-sm text-slate-600 font-medium">Total Leads</p>
                <p className="text-2xl font-bold text-blue-600">{getLeadsCount()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-slate-500" />
                <span className="text-sm font-semibold text-slate-700">Filters:</span>
              </div>

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="today">📅 Today</option>
                <option value="month">📊 By Month</option>
              </select>

              {filter === "month" && (
                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="all">All Months</option>
                  {months.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              )}

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-64"
                />
              </div>
            </div>

            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Lead Email</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Client Email</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Email Body</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Email Responce</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Website</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Country</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Lead</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filter === "today" ? (
                  filterLeadsBySearch(filteredLeads).length ? (
                    filterLeadsBySearch(filteredLeads).map((lead, idx) => (
                      <tr key={lead.id} className={`hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <span className="font-medium text-slate-900 text-sm">{lead.subjectLine}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">{lead.leadEmail}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{lead.clientEmail}</td>
                         <td className="px-6 py-4 text-sm text-slate-700">{lead.emailPitch}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{lead.emailResponce}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {lead.phone || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          <div className="flex items-center gap-1">
                            <Globe className="w-3 h-3 text-slate-400" />
                            {lead.website || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-700">{lead.country || '-'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {new Date(lead.date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {lead.link ? (
                            <a
                              href={lead.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-200 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              View
                            </a>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center">
                        <div className="text-slate-400 text-4xl mb-3">📭</div>
                        <p className="text-slate-600 font-medium">No leads found</p>
                        <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or search term</p>
                      </td>
                    </tr>
                  )
                ) : (
                  Object.entries(filteredLeads).map(([month, leads]) => {
                    const searchFilteredLeads = filterLeadsBySearch(leads);
                    return (
                      <React.Fragment key={month}>
                        {monthFilter === "all" && (
                          <tr className="bg-gradient-to-r from-slate-100 to-slate-50">
                            <td colSpan="8" className="px-6 py-3">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-600" />
                                <span className="font-bold text-slate-800 text-base">{month} {currentYear}</span>
                                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                  {searchFilteredLeads.length} leads
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}
                        {searchFilteredLeads.length ? (
                          searchFilteredLeads.map((lead, idx) => (
                            <tr key={lead.id} className={`hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                  <span className="font-medium text-slate-900 text-sm">{lead.subjectLine}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-700">{lead.leadEmail}</td>
                              <td className="px-6 py-4 text-sm text-slate-700">{lead.clientEmail}</td>
                              <td className="px-6 py-4 text-sm text-slate-700">
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {lead.phone || '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-700">
                                <div className="flex items-center gap-1">
                                  <Globe className="w-3 h-3 text-slate-400" />
                                  {lead.website || '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  <span className="text-slate-700">{lead.country || '-'}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  {new Date(lead.date).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                {lead.link ? (
                                  <a
                                    href={lead.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-200 transition-colors"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    View
                                  </a>
                                ) : (
                                  <span className="text-slate-400 text-sm">-</span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="px-6 py-8 text-center">
                              <p className="text-slate-500 text-sm">No data available for {month}</p>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}