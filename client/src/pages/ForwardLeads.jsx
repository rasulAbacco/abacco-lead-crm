import React, { useState, useEffect, useMemo } from "react";
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
  ThumbsUp,
  ThumbsDown,
  XCircle,
  RefreshCw,
  AlertCircle,
  Bug,
  Eye,
  EyeOff,
  Info,
  Filter,
  Database,
} from "lucide-react";
import { toZonedTime, format } from "date-fns-tz";
import Loader from "../components/Loader";

const USA_TZ = "America/Chicago";

const ForwardLeads = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [debugMode, setDebugMode] = useState(false);
  const [debugTab, setDebugTab] = useState("overview");
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Fetch employees with leads
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/employees/with-leads`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();

      const todayUSA = toZonedTime(new Date(), USA_TZ);
      const todayStr = format(todayUSA, "yyyy-MM-dd", { timeZone: USA_TZ });

      // Debug: Log today's date in USA timezone
      console.log("Today's date (USA):", todayStr);

      setEmployees(
        data.map((emp) => {
          // Debug: Log all leads for this employee
          if (debugMode) {
            console.log(
              `Employee ${emp.fullName} has ${emp.leads.length} leads`
            );
            emp.leads.forEach((lead, index) => {
              const leadDateUSA = toZonedTime(new Date(lead.date), USA_TZ);
              const leadDateStr = format(leadDateUSA, "yyyy-MM-dd", {
                timeZone: USA_TZ,
              });
              console.log(
                `Lead ${index}: date=${lead.date}, formatted=${leadDateStr}, forwarded=${lead.forwarded}, qualified=${lead.qualified}`
              );
            });
          }

          // Separate today's leads and previous unforwarded leads
          const todayLeads = emp.leads.filter((lead) => {
            const leadDateUSA = toZonedTime(new Date(lead.date), USA_TZ);
            const leadDateStr = format(leadDateUSA, "yyyy-MM-dd", {
              timeZone: USA_TZ,
            });
            return leadDateStr === todayStr;
          });

          // FIXED: Updated filtering logic for old unforwarded leads
          const oldUnforwardedLeads = emp.leads.filter((lead) => {
            const leadDateUSA = toZonedTime(new Date(lead.date), USA_TZ);
            const leadDateStr = format(leadDateUSA, "yyyy-MM-dd", {
              timeZone: USA_TZ,
            });

            // Scenario 1: Fetch if forwarded is false AND qualified is null or true
            const isNotToday = leadDateStr !== todayStr;
            const isNotForwarded = lead.forwarded === false;
            const isQualifiedOrNull =
              lead.qualified === true || lead.qualified === null;

            return isNotToday && isNotForwarded && isQualifiedOrNull;
          });

          // Debug: Log filtered results
          if (debugMode) {
            console.log(
              `Filtered results for ${emp.fullName}: today=${todayLeads.length}, old=${oldUnforwardedLeads.length}`
            );
          }

          return {
            id: emp.employeeId,
            name: emp.fullName,
            email: emp.email,
            dailyLeads: todayLeads.length,
            oldUnforwardedLeads: oldUnforwardedLeads.length,
            leads: todayLeads.map((lead) => {
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
                contactDate: format(leadDateUSA, "MMM dd, yyyy", {
                  timeZone: USA_TZ,
                }),
                time: format(leadDateUSA, "hh:mm a", { timeZone: USA_TZ }),
                subjectLine: lead.subjectLine,
                emailPitch: lead.emailPitch,
                emailResponce: lead.emailResponce,
                link: lead.link,
                forwarded: lead.forwarded || false,
                qualified: lead.qualified,
                isEdited: lead.isEdited,
              };
            }),
            oldLeads: oldUnforwardedLeads.map((lead) => {
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
                contactDate: format(leadDateUSA, "MMM dd, yyyy", {
                  timeZone: USA_TZ,
                }),
                time: format(leadDateUSA, "hh:mm a", { timeZone: USA_TZ }),
                subjectLine: lead.subjectLine,
                emailPitch: lead.emailPitch,
                emailResponce: lead.emailResponce,
                link: lead.link,
                forwarded: lead.forwarded || false,
                qualified: lead.qualified,
                isEdited: lead.isEdited,
              };
            }),
          };
        })
      );
      setErrorMessage("");
    } catch (err) {
      console.error("❌ Error fetching employees with leads:", err);
      setErrorMessage("Failed to load employee data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchEmployees();
  };

  // Calculate stats for today's leads only
  const stats = useMemo(() => {
    const totalLeads = employees.reduce((sum, emp) => sum + emp.dailyLeads, 0);

    const forwardedCount = employees.reduce((sum, emp) => {
      return sum + emp.leads.filter((lead) => lead.forwarded).length;
    }, 0);

    const qualifiedCount = employees.reduce((sum, emp) => {
      return sum + emp.leads.filter((lead) => lead.qualified === true).length;
    }, 0);

    const disqualifiedCount = employees.reduce((sum, emp) => {
      return sum + emp.leads.filter((lead) => lead.qualified === false).length;
    }, 0);

    const oldUnforwardedCount = employees.reduce((sum, emp) => {
      return sum + emp.oldUnforwardedLeads;
    }, 0);

    return {
      totalLeads,
      forwardedCount,
      qualifiedCount,
      disqualifiedCount,
      oldUnforwardedCount,
    };
  }, [employees]);

  // Forward a lead
  // const forwardLead = async (leadId, empId, isOldLead = false) => {
  //   setActionLoading((prev) => ({ ...prev, [leadId]: "forwarding" }));
  //   try {
  //     const res = await fetch(
  //       `${API_BASE_URL}/api/employees/leads/${leadId}/forward`,
  //       {
  //         method: "POST",
  //       }
  //     );

  //     if (!res.ok) throw new Error("Failed to forward lead");

  //     // Update local state
  //     setEmployees((prevEmployees) =>
  //       prevEmployees.map((emp) => {
  //         if (emp.id !== empId) return emp;

  //         const updatedEmp = { ...emp };

  //         if (isOldLead) {
  //           updatedEmp.oldLeads = emp.oldLeads.map((lead) =>
  //             lead.id === leadId ? { ...lead, forwarded: true } : lead
  //           );
  //           // Update count
  //           updatedEmp.oldUnforwardedLeads = emp.oldLeads.filter(
  //             (l) => l.id !== leadId && !l.forwarded
  //           ).length;
  //         } else {
  //           updatedEmp.leads = emp.leads.map((lead) =>
  //             lead.id === leadId ? { ...lead, forwarded: true } : lead
  //           );
  //         }

  //         return updatedEmp;
  //       })
  //     );

  //     showSuccessMessage("Lead forwarded to CRM successfully!");
  //   } catch (error) {
  //     console.error("❌ Error forwarding lead:", error);
  //     alert("Failed to forward lead. Please try again.");
  //   } finally {
  //     setActionLoading((prev) => ({ ...prev, [leadId]: null }));
  //   }
  // };
  const forwardLead = async (leadId, empId, isOldLead = false) => {
    setActionLoading((prev) => ({ ...prev, [leadId]: "forwarding" }));
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/employees/leads/${leadId}/forward`,
        {
          method: "POST",
        }
      );

      if (!res.ok) throw new Error("Failed to forward lead");

      // Update UI immediately
      setEmployees((prevEmployees) =>
        prevEmployees.map((emp) => {
          if (emp.id !== empId) return emp;
          const updatedEmp = { ...emp };

          if (isOldLead) {
            updatedEmp.oldLeads = emp.oldLeads.map((lead) =>
              lead.id === leadId ? { ...lead, forwarded: true } : lead
            );
            updatedEmp.oldUnforwardedLeads = updatedEmp.oldLeads.filter(
              (l) => !l.forwarded
            ).length;
          } else {
            updatedEmp.leads = emp.leads.map((lead) =>
              lead.id === leadId ? { ...lead, forwarded: true } : lead
            );
          }

          return updatedEmp;
        })
      );

      showSuccessMessage("✅ Lead forwarded to CRM successfully!");
    } catch (error) {
      console.error("❌ Error forwarding lead:", error);
      alert("Failed to forward lead. Please try again.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [leadId]: null }));
    }
  };


  // Mark lead as qualified
  const markQualified = async (
    leadId,
    empId,
    isQualified,
    isOldLead = false
  ) => {
    setActionLoading((prev) => ({ ...prev, [leadId]: "qualifying" }));
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/employees/leads/${leadId}/qualify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qualified: isQualified }),
        }
      );

      if (!res.ok) throw new Error("Failed to update lead qualification");

      // Update local state
      setEmployees((prevEmployees) =>
        prevEmployees.map((emp) => {
          if (emp.id !== empId) return emp;

          const updatedEmp = { ...emp };

          if (isOldLead) {
            updatedEmp.oldLeads = emp.oldLeads.map((lead) =>
              lead.id === leadId ? { ...lead, qualified: isQualified } : lead
            );
            // If marking as disqualified, remove from old leads
            if (isQualified === false) {
              updatedEmp.oldLeads = updatedEmp.oldLeads.filter(
                (l) => l.id !== leadId
              );
              updatedEmp.oldUnforwardedLeads = updatedEmp.oldLeads.length;
            }
          } else {
            updatedEmp.leads = emp.leads.map((lead) =>
              lead.id === leadId ? { ...lead, qualified: isQualified } : lead
            );
          }

          return updatedEmp;
        })
      );

      showSuccessMessage(
        isQualified
          ? "Lead marked as Qualified!"
          : "Lead marked as Disqualified!"
      );
    } catch (error) {
      console.error("❌ Error updating qualification:", error);
      alert("Failed to update lead. Please try again.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [leadId]: null }));
    }
  };

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const viewLeadDetails = (emp, isOldLead = false) => {
    setSelectedEmployee(
      selectedEmployee?.id === emp.id &&
        selectedEmployee?.isOldLead === isOldLead
        ? null
        : { ...emp, isOldLead }
    );
  };

  if (loading) {
    return <Loader />;
  }

  // Display current Central USA time
  const currentUSA = toZonedTime(new Date(), USA_TZ);
  const currentUSADate = format(currentUSA, "MMM dd, yyyy", {
    timeZone: USA_TZ,
  });
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
              Manage and forward employee leads to your Sales CRM system
            </p>
          </div>

          {/* USA Time Display */}
          <div className="px-5 py-3 rounded-xl bg-white/60 backdrop-blur-md border border-gray-200 shadow-sm text-center">
            <div className="text-sm text-gray-500">Central USA Time (CST)</div>
            <div className="text-gray-900 font-semibold text-lg">
              {currentUSADate}
            </div>
            <div className="text-indigo-600 font-bold text-xl">
              {currentUSATime}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-md">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
              <div>
                <p className="text-red-800 font-semibold">Error!</p>
                <p className="text-red-700 text-sm">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg shadow-md animate-fade-in">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
              <div>
                <p className="text-green-800 font-semibold">Success!</p>
                <p className="text-green-700 text-sm">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              title: "Today's Leads",
              value: stats.totalLeads,
              icon: <Mail className="w-6 h-6 text-white" />,
              color: "from-blue-500 to-blue-600",
            },
            {
              title: "Active Employees",
              value: employees.filter((e) => e.dailyLeads > 0).length,
              icon: <User className="w-6 h-6 text-white" />,
              color: "from-indigo-500 to-indigo-600",
            },
            {
              title: "Forwarded",
              value: stats.forwardedCount,
              icon: <Send className="w-6 h-6 text-white" />,
              color: "from-green-500 to-green-600",
            },
            {
              title: "Qualified",
              value: stats.qualifiedCount,
              icon: <ThumbsUp className="w-6 h-6 text-white" />,
              color: "from-emerald-500 to-emerald-600",
            },
            {
              title: "Old Unforwarded",
              value: stats.oldUnforwardedCount,
              icon: <Clock className="w-6 h-6 text-white" />,
              color: "from-amber-500 to-amber-600",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.title}
                  </p>
                  <h3 className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </h3>
                </div>
                <div
                  className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}
                >
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex justify-between">
          <button
            onClick={() => setDebugMode(!debugMode)}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
              debugMode
                ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600"
                : "bg-gray-600 text-white hover:bg-gray-700"
            }`}
          >
            {debugMode ? (
              <Bug className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            {debugMode ? "Debug Mode" : "Enable Debug"}
          </button>

          <button
            onClick={refreshData}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Redesigned Debug Section */}
        {debugMode && (
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-xl border border-purple-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bug className="w-5 h-5 text-white" />
                  <h3 className="text-lg font-bold text-white">
                    Debug Information
                  </h3>
                </div>
                <button
                  onClick={() => setDebugMode(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <EyeOff className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Debug Tabs */}
            <div className="flex border-b border-purple-200">
              {[
                {
                  id: "overview",
                  label: "Overview",
                  icon: <Info className="w-4 h-4" />,
                },
                {
                  id: "filtering",
                  label: "Filtering",
                  icon: <Filter className="w-4 h-4" />,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setDebugTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                    debugTab === tab.id
                      ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50"
                      : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Debug Tab Content */}
            <div className="p-6">
              {debugTab === "overview" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        <h4 className="font-semibold text-gray-800">
                          Today's Date (USA)
                        </h4>
                      </div>
                      <p className="text-lg font-mono text-purple-600">
                        {format(toZonedTime(new Date(), USA_TZ), "yyyy-MM-dd", {
                          timeZone: USA_TZ,
                        })}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-purple-600" />
                        <h4 className="font-semibold text-gray-800">
                          Total Employees
                        </h4>
                      </div>
                      <p className="text-lg font-mono text-purple-600">
                        {employees.length}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-purple-600" />
                        <h4 className="font-semibold text-gray-800">
                          Employees with Old Leads
                        </h4>
                      </div>
                      <p className="text-lg font-mono text-purple-600">
                        {
                          employees.filter((e) => e.oldUnforwardedLeads > 0)
                            .length
                        }
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                    <h4 className="font-semibold text-gray-800 mb-3">
                      Employee Lead Summary
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-purple-100">
                            <th className="text-left py-2 px-3 font-medium text-gray-700">
                              Employee
                            </th>
                            <th className="text-center py-2 px-3 font-medium text-gray-700">
                              Today
                            </th>
                            <th className="text-center py-2 px-3 font-medium text-gray-700">
                              Old
                            </th>
                            <th className="text-center py-2 px-3 font-medium text-gray-700">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {employees.map((emp) => (
                            <tr
                              key={emp.id}
                              className="border-b border-purple-50"
                            >
                              <td className="py-2 px-3 font-medium">
                                {emp.name}
                              </td>
                              <td className="text-center py-2 px-3">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                                  {emp.dailyLeads}
                                </span>
                              </td>
                              <td className="text-center py-2 px-3">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                                  {emp.oldUnforwardedLeads}
                                </span>
                              </td>
                              <td className="text-center py-2 px-3">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                                  {emp.dailyLeads + emp.oldUnforwardedLeads}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {debugTab === "filtering" && (
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                    <h4 className="font-semibold text-gray-800 mb-3">
                      Filtering Logic
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold mt-0.5">
                          1
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">
                            Today's Leads
                          </p>
                          <p className="text-gray-600">
                            Leads where date matches today's date in USA
                            timezone
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold mt-0.5">
                          2
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">
                            Old Unforwarded Leads
                          </p>
                          <p className="text-gray-600">Leads where:</p>
                          <ul className="ml-4 mt-1 space-y-1 text-gray-600">
                            <li>• Date is NOT today's date</li>
                            <li>• Forwarded is false</li>
                            <li>• Qualified is null or true</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                    <h4 className="font-semibold text-gray-800 mb-3">
                      Sample Lead Data
                    </h4>
                    <div className="space-y-3">
                      {employees.slice(0, 2).map((emp) => (
                        <div
                          key={emp.id}
                          className="border border-purple-100 rounded-lg p-3"
                        >
                          <h5 className="font-medium text-gray-800 mb-2">
                            {emp.name}
                          </h5>
                          {emp.leads.slice(0, 1).map((lead) => (
                            <div key={lead.id} className="text-xs space-y-1">
                              <div className="flex justify-between">
                                <span className="text-gray-500">ID:</span>
                                <span className="font-mono">{lead.id}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Date:</span>
                                <span className="font-mono">
                                  {lead.contactDate}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  Forwarded:
                                </span>
                                <span
                                  className={`font-semibold ${
                                    lead.forwarded
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {lead.forwarded ? "Yes" : "No"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  Qualified:
                                </span>
                                <span
                                  className={`font-semibold ${
                                    lead.qualified === true
                                      ? "text-green-600"
                                      : lead.qualified === false
                                      ? "text-red-600"
                                      : "text-gray-600"
                                  }`}
                                >
                                  {lead.qualified === true
                                    ? "Yes"
                                    : lead.qualified === false
                                    ? "No"
                                    : "Not Set"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Today's Leads Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Today's Employee Leads
            </h2>
            <span className="text-sm text-gray-500">
              Showing {employees.filter((e) => e.dailyLeads > 0).length}{" "}
              employees with leads
            </span>
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
                {employees.filter((emp) => emp.dailyLeads > 0).length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No leads found for today
                    </td>
                  </tr>
                ) : (
                  employees
                    .filter((emp) => emp.dailyLeads > 0)
                    .map((emp, index) => (
                      <React.Fragment key={`today-${emp.id}`}>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold mr-3">
                                {emp.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
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
                              <span className="text-gray-500 text-sm">
                                leads
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => viewLeadDetails(emp, false)}
                              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all font-medium text-sm shadow-md"
                            >
                              {selectedEmployee?.id === emp.id &&
                              !selectedEmployee?.isOldLead
                                ? "Hide Details"
                                : "View Details"}
                            </button>
                          </td>
                        </tr>

                        {/* Lead Details Expanded View */}
                        {selectedEmployee?.id === emp.id &&
                          !selectedEmployee?.isOldLead &&
                          emp.leads.length > 0 && (
                            <tr>
                              <td
                                colSpan="4"
                                className="bg-gradient-to-r from-blue-50 to-indigo-50"
                              >
                                <div className="p-6 space-y-4">
                                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                                    Lead Details for {emp.name}
                                  </h3>
                                  <div className="grid grid-cols-1 gap-4">
                                    {emp.leads.map((lead) => (
                                      <LeadCard
                                        key={lead.id}
                                        lead={lead}
                                        empId={emp.id}
                                        forwardLead={forwardLead}
                                        markQualified={markQualified}
                                        actionLoading={actionLoading}
                                        isOldLead={false}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                      </React.Fragment>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Old Unforwarded Leads Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Previous Unforwarded Leads
            </h2>
            <span className="text-sm text-gray-500">
              Showing{" "}
              {employees.filter((e) => e.oldUnforwardedLeads > 0).length}{" "}
              employees with unforwarded leads
            </span>
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
                    Unforwarded Leads
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {employees.filter((emp) => emp.oldUnforwardedLeads > 0)
                  .length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No unforwarded leads from previous days
                    </td>
                  </tr>
                ) : (
                  employees
                    .filter((emp) => emp.oldUnforwardedLeads > 0)
                    .map((emp, index) => (
                      <React.Fragment key={`old-${emp.id}`}>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-semibold text-sm">
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold mr-3">
                                {emp.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
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
                              <Clock className="w-4 h-4 text-amber-500" />
                              <span className="text-gray-900 font-semibold">
                                {emp.oldUnforwardedLeads}
                              </span>
                              <span className="text-gray-500 text-sm">
                                leads
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => viewLeadDetails(emp, true)}
                              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all font-medium text-sm shadow-md"
                            >
                              {selectedEmployee?.id === emp.id &&
                              selectedEmployee?.isOldLead
                                ? "Hide Details"
                                : "View Details"}
                            </button>
                          </td>
                        </tr>

                        {/* Lead Details Expanded View */}
                        {selectedEmployee?.id === emp.id &&
                          selectedEmployee?.isOldLead &&
                          emp.oldLeads.length > 0 && (
                            <tr>
                              <td
                                colSpan="4"
                                className="bg-gradient-to-r from-amber-50 to-orange-50"
                              >
                                <div className="p-6 space-y-4">
                                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                                    Previous Unforwarded Leads for {emp.name}
                                  </h3>
                                  <div className="grid grid-cols-1 gap-4">
                                    {emp.oldLeads.map((lead) => (
                                      <LeadCard
                                        key={lead.id}
                                        lead={lead}
                                        empId={emp.id}
                                        forwardLead={forwardLead}
                                        markQualified={markQualified}
                                        actionLoading={actionLoading}
                                        isOldLead={true}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                      </React.Fragment>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Lead Card Component
const LeadCard = ({
  lead,
  empId,
  forwardLead,
  markQualified,
  actionLoading,
  isOldLead,
}) => (
  <div
    className={`bg-white rounded-xl p-6 shadow-md border-2 ${
      lead.qualified === true
        ? "border-green-300 bg-green-50/30"
        : lead.qualified === false
        ? "border-red-300 bg-red-50/30"
        : "border-gray-200"
    }`}
  >
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
            {lead.leadType || "Not Available"}
          </span>
          {lead.isEdited && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 border border-amber-200">
              <CheckCircle className="w-3 h-3" />
              Edited
            </span>
          )}

          {lead.forwarded && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              <Send className="w-3 h-3 mr-1" />
              Forwarded
            </span>
          )}
          {lead.qualified === true && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
              <ThumbsUp className="w-3 h-3 mr-1" />
              Qualified
            </span>
          )}
          {lead.qualified === false && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
              <ThumbsDown className="w-3 h-3 mr-1" />
              Disqualified
            </span>
          )}
          {isOldLead && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
              <Clock className="w-3 h-3 mr-1" />
              Previous Day
            </span>
          )}
        </div>
        <h4 className="text-lg font-bold text-gray-900">
          {lead.subjectLine || "No Subject"}
        </h4>
      </div>
    </div>

    {/* Information Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <InfoRow icon={<Mail />} label="Lead" value={lead.leadEmail} />
      <InfoRow icon={<Mail />} label="Client" value={lead.clientEmail} />
      <InfoRow icon={<Mail />} label="CC" value={lead.ccEmail} />
      <InfoRow icon={<Phone />} label="Phone" value={lead.phone} />
      <InfoRow icon={<Globe />} label="Website" link={lead.website} />
      <InfoRow icon={<Globe />} label="Lead Link" link={lead.link} />
      <InfoRow
        icon={<Calendar />}
        label="Contact Date"
        value={`${lead.contactDate || "Not Available"} ${
          lead.time ? "• " + lead.time : ""
        }`}
      />
      <InfoRow icon={<Globe />} label="Country" value={lead.country} />
    </div>

    {/* Response & Pitch */}
    <div className="flex flex-col gap-4 mb-4">
      <TextBlock icon={<FileText />} label="Response" value={lead.emailResponce} />
      <TextBlock
        icon={<FileText />}
        label="Email Pitch"
        value={lead.emailPitch}
      />
    </div>

    {/* Action Buttons */}
    <div className="border-t border-gray-200 pt-4 flex flex-wrap gap-3">
      {/* Qualified Button */}
      <button
        onClick={() => markQualified(lead.id, empId, true, isOldLead)}
        disabled={
          lead.qualified === true || actionLoading[lead.id] === "qualifying"
        }
        className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
          lead.qualified === true || actionLoading[lead.id] === "qualifying"
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-md hover:shadow-lg"
        }`}
      >
        {actionLoading[lead.id] === "qualifying" ? (
          <>Processing...</>
        ) : (
          <>
            <ThumbsUp className="w-4 h-4" />
            {lead.qualified === true ? "Qualified" : "Mark Qualified"}
          </>
        )}
      </button>

      {/* Disqualified Button */}
      <button
        onClick={() => markQualified(lead.id, empId, false, isOldLead)}
        disabled={
          lead.qualified === false || actionLoading[lead.id] === "qualifying"
        }
        className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
          lead.qualified === false || actionLoading[lead.id] === "qualifying"
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 shadow-md hover:shadow-lg"
        }`}
      >
        {actionLoading[lead.id] === "qualifying" ? (
          <>Processing...</>
        ) : (
          <>
            <ThumbsDown className="w-4 h-4" />
            {lead.qualified === false ? "Disqualified" : "Mark Disqualified"}
          </>
        )}
      </button>

      {/* Forward Button - Disabled if lead is disqualified */}
      <button
        onClick={() => forwardLead(lead.id, empId, isOldLead)}
        disabled={
          lead.forwarded ||
          actionLoading[lead.id] === "forwarding" ||
          lead.qualified === false // Disable if lead is disqualified
        }
        className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
          lead.forwarded ||
          actionLoading[lead.id] === "forwarding" ||
          lead.qualified === false
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 shadow-md hover:shadow-lg"
        }`}
        title={
          lead.qualified === false ? "Cannot forward disqualified leads" : ""
        }
      >
        {actionLoading[lead.id] === "forwarding" ? (
          <>Processing...</>
        ) : lead.forwarded ? (
          <>
            <CheckCircle className="w-4 h-4" /> Forwarded
          </>
        ) : lead.qualified === false ? (
          <>
            <XCircle className="w-4 h-4" /> Cannot Forward
          </>
        ) : (
          <>
            <Send className="w-4 h-4" /> Forward to CRM
          </>
        )}
      </button>
    </div>
  </div>
);

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
        className="font-medium text-blue-600 hover:underline truncate"
      >
        {link}
      </a>
    ) : (
      <span className="font-medium text-gray-900 truncate">
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
      <p className="text-gray-900 font-medium whitespace-pre-wrap">
        {value || "Not Available"}
      </p>
    </div>
  </div>
);

export default ForwardLeads;
