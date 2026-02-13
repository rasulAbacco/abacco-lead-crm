import React, { useState, useEffect } from "react";
import {
  Mail,
  Globe,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const normalizeDomain = (domain) => (domain ? domain.trim().toLowerCase() : "");
const formatDomain = (domain) => {
  const clean = normalizeDomain(domain);
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

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

  const groupedSummary = React.useMemo(() => {
    return domains.reduce((acc, item) => {
      const key = normalizeDomain(item.domain);
      if (!acc[key]) acc[key] = { emailCount: 0, totalLeads: 0, monthLeads: 0 };
      acc[key].emailCount += 1;
      acc[key].totalLeads += item.totalCount || 0;
      acc[key].monthLeads += item.currentMonthCount || 0;
      return acc;
    }, {});
  }, [domains]);

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    setFetchingDomains(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/email-domains/${employeeId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      const data = await response.json();
      if (response.ok) setDomains(data.domains || []);
    } catch (error) {
      toast.error("Failed to connect to server");
    } finally {
      setFetchingDomains(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/email-domains`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ ...formData, employeeId }),
      });
      if (response.ok) {
        toast.success("Domain added successfully!");
        setFormData({ email: "", domain: "", isActive: true });
        fetchDomains();
      }
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
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (response.ok) {
        toast.success("Status updated");
        fetchDomains();
      }
    } catch (error) {
      toast.error("Update failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] p-4 md:p-6 font-sans">
      <Toaster position="top-right" />

      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* --- SECTION 1: HEADER & UPDATED FORM WITH STATUS --- */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              Email Infrastructure
            </h1>
            <p className="text-slate-500 font-medium">
              Manage and monitor domain-specific lead generation
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-wrap items-center gap-3 w-full xl:w-auto"
          >
            <div className="relative flex-1 min-w-[220px]">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                required
              />
            </div>
            <div className="relative flex-1 min-w-[150px]">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Domain"
                value={formData.domain}
                onChange={(e) =>
                  setFormData({ ...formData, domain: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                required
              />
            </div>

            {/* RESTORED STATUS DROPDOWN */}
            <div className="relative min-w-[130px]">
              <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={formData.isActive}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    isActive: e.target.value === "true",
                  })
                }
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all appearance-none cursor-pointer font-bold text-sm text-slate-600"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <button
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add Domain
            </button>
          </form>
        </div>

        {/* --- SECTION 2: TOP SUMMARY CARDS (With Horizontal Scroll for Multiple Domains) --- */}
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
          {Object.entries(groupedSummary).map(([domain, data]) => (
            <div
              key={domain}
              className="group relative flex-shrink-0 w-[280px] bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-5 text-white shadow-xl shadow-indigo-100 overflow-hidden transition-transform hover:-translate-y-1"
            >
              <Globe className="absolute -right-4 -bottom-4 w-20 h-20 text-white/10 group-hover:rotate-12 transition-transform" />
              <div className="relative z-10">
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-200 opacity-80">
                  Network Provider
                </span>
                <h3 className="text-xl font-black mb-4 truncate">
                  {formatDomain(domain)}
                </h3>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-bold text-indigo-200 uppercase opacity-80">
                      Total Mails
                    </p>
                    <p className="text-2xl font-black">{data.emailCount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-indigo-200 uppercase opacity-80">
                      Lead Growth
                    </p>
                    <p className="text-2xl font-black">{data.totalLeads}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* --- SECTION 3: FULL WIDTH DATA TABLE --- */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800">
              Email Fleet Management
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Total Records: {domains.length}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            {fetchingDomains ? (
              <div className="p-20 flex flex-col items-center gap-4">
                <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
                <p className="text-slate-400 font-bold tracking-tighter uppercase">
                  Synchronizing Fleet...
                </p>
              </div>
            ) : (
              <table className="w-full text-left min-w-[1000px]">
                <thead>
                  <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/30">
                    <th className="px-8 py-4">No.</th> {/* 👈 Add this */}
                    <th className="px-8 py-4">Identity</th>
                    <th className="px-8 py-4">Provider</th>
                    <th className="px-8 py-4">
                      Analytics (Lifetime / Monthly)
                    </th>
                    <th className="px-8 py-4">System Status</th>
                    <th className="px-8 py-4">Deployment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {domains.map((domain, index) => (
                    <tr
                      key={domain.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="px-8 py-5 text-sm font-bold text-slate-500">
                        {index + 1}
                      </td>

                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black">
                            {domain.domain.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-700">
                              {domain.email}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                              Verified Integration
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg uppercase tracking-widest border border-slate-200">
                          {formatDomain(domain.domain)}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">
                              Lifetime
                            </p>
                            <p className="text-sm font-black text-slate-700">
                              {domain.totalCount || 0}
                            </p>
                          </div>
                          <div className="h-8 w-[1px] bg-slate-100" />
                          <div>
                            <p className="text-[10px] font-bold text-indigo-400 uppercase">
                              Monthly
                            </p>
                            <p className="text-sm font-black text-indigo-600">
                              {domain.currentMonthCount || 0}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <button
                          onClick={() =>
                            handleToggle(domain.id, domain.isActive)
                          }
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all border ${
                            domain.isActive
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100"
                          }`}
                        >
                          {domain.isActive ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          {domain.isActive ? "ACTIVE" : "PAUSED"}
                        </button>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-600">
                            {new Date(domain.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                            Auto-Deployed
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailDomains;
