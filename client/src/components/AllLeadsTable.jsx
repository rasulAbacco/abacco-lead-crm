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
  Globe,
  Phone,
  CheckCircle,
} from "lucide-react";
import Loader from "./Loader";

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

// ✅ Format date as dd/mm/yy
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

  // Fetch all leads
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

  // Unique dropdown options
  const leadEmailOptions = useMemo(() => {
    return [...new Set(leads.map((lead) => lead.leadEmail).filter(Boolean))];
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

  // Filtering logic
  // const filteredLeads = useMemo(() => {
  //   return leads
  //     .filter((lead) => {
  //       const leadTypeMatch =
  //         filters.leadType === "all" ||
  //         String(lead.leadType || "")
  //           .trim()
  //           .toLowerCase() === filters.leadType.toLowerCase();

  //       const employeeMatch =
  //         filters.employee === "all" ||
  //         // String(lead.employeeId).trim() === filters.employee;
  //         String(lead.employeeId) === String(filters.employee);


  //       const fromDateMatch =
  //         !filters.fromDate ||
  //         new Date(lead.date) >= new Date(filters.fromDate);
  //       const toDateMatch =
  //         !filters.toDate || new Date(lead.date) <= new Date(filters.toDate);

  //       const searchMatch =
  //         filters.search === "" ||
  //         [
  //           lead.employeeId,
  //           lead.employee?.fullName,
  //           lead.agentName,
  //           lead.clientEmail,
  //           lead.leadEmail,
  //           lead.ccEmail,
  //           lead.leadType,
  //           lead.subjectLine,
  //           lead.country,
  //           lead.phone, // ✅ Include phone number in search
  //         ].some((field) =>
  //           (field || "")
  //             .toString()
  //             .toLowerCase()
  //             .includes(filters.search.toLowerCase())
  //         );

  //       const leadEmailMatch =
  //         filters.leadEmail === "all" ||
  //         (lead.leadEmail &&
  //           lead.leadEmail.toLowerCase() === filters.leadEmail.toLowerCase());

  //       return (
  //         leadTypeMatch &&
  //         employeeMatch &&
  //         fromDateMatch &&
  //         toDateMatch &&
  //         searchMatch &&
  //         leadEmailMatch
  //       );
  //     })
  //     .sort((a, b) => {
  //       switch (filters.sortBy) {
  //         case "id-asc":
  //           return a.id - b.id;
  //         case "id-desc":
  //           return b.id - a.id;
  //         case "date-asc":
  //           return new Date(a.date) - new Date(b.date);
  //         case "date-desc":
  //           return new Date(b.date) - new Date(a.date);
  //         default:
  //           return 0;
  //       }
  //     });
  // }, [leads, filters]);
  const filteredLeads = useMemo(() => {
    return leads
      .filter((lead) => {
        const leadTypeMatch =
          filters.leadType === "all" ||
          String(lead.leadType || "")
            .trim()
            .toLowerCase() === filters.leadType.toLowerCase();

        // ✅ Employee filter fixed
        const employeeMatch =
          filters.employee === "all" ||
          String(lead.employeeId) === String(filters.employee);

        // ✅ Date normalization (prevents timezone issues)
        const leadDate = lead.date
          ? new Date(lead.date).setHours(0, 0, 0, 0)
          : null;

        const fromDateMatch =
          !filters.fromDate ||
          (leadDate !== null &&
            leadDate >=
            new Date(filters.fromDate).setHours(0, 0, 0, 0));

        const toDateMatch =
          !filters.toDate ||
          (leadDate !== null &&
            leadDate <= new Date(filters.toDate).setHours(0, 0, 0, 0));

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
            lead.country,
            lead.phone,
          ].some((field) =>
            (field || "")
              .toString()
              .toLowerCase()
              .includes(filters.search.toLowerCase())
          );

        const leadEmailMatch =
          filters.leadEmail === "all" ||
          (lead.leadEmail &&
            lead.leadEmail.toLowerCase() ===
            filters.leadEmail.toLowerCase());

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
        const aDate = a.date
          ? new Date(a.date).setHours(0, 0, 0, 0)
          : 0;
        const bDate = b.date
          ? new Date(b.date).setHours(0, 0, 0, 0)
          : 0;

        switch (filters.sortBy) {
          case "id-asc":
            return a.id - b.id;
          case "id-desc":
            return b.id - a.id;

          // ✅ Date sorting fixed
          case "date-asc":
            return aDate - bDate;
          case "date-desc":
            return bDate - aDate;

          default:
            return 0;
        }
      });
  }, [leads, filters]);


  // CSV Export
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
      "Phone Number",
      "Country",
      "Subject",
      "Lead Type",
      "Date (dd/mm/yy)",
      "Link",
      "Pitch",
      "Response",
      "Edited",
    ];

    const rows = filteredLeads.map((lead) => [
      lead.id,
      safe(lead.employee?.fullName),
      safe(lead.employeeId),
      safe(lead.agentName),
      safe(lead.clientEmail),
      safe(lead.leadEmail),
      safe(lead.ccEmail),
      safe(lead.phone),
      safe(lead.country),
      safe(lead.subjectLine),
      safe(lead.leadType),
      formatDate(lead.date),
      safe(lead.link),
      safe(lead.emailPitch),
      safe(lead.emailResponce),
      lead.isEdited ? "Yes" : "No",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((val) => `"${(val || "").toString().replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <Loader />;
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
        {/* ✅ Filter Section */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, country, phone, or subject..."
                className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-700"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
            </div>

            {/* Dropdown Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <select
                value={filters.leadType}
                onChange={(e) =>
                  setFilters({ ...filters, leadType: e.target.value })
                }
                className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
              >
                <option value="all">All Types</option>
                <option value="Association Lead">Association</option>
                <option value="Industry Lead">Industry</option>
                <option value="Attendees Lead">Attendees</option>
              </select>

              <select
                value={filters.employee}
                onChange={(e) =>
                  setFilters({ ...filters, employee: e.target.value })
                }
                className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
              >
                <option value="all">All Employees</option>
                {employeeOptions.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) =>
                  setFilters({ ...filters, fromDate: e.target.value })
                }
                className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
              />
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) =>
                  setFilters({ ...filters, toDate: e.target.value })
                }
                className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
              />

              <select
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters({ ...filters, sortBy: e.target.value })
                }
                className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
              >
                <option value="id-desc">Newest First</option>
                <option value="id-asc">Oldest First</option>
                <option value="date-desc">Date (Recent)</option>
                <option value="date-asc">Date (Oldest)</option>
              </select>
            </div>
          </div>
        )}
        {/* Cards */}
        <div className="space-y-4">
          {filteredLeads.length ? (
            filteredLeads.map((lead) => {
              const isExpanded = expandedCards.has(lead.id);
              const ccEmails = lead.ccEmail
                ? lead.ccEmail
                  .split(",")
                  .map((e) => e.trim())
                  .filter(Boolean)
                : [];
              const phoneNumbers = lead.phone
                ? lead.phone
                  .split(",")
                  .map((p) => p.trim())
                  .filter(Boolean)
                : [];

              return (
                <div
                  key={lead.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-xs font-semibold text-slate-500">
                            #{lead.id}
                          </span>
                          {lead.isEdited && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                              <CheckCircle className="w-3 h-3" />
                              Edited
                            </span>
                          )}
                          <span className="inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full border">
                            {lead.leadType || "Lead"}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">
                          {safe(lead.subjectLine)}
                        </h3>
                      </div>
                      <div className="flex gap-2">
                        {lead.link ? (
                          <a
                            href={lead.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition"
                          >
                            <ExternalLink className="w-4 h-4" /> View
                          </a>
                        ) : (
                          <span className="text-slate-400 text-sm">
                            No link
                          </span>
                        )}
                        <button
                          onClick={() => toggleExpand(lead.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-100"
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

                  {/* Info Cards */}
                  <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      icon={Globe}
                      color="teal"
                      title="Country"
                      value={safe(lead.country)}
                    />

                    {/* ✅ Phone Numbers */}
                    <div className="flex items-start gap-3 sm:col-span-2 lg:col-span-1">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Phone className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">
                          Phone Number(s)
                        </p>
                        {phoneNumbers.length ? (
                          <div className="flex flex-col gap-1">
                            {phoneNumbers.map((num, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 text-xs rounded-md w-fit"
                              >
                                {num}
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

                    {/* CC Emails */}
                    <div className="flex items-start gap-3 sm:col-span-2 lg:col-span-1">
                      <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                        <MailPlus className="w-5 h-5 text-violet-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">
                          CC Emails
                        </p>
                        {ccEmails.length ? (
                          <div className="flex flex-col gap-1">
                            {ccEmails.map((email, i) => (
                              <span
                                key={i}
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

                  {isExpanded && <ExpandedContent lead={lead} />}
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
    <div>
      <p className="text-xs text-slate-500 mb-0.5">{title}</p>
      <p className="font-medium text-slate-900 text-sm break-all">{value}</p>
    </div>
  </div>
);

const ExpandedContent = ({ lead }) => (
  <div className="mt-6 pt-6 border-t border-slate-200 space-y-4 animate-in fade-in duration-300">
    {lead.emailPitch && (
      <EmailSection
        title="Email Pitch"
        color="blue"
        icon={Send}
        text={lead.emailPitch}
      />
    )}
    {lead.emailResponce && (
      <EmailSection
        title="Email Response"
        color="emerald"
        icon={MessageSquare}
        text={lead.emailResponce}
      />
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
