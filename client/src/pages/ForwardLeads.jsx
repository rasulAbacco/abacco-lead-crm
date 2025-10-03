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

const ForwardLeads = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [forwardedLeads, setForwardedLeads] = useState(new Set()); // ✅ store lead IDs
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch employees with leads
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/employees/with-leads");
        const data = await res.json();
        setEmployees(
          data.map((emp) => ({
            id: emp.employeeId,
            name: emp.fullName,
            email: emp.email,
            dailyLeads: emp.leads.filter(
              (lead) =>
                new Date(lead.date).toDateString() === new Date().toDateString()
            ).length,
            leads: emp.leads.map((lead) => ({
              id: lead.id,
              agentName: lead.agentName,
              leadType: lead.leadType,
              clientEmail: lead.clientEmail,
              leadEmail: lead.leadEmail,
              ccEmail: lead.ccEmail,
              phone: lead.phone,
              website: lead.website,
              country: lead.country,
              contactDate: new Date(lead.date).toLocaleDateString(),
              subjectLine: lead.subjectLine,
              emailPitch: lead.emailPitch,
              link: lead.link,
              time: new Date(lead.date).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            })),
          }))
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

  // 🔹 Forward a single lead
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Forward Leads to CRM
            </h1>
            <p className="text-gray-600">
              Send today's employee leads to your Sales CRM system
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
              <span className="text-sm text-gray-600">Today: </span>
              <span className="text-sm font-semibold text-gray-900">
                {new Date().toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg shadow-lg animate-fade-in">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
              <div>
                <p className="text-green-800 font-semibold">
                  Successfully Forwarded!
                </p>
                <p className="text-green-700 text-sm">
                  Lead has been sent to the Sales CRM
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Total Leads Today
                </p>
                <h3 className="text-3xl font-bold text-gray-900">{totalLeads}</h3>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                <Mail className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Active Employees
                </p>
                <h3 className="text-3xl font-bold text-gray-900">
                  {employees.length}
                </h3>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Forwarded Leads
                </p>
                <h3 className="text-3xl font-bold text-gray-900">
                  {forwardedCount}/{totalLeads}
                </h3>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
                <Send className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Employee Leads Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Employee Leads Overview
            </h2>
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
                          <span className="text-gray-900 font-semibold">
                            {emp.dailyLeads}
                          </span>
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

                    {/* Lead Details Dropdown */}
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
                                        {lead.leadType}
                                      </span>
                                      <h4 className="text-lg font-bold text-gray-900">
                                        {lead.subjectLine}
                                      </h4>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="flex items-center gap-2 text-sm">
                                      <Mail className="w-4 h-4 text-gray-400" />
                                      <span className="text-gray-600">Lead:</span>
                                      <span className="font-medium text-gray-900">
                                        {lead.leadEmail}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      <Mail className="w-4 h-4 text-gray-400" />
                                      <span className="text-gray-600">Client:</span>
                                      <span className="font-medium text-gray-900">
                                        {lead.clientEmail}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      <Phone className="w-4 h-4 text-gray-400" />
                                      <span className="text-gray-600">Phone:</span>
                                      <span className="font-medium text-gray-900">
                                        {lead.phone}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      <Globe className="w-4 h-4 text-gray-400" />
                                      <span className="text-gray-600">Website:</span>
                                      <a
                                        href={lead.website}
                                        className="font-medium text-blue-600 hover:underline"
                                      >
                                        {lead.website}
                                      </a>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      <Globe className="w-4 h-4 text-gray-400" />
                                      <span className="text-gray-600">Lead Link:</span>
                                      <a
                                        href={lead.link}
                                        className="font-medium text-blue-600 hover:underline"
                                      >
                                        {lead.link}
                                      </a>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      <Calendar className="w-4 h-4 text-gray-400" />
                                      <span className="text-gray-600">Contact Date:</span>
                                      <span className="font-medium text-gray-900">
                                        {lead.contactDate}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      <Globe className="w-4 h-4 text-gray-400" />
                                      <span className="text-gray-600">Country:</span>
                                      <span className="font-medium text-gray-900">
                                        {lead.country}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
                                    <div className="flex items-start gap-2">
                                      <FileText className="w-4 h-4 text-gray-400 mt-1" />
                                      <div className="flex-1">
                                        <span className="text-sm text-gray-600 block mb-1">
                                          Email Pitch:
                                        </span>
                                        <p className="text-sm text-gray-900">
                                          {lead.emailPitch}
                                        </p>
                                      </div>
                                    </div>

                                    {/* ✅ Per-lead Forward Button */}
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

export default ForwardLeads;
