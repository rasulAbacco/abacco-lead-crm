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
  Building2,
  ExternalLink,
  MessageSquare,
  Send,
  MailPlus,
  Globe,
  Phone,
  Edit,
  Save,
  X,
  CheckCircle,
} from "lucide-react";
import Loader from "./Loader";

const defaultFilters = {
  leadType: "all",
  fromDate: "",
  toDate: "",
  search: "",
  sortBy: "id-desc",
  leadEmail: "all",
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const formatDate = (dateString) => {
  if (!dateString) return "Not available";
  const date = new Date(dateString);
  if (isNaN(date)) return "Not available";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
};

const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date)) return "";
  // Convert to USA timezone (America/New_York)
  const usaDate = new Date(
    date.toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  const year = usaDate.getFullYear();
  const month = String(usaDate.getMonth() + 1).padStart(2, "0");
  const day = String(usaDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Get today's date in YYYY-MM-DD format for max date attribute
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function MyLeadsTable() {
  const [leads, setLeads] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [editingLead, setEditingLead] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const safe = (val) => (val && val.trim() !== "" ? val : "Not available");

  const employeeId = localStorage.getItem("employeeId") || "AT113";

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/employees/leads/${employeeId}`
      );
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
  }, [employeeId]);

  const toggleExpand = (id) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const handleEdit = (lead) => {
    setEditingLead(lead.id);
    setEditForm({
      agentName: lead.agentName || "",
      clientEmail: lead.clientEmail || "",
      leadEmail: lead.leadEmail || "",
      ccEmail: lead.ccEmail || "",
      phone: lead.phone || "",
      country: lead.country || "",
      subjectLine: lead.subjectLine || "",
      leadType: lead.leadType || "",
      date: formatDateForInput(lead.date),
      link: lead.link || "",
      emailPitch: lead.emailPitch || "",
      emailResponce: lead.emailResponce || "",
    });
    // Auto-expand the card when editing
    setExpandedCards((prev) => new Set(prev).add(lead.id));
  };

  const handleCancelEdit = () => {
    setEditingLead(null);
    setEditForm({});
  };

  const handleSaveEdit = async (leadId) => {
    setSaving(true);
    try {
      // Convert date to USA timezone datetime string
      let dateToSend = editForm.date;
      if (dateToSend) {
        // Add USA timezone time (5 PM EST = 17:00)
        dateToSend = `${dateToSend}T17:00:00.000Z`;
      }

      const dataToSend = {
        ...editForm,
        date: dateToSend,
        isEdited: true, // Mark as edited
      };

      const res = await fetch(`${API_BASE_URL}/api/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (!res.ok) throw new Error("Failed to update lead");

      const updatedLead = await res.json();

      // Refresh leads to get updated data from server
      await fetchLeads();
      setEditingLead(null);
      setEditForm({});
    } catch (err) {
      console.error("Error updating lead:", err);
      alert("Failed to update lead. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const leadEmailOptions = useMemo(() => {
    const uniqueEmails = [
      ...new Set(leads.map((lead) => lead.leadEmail).filter(Boolean)),
    ];
    return uniqueEmails;
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads
      .filter((lead) => {
        const leadTypeMatch =
          filters.leadType === "all" ||
          String(lead.leadType || "")
            .trim()
            .toLowerCase() === filters.leadType.toLowerCase();

        const fromDateMatch =
          !filters.fromDate ||
          new Date(lead.date) >= new Date(filters.fromDate);
        const toDateMatch =
          !filters.toDate || new Date(lead.date) <= new Date(filters.toDate);

        const searchMatch =
          filters.search === "" ||
          [
            lead.subjectLine,
            lead.agentName,
            lead.clientEmail,
            lead.leadEmail,
            lead.ccEmail,
            lead.leadType,
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
            lead.leadEmail.toLowerCase() === filters.leadEmail.toLowerCase());

        return (
          leadTypeMatch &&
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
      badges[
        String(type || "")
          .trim()
          .toLowerCase()
      ] || "bg-gray-100 text-gray-700 border-gray-200"
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
    link.setAttribute("download", "MyLeads.csv");
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
              My Leads
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

        {/* Filter Section */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6 space-y-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, country, phone, subject..."
                className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
            </div>

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
                value={filters.leadEmail}
                onChange={(e) =>
                  setFilters({ ...filters, leadEmail: e.target.value })
                }
                className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
              >
                <option value="all">All Lead Emails</option>
                {leadEmailOptions.map((email) => (
                  <option key={email} value={email}>
                    {email}
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
          {filteredLeads.length > 0 ? (
            filteredLeads.map((lead) => {
              const isExpanded = expandedCards.has(lead.id);
              const isEditing = editingLead === lead.id;
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
                  {/* Card Header */}
                  <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
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
                          {isEditing ? (
                            <select
                              value={editForm.leadType}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  leadType: e.target.value,
                                })
                              }
                              className="px-2.5 py-0.5 text-xs font-semibold rounded-full border"
                            >
                              <option value="Association Lead">
                                Association
                              </option>
                              <option value="Industry Lead">Industry</option>
                              <option value="Attendees Lead">Attendees</option>
                            </select>
                          ) : (
                            <span
                              className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getLeadTypeBadge(
                                lead.leadType
                              )}`}
                            >
                              {getLeadTypeLabel(lead.leadType)}
                            </span>
                          )}
                        </div>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.subjectLine}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                subjectLine: e.target.value,
                              })
                            }
                            className="w-full text-base sm:text-lg font-semibold text-slate-900 border border-slate-300 rounded px-2 py-1"
                          />
                        ) : (
                          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">
                            {safe(lead.subjectLine)}
                          </h3>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!isEditing && (
                          <button
                            onClick={() => handleEdit(lead)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                          >
                            <Edit className="w-4 h-4" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                        )}
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(lead.id)}
                              disabled={saving}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Save className="w-4 h-4" />
                              {saving ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            {lead.link && lead.link.trim() !== "" ? (
                              <a
                                href={lead.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                              >
                                <ExternalLink className="w-4 h-4" />
                                <span className="hidden sm:inline">
                                  View Link
                                </span>
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
                                  <ChevronUp className="w-4 h-4" /> Hide
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4" /> View
                                </>
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {isEditing ? (
                        <>
                          <EditableField
                            label="Agent"
                            icon={Building2}
                            color="emerald"
                            value={editForm.agentName}
                            onChange={(v) =>
                              setEditForm({ ...editForm, agentName: v })
                            }
                          />
                          <EditableField
                            label="Date"
                            icon={Calendar}
                            color="purple"
                            value={editForm.date}
                            onChange={(v) =>
                              setEditForm({ ...editForm, date: v })
                            }
                            type="date"
                            max={getTodayDate()}
                          />
                          <EditableField
                            label="Country"
                            icon={Globe}
                            color="teal"
                            value={editForm.country}
                            onChange={(v) =>
                              setEditForm({ ...editForm, country: v })
                            }
                          />
                          <EditableField
                            label="Phone Number"
                            icon={Phone}
                            color="blue"
                            value={editForm.phone}
                            onChange={(v) =>
                              setEditForm({ ...editForm, phone: v })
                            }
                          />
                          <EditableField
                            label="Client Email"
                            icon={Mail}
                            color="orange"
                            value={editForm.clientEmail}
                            onChange={(v) =>
                              setEditForm({ ...editForm, clientEmail: v })
                            }
                          />
                          <EditableField
                            label="Lead Email"
                            icon={Mail}
                            color="pink"
                            value={editForm.leadEmail}
                            onChange={(v) =>
                              setEditForm({ ...editForm, leadEmail: v })
                            }
                          />
                          <EditableField
                            label="CC Email"
                            icon={MailPlus}
                            color="violet"
                            value={editForm.ccEmail}
                            onChange={(v) =>
                              setEditForm({ ...editForm, ccEmail: v })
                            }
                            colSpan="sm:col-span-2 lg:col-span-1"
                          />
                          <EditableField
                            label="Link"
                            icon={ExternalLink}
                            color="indigo"
                            value={editForm.link}
                            onChange={(v) =>
                              setEditForm({ ...editForm, link: v })
                            }
                            colSpan="sm:col-span-2 lg:col-span-2"
                          />
                        </>
                      ) : (
                        <>
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
                          <div className="flex items-start gap-3 sm:col-span-2 lg:col-span-1">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Phone className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 mb-0.5">
                                Phone Number(s)
                              </p>
                              {phoneNumbers.length > 0 ? (
                                <div className="flex flex-col gap-1">
                                  {phoneNumbers.map((ph, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 text-xs rounded-md w-fit"
                                    >
                                      {ph}
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
                          <div className="flex items-start gap-3 sm:col-span-2 lg:col-span-1">
                            <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                              <MailPlus className="w-5 h-5 text-violet-600" />
                            </div>
                            <div>
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
                        </>
                      )}
                    </div>

                    {isExpanded && (
                      <ExpandedContent
                        lead={lead}
                        isEditing={isEditing}
                        editForm={editForm}
                        setEditForm={setEditForm}
                      />
                    )}
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

const EditableField = ({
  label,
  icon: Icon,
  color,
  value,
  onChange,
  type = "text",
  max,
  colSpan = "",
}) => (
  <div className={`flex items-start gap-3 ${colSpan}`}>
    <div
      className={`flex-shrink-0 w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center`}
    >
      <Icon className={`w-5 h-5 text-${color}-600`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <input
        type={type}
        value={value}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
      />
    </div>
  </div>
);

const ExpandedContent = ({ lead, isEditing, editForm, setEditForm }) => (
  <div className="mt-6 pt-6 border-t border-slate-200 space-y-4">
    {isEditing ? (
      <>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Email Pitch
          </label>
          <textarea
            value={editForm.emailPitch}
            onChange={(e) =>
              setEditForm({ ...editForm, emailPitch: e.target.value })
            }
            rows={6}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>
         <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Email Response
          </label>
          <textarea
            value={editForm.emailResponce}
            onChange={(e) =>
              setEditForm({ ...editForm, emailResponce: e.target.value })
            }
            rows={6}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div> 
      </>
    ) : (
      <>
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
      </>
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
