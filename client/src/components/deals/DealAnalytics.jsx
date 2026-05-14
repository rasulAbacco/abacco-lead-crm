import React, { useEffect, useState } from "react";

const P = {
  textMain: "#1e293b",
  textMuted: "#64748b",
  accent: "#4f46e5",
  border: "#f1f5f9",
  rowHover: "#f8fafc",
  childBg: "#ffffff",
  success: "#10b981",
  pending: "#f59e0b",
  danger: "#ef4444",
};

const STYLES = `
  .classic-container {
    font-family: 'Inter', -apple-system, sans-serif;
    color: ${P.textMain};
    max-width: 1300px;
    margin: 0 auto;
    padding: 40px 20px;
  }

  /* Header & Filters */
  .classic-header {
    margin-bottom: 32px;
    border-bottom: 1px solid ${P.border};
    padding-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 20px;
    flex-wrap: wrap;
  }

  .filter-group {
    display: flex;
    gap: 24px;
    flex-grow: 1;
  }

  .classic-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .classic-field label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${P.textMuted};
  }

  .classic-input {
    border: none;
    border-bottom: 2px solid ${P.border};
    padding: 8px 0;
    background: transparent;
    font-size: 14px;
    color: ${P.textMain};
    outline: none;
    transition: border-color 0.2s;
    min-width: 150px;
  }

  .classic-input:focus {
    border-color: ${P.accent};
  }

  .btn-clear {
    background: none;
    border: none;
    color: ${P.textMuted};
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    padding: 8px 0;
    text-decoration: underline;
    text-underline-offset: 4px;
  }

  /* Table Style */
  .classic-table {
    width: 100%;
    border-collapse: collapse;
  }

  .classic-table th {
    text-align: left;
    padding: 16px;
    font-size: 12px;
    font-weight: 600;
    color: ${P.textMuted};
    border-bottom: 1px solid ${P.border};
  }

  .parent-row {
    transition: background 0.2s;
    cursor: pointer;
  }

  .parent-row:hover {
    background: ${P.rowHover};
  }

  .parent-row td {
    padding: 24px 16px;
    border-bottom: 1px solid ${P.border};
  }

  /* Child Identification Strategy */
  .child-wrapper {
    position: relative;
    padding: 8px 0 32px 64px;
    animation: slideDown 0.3s ease-out;
  }

  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Visual Connector Line */
  .child-wrapper::before {
    content: "";
    position: absolute;
    left: 32px;
    top: -24px;
    bottom: 48px;
    width: 2px;
    background: ${P.border};
  }

  .child-item {
    display: grid;
    grid-template-columns: 2fr 1fr 1.5fr 1fr;
    align-items: center;
    padding: 16px 24px;
    background: ${P.childBg};
    border: 1px solid ${P.border};
    border-radius: 8px;
    margin-bottom: 8px;
    position: relative;
    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  }

  .child-item::before {
    content: "";
    position: absolute;
    left: -32px;
    top: 50%;
    width: 32px;
    height: 2px;
    background: ${P.border};
  }

  /* Badges & Tags */
  .pill {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    margin-right: 6px;
    margin-bottom: 4px;
  }

  .tag {
    display: inline-block;
    background: #f1f5f9;
    color: ${P.textMuted};
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 4px;
    margin-right: 4px;
    margin-bottom: 4px;
    border: 1px solid ${P.border};
  }

  /* Pagination */
  .classic-pagination {
    margin-top: 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: ${P.textMuted};
    font-size: 14px;
  }

  .page-controls {
    display: flex;
    gap: 8px;
  }

  .page-btn {
    padding: 8px 20px;
    border: 1px solid ${P.border};
    background: white;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: 0.2s;
  }

  .page-btn:hover:not(:disabled) {
    border-color: ${P.accent};
    color: ${P.accent};
  }

  .expand-arrow {
    display: inline-block;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    margin-right: 12px;
    font-size: 10px;
    color: ${P.accent};
  }

  .is-open {
    transform: rotate(90deg);
  }
`;

const getStatusStyles = (status) => {
  const s = status?.toLowerCase() || "";
  if (s.includes("closed") || s.includes("deal"))
    return { backgroundColor: "#ecfdf5", color: P.success };
  if (s.includes("pending"))
    return { backgroundColor: "#fffbeb", color: P.pending };
  if (s.includes("cancel"))
    return { backgroundColor: "#fef2f2", color: P.danger };
  return { backgroundColor: "#f8fafc", color: P.textMuted };
};

const DealAnalytics = ({
  deals = [],
  meta = { total: 0, page: 1, totalPages: 1 },
  filters = {},
  setFilters,
  onPageChange,
  loading,
  availableYears = [],
}) => {
  const [searchInput, setSearchInput] = useState(filters?.search || "");

  // Changed to a string to only allow one open row at a time (Accordion effect)
  const [activeRow, setActiveRow] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const toggleRow = (name) => {
    // If clicking the same row, close it. Otherwise, set the new row and close previous.
    setActiveRow(activeRow === name ? null : name);
  };

  return (
    <div className="classic-container">
      <style>{STYLES}</style>

      {/* Elegant Header */}
      <div className="classic-header">
        <div className="filter-group">
          <div className="classic-field">
            <label>Search</label>
            <input
              className="classic-input"
              placeholder="Filter anything..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="classic-field">
            <label>Month</label>
            <select
              className="classic-input"
              value={filters?.month || ""}
              onChange={(e) =>
                setFilters((p) => ({ ...p, month: e.target.value, page: 1 }))
              }
            >
              <option value="">All Months</option>
              {[
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ].map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="classic-field">
            <label>Year</label>
            <select
              className="classic-input"
              value={filters?.year || ""}
              onChange={(e) =>
                setFilters((p) => ({ ...p, year: e.target.value, page: 1 }))
              }
            >
              <option value="">Select Year</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          className="btn-clear"
          onClick={() => {
            setSearchInput("");
            setFilters({ page: 1, limit: 20, month: "", year: "", search: "" });
            setActiveRow(null); // Close any open row on reset
          }}
        >
          Reset Filters
        </button>
      </div>

      {/* Minimal Table */}
      <table className="classic-table">
        <thead>
          <tr>
            <th style={{ width: "40px" }}>ID</th>
            <th>EXHIBITION EVENT</th>
            <th>DEAL VOLUME</th>
            <th>STATUS SUMMARY</th>
            <th>PERIOD SUMMARY</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="5" style={{ textAlign: "center", padding: "100px" }}>
                Analyzing Data...
              </td>
            </tr>
          ) : deals.length > 0 ? (
            deals.map((group, index) => {
              const isOpen = activeRow === group.eventName;

              return (
                <React.Fragment key={group.eventName}>
                  <tr
                    className="parent-row"
                    onClick={() => toggleRow(group.eventName)}
                  >
                    <td style={{ color: P.textMuted, fontSize: "13px" }}>
                      {String((meta.page - 1) * 20 + index + 1).padStart(
                        2,
                        "0",
                      )}
                    </td>
                    <td>
                      <span
                        className={`expand-arrow ${isOpen ? "is-open" : ""}`}
                      >
                        ▶
                      </span>
                      <span style={{ fontWeight: 700, fontSize: "15px" }}>
                        {group.eventName}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500, color: P.accent }}>
                        {group.totalDeals} Units
                      </span>
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          maxWidth: "300px",
                        }}
                      >
                        {group.statuses?.map((s, i) => (
                          <span
                            key={i}
                            className="pill"
                            style={getStatusStyles(s)}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          maxWidth: "250px",
                        }}
                      >
                        {group.periods?.map((p, i) => (
                          <span key={i} className="tag">
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Child Rows */}
                  {isOpen && (
                    <tr>
                      <td colSpan="5" style={{ padding: 0, border: "none" }}>
                        <div className="child-wrapper">
                          {group.children?.map((child, cIdx) => (
                            <div key={cIdx} className="child-item">
                              <div>
                                <div
                                  style={{ fontWeight: 600, fontSize: "14px" }}
                                >
                                  {child.industry}
                                </div>
                                <div
                                  style={{
                                    fontSize: "11px",
                                    color: P.textMuted,
                                    marginTop: "2px",
                                  }}
                                >
                                  Agent: {child.agentName}
                                </div>
                              </div>
                              <div
                                style={{
                                  fontWeight: 600,
                                  fontSize: "13px",
                                  color: P.textMuted,
                                }}
                              >
                                1 Deal
                              </div>
                              <div>
                                <span
                                  className="pill"
                                  style={getStatusStyles(child.dealStatus)}
                                >
                                  {child.dealStatus}
                                </span>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <span className="tag" style={{ margin: 0 }}>
                                  {child.period}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
          ) : (
            <tr>
              <td
                colSpan="5"
                style={{
                  textAlign: "center",
                  padding: "60px",
                  color: P.textMuted,
                }}
              >
                No records found for the selected criteria.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="classic-pagination">
        <div>
          Showing <b>{deals.length}</b> records out of <b>{meta.total}</b>
        </div>
        <div className="page-controls">
          <button
            className="page-btn"
            disabled={meta.page <= 1}
            onClick={() => onPageChange(meta.page - 1)}
          >
            Previous
          </button>
          <button
            className="page-btn"
            disabled={meta.page >= meta.totalPages}
            onClick={() => onPageChange(meta.page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default DealAnalytics;
