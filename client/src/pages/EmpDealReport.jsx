import React, { useEffect, useState } from "react";
import EmpDealTab from "../components/deals/EmpDealTab";
import DealAnalytics from "../components/deals/DealAnalytics";

// ✅ STEP 1 — FIX API BASE
const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api/admin`;

const EmpDealReport = () => {
  const [activeTab, setActiveTab] = useState("analytics");
  const [loading, setLoading] = useState(false);

  // ✅ STEP 2 — SPLIT STATE (VERY IMPORTANT)
  const [deals, setDeals] = useState([]);        // employee deals
  const [allDeals, setAllDeals] = useState([]);  // all deals (analytics)

  const [filters, setFilters] = useState({
    industry: "",
    leadType: "",
    dealStatus: "",
    month: "",
    year: "",
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // ✅ STEP 5 — KEEP useEffect SAME
  useEffect(() => {
    const controller = new AbortController();

    // ✅ STEP 4 — NEW FETCH LOGIC (CORE FIX)
    const loadDeals = async () => {
      try {
        setLoading(true);

        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) queryParams.append(key, value);
        });

        const query = queryParams.toString();

        // 🔥 ALWAYS fetch both
        const [empRes, allRes] = await Promise.all([
          fetch(`${API_BASE}/emp-deals${query ? `?${query}` : ""}`, {
            headers: getAuthHeaders(),
            signal: controller.signal,
          }),
          fetch(`${API_BASE}/deals${query ? `?${query}` : ""}`, {
            headers: getAuthHeaders(),
            signal: controller.signal,
          }),
        ]);

        const empData = await empRes.json();
        const allData = await allRes.json();

        if (!controller.signal.aborted) {
          setDeals(Array.isArray(empData) ? empData : []);
          setAllDeals(Array.isArray(allData) ? allData : []);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Employee deals fetch error:", err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadDeals();

    return () => controller.abort();
  }, [filters, activeTab]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-lg font-bold text-slate-900">
              My Deal Insights
            </h1>

            <div className="flex items-center bg-slate-50 border border-slate-200 p-1 rounded-full">
              {[
                { id: "analytics", label: "Analytics" },
                { id: "deals", label: "Deals" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${activeTab === tab.id
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "analytics" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            {/* ✅ STEP 6 — FIX ANALYTICS PROP (CRITICAL) */}
            <DealAnalytics
              deals={deals}        // employee data → KPI
              allDeals={allDeals}  // full data → charts
              role="employee"
            />
          </div>
        )}

        {activeTab === "deals" && (
          <EmpDealTab
            deals={deals}
            filters={filters}
            setFilters={setFilters}
            loading={loading}
          />
        )}
      </main>
    </div>
  );
};

export default EmpDealReport;