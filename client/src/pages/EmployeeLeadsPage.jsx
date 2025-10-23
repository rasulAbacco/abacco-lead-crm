import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Search,
  Download,
  Calendar,
  Mail,
  Phone,
  Globe,
  MapPin,
  ExternalLink,
  MessageSquare,
  Send,
  MailPlus,
  ChevronDown,
  ChevronUp,
  Filter,
  UserRound
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function EmployeeLeadsPage() {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("today");
  const [monthFilter, setMonthFilter] = useState("all");
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCards, setExpandedCards] = useState(new Set());

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentYear = new Date().getFullYear();

  const toggleExpand = (id) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  useEffect(() => {
    const fetchEmployeeLeads = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/employees/${id}/leads`);
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
      leadsToDownload =
        monthFilter === "all"
          ? Object.values(filteredLeads).flat()
          : filteredLeads[monthFilter] || [];
    }

    if (!leadsToDownload.length) return;

    const headers = [
      "Lead ID,Subject Line,Lead Email,CC Email,Client Email,Agent Name,Phone,Website,Country,Date,Email Pitch,Email Response,Link",
    ];
    const rows = leadsToDownload.map(
      (lead) =>
        `${lead.id},"${lead.subjectLine}",${lead.leadEmail},"${lead.ccEmail}",${lead.clientEmail},${lead.agentName},${lead.phone},${lead.website},${lead.country},${lead.date},"${lead.emailPitch}","${lead.emailResponce}",${lead.link}`
    );

    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${employee?.fullName}_${filter}_${monthFilter}_leads.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filterLeadsBySearch = (leads) => {
    if (!searchTerm) return leads;
    return leads.filter((lead) =>
      [lead.subjectLine, lead.leadEmail, lead.ccEmail, lead.clientEmail, lead.country, lead.agentName]
        .some((f) => f?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-600 font-medium">Loading leads...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-slate-700 font-semibold">Employee not found</p>
        </div>
      </div>
    );
  }

  const renderLeadCard = (lead) => {
    const isExpanded = expandedCards.has(lead.id);
    const ccEmails = lead.ccEmail
      ? lead.ccEmail.split(",").map((e) => e.trim()).filter(Boolean)
      : [];

    const safe = (value) =>
      value && value.trim() !== "" ? value : "Not available";

    return (
      <div
        key={lead.id}
        className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-500">
                  #{lead.id}
                </span>
                <span className="inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full border bg-blue-100 text-blue-700 border-blue-200">
                  {safe(lead.leadType)}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">
                {safe(lead.subjectLine)}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {lead.link ? (
                <a
                  href={lead.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View
                </a>
              ) : (
                <span className="text-sm text-slate-400">No link</span>
              )}
              <button
                onClick={() => toggleExpand(lead.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" /> Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" /> View
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Lead Email */}
            <InfoCard icon={Mail} title="Lead Email" value={safe(lead.leadEmail)} color="pink" />
            {/* CC Email */}
            <InfoCard icon={MailPlus} title="CC Emails" value={ccEmails.length ? ccEmails.join(", ") : "Not available"} color="violet" />
            {/* Client Email */}
            <InfoCard icon={Mail} title="Client Email" value={safe(lead.clientEmail)} color="orange" />
            {/* Agent Name */}
            <InfoCard icon={UserRound} title="Agent Name" value={safe(lead.agentName)} color="emerald" />
            {/* Phone */}
            <InfoCard icon={Phone} title="Phone" value={safe(lead.phone)} color="green" />
            {/* Website */}
            <InfoCard icon={Globe} title="Website" value={safe(lead.website)} color="indigo" />
            {/* Country */}
            <InfoCard icon={MapPin} title="Country" value={safe(lead.country)} color="teal" />
          </div>

          {/* Expanded */}
          {isExpanded && (
            <div className="mt-6 pt-6 border-t border-slate-200 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {lead.emailPitch && (
                <EmailSection
                  title="Email Pitch"
                  icon={Send}
                  color="blue"
                  text={lead.emailPitch}
                />
              )}
              {lead.emailResponce && (
                <EmailSection
                  title="Email Response"
                  icon={MessageSquare}
                  color="emerald"
                  text={lead.emailResponce}
                />
              )}
              {!lead.emailPitch && !lead.emailResponce && (
                <p className="text-center text-slate-500 py-4">
                  No pitch or response available
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const InfoCard = ({ icon: Icon, title, value, color }) => (
    <div className="flex items-start gap-3">
      <div
        className={`flex-shrink-0 w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center`}
      >
        <Icon className={`w-5 h-5 text-${color}-600`} />
      </div>
      <div>
        <p className="text-xs text-slate-500 mb-0.5">{title}</p>
        <p className="font-medium text-slate-900 text-sm break-all">{value}</p>
      </div>
    </div>
  );

  const EmailSection = ({ title, icon: Icon, color, text }) => (
    <div
      className={`bg-gradient-to-br from-${color}-50 to-${color}-100 rounded-lg p-4 border border-${color}-200`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`w-8 h-8 bg-${color}-600 rounded-lg flex items-center justify-center`}
        >
          <Icon className="w-4 h-4 text-white" />
        </div>
        <h4 className="font-semibold text-slate-900">{title}</h4>
      </div>
      <div className="bg-white rounded-lg p-4 border border-slate-200">
        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
          {text}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
      {/* Header */}
      <div className="max-w-[1600px] mx-auto mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-1">
              {employee.fullName}’s Leads
            </h1>
            <p className="text-slate-600 text-sm sm:text-base">
              Filtered and grouped leads • {currentYear}
            </p>
          </div>
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg font-medium"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-[1600px] mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-700"
          >
            <option value="today">Today</option>
            <option value="month">By Month</option>
          </select>
          {filter === "month" && (
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-700"
            >
              <option value="all">All Months</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}
          <div className="relative flex-1 sm:flex-none sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by subject, email, etc..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-[1600px] mx-auto space-y-4">
        {filter === "today"
          ? filterLeadsBySearch(filteredLeads).map(renderLeadCard)
          : Object.entries(filteredLeads).map(([month, leads]) => {
            const searchFiltered = filterLeadsBySearch(leads);
            if (!searchFiltered.length) return null;
            return (
              <div key={month}>
                <h2 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  {month}
                </h2>
                <div className="space-y-4">
                  {searchFiltered.map(renderLeadCard)}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
