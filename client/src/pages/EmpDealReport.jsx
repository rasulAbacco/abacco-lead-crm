import React, { useEffect, useState } from "react";
import EmpDealTab from "../components/deals/EmpDealTab";
import DealAnalytics from "../components/deals/DealAnalytics";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api/admin`;

const EmpDealReport = () => {
  const [activeTab, setActiveTab] = useState("analytics");
  const [loading, setLoading] = useState(false);
  const [deals, setDeals] = useState([]);

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

  useEffect(() => {
    const controller = new AbortController();

    const loadDeals = async () => {
      try {
        setLoading(true);
        setDeals([]); // clear previous data immediately

        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) queryParams.append(key, value);
        });

        const endpoint =
          activeTab === "analytics"
            ? `${API_BASE}/deals`
            : `${API_BASE}/emp-deals`;

        const res = await fetch(`${endpoint}?${queryParams.toString()}`, {
          headers: getAuthHeaders(),
          signal: controller.signal,
        });

        const data = await res.json();

        if (!controller.signal.aborted) {
          setDeals(Array.isArray(data) ? data : []);
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

    return () => controller.abort(); // cancel previous request
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

            {/* Tabs */}
            <div className="flex items-center bg-slate-50 border border-slate-200 p-1 rounded-full">
              {[
                { id: "analytics", label: "Analytics" },
                { id: "deals", label: "Deals" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeTab === tab.id
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
            <DealAnalytics deals={deals} />
          </div>
        )}

        {activeTab === "deals" &&
          (loading ? (
            <div className="text-center py-10 text-slate-500">
              Loading deals...
            </div>
          ) : (
            <EmpDealTab
              deals={deals}
              filters={filters}
              setFilters={setFilters}
              loading={loading}
            />
          ))}
      </main>
    </div>
  );
};

export default EmpDealReport;
