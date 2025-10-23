import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Download,
  Filter,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp,
  Mail,
  User,
  Building2,
  ExternalLink,
  MessageSquare,
  Send,
  MailPlus,
} from "lucide-react";

const defaultFilters = {
  leadType: "all",
  employee: "all",
  fromDate: "",
  toDate: "",
  search: "",
  sortBy: "id-desc",
  leadEmail: "all",
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// 🔧 Helper function for date formatting
const formatDate = (dateString) => {
  if (!dateString) return "Not available";
  const date = new Date(dateString);
  if (isNaN(date)) return "Not available";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
};

export default function AllLeadsTable() {
  const [leads, setLeads] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [expandedCards, setExpandedCards] = useState(new Set());

  const safe = (val) => (val && val.trim() !== "" ? val : "Not available");

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/employees/full`);
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

  const toggleExpand = (id) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const leadEmailOptions = useMemo(() => {
    const uniqueEmails = [
      ...new Set(leads.map((lead) => lead.leadEmail).filter(Boolean)),
    ];
    return uniqueEmails;
  }, [leads]);

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
        const leadTypeMatch =
          filters.leadType === "all" ||
          String(lead.leadType || "")
            .trim()
            .toLowerCase() === filters.leadType.toLowerCase();

        const employeeMatch =
          filters.employee === "all" ||
          String(lead.employeeId) === filters.employee;

        const fromDateMatch =
          !filters.fromDate ||
          new Date(lead.date) >= new Date(filters.fromDate);
        const toDateMatch =
          !filters.toDate || new Date(lead.date) <= new Date(filters.toDate);

        const searchMatch =
          filters.search === "" ||
          [
            lead.employeeId,
            lead.employee?.fullName,
            lead.agentName,
            lead.clientEmail,
            lead.leadEmail,
            lead.ccEmail,
            lead.leadType,
            lead.subjectLine,
          ].some((field) =>
            (field || "")
              .toString()
              .toLowerCase()
              .includes(filters.search.toLowerCase())
          );

        const leadEmailMatch =
          filters.leadEmail === "all" ||
          (lead.leadEmail &&
            lead.leadEmail.toLowerCase() === filters.leadEmail.toLowerCase());

        return (
          leadTypeMatch &&
          employeeMatch &&
          fromDateMatch &&
          toDateMatch &&
          searchMatch &&
          leadEmailMatch
        );
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
            return (a.employee?.fullName || "").localeCompare(
              b.employee?.fullName || ""
            );
          case "leadType":
            return (a.leadType || "").localeCompare(b.leadType || "");
          default:
            return 0;
        }
      });
  }, [leads, filters]);

  const getLeadTypeBadge = (type) => {
    const badges = {
      association: "bg-purple-100 text-purple-700 border-purple-200",
      industry: "bg-blue-100 text-blue-700 border-blue-200",
      attendees: "bg-emerald-100 text-emerald-700 border-emerald-200",
    };
    return (
      badges[String(type || "").trim().toLowerCase()] ||
      "bg-gray-100 text-gray-700 border-gray-200"
    );
  };

  const getLeadTypeLabel = (type) => {
    const str = String(type || "").trim();
    if (str.toLowerCase().includes("association")) return "Association";
    if (str.toLowerCase().includes("industry")) return "Industry";
    if (str.toLowerCase().includes("attendees")) return "Attendees";
    return safe(type);
  };

  const downloadCSV = () => {
    if (!filteredLeads.length) return;

    const headers = [
      "ID",
      "Employee Name",
      "Employee ID",
      "Agent",
      "Client Email",
      "Lead Email",
      "CC Email",
      "Subject",
      "Lead Type",
      "Date (dd/mm/yy)",
      "Link",
      "Pitch",
      "Response",
    ];

    const rows = filteredLeads.map((lead) => [
      lead.id,
      safe(lead.employee?.fullName),
      safe(lead.employeeId),
      safe(lead.agentName),
      safe(lead.clientEmail),
      safe(lead.leadEmail),
      safe(lead.ccEmail),
      safe(lead.subjectLine),
      safe(lead.leadType),
      formatDate(lead.date),
      safe(lead.link),
      safe(lead.emailPitch),
      safe(lead.emailResponce),
    ]);

    const csvContent =
      [headers, ...rows]
        .map((row) =>
          row.map((val) => `"${(val || "").toString().replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-600 font-medium">Loading leads...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-1">
              Leads Dashboard
            </h1>
            <p className="text-slate-600 text-sm sm:text-base">
              {filteredLeads.length} of {leads.length} leads
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm font-medium text-slate-700"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
            <button
              onClick={downloadCSV}
              disabled={!filteredLeads.length}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="space-y-4">
          {filteredLeads.length > 0 ? (
            filteredLeads.map((lead) => {
              const isExpanded = expandedCards.has(lead.id);
              const ccEmails = lead.ccEmail
                ? lead.ccEmail.split(",").map((e) => e.trim()).filter(Boolean)
                : [];

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
                          <span
                            className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getLeadTypeBadge(
                              lead.leadType
                            )}`}
                          >
                            {getLeadTypeLabel(lead.leadType)}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">
                          {safe(lead.subjectLine)}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {lead.link && lead.link.trim() !== "" ? (
                          <a
                            href={lead.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span className="hidden sm:inline">View Link</span>
                          </a>
                        ) : (
                          <span className="text-sm text-slate-400">
                            No link available
                          </span>
                        )}
                        <button
                          onClick={() => toggleExpand(lead.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              <span className="hidden sm:inline">Hide</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              <span className="hidden sm:inline">View</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <InfoCard
                        icon={User}
                        color="blue"
                        title="Employee"
                        value={`${safe(lead.employee?.fullName)} (${safe(
                          lead.employeeId
                        )})`}
                      />
                      <InfoCard
                        icon={Building2}
                        color="emerald"
                        title="Agent"
                        value={safe(lead.agentName)}
                      />
                      <InfoCard
                        icon={Calendar}
                        color="purple"
                        title="Date"
                        value={formatDate(lead.date)}
                      />
                      <InfoCard
                        icon={Mail}
                        color="orange"
                        title="Client Email"
                        value={safe(lead.clientEmail)}
                      />
                      <InfoCard
                        icon={Mail}
                        color="pink"
                        title="Lead Email"
                        value={safe(lead.leadEmail)}
                      />
                      {/* CC Email Section */}
                      <div className="flex items-start gap-3 sm:col-span-2 lg:col-span-1">
                        <div className="flex-shrink-0 w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                          <MailPlus className="w-5 h-5 text-violet-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-slate-500 mb-0.5">
                            CC Emails
                          </p>
                          {ccEmails.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {ccEmails.map((email, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-violet-50 border border-violet-100 text-violet-700 text-xs rounded-md w-fit"
                                >
                                  {email}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-700">
                              Not available
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded */}
                    {isExpanded && <ExpandedContent lead={lead} />}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium text-lg mb-2">
                No leads found
              </p>
              <p className="text-slate-400 text-sm">
                Try adjusting your filters or search terms
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const InfoCard = ({ icon: Icon, color, title, value }) => (
  <div className="flex items-start gap-3">
    <div
      className={`flex-shrink-0 w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center`}
    >
      <Icon className={`w-5 h-5 text-${color}-600`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-slate-500 mb-0.5">{title}</p>
      <p className="font-medium text-slate-900 text-sm break-all">{value}</p>
    </div>
  </div>
);

const ExpandedContent = ({ lead }) => (
  <div className="mt-6 pt-6 border-t border-slate-200 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
    {lead.emailPitch ? (
      <EmailSection
        title="Email Pitch"
        color="blue"
        icon={Send}
        text={lead.emailPitch}
      />
    ) : (
      <p className="text-sm text-slate-500 bg-blue-50 p-3 rounded-md">
        No pitch available
      </p>
    )}
    {lead.emailResponce ? (
      <EmailSection
        title="Email Response"
        color="emerald"
        icon={MessageSquare}
        text={lead.emailResponce}
      />
    ) : (
      <p className="text-sm text-slate-500 bg-emerald-50 p-3 rounded-md">
        No response available
      </p>
    )}
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
