//pages/DealUpdates.jsx
import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx"; // 🔹 STEP 2 — ADD IMPORT
import DealsTab from "../components/deals/DealsTab";
import DealSettings from "../components/deals/DealSettings";
import DealAnalytics from "../components/deals/DealAnalytics";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api/admin`;

const DealUpdates = () => {
  const [activeTab, setActiveTab] = useState("analytics");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false); // 🔹 STEP 3 — ADD NEW STATE
  const [editingId, setEditingId] = useState(null);

  const [deals, setDeals] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [leadTypes, setLeadTypes] = useState([]);
  const [dealStatuses, setDealStatuses] = useState([]);
  const [events, setEvents] = useState([]);
  const [associations, setAssociations] = useState([]);

  const [showManualPopup, setShowManualPopup] = useState(false);

  const [manualAgent, setManualAgent] = useState({
    manualAgentName: "",
    manualAgentId: "",
  });

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
    const disableCopy = (e) => {
      e.preventDefault();
    };

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
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "c" || e.key === "x" || e.key === "u")
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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
        if (
          value !== undefined &&
          value !== null &&
          value !== "" &&
          value !== "undefined" &&
          value !== "null"
        ) {
          queryParams.append(key, value);
        }
      });

      const queryString = queryParams.toString();
      const res = await fetch(
        queryString ? `${API_BASE}/deals?${queryString}` : `${API_BASE}/deals`,
        { headers: getAuthHeaders() },
      );

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
    const res = await fetch(`${API_BASE}/masters/${newMaster.type}`, {
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

  // 🔹 STEP 4 — ADD BULK UPLOAD FUNCTION
  const handleBulkUpload = async (file) => {
    try {
      setUploading(true);

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet);

      const formattedRows = rows.map((row) => {
        const normalizedRow = {};

        Object.keys(row).forEach((key) => {
          normalizedRow[key.trim()] = row[key];
        });

        return {
          clientEmail:
            normalizedRow["Clinet Email"] ||
            normalizedRow["Client Email"] ||
            normalizedRow.clientEmail ||
            normalizedRow.Email ||
            normalizedRow.email ||
            "",

          industry: normalizedRow["Industry"] || normalizedRow.industry || "",

          leadType: normalizedRow["Lead Type"] || normalizedRow.leadType || "",

          dealStatus: normalizedRow["Status"] || normalizedRow.dealStatus || "",

          month:
            normalizedRow["Deal Month"] === "January" ||
            normalizedRow["Deal Month"] === "Jan"
              ? 1
              : normalizedRow["Deal Month"] === "February" ||
                  normalizedRow["Deal Month"] === "Feb"
                ? 2
                : normalizedRow["Deal Month"] === "March" ||
                    normalizedRow["Deal Month"] === "Mar"
                  ? 3
                  : normalizedRow["Deal Month"] === "April" ||
                      normalizedRow["Deal Month"] === "Apr"
                    ? 4
                    : normalizedRow["Deal Month"] === "May"
                      ? 5
                      : normalizedRow["Deal Month"] === "June" ||
                          normalizedRow["Deal Month"] === "Jun"
                        ? 6
                        : normalizedRow["Deal Month"] === "July" ||
                            normalizedRow["Deal Month"] === "Jul"
                          ? 7
                          : normalizedRow["Deal Month"] === "August" ||
                              normalizedRow["Deal Month"] === "Aug"
                            ? 8
                            : normalizedRow["Deal Month"] === "September" ||
                                normalizedRow["Deal Month"] === "Sep"
                              ? 9
                              : normalizedRow["Deal Month"] === "October" ||
                                  normalizedRow["Deal Month"] === "Oct"
                                ? 10
                                : normalizedRow["Deal Month"] === "November" ||
                                    normalizedRow["Deal Month"] === "Nov"
                                  ? 11
                                  : normalizedRow["Deal Month"] ===
                                        "December" ||
                                      normalizedRow["Deal Month"] === "Dec"
                                    ? 12
                                    : normalizedRow.month || "",

          year:
            Number(normalizedRow["Deal Year"]) ||
            Number(normalizedRow.year) ||
            "",

          eventName: normalizedRow["Event"] || "",

          associationName: normalizedRow["Association"] || "",

          manualAgentName: normalizedRow["Agent Name"] || "",

          ...normalizedRow,
        };
      });

      console.log("FORMATTED ROWS:", formattedRows);

      const res = await fetch(`${API_BASE}/deals/bulk-upload`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          deals: formattedRows,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.message || "Upload failed");
        return;
      }

      alert(
        `Upload Completed\n\nTotal Uploaded: ${result.totalUploaded}\nUnresolved Agents: ${result.unresolvedCount}`,
      );
      fetchDeals();
    } catch (error) {
      console.error("Bulk upload error:", error);
      alert("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMaster = async (type, id) => {
    if (!window.confirm("Delete this item?")) return;
    const res = await fetch(`${API_BASE}/masters/${type}/${id}`, {
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
              handleDeleteDeal={handleDeleteDeal}
              loading={loading}
              saving={saving}
              handleBulkUpload={handleBulkUpload} // 🔹 STEP 5 — PASS NEW PROPS
              uploading={uploading} // 🔹 STEP 5 — PASS NEW PROPS
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
                  events={events}
                  associations={associations}
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
                This email is not registered. Please enter agent details
                manually.
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
                className="w-full border rounded-lg px-3 py-2 text-sm"
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
