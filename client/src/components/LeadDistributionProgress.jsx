import { useEffect, useState } from "react";
import axios from "axios";
import { toZonedTime, format } from "date-fns-tz";

/* ─── Donut Chart (arc-path, no gaps) ──────────────── */
const DonutChart = ({
  segments = [],
  size = 120,
  strokeWidth = 14,
  holeRatio = 0.55,
  centerLabel = null,
}) => {
  const total = segments.reduce((s, d) => s + d.v, 0);
  const cx = size / 2,
    cy = size / 2;
  const r = (size - strokeWidth) / 2;
  const holeR = r * holeRatio;

  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        <circle cx={cx} cy={cy} r={holeR} fill="white" />
      </svg>
    );
  }

  let startAngle = -Math.PI / 2;
  const paths = segments.map((seg, i) => {
    if (seg.v <= 0) return null;
    const fraction = seg.v / total;
    const sweepAngle = fraction * 2 * Math.PI;
    const endAngle = startAngle + sweepAngle;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = sweepAngle > Math.PI ? 1 : 0;
    const d = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
    startAngle = endAngle;
    return (
      <path
        key={i}
        d={d}
        fill="none"
        stroke={seg.color}
        strokeWidth={strokeWidth}
        strokeLinecap="butt"
      />
    );
  });

  return (
    <div
      style={{ position: "relative", width: size, height: size, flexShrink: 0 }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {paths}
        <circle cx={cx} cy={cy} r={holeR} fill="white" />
      </svg>
      {centerLabel && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          {centerLabel}
        </div>
      )}
    </div>
  );
};

/* ─── Stat Card ─────────────────────────────────────── */
const StatCard = ({ label, current, target, color }) => {
  const pct =
    target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const remaining = Math.max(0, target - current);

  const colorMap = {
    blue: {
      bg: "#EFF6FF",
      bar: "#3B82F6",
      text: "#1D4ED8",
      badge: "#DBEAFE",
      badgeText: "#1E40AF",
    },
    green: {
      bg: "#F0FDF4",
      bar: "#22C55E",
      text: "#15803D",
      badge: "#DCFCE7",
      badgeText: "#166634",
    },
    violet: {
      bg: "#F5F3FF",
      bar: "#7C3AED",
      text: "#6D28D9",
      badge: "#EDE9FE",
      badgeText: "#4C1D95",
    },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div
      style={{
        background: "#fff",
        border: "0.5px solid #E5E7EB",
        borderRadius: "12px",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            background: c.bg,
            borderRadius: "6px",
            padding: "3px 8px",
            fontSize: "10px",
            fontWeight: 700,
            color: c.text,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>
        <div
          style={{
            background: pct >= 100 ? "#DCFCE7" : c.badge,
            color: pct >= 100 ? "#15803D" : c.badgeText,
            borderRadius: "20px",
            padding: "2px 8px",
            fontSize: "10px",
            fontWeight: 700,
          }}
        >
          {pct}%
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
        <span
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "#111827",
            lineHeight: 1,
          }}
        >
          {current}
        </span>
        <span style={{ fontSize: "13px", color: "#9CA3AF", fontWeight: 500 }}>
          / {target}
        </span>
      </div>
      <div>
        <div
          style={{
            height: "4px",
            background: "#F3F4F6",
            borderRadius: "99px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: c.bar,
              borderRadius: "99px",
              transition: "width 0.6s ease",
            }}
          />
        </div>
        <div style={{ marginTop: "5px", fontSize: "11px", color: "#9CA3AF" }}>
          {pct >= 100 ? (
            <span style={{ color: "#16A34A", fontWeight: 600 }}>
              ✓ Target reached
            </span>
          ) : (
            <span>{remaining} remaining</span>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Main Component ─────────────────────────────────── */
const LeadDistributionProgress = ({ leads, employeeTarget, apiBase }) => {
  const [distribution, setDistribution] = useState(null);
  const employeeId = localStorage.getItem("employeeId");

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyLeads = leads.filter((l) => {
    if (!l.date) return false;

    const leadDate = toZonedTime(l.date, "America/Chicago");

    return (
      leadDate.getMonth() === currentMonth &&
      leadDate.getFullYear() === currentYear
    );
  });

  useEffect(() => {
    const fetchDistribution = async () => {
      try {
        const res = await axios.get(`${apiBase}/api/targets`);
        const emp = res.data.find(
          (e) => String(e.employeeId) === String(employeeId),
        );
        if (emp) setDistribution(emp);
      } catch (err) {
        console.error("Error fetching distribution", err);
      }
    };
    fetchDistribution();
  }, [apiBase, employeeId]);

  if (!distribution) return null;

  /* ── Count Leads ── */
  const associationLeads = monthlyLeads.filter((l) =>
    (l.leadType || "").toLowerCase().includes("association"),
  ).length;

  const attendeesLeads = monthlyLeads.filter((l) =>
    (l.leadType || "").toLowerCase().includes("attendee"),
  ).length;

  const industryLeads = monthlyLeads.filter((l) =>
    (l.leadType || "").toLowerCase().includes("industry"),
  ).length;

  /* ── Targets ── */
  const associationTarget = Math.round(
    (employeeTarget * distribution.associationPercent) / 100,
  );
  const attendeesTarget = Math.round(
    (employeeTarget * distribution.attendeesPercent) / 100,
  );
  const industryTarget = Math.round(
    (employeeTarget * distribution.industryPercent) / 100,
  );

  const totalLeads = associationLeads + attendeesLeads + industryLeads;
  const overallPct =
    employeeTarget > 0
      ? Math.min(100, Math.round((totalLeads / employeeTarget) * 100))
      : 0;

  /* Small donut segments (header pill) */
  const smallDonutSegments = [
    { v: associationLeads, color: "#3B82F6" },
    { v: attendeesLeads, color: "#22C55E" },
    { v: industryLeads, color: "#7C3AED" },
    { v: Math.max(0, employeeTarget - totalLeads), color: "#EEF2FF" },
  ];

  /* Big donut segments */
  const bigDonutSegments = [
    {
      v: associationLeads,
      color: "#3B82F6",
      label: "Association",
      target: associationTarget,
    },
    {
      v: attendeesLeads,
      color: "#22C55E",
      label: "Attendees",
      target: attendeesTarget,
    },
    {
      v: industryLeads,
      color: "#7C3AED",
      label: "Industry",
      target: industryTarget,
    },
    {
      v: Math.max(0, employeeTarget - totalLeads),
      color: "#F1F5F9",
      label: "Remaining",
      target: null,
    },
  ];

  const legendItems = [
    {
      color: "#3B82F6",
      label: "Association",
      value: associationLeads,
      target: associationTarget,
    },
    {
      color: "#22C55E",
      label: "Attendees",
      value: attendeesLeads,
      target: attendeesTarget,
    },
    {
      color: "#7C3AED",
      label: "Industry",
      value: industryLeads,
      target: industryTarget,
    },
    {
      color: "#E2E8F0",
      label: "Remaining",
      value: Math.max(0, employeeTarget - totalLeads),
      target: null,
    },
  ];

  return (
    <div
      style={{
        background: "#ffffff",
        border: "0.5px solid #E5E7EB",
        borderRadius: "16px",
        padding: "16px 20px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "14px",
        }}
      >
        <div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
            Lead Distribution
          </div>
          <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "1px" }}>
            Monthly target by type
          </div>
        </div>

        {/* Small donut pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background: "#F9FAFB",
            border: "0.5px solid #E5E7EB",
            borderRadius: "12px",
            padding: "8px 14px",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "48px",
              height: "48px",
              flexShrink: 0,
            }}
          >
            <DonutChart
              segments={smallDonutSegments}
              size={48}
              strokeWidth={8}
              holeRatio={0.42}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <span
                style={{ fontSize: "9px", fontWeight: 700, color: "#4338CA" }}
              >
                {overallPct}%
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <div>
              <div
                style={{
                  fontSize: "10px",
                  color: "#9CA3AF",
                  fontWeight: 500,
                  marginBottom: "1px",
                }}
              >
                Overall
              </div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#111827",
                  lineHeight: 1.1,
                }}
              >
                {totalLeads}
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 400,
                    color: "#9CA3AF",
                  }}
                >
                  {" "}
                  / {employeeTarget}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {[
                { color: "#3B82F6", v: associationLeads, t: associationTarget },
                { color: "#22C55E", v: attendeesLeads, t: attendeesTarget },
                { color: "#7C3AED", v: industryLeads, t: industryTarget },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{ display: "flex", alignItems: "center", gap: "3px" }}
                >
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: item.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#6B7280",
                      fontWeight: 500,
                    }}
                  >
                    {item.v}
                    <span style={{ color: "#D1D5DB" }}>/{item.t}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "0.5px solid #F3F4F6", marginBottom: "14px" }} />

      {/* ── Bottom row: 3 stat cards + big donut ── */}
      <div style={{ display: "flex", gap: "10px", alignItems: "stretch" }}>
        {/* Three stat cards stacked side by side */}
        <div style={{ display: "flex", gap: "10px", flex: 1, minWidth: 0 }}>
          <StatCard
            label="Association"
            current={associationLeads}
            target={associationTarget}
            color="blue"
          />
          <StatCard
            label="Attendees"
            current={attendeesLeads}
            target={attendeesTarget}
            color="green"
          />
          <StatCard
            label="Industry"
            current={industryLeads}
            target={industryTarget}
            color="violet"
          />
        </div>

        {/* Big donut card */}
        <div
          style={{
            background: "#F9FAFB",
            border: "0.5px solid #E5E7EB",
            borderRadius: "12px",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexShrink: 0,
          }}
        >
          <DonutChart
            segments={bigDonutSegments}
            size={110}
            strokeWidth={16}
            holeRatio={0.52}
            centerLabel={
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#111827",
                    lineHeight: 1,
                  }}
                >
                  {totalLeads}
                </div>
                <div
                  style={{
                    fontSize: "9px",
                    color: "#9CA3AF",
                    marginTop: "2px",
                  }}
                >
                  of {employeeTarget}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#4338CA",
                    marginTop: "1px",
                  }}
                >
                  {overallPct}%
                </div>
              </div>
            }
          />

          {/* Legend */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {legendItems.map((item) => {
              const pct = item.target
                ? Math.min(100, Math.round((item.value / item.target) * 100))
                : null;
              return (
                <div
                  key={item.label}
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: item.color,
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#374151",
                        lineHeight: 1,
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#9CA3AF",
                        marginTop: "1px",
                      }}
                    >
                      {item.value}
                      {item.target !== null && (
                        <span style={{ color: "#D1D5DB" }}>/{item.target}</span>
                      )}
                      {pct !== null && (
                        <span
                          style={{
                            marginLeft: "4px",
                            color: pct >= 100 ? "#16A34A" : "#6B7280",
                            fontWeight: 600,
                          }}
                        >
                          {pct}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDistributionProgress;
