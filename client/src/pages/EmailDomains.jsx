import React, { useState, useEffect } from "react";
import { Mail, Globe, Plus, RefreshCw, AlertCircle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function EmailDomains() {
  const [formData, setFormData] = useState({
    email: "",
    domain: "",
    isActive: true,
  });
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingDomains, setFetchingDomains] = useState(true);
  const employeeId = localStorage.getItem("employeeId");

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    setFetchingDomains(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/email-domains/${employeeId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Server returned non-JSON response");
        toast.error("Server error: Invalid response format");
        setDomains([]);
        setFetchingDomains(false);
        return;
      }

      const data = await response.json();
      if (response.ok) {
        setDomains(data.domains || []);
      } else {
        toast.error(data.error || "Failed to fetch domains");
        setDomains([]);
      }
    } catch (error) {
      console.error("Error fetching domains:", error);
      toast.error("Failed to connect to server");
      setDomains([]);
    } finally {
      setFetchingDomains(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.email.trim() || !formData.domain.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/email-domains`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...formData,
          employeeId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Domain added successfully!");
        setFormData({ email: "", domain: "", isActive: true });
        fetchDomains();
      } else {
        toast.error(data.error || "Failed to add domain");
      }
    } catch (error) {
      console.error("Error adding domain:", error);
      toast.error("Failed to add domain");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/email-domains/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      });

      if (response.ok) {
        toast.success("Status updated successfully!");
        fetchDomains();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-6">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 text-center md:text-left">
          <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl shadow-lg mb-4 w-full">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Email Domains Management
              </h1>
              <p className="text-sm text-gray-600">
                Manage your email addresses and domains efficiently
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 mb-8 border border-gray-100 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Add New Domain</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {/* Email Input */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-600" />
                  Email Address
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="abc@gmail.com"
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 hover:border-indigo-300 bg-gray-50 focus:bg-white"
                />
              </div>

              {/* Domain Input */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-purple-600" />
                  Domain
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.domain}
                  onChange={(e) =>
                    setFormData({ ...formData, domain: e.target.value })
                  }
                  placeholder="gmail"
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 hover:border-purple-300 bg-gray-50 focus:bg-white"
                />
              </div>

              {/* Status Dropdown */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-green-600" />
                  Status
                </label>
                <select
                  value={formData.isActive}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isActive: e.target.value === "true",
                    })
                  }
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 hover:border-green-300 bg-gray-50 focus:bg-white cursor-pointer"
                >
                  <option value="true">✓ Active</option>
                  <option value="false">✗ Inactive</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transform hover:scale-105"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Add Domain
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Domains List */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden backdrop-blur-sm">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <Globe className="w-6 h-6" />
              Your Domains
              <span className="ml-auto bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-semibold">
                {domains.length} Total
              </span>
            </h2>
          </div>

          {fetchingDomains ? (
            <div className="p-16 text-center">
              <RefreshCw className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-spin" />
              <p className="text-gray-500 font-medium">Loading domains...</p>
            </div>
          ) : domains.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Globe className="w-12 h-12 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No domains added yet
              </h3>
              <p className="text-gray-500">
                Add your first domain using the form above
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-20">
                      #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Email Address
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Domain
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Created Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {domains.map((domain, index) => (
                    <tr
                      key={domain.id}
                      className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200"
                    >
                      {/* Row Number Column */}
                      <td className="px-6 py-5">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {index + 1}
                          </span>
                        </div>
                      </td>

                      {/* Email Column */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                            <Mail className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-gray-900 block">
                              {domain.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Domain Column */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Globe className="w-4 h-4 text-purple-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {domain.domain}
                          </span>
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="px-6 py-5">
                        <button
                          onClick={() =>
                            handleToggle(domain.id, domain.isActive)
                          }
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 transform hover:scale-105 shadow-md ${
                            domain.isActive
                              ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700"
                              : "bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700"
                          }`}
                        >
                          {domain.isActive ? "✓ Active" : "✗ Inactive"}
                        </button>
                      </td>

                      {/* Created Date Column */}
                      <td className="px-6 py-5">
                        <span className="text-sm text-gray-600 font-medium">
                          {new Date(domain.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </span>
                        <span className="block text-xs text-gray-400 mt-1">
                          {new Date(domain.createdAt).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 mb-2">Quick Tips</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Enter complete email addresses (e.g., abc@gmail.com)</li>
                <li>
                  • Domain should be the email provider (e.g., gmail, yahoo)
                </li>
                <li>• Toggle status anytime by clicking the status button</li>
                <li>• Inactive domains will be stored but not actively used</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailDomains;
