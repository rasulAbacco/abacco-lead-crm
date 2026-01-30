import React, { useEffect, useState } from "react";
import {
  Plus,
  Users,
  Mail,
  Phone,
  Edit2,
  Power,
  X,
  Save,
  Loader2,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function SalesEmployee() {
  const [activeView, setActiveView] = useState("view");
  const [salesEmployees, setSalesEmployees] = useState([]);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });
  const [editModal, setEditModal] = useState({
    open: false,
    id: null,
    fullName: "",
    phone: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchSalesEmployees = async () => {
    try {
      setFetching(true);
      setError("");
      const res = await fetch(`${API_BASE_URL}/api/admin/sales-employees`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load sales employees");
      const data = await res.json();
      setSalesEmployees(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchSalesEmployees();
  }, []);

  const addSalesEmployee = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/sales-employees`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to add employee");
      }
      setFormData({ fullName: "", email: "", phone: "" });
      setActiveView("view");
      fetchSalesEmployees();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, isActive) => {
    try {
      await fetch(`${API_BASE_URL}/api/admin/sales-employees/${id}/status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ isActive: !isActive }),
      });
      fetchSalesEmployees();
    } catch {
      alert("Failed to update status");
    }
  };

  const updateSalesEmployee = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/admin/sales-employees/${editModal.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          fullName: editModal.fullName,
          phone: editModal.phone,
          email: editModal.email,
        }),
      });
      setEditModal({ open: false });
      fetchSalesEmployees();
    } catch {
      alert("Failed to update employee");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Sales Team
            </h1>
            <p className="text-slate-500 mt-1">
              Manage your sales representatives and their account status.
            </p>
          </div>

          <div className="flex bg-white p-1.5 rounded-xl shadow-sm border border-slate-200 w-fit">
            <button
              onClick={() => setActiveView("view")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeView === "view"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Users size={18} /> View All
            </button>
            <button
              onClick={() => setActiveView("add")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeView === "add"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Plus size={18} /> Add New
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl animate-in fade-in slide-in-from-top-2">
            <div className="bg-red-200 p-1 rounded-full">
              <X size={14} />
            </div>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* CONTENT AREA */}
        <div className="transition-all duration-300">
          {activeView === "add" ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden max-w-2xl mx-auto">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-semibold">Employee Details</h2>
              </div>
              <form onSubmit={addSalesEmployee} className="p-6 space-y-5">
                <div className="grid gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Full Name
                    </label>
                    <input
                      required
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Email Address
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="john@company.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Phone Number
                    </label>
                    <input
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <button
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Save size={20} />
                  )}
                  {loading ? "Registering..." : "Add Employee"}
                </button>
              </form>
            </div>
          ) : (
            /* VIEW TABLE */
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200">
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Employee
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">
                        Status
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fetching ? (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-6 py-12 text-center text-slate-400"
                        >
                          <Loader2 className="animate-spin mx-auto mb-2" />
                          Fetching records...
                        </td>
                      </tr>
                    ) : salesEmployees.length === 0 ? (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-6 py-12 text-center text-slate-400"
                        >
                          No employees found.
                        </td>
                      </tr>
                    ) : (
                      salesEmployees.map((emp) => (
                        <tr
                          key={emp.id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-800">
                              {emp.fullName}
                            </div>
                            {/* Fixed the slice error by converting to string first */}
                            <div className="text-xs text-slate-400 italic">
                              ID: {String(emp.id).slice(-6)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Mail size={14} className="text-slate-400" />
                              {emp.email}
                            </div>
                            {emp.phone && (
                              <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                                <Phone size={14} className="text-slate-400" />
                                {emp.phone}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                emp.isActive
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${emp.isActive ? "bg-emerald-500" : "bg-slate-400"}`}
                              ></span>
                              {emp.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() =>
                                  setEditModal({
                                    open: true,
                                    ...emp,
                                    phone: emp.phone || "",
                                  })
                                }
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Edit Profile"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() =>
                                  toggleStatus(emp.id, emp.isActive)
                                }
                                className={`p-2 rounded-lg transition-all ${
                                  emp.isActive
                                    ? "text-slate-400 hover:text-red-600 hover:bg-red-50"
                                    : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                                }`}
                                title={emp.isActive ? "Deactivate" : "Activate"}
                              >
                                <Power size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* MODAL */}
        {editModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
              onClick={() => setEditModal({ open: false })}
            ></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800">
                  Edit Profile
                </h2>
                <button
                  onClick={() => setEditModal({ open: false })}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Full Name
                  </label>
                  <input
                    className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    value={editModal.fullName}
                    onChange={(e) =>
                      setEditModal({ ...editModal, fullName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Email
                  </label>
                  <input
                    className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    value={editModal.email}
                    onChange={(e) =>
                      setEditModal({ ...editModal, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Phone
                  </label>
                  <input
                    className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    value={editModal.phone}
                    onChange={(e) =>
                      setEditModal({ ...editModal, phone: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-6 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={() => setEditModal({ open: false })}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={updateSalesEmployee}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-md shadow-blue-200 transition-all"
                >
                  Update Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
