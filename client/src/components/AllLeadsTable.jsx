import React, { useEffect, useMemo, useState } from "react";
import { Search, Download, RefreshCw, Filter, Calendar, FileText } from "lucide-react";

const defaultFilters = {
  leadType: "all",
  employee: "all",
  fromDate: "",
  toDate: "",
  search: "",
  sortBy: "id-asc",
};

export default function AllLeadsTable() {
  const [leads, setLeads] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/employees/full");
      const data = await res.json();
      if (data) setLeads(Array.isArray(data) ? data : data.leads);
    } catch (err) {
      console.error("Failed to fetch leads:", err);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const employeeOptions = useMemo(() => {
    const map = new Map();
    leads.forEach((l) => {
      const id = l.employeeId;
      const name = l.employee?.fullName || id;
      if (id && !map.has(id)) map.set(id, name);
    });
    return Array.from(map.entries());
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads
      .filter((lead) => {
        // Lead type filter - FIXED: Ensure string conversion and case handling
        const leadTypeMatch =
          filters.leadType === "all" ||
          String(lead.leadType || "").trim().toLowerCase() === filters.leadType.toLowerCase();

        // Employee filter - FIXED: Ensure consistent string comparison
        const employeeMatch =
          filters.employee === "all" || String(lead.employeeId) === filters.employee;

        // Date filters
        const fromDateMatch =
          !filters.fromDate || new Date(lead.date) >= new Date(filters.fromDate);
        const toDateMatch =
          !filters.toDate || new Date(lead.date) <= new Date(filters.toDate);

        // Search filter
        const searchMatch =
          filters.search === "" ||
          [lead.employeeId, lead.employee?.fullName, lead.agentName, lead.clientEmail, lead.leadEmail, lead.leadType, lead.subjectLine]
            .some((field) =>
              (field || "").toString().toLowerCase().includes(filters.search.toLowerCase())
            );

        return leadTypeMatch && employeeMatch && fromDateMatch && toDateMatch && searchMatch;
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case "id-asc":
            return a.id - b.id;
          case "id-desc":
            return b.id - a.id;
          case "date-asc":
            return new Date(a.date) - new Date(b.date);
          case "date-desc":
            return new Date(b.date) - new Date(a.date);
          case "employee":
            return (a.employee?.fullName || "").localeCompare(b.employee?.fullName || "");
          case "leadType":
            return (a.leadType || "").localeCompare(b.leadType || "");
          default:
            return 0;
        }
      });
  }, [leads, filters]);

  const downloadCSV = () => {
    if (!filteredLeads.length) return;

    const headers = [
      "ID",
      "Employee Name",
      "Employee ID",
      "Agent",
      "Client Email",
      "Lead Email",
      "Subject",
      "Lead Type",
      "Date",
      "Link",
    ];

    const rows = filteredLeads.map((lead) => [
      lead.id,
      lead.employee?.fullName || "",
      lead.employeeId,
      lead.agentName,
      lead.clientEmail,
      lead.leadEmail,
      lead.subjectLine,
      lead.leadType,
      lead.date ? new Date(lead.date).toLocaleDateString() : "",
      lead.link || "",
    ]);

    const csvContent =
      [headers, ...rows].map((row) => row.map((val) => `"${val}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getLeadTypeBadge = (type) => {
    const badges = {
      association: "bg-purple-100 text-purple-800 border-purple-200",
      industry: "bg-blue-100 text-blue-800 border-blue-200",
      attendees: "bg-green-100 text-green-800 border-green-200",
    };
    return badges[String(type || "").trim().toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  if (loading)
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-600 font-medium">Loading leads...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Leads Dashboard</h1>
            <p className="text-slate-600">Manage and track all your leads in one place</p>
          </div>
          <div className="flex gap-3">
            {/* <button
              onClick={fetchLeads}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm hover:shadow font-medium text-slate-700"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button> */}
            <button
              onClick={downloadCSV}
              disabled={!filteredLeads.length}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <select
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-slate-700 font-medium"
              value={filters.leadType}
              onChange={(e) => setFilters({ ...filters, leadType: e.target.value })}
            >
              <option value="all">All Lead Types</option>
              <option value="Association Lead">Association</option>
              <option value="Industry Lead">Industry</option>
              <option value="Attendees Lead">Attendees</option>
            </select>

            <select
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-slate-700 font-medium"
              value={filters.employee}
              onChange={(e) => setFilters({ ...filters, employee: e.target.value })}
            >
              <option value="all">All Employees</option>
              {employeeOptions.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>

            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
              <input
                type="date"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-700"
                value={filters.fromDate}
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              />
            </div>

            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
              <input
                type="date"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-700"
                value={filters.toDate}
                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              />
            </div>

            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search leads..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-700"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setFilters(defaultFilters)}
              className="px-5 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {["ID","Employee","Emp ID","Agent","Client Email","Lead Email","Subject","Type","Date","Link"].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredLeads.length ? filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">#{lead.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{lead.employee?.fullName || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{lead.employeeId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{lead.agentName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{lead.clientEmail}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{lead.leadEmail}</td>
                    <td className="px-6 py-4 max-w-xs truncate">{lead.subjectLine}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getLeadTypeBadge(lead.leadType)}`}>
                        {lead.leadType || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{lead.date ? new Date(lead.date).toLocaleDateString() : "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {lead.link ? (
                        <a href={lead.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors">
                          View
                        </a>
                      ) : "-"}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="10" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="w-12 h-12 text-slate-300 mb-3" />
                        <p className="text-slate-500 font-medium">No leads found</p>
                        <p className="text-slate-400 text-sm mt-1">Try adjusting your filters</p>
                      </div>
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
}