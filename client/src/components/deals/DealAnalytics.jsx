import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";

const P = {
  ink: "#1a1a1a",
  charcoal: "#2e2e2e",
  graphite: "#4a4a4a",
  ash: "#7a7a7a",
  silver: "#b0b0b0",
  fog: "#d6d6d6",
  mist: "#efefef",
  paper: "#f7f6f4",
  white: "#ffffff",
  accent: "#b8860b",
  positive: "#2d5a27",
  positiveLight: "#e8f0e7",
  danger: "#6b2020",
  dangerLight: "#f0e8e8",
  pending: "#1a3a5c",
  pendingLight: "#e8eef5",
};
const STATUS_MAP = {
  Deal: { fg: P.positive, bg: P.positiveLight },
  "Deal Closed": { fg: P.positive, bg: P.positiveLight },
  "Invoice Pending": { fg: P.pending, bg: P.pendingLight },
  "Invoice Cancelled": { fg: P.danger, bg: P.dangerLight },
  Negotiation: { fg: P.graphite, bg: P.mist },
  Prospecting: { fg: P.ash, bg: P.mist },
  Active: { fg: P.charcoal, bg: P.fog },
};
const LEAD_COLORS = [P.ink, P.accent, P.graphite, P.ash, "#3a5c3a", "#5c3a3a"];
const sFg = (s) => STATUS_MAP[s]?.fg ?? P.graphite;
const sBg = (s) => STATUS_MAP[s]?.bg ?? P.mist;

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Source+Sans+3:wght@400;600;700&display=swap');
  .da-wrap { font-family:'Source Sans 3',sans-serif; background:${P.paper}; color:${P.ink}; }
  .da-wrap * { box-sizing:border-box; }
  .da-inner { max-width:1200px; margin:0 auto; padding:32px 16px 48px; }
  .da-header { display:flex; align-items:flex-end; justify-content:space-between; flex-wrap:wrap; gap:16px; padding-bottom:24px; border-bottom:2px solid ${P.ink}; margin-bottom:28px; }
  .da-h1 { font-family:'Playfair Display',Georgia,serif; font-size:clamp(22px,4vw,32px); font-weight:700; color:${P.ink}; letter-spacing:-0.02em; line-height:1.1; }
  .da-eyebrow { font-size:9px; font-weight:700; letter-spacing:.18em; text-transform:uppercase; color:${P.accent}; margin-bottom:5px; }
  .da-tagline { font-size:12px; color:${P.ash}; margin-top:4px; }
  .da-total-label { font-size:9px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:${P.ash}; text-align:right; }
  .da-total-val { font-family:'Playfair Display',Georgia,serif; font-size:30px; font-weight:700; color:${P.ink}; line-height:1; text-align:right; }
  .da-kpi { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:20px; }
  .da-two { display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-bottom:18px; }
  @media(max-width:900px){ .da-kpi{grid-template-columns:repeat(2,1fr)} .da-two{grid-template-columns:1fr} }
  @media(max-width:480px){ .da-kpi{grid-template-columns:1fr 1fr} }
  .da-card { background:${P.white}; border:1px solid ${P.fog}; border-radius:6px; padding:24px 20px; margin-bottom:18px; }
  .da-card-nm { background:${P.white}; border:1px solid ${P.fog}; border-radius:6px; padding:24px 20px; }
  .da-kpi-card { background:${P.white}; border:1px solid ${P.fog}; border-radius:5px; padding:18px 16px 14px; }
  .da-kpi-label { display:block; font-size:9px; font-weight:700; letter-spacing:.18em; text-transform:uppercase; color:${P.silver}; }
  .da-kpi-val { display:block; font-family:'Playfair Display',Georgia,serif; font-size:32px; font-weight:700; line-height:1; margin-top:4px; }
  .da-kpi-sub { display:block; font-size:11px; color:${P.ash}; margin-top:2px; }
  .da-scope-badge { display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:4px; font-size:11px; font-weight:600; margin-bottom:20px; }
  .da-sec-title { font-family:'Playfair Display',Georgia,serif; font-size:16px; font-weight:700; color:${P.ink}; }
  .da-sec-desc { font-size:12px; color:${P.ash}; margin-top:3px; margin-left:14px; }
  .da-sec-wrap { margin-bottom:18px; }
  .da-legend { display:flex; flex-wrap:wrap; gap:7px; margin-bottom:16px; }
  .da-legend-chip { display:inline-flex; align-items:center; gap:5px; padding:3px 9px; border-radius:3px; font-size:11px; font-weight:600; }
  .da-legend-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
  .da-heat-hdr { display:flex; align-items:center; gap:10px; padding:0 6px; margin-bottom:6px; }
  .da-heat-hdr span { font-size:9px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:${P.silver}; }
  .da-heat-row { display:flex; align-items:center; gap:12px; padding:10px 6px; border-bottom:1px solid ${P.mist}; transition:background .1s; }
  .da-heat-row:last-child { border-bottom:none; }
  .da-heat-row:hover { background:${P.paper}; }
  .da-heat-name { width:130px; flex-shrink:0; font-size:12px; font-weight:600; color:${P.charcoal}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .da-heat-track { flex:1; background:${P.mist}; border-radius:3px; height:24px; overflow:hidden; position:relative; }
  .da-heat-fill { height:100%; border-radius:3px; display:flex; align-items:center; padding-left:8px; transition:width .5s ease; min-width:2px; }
  .da-heat-fill span { color:white; font-size:10px; font-weight:700; pointer-events:none; user-select:none; white-space:nowrap; }
  .da-heat-count { width:40px; flex-shrink:0; text-align:right; font-size:12px; font-weight:700; color:${P.ash}; }
  .da-heat-pct { width:36px; flex-shrink:0; text-align:right; font-size:10px; color:${P.silver}; }
  .da-chart-lbl { font-size:9px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:${P.silver}; margin:24px 0 12px; display:flex; align-items:center; gap:10px; }
  .da-chart-lbl::after { content:''; flex:1; height:1px; background:${P.mist}; }
  .da-prog-row { display:flex; align-items:center; gap:10px; margin-bottom:9px; }
  .da-prog-chip { width:115px; flex-shrink:0; font-size:10px; font-weight:700; padding:4px 8px; border-radius:3px; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; letter-spacing:.02em; }
  .da-prog-track { flex:1; border-radius:2px; overflow:hidden; }
  .da-prog-fill { height:100%; border-radius:2px; transition:width .6s; }
  .da-prog-meta { width:50px; flex-shrink:0; text-align:right; }
  .da-prog-count { font-size:13px; font-weight:700; color:${P.ink}; }
  .da-prog-pct { font-size:10px; color:${P.silver}; margin-left:2px; }
  .da-divider { border:none; border-top:1px solid ${P.mist}; margin:18px 0 14px; }
  .da-sub-lbl { font-size:9px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:${P.silver}; margin-bottom:12px; display:block; }
  .da-lead-row { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
  .da-lead-name { width:95px; font-size:12px; font-weight:600; color:${P.graphite}; flex-shrink:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .da-lead-count { font-size:12px; font-weight:700; color:${P.graphite}; width:26px; text-align:right; flex-shrink:0; }
  .da-table-wrap { overflow-x:auto; -webkit-overflow-scrolling:touch; }
  .da-tbl { width:100%; border-collapse:collapse; font-size:12px; }
  .da-tbl th { padding:9px 10px; font-size:9px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:${P.silver}; border-bottom:2px solid ${P.fog}; text-align:center; white-space:nowrap; }
  .da-tbl th:first-child { text-align:left; position:sticky; left:0; background:${P.white}; z-index:1; }
  .da-tbl td { padding:10px 10px; border-bottom:1px solid ${P.mist}; text-align:center; vertical-align:middle; }
  .da-tbl td:first-child { text-align:left; position:sticky; left:0; background:${P.white}; z-index:1; }
  .da-tbl tr:hover td { background:${P.paper}; }
  .da-tbl tr:hover td:first-child { background:${P.paper}; }
  .da-tbl tr:last-child td { border-bottom:none; }
  .da-tbl-badge { display:inline-block; padding:3px 8px; border-radius:3px; font-size:11px; font-weight:700; }
  .da-filter-bar { background:${P.white}; border:1px solid ${P.fog}; border-radius:6px; padding:12px 16px; display:flex; flex-wrap:wrap; gap:7px; align-items:center; margin-bottom:24px; }
  .da-filter-lbl { font-size:9px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:${P.silver}; margin-right:3px; white-space:nowrap; }
  .da-filter-sep { width:1px; height:16px; background:${P.fog}; margin:0 3px; flex-shrink:0; }
  .da-pill { font-size:11px; font-weight:600; padding:4px 12px; border-radius:3px; border:1px solid transparent; cursor:pointer; transition:all .15s; background:none; font-family:inherit; }
  .da-pill:hover { transform:translateY(-1px); }
  .da-clear { margin-left:auto; font-size:11px; font-weight:600; color:${P.ash}; background:none; border:none; cursor:pointer; text-decoration:underline; text-underline-offset:3px; transition:color .15s; font-family:inherit; }
  .da-clear:hover { color:${P.danger}; }
  .da-error { background:${P.dangerLight}; border-left:3px solid ${P.danger}; padding:12px 16px; border-radius:4px; margin-bottom:20px; font-size:13px; color:${P.danger}; font-weight:500; }
  .da-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:44px 20px; gap:10px; }
  .da-empty p { font-size:13px; color:${P.silver}; font-weight:500; }
  .da-skel { padding:8px 0; }
  .da-skel-row { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
  .da-skel-item { background:${P.mist}; border-radius:3px; animation:da-shimmer 1.4s infinite; }
  @keyframes da-shimmer{0%,100%{opacity:1}50%{opacity:.4}}
  .da-footer { text-align:center; font-size:10px; color:${P.silver}; letter-spacing:.08em; margin-top:8px; padding-top:18px; border-top:1px solid ${P.fog}; }
  .da-tooltip { background:${P.white}; border:1px solid ${P.fog}; box-shadow:0 8px 24px rgba(0,0,0,.10); border-radius:5px; padding:10px 12px; font-family:'Source Sans 3',sans-serif; min-width:140px; }
  .da-tooltip-lbl { font-size:12px; font-weight:700; color:${P.charcoal}; padding-bottom:7px; border-bottom:1px solid ${P.mist}; margin-bottom:5px; }
  .da-tooltip-row { display:flex; align-items:center; gap:7px; padding:2px 0; }
  .da-tooltip-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
  .da-tooltip-name { font-size:11px; color:${P.ash}; flex:1; }
  .da-tooltip-val { font-size:12px; font-weight:700; color:${P.ink}; }
`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const groupBy = (arr, key) => {
  const map = {};
  arr.forEach((item) => {
    const k = item[key] || "Unknown";
    map[k] = (map[k] || 0) + 1;
  });
  return Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
};
const crossTab = (arr, rowKey, colKey) => {
  const rows = {},
    cols = new Set();
  arr.forEach((item) => {
    const r = item[rowKey] || "Unknown",
      c = item[colKey] || "Unknown";
    cols.add(c);
    if (!rows[r]) rows[r] = {};
    rows[r][c] = (rows[r][c] || 0) + 1;
  });
  const colList = Array.from(cols).sort();
  return {
    data: Object.entries(rows)
      .map(([name, vals]) => ({ name, ...vals }))
      .sort(
        (a, b) =>
          Object.values(b).reduce(
            (s, v) => (typeof v === "number" ? s + v : s),
            0,
          ) -
          Object.values(a).reduce(
            (s, v) => (typeof v === "number" ? s + v : s),
            0,
          ),
      ),
    cols: colList,
  };
};

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────
const Tooltip_ = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="da-tooltip">
      <p className="da-tooltip-lbl">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="da-tooltip-row">
          <span className="da-tooltip-dot" style={{ background: p.color }} />
          <span className="da-tooltip-name">{p.name}</span>
          <span className="da-tooltip-val">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const SectionTitle = ({ title, desc }) => (
  <div className="da-sec-wrap">
    <div style={{ display: "flex", alignItems: "baseline", gap: 11 }}>
      <span
        style={{
          display: "inline-block",
          width: 3,
          height: 16,
          background: P.accent,
          borderRadius: 2,
          flexShrink: 0,
        }}
      />
      <h2 className="da-sec-title">{title}</h2>
    </div>
    {desc && <p className="da-sec-desc">{desc}</p>}
  </div>
);

const KpiCard = ({ label, value, sub, accent, borderColor }) => (
  <div
    className="da-kpi-card"
    style={{ borderTop: `3px solid ${borderColor || P.fog}` }}
  >
    <span className="da-kpi-label">{label}</span>
    <span className="da-kpi-val" style={{ color: accent || P.ink }}>
      {value}
    </span>
    {sub && <span className="da-kpi-sub">{sub}</span>}
  </div>
);

// NEW: Proportional bar — bar width scales to data, not % of container
const HeatRow = ({ name, data, cols, maxTotal }) => {
  const rowTotal = cols.reduce((s, c) => s + (data[c] || 0), 0);
  // bar fills proportionally relative to the max total in the dataset
  const barPct = maxTotal > 0 ? (rowTotal / maxTotal) * 100 : 0;

  return (
    <div className="da-heat-row">
      <div className="da-heat-name" title={name}>
        {name}
      </div>
      <div className="da-heat-track">
        <div
          className="da-heat-fill"
          style={{
            width: `${barPct}%`,
            background: sFg(cols[0] || ""),
            flexDirection: "row",
            gap: 1,
            padding: 0,
            display: "flex",
          }}
        >
          {cols.map((col) => {
            const val = data[col] || 0;
            if (!val) return null;
            const segPct = rowTotal > 0 ? (val / rowTotal) * 100 : 0;
            return (
              <div
                key={col}
                title={`${col}: ${val}`}
                style={{
                  width: `${segPct}%`,
                  background: sFg(col),
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: val > 0 ? 4 : 0,
                  transition: "width .4s",
                }}
              >
                {segPct > 12 && (
                  <span
                    style={{
                      color: "white",
                      fontSize: 10,
                      fontWeight: 700,
                      userSelect: "none",
                      pointerEvents: "none",
                    }}
                  >
                    {val}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="da-heat-count">{rowTotal}</div>
      <div className="da-heat-pct">{barPct.toFixed(0)}%</div>
    </div>
  );
};

const EmptyState = ({ message = "No data" }) => (
  <div className="da-empty">
    <svg width="30" height="30" fill="none" viewBox="0 0 24 24">
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
        stroke={P.fog}
        strokeWidth="1.5"
      />
      <path
        d="M8 12h8M8 8h5M8 16h3"
        stroke={P.fog}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
    <p>{message}</p>
  </div>
);

const Skel = () => (
  <div className="da-skel">
    {[75, 55, 85, 45, 65].map((w, i) => (
      <div key={i} className="da-skel-row">
        <div className="da-skel-item" style={{ width: 95, height: 11 }} />
        <div
          className="da-skel-item"
          style={{ flex: 1, maxWidth: `${w}%`, height: 14 }}
        />
        <div className="da-skel-item" style={{ width: 28, height: 11 }} />
      </div>
    ))}
  </div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
/**
 * Props:
 *   deals      {Array}   — Employee's own deals (used for KPI cards when role=employee)
 *   allDeals   {Array}   — All deals across all employees (used for analytics charts always)
 *   role       {string}  — "admin" | "employee"  (default: "admin")
 *   loading    {boolean}
 *   error      {string}
 */
const DealAnalytics = ({
  deals = [],
  allDeals = null,
  role = "admin",
  loading = false,
  error = null,
}) => {
  const [activeStatus, setActiveStatus] = useState(null);
  const [activeLead, setActiveLead] = useState(null);

  // Analytics always use allDeals if provided (so employees see full picture),
  // otherwise fall back to deals (admin case where allDeals isn't passed separately)
  const analyticsSource = allDeals ?? deals;

  const statuses = useMemo(
    () =>
      [
        ...new Set(analyticsSource.map((d) => d.dealStatus).filter(Boolean)),
      ].sort(),
    [analyticsSource],
  );
  const leadTypes = useMemo(
    () =>
      [
        ...new Set(analyticsSource.map((d) => d.leadType).filter(Boolean)),
      ].sort(),
    [analyticsSource],
  );

  // Filters apply to the analytics source
  const filtered = useMemo(
    () =>
      analyticsSource.filter((d) => {
        if (activeStatus && d.dealStatus !== activeStatus) return false;
        if (activeLead && d.leadType !== activeLead) return false;
        return true;
      }),
    [analyticsSource, activeStatus, activeLead],
  );

  // KPI cards: employees see their own numbers, admins see filtered analytics
  const kpiSource = role === "employee" ? deals : filtered;
  const kpiTotal = kpiSource.length;
  const kpiClosed = kpiSource.filter(
    (d) => d.dealStatus === "Deal Closed" || d.dealStatus === "Deal",
  ).length;
  const kpiPending = kpiSource.filter(
    (d) => d.dealStatus === "Invoice Pending",
  ).length;
  const kpiCancel = kpiSource.filter(
    (d) => d.dealStatus === "Invoice Cancelled",
  ).length;
  const kpiConv =
    kpiTotal > 0 ? ((kpiClosed / kpiTotal) * 100).toFixed(1) : "0.0";

  const statusData = useMemo(() => groupBy(filtered, "dealStatus"), [filtered]);
  const industryData = useMemo(() => groupBy(filtered, "industry"), [filtered]);
  const leadTypeData = useMemo(() => groupBy(filtered, "leadType"), [filtered]);
  const indStatus = useMemo(
    () => crossTab(filtered, "industry", "dealStatus"),
    [filtered],
  );
  const indLead = useMemo(
    () => crossTab(filtered, "industry", "leadType"),
    [filtered],
  );

  // For proportional bars: find max total across all industries
  const indStatusRows = useMemo(() => {
    const rows = indStatus.data.map((row) => ({
      ...row,
      _total: indStatus.cols.reduce((s, c) => s + (row[c] || 0), 0),
    }));
    const maxT = Math.max(...rows.map((r) => r._total), 1);
    return { rows, maxTotal: maxT };
  }, [indStatus]);

  const isEmployee = role === "employee";

  return (
    <div className="da-wrap">
      <style>{STYLES}</style>
      <div className="da-inner">
        {/* HEADER */}
        <div className="da-header">
          <div>
            <p className="da-eyebrow">Deal Intelligence</p>
            <h1 className="da-h1">Analytics Dashboard</h1>
            <p className="da-tagline">
              Industries · Lead types · Pipeline stages at a glance
            </p>
          </div>
          <div>
            <p className="da-total-label">
              {isEmployee ? "Your Deals" : "Total Records"}
            </p>
            <p className="da-total-val">{loading ? "—" : kpiTotal}</p>
            {(activeStatus || activeLead) && (
              <p
                style={{
                  fontSize: 11,
                  color: P.accent,
                  fontWeight: 600,
                  textAlign: "right",
                  marginTop: 2,
                }}
              >
                Showing {filtered.length} of {analyticsSource.length}
              </p>
            )}
          </div>
        </div>

        {/* SCOPE BADGE — tells employee they're seeing full analytics */}
        {isEmployee && (
          <div
            className="da-scope-badge"
            style={{
              background: P.pendingLight,
              color: P.pending,
              border: `1px solid ${P.pending}22`,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke={P.pending}
                strokeWidth="2"
              />
              <path
                d="M12 8v4l3 3"
                stroke={P.pending}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Your KPI cards show your own deals. Charts below show overall team
            analytics.
          </div>
        )}

        {error && <div className="da-error">⚠ {error}</div>}

        {/* FILTER BAR */}
        {!loading && analyticsSource.length > 0 && (
          <div className="da-filter-bar">
            <span className="da-filter-lbl">Filter by</span>
            {statuses.map((s) => (
              <button
                key={s}
                className="da-pill"
                onClick={() => setActiveStatus((v) => (v === s ? null : s))}
                style={{
                  background: activeStatus === s ? sFg(s) : sBg(s),
                  color: activeStatus === s ? P.white : sFg(s),
                  borderColor: activeStatus === s ? sFg(s) : P.fog,
                  opacity: activeStatus && activeStatus !== s ? 0.5 : 1,
                }}
              >
                {s}
              </button>
            ))}
            {statuses.length > 0 && leadTypes.length > 0 && (
              <div className="da-filter-sep" />
            )}
            {leadTypes.map((lt, i) => (
              <button
                key={lt}
                className="da-pill"
                onClick={() => setActiveLead((v) => (v === lt ? null : lt))}
                style={{
                  background:
                    activeLead === lt
                      ? LEAD_COLORS[i % LEAD_COLORS.length]
                      : P.mist,
                  color:
                    activeLead === lt
                      ? P.white
                      : LEAD_COLORS[i % LEAD_COLORS.length],
                  borderColor:
                    activeLead === lt
                      ? LEAD_COLORS[i % LEAD_COLORS.length]
                      : P.fog,
                  opacity: activeLead && activeLead !== lt ? 0.5 : 1,
                }}
              >
                {lt}
              </button>
            ))}
            {(activeStatus || activeLead) && (
              <button
                className="da-clear"
                onClick={() => {
                  setActiveStatus(null);
                  setActiveLead(null);
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* KPI — always shows personal deals for employee, overall for admin */}
        <div className="da-kpi">
          <KpiCard
            label={isEmployee ? "My Deals" : "Total Deals"}
            value={loading ? "—" : kpiTotal}
            accent={P.ink}
            borderColor={P.ink}
          />
          <KpiCard
            label={isEmployee ? "My Closed" : "Deals Closed"}
            value={loading ? "—" : kpiClosed}
            accent={P.positive}
            borderColor={P.positive}
            sub={`${kpiConv}% conversion`}
          />
          <KpiCard
            label="Invoice Pending"
            value={loading ? "—" : kpiPending}
            accent={P.pending}
            borderColor={P.pending}
          />
          <KpiCard
            label="Invoice Cancelled"
            value={loading ? "—" : kpiCancel}
            accent={P.danger}
            borderColor={P.danger}
          />
        </div>

        {/* INDUSTRY × STATUS — proportional bars */}
        <div className="da-card">
          <SectionTitle
            title="Industry × Deal Status"
            desc="Bar width reflects actual volume — longer bar means more deals"
          />
          {loading ? (
            <Skel />
          ) : indStatusRows.rows.length === 0 ? (
            <EmptyState message="No industry/status data" />
          ) : (
            <>
              <div className="da-legend">
                {indStatus.cols.map((col) => (
                  <span
                    key={col}
                    className="da-legend-chip"
                    style={{ background: sBg(col), color: sFg(col) }}
                  >
                    <span
                      className="da-legend-dot"
                      style={{ background: sFg(col) }}
                    />
                    {col}
                  </span>
                ))}
              </div>

              {/* Header */}
              <div className="da-heat-hdr">
                <span style={{ width: 130 }}>Industry</span>
                <span style={{ flex: 1 }}>Volume (proportional)</span>
                <span style={{ width: 40, textAlign: "right" }}>Count</span>
                <span style={{ width: 36, textAlign: "right" }}>Share</span>
              </div>

              {indStatusRows.rows.map((row) => (
                <HeatRow
                  key={row.name}
                  name={row.name}
                  data={row}
                  cols={indStatus.cols}
                  maxTotal={indStatusRows.maxTotal}
                />
              ))}

              {/* Stacked bar chart breakdown */}
              <p className="da-chart-lbl">Detailed Comparison</p>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={indStatus.data.slice(0, 10)}
                    margin={{ top: 0, right: 0, bottom: 0, left: -10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={P.mist}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: P.ash, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: P.ash }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<Tooltip_ />} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    {indStatus.cols.map((col, i) => (
                      <Bar
                        key={col}
                        dataKey={col}
                        stackId="a"
                        fill={sFg(col)}
                        radius={
                          i === indStatus.cols.length - 1
                            ? [3, 3, 0, 0]
                            : [0, 0, 0, 0]
                        }
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>

        {/* TWO-COL */}
        <div className="da-two">
          <div className="da-card-nm">
            <SectionTitle
              title="Industry × Lead Type"
              desc="How each industry acquires its deals"
            />
            {loading ? (
              <Skel />
            ) : indLead.data.length === 0 ? (
              <EmptyState />
            ) : (
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={indLead.data.slice(0, 8)}
                    layout="vertical"
                    margin={{ top: 0, right: 14, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={P.mist}
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10, fill: P.ash }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={88}
                      tick={{ fontSize: 10, fill: P.graphite, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<Tooltip_ />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {indLead.cols.map((col, i) => (
                      <Bar
                        key={col}
                        dataKey={col}
                        stackId="b"
                        fill={LEAD_COLORS[i % LEAD_COLORS.length]}
                        radius={
                          i === indLead.cols.length - 1
                            ? [0, 3, 3, 0]
                            : [0, 0, 0, 0]
                        }
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="da-card-nm">
            <SectionTitle
              title="Deal Status Overview"
              desc="Volume and share of each pipeline stage"
            />
            {loading ? (
              <Skel />
            ) : statusData.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                {statusData.map((item) => {
                  const pct =
                    filtered.length > 0
                      ? (item.count / filtered.length) * 100
                      : 0;
                  return (
                    <div key={item.name} className="da-prog-row">
                      <div
                        className="da-prog-chip"
                        style={{
                          background: sBg(item.name),
                          color: sFg(item.name),
                        }}
                      >
                        {item.name}
                      </div>
                      <div
                        className="da-prog-track"
                        style={{ background: P.mist, height: 10 }}
                      >
                        <div
                          className="da-prog-fill"
                          style={{
                            width: `${pct}%`,
                            background: sFg(item.name),
                          }}
                        />
                      </div>
                      <div className="da-prog-meta">
                        <span className="da-prog-count">{item.count}</span>
                        <span className="da-prog-pct">{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                  );
                })}
                <hr className="da-divider" />
                <span className="da-sub-lbl">Lead Type Split</span>
                {leadTypeData.map((item, i) => {
                  const pct =
                    filtered.length > 0
                      ? (item.count / filtered.length) * 100
                      : 0;
                  return (
                    <div key={item.name} className="da-lead-row">
                      <div className="da-lead-name">{item.name}</div>
                      <div
                        className="da-prog-track"
                        style={{ background: P.mist, height: 7, flex: 1 }}
                      >
                        <div
                          className="da-prog-fill"
                          style={{
                            width: `${pct}%`,
                            background: LEAD_COLORS[i % LEAD_COLORS.length],
                          }}
                        />
                      </div>
                      <span className="da-lead-count">{item.count}</span>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* TABLE */}
        <div className="da-card">
          <SectionTitle
            title="Industry Performance Table"
            desc="Full breakdown of every industry across all statuses and lead types"
          />
          {loading ? (
            <Skel />
          ) : industryData.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="da-table-wrap">
              <table className="da-tbl">
                <thead>
                  <tr>
                    <th>Industry</th>
                    <th>Total</th>
                    {statuses.map((s) => (
                      <th key={s} style={{ color: sFg(s) }}>
                        {s.replace("Invoice ", "Inv. ")}
                      </th>
                    ))}
                    {leadTypes.map((lt) => (
                      <th key={lt}>{lt}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {industryData.map((ind, ri) => {
                    const rows = filtered.filter(
                      (d) => d.industry === ind.name,
                    );
                    const sc = Object.fromEntries(
                      statuses.map((s) => [
                        s,
                        rows.filter((d) => d.dealStatus === s).length,
                      ]),
                    );
                    const lc = Object.fromEntries(
                      leadTypes.map((lt) => [
                        lt,
                        rows.filter((d) => d.leadType === lt).length,
                      ]),
                    );
                    return (
                      <tr key={ind.name}>
                        <td>
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                              fontWeight: 600,
                              color: P.charcoal,
                            }}
                          >
                            {ri === 0 && (
                              <span style={{ color: P.accent, fontSize: 10 }}>
                                ★
                              </span>
                            )}
                            {ind.name}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: P.ink,
                            }}
                          >
                            {ind.count}
                          </span>
                        </td>
                        {statuses.map((s) => (
                          <td key={s}>
                            {sc[s] > 0 ? (
                              <span
                                className="da-tbl-badge"
                                style={{ background: sBg(s), color: sFg(s) }}
                              >
                                {sc[s]}
                              </span>
                            ) : (
                              <span style={{ color: P.fog }}>—</span>
                            )}
                          </td>
                        ))}
                        {leadTypes.map((lt, li) => (
                          <td key={lt}>
                            {lc[lt] > 0 ? (
                              <span
                                style={{
                                  color: LEAD_COLORS[li % LEAD_COLORS.length],
                                  fontWeight: 700,
                                }}
                              >
                                {lc[lt]}
                              </span>
                            ) : (
                              <span style={{ color: P.fog }}>—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="da-footer">
          Deal Intelligence Dashboard · {filtered.length} records displayed
          {(activeStatus || activeLead) && (
            <span style={{ color: P.accent, fontWeight: 600 }}>
              {" "}
              · Filtered view active
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default DealAnalytics;
