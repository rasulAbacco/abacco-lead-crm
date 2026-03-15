import React, { useEffect, useState } from "react";
import DealsTab from "../components/deals/DealsTab";
import DealSettings from "../components/deals/DealSettings";
import DealAnalytics from "../components/deals/DealAnalytics";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api/admin`;

const DealUpdates = () => {
  const [activeTab, setActiveTab] = useState("analytics");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false); // ✅ separate save state
  const [editingId, setEditingId] = useState(null);

  const [deals, setDeals] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [leadTypes, setLeadTypes] = useState([]);
  const [dealStatuses, setDealStatuses] = useState([]);

  const [showManualPopup, setShowManualPopup] = useState(false);

  const [manualAgent, setManualAgent] = useState({
    manualAgentName: "",
    manualAgentId: ""
  });

  const [formData, setFormData] = useState({
    clientEmail: "",
    industry: "",
    leadType: "",
    dealStatus: "",
    month: "",
    year: "",
  });

  const [filters, setFilters] = useState({
    industry: "",
    leadType: "",
    dealStatus: "",
    month: "",
    year: "",
  });

  const [newMaster, setNewMaster] = useState({
    type: "industries",
    value: "",
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    fetchMasters();
  }, []);

  useEffect(() => {
    if (activeTab === "deals" || activeTab === "analytics") {
      fetchDeals();
    }
  }, [filters, activeTab]);

  const fetchDeals = async () => {
    try {
      setLoading(true);

      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const res = await fetch(`${API_BASE}/deals?${queryParams.toString()}`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
          return;
        }
        setDeals([]);
        return;
      }

      const data = await res.json();
      setDeals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch deals error:", err);
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMasters = async () => {
    const request = async (url) => {
      try {
        const res = await fetch(url, { headers: getAuthHeaders() });
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    };

    const [i, l, s] = await Promise.all([
      request(`${API_BASE}/industries`),
      request(`${API_BASE}/lead-types`),
      request(`${API_BASE}/deal-status`),
    ]);

    setIndustries(i);
    setLeadTypes(l);
    setDealStatuses(s);
  };

  const handleSaveDeal = async (e) => {
    e.preventDefault();
    setSaving(true);

    const method = editingId ? "PUT" : "POST";
    const url = editingId
      ? `${API_BASE}/deals/${editingId}`
      : `${API_BASE}/deals`;

    const payload = {
      ...formData,
      ...manualAgent,
      month: formData.month ? Number(formData.month) : null,
      year: formData.year ? Number(formData.year) : null,
    };

    try {
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.status === 400) {
        const data = await res.json();

        if (data.message?.includes("manual agent")) {
          setShowManualPopup(true);
          setSaving(false);
          return;
        }
      }

      if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      if (res.ok) {
        setEditingId(null);
        setShowForm(false);
        setManualAgent({ manualAgentName: "", manualAgentId: "" });

        setFormData({
          clientEmail: "",
          industry: "",
          leadType: "",
          dealStatus: "",
          month: "",
          year: "",
        });

        fetchDeals();
      }
    } catch (err) {
      console.error("Save deal error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDeal = async (id) => {
    if (!window.confirm("Delete this deal?")) return;

    const res = await fetch(`${API_BASE}/deals/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (res.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      return;
    }

    fetchDeals();
  };

  const handleAddMaster = async () => {
    if (!newMaster.value.trim()) return;

    const res = await fetch(`${API_BASE}/${newMaster.type}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ name: newMaster.value }),
    });

    if (res.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      return;
    }

    setNewMaster({ ...newMaster, value: "" });
    fetchMasters();
  };

  const handleDeleteMaster = async (type, id) => {
    if (!window.confirm("Delete this item?")) return;

    const res = await fetch(`${API_BASE}/${type}/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (res.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      return;
    }

    fetchMasters();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">AT</span>
              </div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 hidden sm:block">
                Deal Report{" "}
                <span className="text-indigo-600 font-medium text-sm ml-2">Abacco Tech</span>
              </h1>
            </div>

            <nav className="flex items-center bg-slate-50 border border-slate-200 p-1 rounded-full">
              {[
                { id: "analytics", label: "Analytics" },
                { id: "deals", label: "Deals" },
                { id: "config", label: "Settings" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${activeTab === tab.id
                    ? "bg-white text-indigo-600 shadow-sm border border-slate-100"
                    : "text-slate-500 hover:text-slate-700"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center">
              {activeTab === "deals" && (
                <button
                  onClick={() => {
                    setShowForm(!showForm);
                    setEditingId(null);
                  }}
                  className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold transition-all ${showForm
                    ? "text-slate-600 bg-white border border-slate-200 hover:bg-slate-50"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100"
                    }`}
                >
                  {showForm ? "Close Form" : "+ Create Deal"}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "analytics" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <DealAnalytics deals={deals} />
          </div>
        )}

        {activeTab === "deals" && (
          <div className="space-y-6">
            <DealsTab
              deals={deals}
              industries={industries}
              dealStatuses={dealStatuses}
              leadTypes={leadTypes}
              formData={formData}
              setFormData={setFormData}
              filters={filters}
              setFilters={setFilters}
              showForm={showForm}
              editingId={editingId}
              setEditingId={setEditingId}
              setShowForm={setShowForm}
              handleSaveDeal={handleSaveDeal}
              handleDeleteDeal={handleDeleteDeal}
              loading={loading}
              saving={saving} // ✅ passed down
            />
          </div>
        )}

        {activeTab === "config" && (
          <div className="mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                  Master Data Management
                </h2>
              </div>
              <div className="p-6">
                <DealSettings
                  industries={industries}
                  leadTypes={leadTypes}
                  dealStatuses={dealStatuses}
                  newMaster={newMaster}
                  setNewMaster={setNewMaster}
                  handleAddMaster={handleAddMaster}
                  handleDeleteMaster={handleDeleteMaster}
                />
              </div>
            </div>

          </div>
        )}

        {showManualPopup && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-[420px] p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                Agent Not Found
              </h3>

              <p className="text-sm text-slate-500">
                This email is not registered. Please enter agent details manually.
              </p>

              <input
                type="text"
                placeholder="Agent Name"
                value={manualAgent.manualAgentName}
                onChange={(e) =>
                  setManualAgent({ ...manualAgent, manualAgentName: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />

              <input
                type="text"
                placeholder="Employee ID"
                value={manualAgent.manualAgentId}
                onChange={(e) =>
                  setManualAgent({ ...manualAgent, manualAgentId: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowManualPopup(false)}
                  className="px-4 py-2 text-sm text-slate-500"
                >
                  Cancel
                </button>

                <button
                  onClick={() => {
                    setShowManualPopup(false);
                    handleSaveDeal(new Event("submit"));
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm"
                >
                  Save Deal
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 text-center">
        <p className="text-slate-400 text-xs uppercase tracking-[0.2em] font-medium">
          Powered by AbaccoTech Systems • 2026
        </p>
      </footer>
    </div>
  );
};

export default DealUpdates;
