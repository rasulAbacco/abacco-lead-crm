import React, { useEffect, useState } from "react";

import EmpDealTab from "../components/deals/EmpDealTab";
import DealAnalytics from "../components/deals/DealAnalytics";

// API
const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api/admin`;

const EmpDealReport = () => {
  const [activeTab, setActiveTab] = useState("analytics");

  const [loading, setLoading] = useState(false);

  // EMPLOYEE DEALS TAB
  const [deals, setDeals] = useState([]);

  // ANALYTICS TAB
  const [analyticsDeals, setAnalyticsDeals] = useState([]);

  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
  });

  // YEARS
  const [availableYears, setAvailableYears] = useState([]);

  // FILTERS
  const [filters, setFilters] = useState({
    month: "",
    year: "",
    search: "",
    page: 1,
    limit: 20,
  });

  // AUTH
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");

    return {
      "Content-Type": "application/json",

      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    };
  };

  // SECURITY
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

  // BLOCK SHORTCUTS
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && ["c", "x", "u"].includes(e.key)) {
        e.preventDefault();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // FETCH YEARS
  const fetchAvailableYears = async () => {
    try {
      const res = await fetch(`${API_BASE}/deals/years`, {
        headers: getAuthHeaders(),
      });

      const data = await res.json();

      setAvailableYears(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Years fetch error:", err);
    }
  };

  // FETCH DATA
  useEffect(() => {
    const controller = new AbortController();

    const loadDeals = async () => {
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

        const query = queryParams.toString();

        // EMPLOYEE DEALS
        const empPromise = fetch(
          `${API_BASE}/emp-deals${query ? `?${query}` : ""}`,
          {
            headers: getAuthHeaders(),

            signal: controller.signal,
          },
        );

        // ANALYTICS
        const analyticsPromise = fetch(
          `${API_BASE}/deals/analytics${query ? `?${query}` : ""}`,
          {
            headers: getAuthHeaders(),

            signal: controller.signal,
          },
        );

        const [empRes, analyticsRes] = await Promise.all([
          empPromise,
          analyticsPromise,
        ]);

        const empData = await empRes.json();

        const analyticsData = await analyticsRes.json();

        if (!controller.signal.aborted) {
          // DEALS TAB
          setDeals(Array.isArray(empData) ? empData : []);

          // ANALYTICS TAB
          setAnalyticsDeals(analyticsData?.deals || []);

          setMeta(
            analyticsData?.meta || {
              total: 0,
              page: 1,
              totalPages: 1,
            },
          );
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

  // LOAD YEARS
  useEffect(() => {
    fetchAvailableYears();
  }, []);

  // PAGINATION
  const onPageChange = (newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* HEADER */}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-lg font-bold text-slate-900">
              My Deal Insights
            </h1>

            <div className="flex items-center bg-slate-50 border border-slate-200 p-1 rounded-full">
              {[
                {
                  id: "analytics",
                  label: "Analytics",
                },

                {
                  id: "deals",
                  label: "Deals",
                },
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

      {/* MAIN */}

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* ANALYTICS */}

        {activeTab === "analytics" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <DealAnalytics
              deals={analyticsDeals}
              meta={meta}
              filters={filters}
              setFilters={setFilters}
              onPageChange={onPageChange}
              loading={loading}
              availableYears={availableYears}
            />
          </div>
        )}

        {/* DEALS */}

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
