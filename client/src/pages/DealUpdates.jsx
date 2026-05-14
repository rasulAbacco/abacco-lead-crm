// pages/DealUpdates.jsx
import React, { useEffect, useState, useCallback } from "react";
import * as XLSX from "xlsx";
import DealsTab from "../components/deals/DealsTab";
import DealSettings from "../components/deals/DealSettings";
import DealAnalytics from "../components/deals/DealAnalytics";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api/admin`;

const DealUpdates = () => {
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState("analytics");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Data & Pagination States
  const [deals, setDeals] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [industries, setIndustries] = useState([]);
  const [leadTypes, setLeadTypes] = useState([]);
  const [dealStatuses, setDealStatuses] = useState([]);
  const [events, setEvents] = useState([]);
  const [associations, setAssociations] = useState([]);

  // Agent Fallback States
  const [showManualPopup, setShowManualPopup] = useState(false);
  const [manualAgent, setManualAgent] = useState({
    manualAgentName: "",
    manualAgentId: "",
  });

  // Form & Filter States
  const [formData, setFormData] = useState({
    clientEmail: "",
    industry: "",
    industryId: "",
    eventId: "",
    associationId: "",
    leadType: "",
    dealStatus: "",
    month: "",
    year: "",
  });

  const [filters, setFilters] = useState({
    industry: "",
    industryId: "",
    eventId: "",
    associationId: "",
    leadType: "",
    dealStatus: "",
    month: "",
    year: "",
    page: 1,
    limit: 20, // Critical for server-side volume management
  });

  const [newMaster, setNewMaster] = useState({ type: "industries", value: "" });

  // Security & Utility
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // Security Layer: Disable Inspection & Theft
  useEffect(() => {
    const disableCopy = (e) => e.preventDefault();
    document.addEventListener("copy", disableCopy);
    document.addEventListener("cut", disableCopy);
    document.addEventListener("contextmenu", disableCopy);
    return () => {
      document.removeEventListener("copy", disableCopy);
      document.removeEventListener("cut", disableCopy);
      document.removeEventListener("contextmenu", disableCopy);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && ["c", "x", "u"].includes(e.key)) {
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Data Fetching Logic
  const fetchDeals = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== "" &&
          value !== "undefined"
        ) {
          queryParams.append(key, value);
        }
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

      // Handle Paginated Backend Structure
      if (data.deals) {
        setDeals(data.deals);
        setMeta(data.meta);
      } else {
        setDeals(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Deal retrieval error:", err);
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMasters();
  }, []);

  useEffect(() => {
    if (activeTab === "deals" || activeTab === "analytics") {
      fetchDeals();
    }
  }, [fetchDeals, activeTab]);

  const onPageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const fetchMasters = async () => {
    const request = async (url) => {
      try {
        const res = await fetch(url, { headers: getAuthHeaders() });
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    };

    const [i, l, s, e, a] = await Promise.all([
      request(`${API_BASE}/masters/industries`),
      request(`${API_BASE}/masters/lead-types`),
      request(`${API_BASE}/masters/deal-status`),
      request(`${API_BASE}/masters/events`),
      request(`${API_BASE}/masters/associations`),
    ]);

    setIndustries(i);
    setLeadTypes(l);
    setDealStatuses(s);
    setEvents(e);
    setAssociations(a);
  };

  // Action Handlers
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
      month: Number(formData.month),
      year: Number(formData.year),
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
          return;
        }
      }
      if (res.ok) {
        setEditingId(null);
        setShowForm(false);
        setManualAgent({ manualAgentName: "", manualAgentId: "" });
        setFormData({
          clientEmail: "",
          industry: "",
          industryId: "",
          eventId: "",
          associationId: "",
          leadType: "",
          dealStatus: "",
          month: "",
          year: "",
        });
        fetchDeals();
      }
    } catch (err) {
      console.error("Save failure:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUpload = async (file) => {
    try {
      setUploading(true);
      const data = await file.arrayBuffer();
      const rows = XLSX.utils.sheet_to_json(
        XLSX.read(data).Sheets[XLSX.read(data).SheetNames[0]],
      );

      const formattedRows = rows.map((row) => {
        const normalized = {};
        Object.keys(row).forEach((k) => (normalized[k.trim()] = row[k]));
        return {
          clientEmail:
            normalized["Client Email"] ||
            normalized.clientEmail ||
            normalized.Email ||
            "",
          industry: normalized["Industry"] || normalized.industry || "",
          leadType: normalized["Lead Type"] || normalized.leadType || "",
          dealStatus: normalized["Status"] || normalized.dealStatus || "",
          month: normalized.month || "",
          year: Number(normalized.year) || "",
          eventName: normalized["Event"] || "",
          associationName: normalized["Association"] || "",
          manualAgentName: normalized["Agent Name"] || "",
          ...normalized,
        };
      });

      const res = await fetch(`${API_BASE}/deals/bulk-upload`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ deals: formattedRows }),
      });
      const result = await res.json();
      if (res.ok) {
        alert(
          `Upload Complete. Records: ${result.totalUploaded}, Unresolved: ${result.unresolvedCount}`,
        );
        fetchDeals();
      }
    } catch {
      alert("File upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased select-none">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">AT</span>
              </div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 hidden sm:block">
                Deal Report{" "}
                <span className="text-indigo-600 font-medium text-sm ml-2">
                  Abacco Tech
                </span>
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
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
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
            <DealAnalytics
              deals={deals}
              meta={meta}
              filters={filters}
              setFilters={setFilters}
              onPageChange={onPageChange}
              loading={loading}
            />
          </div>
        )}

        {activeTab === "deals" && (
          <DealsTab
            deals={deals}
            industries={industries}
            events={events}
            associations={associations}
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
            handleDeleteDeal={(id) => {
              if (window.confirm("Delete this deal?"))
                fetch(`${API_BASE}/deals/${id}`, {
                  method: "DELETE",
                  headers: getAuthHeaders(),
                }).then(fetchDeals);
            }}
            loading={loading}
            saving={saving}
            handleBulkUpload={handleBulkUpload}
            uploading={uploading}
          />
        )}

        {activeTab === "config" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <DealSettings
              industries={industries}
              events={events}
              associations={associations}
              leadTypes={leadTypes}
              dealStatuses={dealStatuses}
              newMaster={newMaster}
              setNewMaster={setNewMaster}
              handleAddMaster={() => {
                if (!newMaster.value.trim()) return;
                fetch(`${API_BASE}/masters/${newMaster.type}`, {
                  method: "POST",
                  headers: getAuthHeaders(),
                  body: JSON.stringify({ name: newMaster.value }),
                }).then(() => {
                  setNewMaster({ ...newMaster, value: "" });
                  fetchMasters();
                });
              }}
              handleDeleteMaster={(type, id) => {
                if (window.confirm("Delete this item?"))
                  fetch(`${API_BASE}/masters/${type}/${id}`, {
                    method: "DELETE",
                    headers: getAuthHeaders(),
                  }).then(fetchMasters);
              }}
            />
          </div>
        )}

        {showManualPopup && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-[400px] shadow-2xl space-y-4">
              <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider">
                Agent Registration Required
              </h3>
              <p className="text-xs text-slate-500">
                The provided email is not in our directory. Please enter agent
                credentials manually.
              </p>
              <input
                type="text"
                placeholder="Agent Name"
                value={manualAgent.manualAgentName}
                onChange={(e) =>
                  setManualAgent({
                    ...manualAgent,
                    manualAgentName: e.target.value,
                  })
                }
                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="Employee ID"
                value={manualAgent.manualAgentId}
                onChange={(e) =>
                  setManualAgent({
                    ...manualAgent,
                    manualAgentId: e.target.value,
                  })
                }
                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowManualPopup(false)}
                  className="text-sm text-slate-400 hover:text-slate-600"
                >
                  Discard
                </button>
                <button
                  onClick={() => {
                    setShowManualPopup(false);
                    handleSaveDeal(new Event("submit"));
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
                >
                  Finalize & Save
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
