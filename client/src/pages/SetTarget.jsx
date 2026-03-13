import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Target,
  Save,
  X,
  Pencil,
  Users,
  TrendingUp,
  BarChart3,
  Award,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/* ─── Mini Donut — uses SVG arc paths (correct geometry) ── */
const MiniDonut = ({ assoc = 0, attend = 0, industry = 0 }) => {
  const svgRef = useRef(null);
  const segments = [
    { v: assoc, color: "#3B82F6" },
    { v: attend, color: "#22C55E" },
    { v: industry, color: "#7C3AED" },
  ];
  const total = segments.reduce((s, d) => s + d.v, 0);
  const cx = 21,
    cy = 21,
    r = 14;

  const buildArcs = () => {
    if (total === 0) return null;
    let startAngle = -Math.PI / 2;
    return segments.map((seg, i) => {
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
          strokeWidth="7"
          strokeLinecap="butt"
        />
      );
    });
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
      }}
    >
      <svg ref={svgRef} width="42" height="42" viewBox="0 0 42 42">
        {total === 0 ? (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="7"
          />
        ) : (
          buildArcs()
        )}
        <circle cx={cx} cy={cy} r="8" fill="white" />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {[
          { color: "#3B82F6", val: assoc },
          { color: "#22C55E", val: attend },
          { color: "#7C3AED", val: industry },
        ].map((d, i) => (
          <div
            key={i}
            style={{ display: "flex", alignItems: "center", gap: "3px" }}
          >
            <div
              style={{
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: d.color,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: "9px",
                color: "#6B7280",
                fontWeight: 600,
                lineHeight: 1,
              }}
            >
              {d.val}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Stat Card ─────────────────────────────────── */
const StatCard = ({ label, value, color, icon: Icon, sub }) => {
  const colors = {
    slate: {
      bg: "#F8FAFC",
      accent: "#64748B",
      text: "#0F172A",
      border: "#E2E8F0",
    },
    blue: {
      bg: "#EFF6FF",
      accent: "#2563EB",
      text: "#1E3A8A",
      border: "#BFDBFE",
    },
    green: {
      bg: "#F0FDF4",
      accent: "#16A34A",
      text: "#14532D",
      border: "#BBF7D0",
    },
    violet: {
      bg: "#F5F3FF",
      accent: "#7C3AED",
      text: "#3B0764",
      border: "#DDD6FE",
    },
    amber: {
      bg: "#FFFBEB",
      accent: "#D97706",
      text: "#78350F",
      border: "#FDE68A",
    },
  };
  const c = colors[color] || colors.slate;
  return (
    <div
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: "14px",
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
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
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: c.accent,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {label}
        </span>
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "8px",
            background: `${c.accent}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={14} color={c.accent} />
        </div>
      </div>
      <div
        style={{
          fontSize: "26px",
          fontWeight: 700,
          color: c.text,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: "11px", color: c.accent, opacity: 0.8 }}>
          {sub}
        </div>
      )}
    </div>
  );
};

/* ─── Editable Cell ──────────────────────────────── */
const EditCell = ({ value, onChange, width = "60px" }) => (
  <input
    type="number"
    value={value === 0 ? "" : value}
    placeholder="0"
    onChange={(e) => {
      const raw = e.target.value;
      onChange(raw === "" ? "" : Number(raw));
    }}
    onBlur={(e) => {
      if (e.target.value === "") onChange(0);
    }}
    style={{
      width,
      padding: "6px 8px",
      fontSize: "13px",
      fontWeight: 500,
      color: "#111827",
      background: "#F9FAFB",
      border: "1px solid #D1D5DB",
      borderRadius: "8px",
      textAlign: "center",
      outline: "none",
    }}
    onFocus={(e) => {
      e.target.style.borderColor = "#6366F1";
      e.target.style.background = "#fff";
    }}
    onBlurCapture={(e) => {
      e.target.style.borderColor = "#D1D5DB";
      e.target.style.background = "#F9FAFB";
    }}
  />
);

/* ─── Main Component ─────────────────────────────── */
const SetTarget = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [editedData, setEditedData] = useState({});

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/targets`);
      const data = Array.isArray(res.data) ? res.data : [];
      setEmployees(data.sort((a, b) => b.expInMonths - a.expInMonths));
    } catch (err) {
      console.error(err);
    }
  };

  const startEditing = (emp) => {
    setEditingRow(emp.id);
    setEditedData({
      target: emp.target,
      associationPercent: emp.associationPercent || 0,
      attendeesPercent: emp.attendeesPercent || 0,
      industryPercent: emp.industryPercent || 0,
    });
  };

  const cancelEditing = () => {
    setEditingRow(null);
    setEditedData({});
  };
  const handleChange = (field, value) =>
    setEditedData((prev) => ({ ...prev, [field]: value }));

  const handleSave = async (emp) => {
    const total =
      Number(editedData.associationPercent) +
      Number(editedData.attendeesPercent) +
      Number(editedData.industryPercent);
    if (total !== 100) {
      alert("Lead distribution must equal 100%");
      return;
    }
    setLoading(emp.id);
    try {
      await axios.put(`${API_BASE_URL}/api/targets/${emp.id}`, {
        target: Number(editedData.target),
      });
      await axios.put(
        `${API_BASE_URL}/api/targets/lead-distribution/${emp.employeeId}`,
        {
          associationPercent: Number(editedData.associationPercent),
          attendeesPercent: Number(editedData.attendeesPercent),
          industryPercent: Number(editedData.industryPercent),
        },
      );
      await fetchEmployees();
      setEditingRow(null);
      setEditedData({});
    } catch (err) {
      console.error(err);
      alert("Error saving data");
    }
    setLoading(null);
  };

  const totalTargets = employees.reduce((s, e) => s + (e.target || 0), 0);
  const avgTarget =
    employees.length > 0 ? Math.round(totalTargets / employees.length) : 0;
  const assocTotal = Math.round(
    employees.reduce((s, e) => s + (e.target * e.associationPercent) / 100, 0),
  );
  const attendTotal = Math.round(
    employees.reduce((s, e) => s + (e.target * e.attendeesPercent) / 100, 0),
  );
  const indTotal = Math.round(
    employees.reduce((s, e) => s + (e.target * e.industryPercent) / 100, 0),
  );

  const th = {
    padding: "10px 14px",
    fontSize: "11px",
    fontWeight: 600,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    textAlign: "center",
    whiteSpace: "nowrap",
    borderBottom: "1px solid #F3F4F6",
    background: "#FAFAFA",
  };
  const td = {
    padding: "12px 14px",
    fontSize: "13px",
    color: "#111827",
    textAlign: "center",
    verticalAlign: "middle",
    borderBottom: "1px solid #F9FAFB",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8FAFC",
        padding: "32px 24px",
        fontFamily: "'DM Sans', 'Geist', system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Target size={20} color="#fff" />
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "22px",
                fontWeight: 700,
                color: "#0F172A",
              }}
            >
              Target Management
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                color: "#94A3B8",
                marginTop: "1px",
              }}
            >
              Set employee targets & lead distribution
            </p>
          </div>
        </div>

        {/* Stat Cards */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          <StatCard
            label="Employees"
            value={employees.length}
            color="slate"
            icon={Users}
            sub="Active"
          />
          <StatCard
            label="Total Target"
            value={totalTargets}
            color="amber"
            icon={TrendingUp}
            sub="Monthly leads"
          />
          <StatCard
            label="Avg Target"
            value={avgTarget}
            color="slate"
            icon={Award}
            sub="Per employee"
          />
          <StatCard
            label="Association"
            value={assocTotal}
            color="blue"
            icon={BarChart3}
            sub="Total leads"
          />
          <StatCard
            label="Attendees"
            value={attendTotal}
            color="green"
            icon={BarChart3}
            sub="Total leads"
          />
          <StatCard
            label="Industry"
            value={indTotal}
            color="violet"
            icon={BarChart3}
            sub="Total leads"
          />
        </div>

        {/* Table */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: "18px",
            overflow: "hidden",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              padding: "16px 20px 14px",
              borderBottom: "1px solid #F3F4F6",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}
            >
              Employee Targets
            </div>
            <div style={{ display: "flex", gap: "12px", fontSize: "12px" }}>
              {[
                ["#3B82F6", "Association"],
                ["#22C55E", "Attendees"],
                ["#7C3AED", "Industry"],
              ].map(([col, lbl]) => (
                <span
                  key={lbl}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    color: col,
                  }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: col,
                      display: "inline-block",
                    }}
                  />
                  {lbl}
                </span>
              ))}
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "780px",
              }}
            >
              <thead>
                <tr>
                  {[
                    "ID",
                    "Name",
                    "Tenure",
                    "Target",
                    "Assoc %",
                    "Attend %",
                    "Industry %",
                    "Total",
                    "Distribution",
                    "Action",
                  ].map((h) => (
                    <th key={h} style={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const isEditing = editingRow === emp.id;
                  const aP = isEditing
                    ? Number(editedData.associationPercent) || 0
                    : emp.associationPercent;
                  const atP = isEditing
                    ? Number(editedData.attendeesPercent) || 0
                    : emp.attendeesPercent;
                  const iP = isEditing
                    ? Number(editedData.industryPercent) || 0
                    : emp.industryPercent;
                  const total = aP + atP + iP;
                  const totalOk = total === 100;

                  return (
                    <tr
                      key={emp.id}
                      style={{
                        background: isEditing ? "#FAFBFF" : "transparent",
                      }}
                    >
                      <td style={td}>
                        <span
                          style={{
                            background: "#F1F5F9",
                            color: "#475569",
                            borderRadius: "6px",
                            padding: "3px 8px",
                            fontSize: "11px",
                            fontWeight: 600,
                            fontFamily: "monospace",
                          }}
                        >
                          {emp.employeeId}
                        </span>
                      </td>

                      <td style={{ ...td, textAlign: "left" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <div
                            style={{
                              width: "30px",
                              height: "30px",
                              borderRadius: "50%",
                              background:
                                "linear-gradient(135deg,#6366F1,#8B5CF6)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "11px",
                              fontWeight: 700,
                              color: "#fff",
                              flexShrink: 0,
                            }}
                          >
                            {(emp.fullName || "?").charAt(0).toUpperCase()}
                          </div>
                          <span
                            style={{
                              fontSize: "13px",
                              color: "#111827",
                              fontWeight: 500,
                            }}
                          >
                            {emp.fullName}
                          </span>
                        </div>
                      </td>

                      <td style={td}>
                        <span style={{ fontSize: "12px", color: "#6B7280" }}>
                          {emp.experience}
                        </span>
                      </td>

                      <td style={td}>
                        {isEditing ? (
                          <EditCell
                            value={editedData.target}
                            onChange={(v) => handleChange("target", v)}
                            width="70px"
                          />
                        ) : (
                          <span style={{ fontWeight: 600 }}>{emp.target}</span>
                        )}
                      </td>

                      <td style={td}>
                        {isEditing ? (
                          <EditCell
                            value={editedData.associationPercent}
                            onChange={(v) =>
                              handleChange("associationPercent", v)
                            }
                          />
                        ) : (
                          <span
                            style={{
                              background: "#EFF6FF",
                              color: "#1D4ED8",
                              borderRadius: "6px",
                              padding: "3px 8px",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          >
                            {emp.associationPercent}%
                          </span>
                        )}
                      </td>

                      <td style={td}>
                        {isEditing ? (
                          <EditCell
                            value={editedData.attendeesPercent}
                            onChange={(v) =>
                              handleChange("attendeesPercent", v)
                            }
                          />
                        ) : (
                          <span
                            style={{
                              background: "#F0FDF4",
                              color: "#15803D",
                              borderRadius: "6px",
                              padding: "3px 8px",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          >
                            {emp.attendeesPercent}%
                          </span>
                        )}
                      </td>

                      <td style={td}>
                        {isEditing ? (
                          <EditCell
                            value={editedData.industryPercent}
                            onChange={(v) => handleChange("industryPercent", v)}
                          />
                        ) : (
                          <span
                            style={{
                              background: "#F5F3FF",
                              color: "#6D28D9",
                              borderRadius: "6px",
                              padding: "3px 8px",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          >
                            {emp.industryPercent}%
                          </span>
                        )}
                      </td>

                      <td style={td}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: totalOk ? "#16A34A" : "#DC2626",
                            fontSize: "13px",
                          }}
                        >
                          {total}%
                          {isEditing && !totalOk && (
                            <span
                              style={{
                                fontSize: "10px",
                                marginLeft: "3px",
                                opacity: 0.7,
                              }}
                            >
                              ({100 - total > 0 ? "+" : ""}
                              {100 - total})
                            </span>
                          )}
                        </span>
                      </td>

                      <td style={{ ...td, minWidth: "90px" }}>
                        <MiniDonut assoc={aP} attend={atP} industry={iP} />
                      </td>

                      <td style={td}>
                        {isEditing ? (
                          <div
                            style={{
                              display: "flex",
                              gap: "6px",
                              justifyContent: "center",
                            }}
                          >
                            <button
                              onClick={() => handleSave(emp)}
                              disabled={loading === emp.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "5px",
                                padding: "6px 12px",
                                borderRadius: "8px",
                                background: "#16A34A",
                                color: "#fff",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: 600,
                                opacity: loading === emp.id ? 0.6 : 1,
                              }}
                            >
                              <Save size={12} />{" "}
                              {loading === emp.id ? "Saving…" : "Save"}
                            </button>
                            <button
                              onClick={cancelEditing}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "6px 10px",
                                borderRadius: "8px",
                                background: "#F3F4F6",
                                color: "#374151",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: 500,
                              }}
                            >
                              <X size={12} /> Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditing(emp)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "6px 12px",
                              borderRadius: "8px",
                              background: "#EEF2FF",
                              color: "#4338CA",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = "#E0E7FF")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "#EEF2FF")
                            }
                          >
                            <Pencil size={12} /> Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {employees.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      style={{
                        ...td,
                        padding: "48px",
                        color: "#9CA3AF",
                        fontSize: "14px",
                      }}
                    >
                      No employees found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetTarget;
