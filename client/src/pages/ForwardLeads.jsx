import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Send,
  CheckCircle,
  Clock,
  Mail,
  Globe,
  Phone,
  Calendar,
  User,
  FileText,
} from "lucide-react";
import { toZonedTime, format } from "date-fns-tz";

const USA_TZ = "America/Chicago";

const ForwardLeads = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [forwardedLeads, setForwardedLeads] = useState(new Set());
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // 🔹 Fetch employees with leads and handle USA timezone
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/employees/with-leads`);
        const data = await res.json();

        setEmployees(
          data.map((emp) => {
            const todayUSA = toZonedTime(new Date(), USA_TZ);

            const dailyLeads = emp.leads.filter((lead) => {
              const leadDateUSA = toZonedTime(new Date(lead.date), USA_TZ);
              return (
                format(leadDateUSA, "yyyy-MM-dd", { timeZone: USA_TZ }) ===
                format(todayUSA, "yyyy-MM-dd", { timeZone: USA_TZ })
              );
            }).length;

            return {
              id: emp.employeeId,
              name: emp.fullName,
              email: emp.email,
              dailyLeads,
              leads: emp.leads.map((lead) => {
                const leadDateUSA = toZonedTime(new Date(lead.date), USA_TZ);
                return {
                  id: lead.id,
                  agentName: lead.agentName,
                  leadType: lead.leadType,
                  clientEmail: lead.clientEmail,
                  leadEmail: lead.leadEmail,
                  ccEmail: lead.ccEmail,
                  phone: lead.phone,
                  website: lead.website,
                  country: lead.country,
                  contactDate: format(leadDateUSA, "MMM dd, yyyy", { timeZone: USA_TZ }),
                  time: format(leadDateUSA, "hh:mm a", { timeZone: USA_TZ }),
                  subjectLine: lead.subjectLine,
                  emailPitch: lead.emailPitch,
                  emailResponce: lead.emailResponce,
                  link: lead.link,
                };
              }),
            };
          })
        );
      } catch (err) {
        console.error("❌ Error fetching employees with leads:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const totalLeads = employees.reduce((sum, emp) => sum + emp.dailyLeads, 0);
  const forwardedCount = forwardedLeads.size;

  const forwardLead = (leadId) => {
    setForwardedLeads((prev) => new Set([...prev, leadId]));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const viewLeadDetails = (emp) => {
    setSelectedEmployee(selectedEmployee?.id === emp.id ? null : emp);
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-lg font-semibold text-gray-600">
        ⏳ Loading employee leads...
      </div>
    );
  }

  // 🕓 Display current Central USA time
  const currentUSA = toZonedTime(new Date(), USA_TZ);
  const currentUSADate = format(currentUSA, "MMM dd, yyyy", { timeZone: USA_TZ });
  const currentUSATime = format(currentUSA, "hh:mm a", { timeZone: USA_TZ });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
              Forward Leads to CRM
            </h1>
            <p className="text-gray-600">
              Send today's employee leads to your Sales CRM system
            </p>
          </div>

          {/* 🕐 USA Time Display */}
          <div className="px-5 py-3 rounded-xl bg-white/60 backdrop-blur-md border border-gray-200 shadow-sm text-center">
            <div className="text-sm text-gray-500">Central USA Time (CST)</div>
            <div className="text-gray-900 font-semibold text-lg">{currentUSADate}</div>
            <div className="text-indigo-600 font-bold text-xl">{currentUSATime}</div>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg shadow-md animate-fade-in">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
              <div>
                <p className="text-green-800 font-semibold">Successfully Forwarded!</p>
                <p className="text-green-700 text-sm">
                  Lead has been sent to the Sales CRM
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Total Leads Today",
              value: totalLeads,
              icon: <Mail className="w-6 h-6 text-white" />,
              color: "from-blue-500 to-blue-600",
            },
            {
              title: "Active Employees",
              value: employees.length,
              icon: <User className="w-6 h-6 text-white" />,
              color: "from-indigo-500 to-indigo-600",
            },
            {
              title: "Forwarded Leads",
              value: `${forwardedCount}/${totalLeads}`,
              icon: <Send className="w-6 h-6 text-white" />,
              color: "from-green-500 to-green-600",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Employee Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Employee Leads Overview</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Leads Today
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {employees.map((emp, index) => (
                  <React.Fragment key={emp.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold mr-3">
                            {emp.name.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <Link
                            to={`/employee/${emp.id}`}
                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {emp.name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900 font-semibold">{emp.dailyLeads}</span>
                          <span className="text-gray-500 text-sm">leads</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => viewLeadDetails(emp)}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>

                    {/* Lead Details Expanded View */}
                    {selectedEmployee?.id === emp.id && emp.leads.length > 0 && (
                      <tr>
                        <td colSpan="4" className="bg-gradient-to-r from-blue-50 to-indigo-50">
                          <div className="p-6 space-y-4">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">
                              Lead Details for {emp.name}
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                              {emp.leads.map((lead) => (
                                <div
                                  key={lead.id}
                                  className="bg-white rounded-xl p-6 shadow-md border border-gray-200"
                                >
                                  <div className="flex items-start justify-between mb-4">
                                    <div>
                                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 mb-2">
                                        {lead.leadType || "Not Available"}
                                      </span>
                                      <h4 className="text-lg font-bold text-gray-900">
                                        {lead.subjectLine || "No Subject"}
                                      </h4>
                                    </div>
                                  </div>

                                  {/* Information Grid */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    {/* Lead Email */}
                                    <InfoRow icon={<Mail />} label="Lead" value={lead.leadEmail} />
                                    <InfoRow icon={<Mail />} label="Client" value={lead.clientEmail} />
                                    <InfoRow icon={<Mail />} label="CC" value={lead.ccEmail} />
                                    <InfoRow icon={<Phone />} label="Phone" value={lead.phone} />
                                    <InfoRow icon={<Globe />} label="Website" link={lead.website} />
                                    <InfoRow icon={<Globe />} label="Lead Link" link={lead.link} />
                                    <InfoRow
                                      icon={<Calendar />}
                                      label="Contact Date"
                                      value={`${lead.contactDate || "Not Available"} ${lead.time ? "• " + lead.time : ""}`}
                                    />
                                    <InfoRow icon={<Globe />} label="Country" value={lead.country} />
                                  </div>

                                  {/* Response & Pitch */}
                                  <div className="flex flex-col gap-4">
                                    <TextBlock icon={<FileText />} label="Response" value={lead.emailResponce} />
                                    <TextBlock icon={<FileText />} label="Email Pitch" value={lead.emailPitch} />
                                  </div>

                                  {/* Footer Button */}
                                  <div className="border-t border-gray-200 pt-4 flex justify-end">
                                    <button
                                      onClick={() => forwardLead(lead.id)}
                                      disabled={forwardedLeads.has(lead.id)}
                                      className={`ml-4 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${forwardedLeads.has(lead.id)
                                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                          : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg"
                                        }`}
                                    >
                                      {forwardedLeads.has(lead.id) ? (
                                        <>
                                          <CheckCircle className="w-4 h-4" /> Forwarded
                                        </>
                                      ) : (
                                        <>
                                          <Send className="w-4 h-4" /> Forward
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable info row for compact fields
const InfoRow = ({ icon, label, value, link }) => (
  <div className="flex items-center gap-2 text-sm">
    {React.cloneElement(icon, { className: "w-4 h-4 text-gray-400" })}
    <span className="text-gray-600">{label}:</span>
    {link ? (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-blue-600 hover:underline"
      >
        {link}
      </a>
    ) : (
      <span className="font-medium text-gray-900">
        {value || "Not Available"}
      </span>
    )}
  </div>
);

// Reusable text block for longer fields
const TextBlock = ({ icon, label, value }) => (
  <div className="flex items-start gap-2 text-sm">
    {React.cloneElement(icon, { className: "w-4 h-4 text-gray-400 mt-1" })}
    <div className="flex-1">
      <span className="text-gray-600 block mb-1">{label}:</span>
      <p className="text-gray-900 font-medium">{value || "Not Available"}</p>
    </div>
  </div>
);

export default ForwardLeads;
