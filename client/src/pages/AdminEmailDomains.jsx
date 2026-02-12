import React, { useState, useEffect } from "react";
import {
  Mail,
  Globe,
  Trash2,
  RefreshCw,
  AlertCircle,
  Users,
  TrendingUp,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function AdminEmailDomains() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedEmployees, setExpandedEmployees] = useState(new Set());

  useEffect(() => {
    fetchAllEmployeesDomains();
  }, []);

  const fetchAllEmployeesDomains = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/email-domains-all`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Server returned non-JSON response");
        toast.error("Server error: Invalid response format");
        setEmployees([]);
        return;
      }

      const data = await response.json();
      if (response.ok) {
        setEmployees(data.employees || []);
      } else {
        toast.error(data.error || "Failed to fetch data");
        setEmployees([]);
      }
    } catch (error) {
      console.error("Error fetching domains:", error);
      toast.error("Failed to connect to server");
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDomain = async (domainId, employeeName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete this domain from ${employeeName}?`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/email-domains/${domainId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (response.ok) {
        toast.success("Domain deleted successfully!");
        fetchAllEmployeesDomains();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete domain");
      }
    } catch (error) {
      console.error("Error deleting domain:", error);
      toast.error("Failed to delete domain");
    }
  };

  const handleToggleStatus = async (domainId, currentStatus, employeeName) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/email-domains/${domainId}/toggle`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            isActive: !currentStatus,
          }),
        },
      );

      if (response.ok) {
        toast.success(`Status updated for ${employeeName}'s domain!`);
        fetchAllEmployeesDomains();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const toggleEmployeeExpansion = (employeeId) => {
    setExpandedEmployees((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId);
      } else {
        newSet.add(employeeId);
      }
      return newSet;
    });
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalDomains = employees.reduce(
    (sum, emp) => sum + emp.mailDomains.length,
    0,
  );
  const totalLeads = employees.reduce(
    (sum, emp) =>
      sum +
      emp.mailDomains.reduce((domSum, domain) => domSum + domain.leadCount, 0),
    0,
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-6">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Admin Email Domains
                  </h1>
                  <p className="text-sm text-gray-600">
                    Manage all employee email domains
                  </p>
                </div>
              </div>

              <button
                onClick={fetchAllEmployeesDomains}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg flex items-center gap-2"
              >
                <RefreshCw
                  className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">
                  {employees.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Domains</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalDomains}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">{totalLeads}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by employee name, ID, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Employees List */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-16 text-center">
            <RefreshCw className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500 font-medium">Loading data...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-16 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No employees found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEmployees.map((employee) => (
              <div
                key={employee.id}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
              >
                {/* Employee Header */}
                <div
                  className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 cursor-pointer hover:from-indigo-100 hover:to-purple-100 transition-all"
                  onClick={() => toggleEmployeeExpansion(employee.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {employee.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {employee.fullName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {employee.employeeId} • {employee.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Domains</p>
                        <p className="text-2xl font-bold text-indigo-600">
                          {employee.mailDomains.length}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total Leads</p>
                        <p className="text-2xl font-bold text-green-600">
                          {employee.mailDomains.reduce(
                            (sum, domain) => sum + domain.leadCount,
                            0,
                          )}
                        </p>
                      </div>
                      {expandedEmployees.has(employee.id) ? (
                        <ChevronUp className="w-6 h-6 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Domains Table - Expanded */}
                {expandedEmployees.has(employee.id) && (
                  <div className="p-6">
                    {employee.mailDomains.length === 0 ? (
                      <div className="text-center py-8">
                        <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No domains added yet</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase w-16">
                                #
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                                Email
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                                Domain
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                                Status
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                                Lead Count
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                                Created
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {employee.mailDomains.map((domain, index) => (
                              <tr
                                key={domain.id}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <td className="px-4 py-4">
                                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-xs">
                                      {index + 1}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-indigo-600" />
                                    <span className="text-sm font-medium text-gray-900">
                                      {domain.email}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-purple-600" />
                                    <span className="text-sm text-gray-700">
                                      {domain.domain}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <button
                                    onClick={() =>
                                      handleToggleStatus(
                                        domain.id,
                                        domain.isActive,
                                        employee.fullName,
                                      )
                                    }
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                      domain.isActive
                                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                                        : "bg-red-100 text-red-700 hover:bg-red-200"
                                    }`}
                                  >
                                    {domain.isActive
                                      ? "✓ Active"
                                      : "✗ Inactive"}
                                  </button>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                      <span className="text-green-700 font-bold text-xs">
                                        {domain.leadCount}
                                      </span>
                                    </div>
                                    <span className="text-sm text-gray-600">
                                      leads
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <span className="text-xs text-gray-600">
                                    {new Date(
                                      domain.createdAt,
                                    ).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                </td>
                                <td className="px-4 py-4 text-right">
                                  <button
                                    onClick={() =>
                                      handleDeleteDomain(
                                        domain.id,
                                        employee.fullName,
                                      )
                                    }
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete domain"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Info Card */}
        <div className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-amber-900 mb-2">
                Admin Instructions
              </h3>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>
                  • Click on employee rows to expand and view their domains
                </li>
                <li>
                  • Lead Count shows how many leads use that email address
                </li>
                <li>• Toggle status to activate/deactivate domains</li>
                <li>
                  • Delete domains carefully - this action cannot be undone
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminEmailDomains;
