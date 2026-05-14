import React, { useEffect, useState } from "react";

const P = {
  white: "#ffffff",
  mist: "#f8fafc",
  fog: "#e2e8f0",
  charcoal: "#1e293b",
  graphite: "#475569",
  accent: "#4f46e5",
  positive: "#16a34a",
  pending: "#ca8a04",
  danger: "#dc2626",
  ash: "#64748b",
};

const STYLES = `
  .da-container {
    font-family: 'Inter', sans-serif;
    color: ${P.charcoal};
  }

  .da-filter-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
    margin-bottom: 20px;
    background: white;
    padding: 16px;
    border-radius: 12px;
    border: 1px solid ${P.fog};
  }

  .da-input {
    width: 100%;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid ${P.fog};
    font-size: 13px;
    outline: none;
    transition: all .2s;
    background: white;
  }

  .da-input:focus {
    border-color: ${P.accent};
    box-shadow: 0 0 0 3px rgba(79,70,229,.08);
  }

  .da-label {
    display: block;
    font-size: 11px;
    font-weight: 700;
    color: ${P.ash};
    text-transform: uppercase;
    margin-bottom: 6px;
    letter-spacing: .05em;
  }

  .da-card {
    background: ${P.white};
    border: 1px solid ${P.fog};
    border-radius: 14px;
    overflow: hidden;
  }

  .da-table {
    width: 100%;
    border-collapse: collapse;
  }

  .da-table th {
    background: ${P.mist};
    padding: 14px 20px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    color: ${P.ash};
    border-bottom: 1px solid ${P.fog};
    text-align: left;
    white-space: nowrap;
  }

  .da-table td {
    padding: 16px 20px;
    font-size: 13px;
    border-bottom: 1px solid ${P.mist};
    white-space: nowrap;
  }

  .da-table tr:hover {
    background: #fafafa;
  }

  .da-badge {
    padding: 5px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    background: ${P.mist};
    color: ${P.accent};
    border: 1px solid ${P.fog};
  }

  .da-status {
    padding: 5px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
  }

  .da-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-top: 1px solid ${P.fog};
    flex-wrap: wrap;
    gap: 12px;
  }

  .da-btn {
    padding: 10px 16px;
    border-radius: 8px;
    border: 1px solid ${P.fog};
    background: white;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
  }

  .da-btn:hover {
    background: ${P.mist};
  }

  .da-btn:disabled {
    opacity: .4;
    cursor: not-allowed;
  }

  .da-reset-btn {
    width: 100%;
    height: 42px;
    background: ${P.mist};
    border: 1px solid ${P.fog};
    border-radius: 8px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    color: ${P.graphite};
  }

  .da-reset-btn:hover {
    background: ${P.fog};
  }

  .da-loading-row {
    text-align: center;
    padding: 30px;
    color: ${P.ash};
    font-weight: 600;
  }

  .da-empty {
    text-align: center;
    padding: 50px;
    color: ${P.ash};
    font-size: 14px;
    font-weight: 500;
  }
`;

const getMonthName = (m) => {
  if (!m) return "—";

  return new Date(2026, m - 1).toLocaleString("default", {
    month: "long",
  });
};

const getStatusStyle = (status) => {
  if (status === "Deal Closed" || status === "Deal") {
    return {
      background: "#dcfce7",
      color: "#166534",
    };
  }

  if (status === "Invoice Pending") {
    return {
      background: "#fef9c3",
      color: "#854d0e",
    };
  }

  if (status === "Invoice Cancelled") {
    return {
      background: "#fee2e2",
      color: "#991b1b",
    };
  }

  return {
    background: "#f1f5f9",
    color: "#334155",
  };
};

const DealAnalytics = ({
  deals = [],
  meta = {
    total: 0,
    page: 1,
    totalPages: 1,
  },
  filters = {},
  setFilters,
  onPageChange,
  loading,
  availableYears = [],
}) => {
  const [searchInput, setSearchInput] = useState(filters?.search || "");

  // SEARCH DEBOUNCE
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        search: searchInput,
        page: 1,
      }));
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const displayRows = deals || [];

  return (
    <div className="da-container">
      <style>{STYLES}</style>

      {/* FILTERS */}

      <div className="da-filter-grid">
        {/* UNIVERSAL SEARCH */}

        <div>
          <label className="da-label">Universal Search</label>

          <input
            type="text"
            className="da-input"
            placeholder="Search anything..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        {/* MONTH */}

        <div>
          <label className="da-label">Month</label>

          <select
            className="da-input"
            value={filters?.month || ""}
            onChange={(e) => handleFilterChange("month", e.target.value)}
          >
            <option value="">All Months</option>

            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {getMonthName(i + 1)}
              </option>
            ))}
          </select>
        </div>

        {/* YEAR */}

        <div>
          <label className="da-label">Year</label>

          <select
            className="da-input"
            value={filters?.year || ""}
            onChange={(e) => handleFilterChange("year", e.target.value)}
          >
            <option value="">All Years</option>

            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* RESET */}

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          <button
            className="da-reset-btn"
            onClick={() => {
              setSearchInput("");

              setFilters({
                page: 1,
                limit: 20,
                month: "",
                year: "",
                search: "",
              });
            }}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* TABLE */}

      <div className="da-card">
        <div style={{ overflowX: "auto" }}>
          <table className="da-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Expo / Event</th>
                <th>Industry</th>
                <th>Deals</th>
                <th>Period</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="da-loading-row">
                    Loading deals...
                  </td>
                </tr>
              ) : displayRows.length > 0 ? (
                displayRows.map((deal, index) => {
                  const rowNum = (meta?.page - 1) * 20 + index + 1;

                  return (
                    <tr key={deal?.id || index}>
                      <td
                        style={{
                          color: P.ash,
                          fontFamily: "monospace",
                          fontWeight: 700,
                        }}
                      >
                        {rowNum}
                      </td>

                      <td>
                        <div
                          style={{
                            fontWeight: 700,
                            color: P.charcoal,
                          }}
                        >
                          {deal?.eventName || "General Entry"}
                        </div>
                      </td>

                      <td>
                        <span
                          style={{
                            fontWeight: 600,
                            color: P.graphite,
                          }}
                        >
                          {deal?.industry || "—"}
                        </span>
                      </td>

                      <td>
                        <span className="da-badge">1 Deal</span>
                      </td>

                      <td>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 700,
                              color: P.charcoal,
                            }}
                          >
                            {getMonthName(deal?.month)}
                          </span>

                          <span
                            style={{
                              fontSize: 11,
                              color: P.ash,
                              fontWeight: 600,
                            }}
                          >
                            {deal?.year || "—"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span
                          className="da-status"
                          style={getStatusStyle(deal?.dealStatus)}
                        >
                          {deal?.dealStatus || "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="da-empty">
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}

        <div className="da-pagination">
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: P.ash,
              textTransform: "uppercase",
              letterSpacing: ".08em",
            }}
          >
            Page {meta?.page || 1}
            {" of "}
            {meta?.totalPages || 1}
            {" • "}
            {meta?.total || 0}
            {" Total Records"}
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
            }}
          >
            <button
              className="da-btn"
              onClick={() => onPageChange?.(meta?.page - 1)}
              disabled={(meta?.page || 1) <= 1}
            >
              Previous
            </button>

            <button
              className="da-btn"
              onClick={() => onPageChange?.(meta?.page + 1)}
              disabled={(meta?.page || 1) >= (meta?.totalPages || 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealAnalytics;
