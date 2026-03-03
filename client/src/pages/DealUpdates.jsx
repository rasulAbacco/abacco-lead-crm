import React, { useEffect, useState } from "react";
import DealsTab from "../components/deals/DealsTab";
import DealSettings from "../components/deals/DealSettings";
import DealAnalytics from "../components/deals/DealAnalytics";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api/admin`;

const DealUpdates = () => {
  const [activeTab, setActiveTab] = useState("analytics");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [deals, setDeals] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [leadTypes, setLeadTypes] = useState([]);
  const [dealStatuses, setDealStatuses] = useState([]);

  const [formData, setFormData] = useState({
    clientEmail: "",
    industry: "",
    leadType: "",
    dealStatus: "",
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

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

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
      const data = await res.json();
      setDeals(data || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchMasters = async () => {
    const [i, l, s] = await Promise.all([
      fetch(`${API_BASE}/industries`, { headers: getAuthHeaders() }).then((r) =>
        r.json(),
      ),
      fetch(`${API_BASE}/lead-types`, { headers: getAuthHeaders() }).then((r) =>
        r.json(),
      ),
      fetch(`${API_BASE}/deal-status`, { headers: getAuthHeaders() }).then(
        (r) => r.json(),
      ),
    ]);
    setIndustries(i);
    setLeadTypes(l);
    setDealStatuses(s);
  };

  const handleSaveDeal = async (e) => {
    e.preventDefault();
    const method = editingId ? "PUT" : "POST";
    const url = editingId
      ? `${API_BASE}/deals/${editingId}`
      : `${API_BASE}/deals`;

    const res = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setEditingId(null);
      setShowForm(false);
      setFormData({
        clientEmail: "",
        industry: "",
        leadType: "",
        dealStatus: "",
      });
      fetchDeals();
    }
  };

  const handleDeleteDeal = async (id) => {
    if (!window.confirm("Delete this deal?")) return;
    await fetch(`${API_BASE}/deals/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    fetchDeals();
  };

  const handleAddMaster = async () => {
    if (!newMaster.value.trim()) return;
    await fetch(`${API_BASE}/${newMaster.type}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ name: newMaster.value }),
    });
    setNewMaster({ ...newMaster, value: "" });
    fetchMasters();
  };

  const handleDeleteMaster = async (type, id) => {
    if (!window.confirm("Delete this item?")) return;
    await fetch(`${API_BASE}/${type}/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    fetchMasters();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased">
      {/* --- Sticky Header --- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo & Brand */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">DF</span>
              </div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 hidden sm:block">
                DealFlow{" "}
                <span className="text-indigo-600 font-medium text-sm">v2</span>
              </h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="flex items-center bg-slate-50 border border-slate-200 p-1 rounded-full">
              {[
                { id: "analytics", label: "Analytics" },
                { id: "deals", label: "Deals" },
                { id: "config", label: "Settings" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-white text-indigo-600 shadow-sm border border-slate-100"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center">
              {activeTab === "deals" && (
                <button
                  onClick={() => {
                    setShowForm(!showForm);
                    setEditingId(null);
                  }}
                  className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    showForm
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

      {/* --- Main Content Area --- */}
      <main className=" mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Analytics Section */}
        {activeTab === "analytics" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <DealAnalytics deals={deals} />
          </div>
        )}

        {/* Deals Section */}
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
            />
          </div>
        )}

        {/* Settings Section */}
        {activeTab === "config" && (
          <div className=" mx-auto">
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
      </main>

      {/* --- Simple Footer --- */}
      <footer className="max-w-7xl mx-auto px-6 py-12 text-center">
        <p className="text-slate-400 text-xs uppercase tracking-[0.2em] font-medium">
          Powered by AbaccoTech Systems &bull; 2026
        </p>
      </footer>
    </div>
  );
};

export default DealUpdates;
