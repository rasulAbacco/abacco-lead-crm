// src/components/Incentive/IncentiveForm.jsx

import { useState } from "react";
import axios from "axios";
import { X, Users, Globe, Building2, Save, Plus, Trash2 } from "lucide-react";

const ICON_OPTIONS = [
  { label: "Users", value: "Users", Icon: Users },
  { label: "Globe", value: "Globe", Icon: Globe },
  { label: "Building", value: "Building2", Icon: Building2 },
];

const COLOR_OPTIONS = [
  { label: "Blue", accent: "border-t-blue-500", bg: "bg-blue-50" },
  { label: "Green", accent: "border-t-green-500", bg: "bg-green-50" },
  { label: "Red", accent: "border-t-red-500", bg: "bg-red-50" },
  { label: "Purple", accent: "border-t-purple-500", bg: "bg-purple-50" },
];

// Updated list to include Member Attendees
const LEAD_TYPES = ["Attendees", "Member Attendees", "Association", "Industry"];

export default function IncentiveForm({ onClose, onSaved, editing }) {
  const API_BASE = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("token");

  const [title, setTitle] = useState(editing?.title || "");
  const [description, setDescription] = useState(editing?.description || "");
  const [icon, setIcon] = useState(editing?.icon || "Users");
  const [accentColor, setAccentColor] = useState(
    editing?.accentColor || COLOR_OPTIONS[0].accent,
  );
  const [bgAccent, setBgAccent] = useState(
    editing?.bgAccent || COLOR_OPTIONS[0].bg,
  );

  const [rules, setRules] = useState(editing?.rules || []);
  const [saving, setSaving] = useState(false);

  const addRule = () => {
    setRules([
      ...rules,
      {
        leadType: "Attendees",
        country: "",
        attendeesMinCount: null,
        industryDomain: "",
        leadsRequired: 0,
        amount: 0,
      },
    ]);
  };

  const updateRule = (i, field, value) => {
    const updated = [...rules];
    updated[i][field] = value;
    setRules(updated);
  };

  const removeRule = (i) => {
    setRules(rules.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    setSaving(true);

    const payload = {
      title,
      description,
      icon,
      accentColor,
      bgAccent,
      rules: rules
        .filter((r) => r.amount > 0 && r.leadsRequired > 0)
        .map((r) => ({
          leadType: r.leadType,
          country: r.leadType !== "Industry" ? r.country : null,
          // Logic for Attendees AND Member Attendees
          attendeesMinCount:
            r.leadType === "Attendees" || r.leadType === "Member Attendees"
              ? r.attendeesMinCount
                ? Number(r.attendeesMinCount)
                : null
              : null,
          industryDomain: r.leadType === "Industry" ? r.industryDomain : null,
          leadsRequired: Number(r.leadsRequired),
          amount: Number(r.amount),
        })),
    };

    try {
      if (editing) {
        await axios.put(`${API_BASE}/api/incentives/${editing.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_BASE}/api/incentives`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save plan. Check required fields.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl p-8 w-full max-w-4xl shadow-xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          {editing ? "Edit Incentive Plan" : "Create Incentive Plan"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LEFT SIDE — PLAN INFO */}
          <div className="space-y-5">
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 block mb-1">
                Title
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                placeholder="e.g. Attendees Plan USA"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-gray-700 block mb-1">
                Description
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all resize-none"
                rows={4}
                placeholder="Describe the incentive plan..."
              />
            </label>

            {/* ICON SELECTION */}
            <div>
              <span className="text-sm font-semibold text-gray-700 block mb-2">
                Select Icon
              </span>
              <div className="flex gap-3">
                {ICON_OPTIONS.map((opt) => {
                  const Icon = opt.Icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setIcon(opt.value)}
                      className={`p-3 rounded-xl border transition-all ${
                        icon === opt.value
                          ? "bg-purple-600 text-white border-purple-600 shadow-lg"
                          : "bg-white text-gray-600 border-gray-200 hover:border-purple-300"
                      }`}
                    >
                      <Icon size={22} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* COLOR SELECTION */}
            <div>
              <span className="text-sm font-semibold text-gray-700 block mb-2">
                Select Accent Color
              </span>
              <div className="flex gap-3">
                {COLOR_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => {
                      setAccentColor(opt.accent);
                      setBgAccent(opt.bg);
                    }}
                    className={`w-8 h-8 rounded-xl border transition-all hover:scale-110 ${
                      accentColor === opt.accent
                        ? "ring-2 ring-offset-2 ring-purple-500 border-transparent"
                        : "border-gray-200"
                    } ${opt.bg}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE — RULE BUILDER */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4 max-h-[600px] overflow-y-auto">
            <div className="flex justify-between items-center sticky top-0 bg-gray-50 py-2 z-10">
              <h3 className="text-lg font-semibold text-gray-800">
                Incentive Rules
              </h3>
              <button
                type="button"
                onClick={addRule}
                className="flex items-center gap-1 text-white bg-green-600 px-3 py-1.5 rounded-xl hover:bg-green-700 transition-colors text-sm font-medium shadow-sm"
              >
                <Plus size={18} /> Add Rule
              </button>
            </div>

            {rules.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm">No rules added yet.</p>
                <p className="text-xs mt-1">Click "Add Rule" to get started.</p>
              </div>
            )}

            {rules.map((rule, i) => (
              <div
                key={i}
                className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm space-y-4"
              >
                <div className="flex justify-between items-center border-b pb-2 mb-2">
                  <h4 className="font-semibold text-gray-700">Rule #{i + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeRule(i)}
                    className="text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* LEAD TYPE SELECT */}
                <label className="block">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Lead Type
                  </span>
                  <select
                    value={rule.leadType}
                    onChange={(e) => updateRule(i, "leadType", e.target.value)}
                    className="w-full border border-gray-300 p-2.5 mt-1 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    {LEAD_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>

                {/* FIELDS FOR ATTENDEES */}
                {rule.leadType === "Attendees" && (
                  <div className="space-y-3">
                    <label className="block">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Country
                      </span>
                      <input
                        type="text"
                        className="w-full border border-gray-300 p-2.5 mt-1 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        placeholder="e.g. USA"
                        value={rule.country || ""}
                        onChange={(e) =>
                          updateRule(i, "country", e.target.value)
                        }
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Min Attendee Count
                      </span>
                      <input
                        type="number"
                        className="w-full border border-gray-300 p-2.5 mt-1 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        placeholder="e.g. 5000"
                        value={rule.attendeesMinCount || ""}
                        onChange={(e) =>
                          updateRule(
                            i,
                            "attendeesMinCount",
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                      />
                    </label>
                  </div>
                )}

                {/* FIELDS FOR MEMBER ATTENDEES */}
                {rule.leadType === "Member Attendees" && (
                  <div className="space-y-3">
                    <label className="block">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Country
                      </span>
                      <input
                        type="text"
                        className="w-full border border-gray-300 p-2.5 mt-1 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        placeholder="e.g. USA"
                        value={rule.country || ""}
                        onChange={(e) =>
                          updateRule(i, "country", e.target.value)
                        }
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Member Count
                      </span>
                      <input
                        type="number"
                        className="w-full border border-gray-300 p-2.5 mt-1 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        placeholder="Optional"
                        value={rule.attendeesMinCount || ""}
                        onChange={(e) =>
                          updateRule(
                            i,
                            "attendeesMinCount",
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                      />
                    </label>
                  </div>
                )}

                {/* FIELDS FOR ASSOCIATION */}
                {rule.leadType === "Association" && (
                  <label className="block">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Country
                    </span>
                    <input
                      type="text"
                      className="w-full border border-gray-300 p-2.5 mt-1 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      placeholder="e.g. USA"
                      value={rule.country || ""}
                      onChange={(e) => updateRule(i, "country", e.target.value)}
                    />
                  </label>
                )}

                {/* FIELDS FOR INDUSTRY */}
                {rule.leadType === "Industry" && (
                  <label className="block">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Industry Domain
                    </span>
                    <input
                      type="text"
                      className="w-full border border-gray-300 p-2.5 mt-1 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      placeholder="e.g. IT, Healthcare"
                      value={rule.industryDomain || ""}
                      onChange={(e) =>
                        updateRule(i, "industryDomain", e.target.value)
                      }
                    />
                  </label>
                )}

                {/* COMMON FIELDS: LEADS & AMOUNT */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t mt-3">
                  <label className="block">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Leads Required
                    </span>
                    <input
                      type="number"
                      className="w-full border border-gray-300 p-2.5 mt-1 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      value={rule.leadsRequired || ""}
                      onChange={(e) =>
                        updateRule(i, "leadsRequired", Number(e.target.value))
                      }
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Amount (₹)
                    </span>
                    <input
                      type="number"
                      className="w-full border border-gray-300 p-2.5 mt-1 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      value={rule.amount || ""}
                      onChange={(e) =>
                        updateRule(i, "amount", Number(e.target.value))
                      }
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="mt-8 flex justify-end border-t pt-6">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl text-white font-semibold shadow-md transition-all ${
              saving
                ? "bg-purple-400 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700 hover:shadow-lg transform hover:-translate-y-0.5"
            }`}
          >
            <Save size={20} />
            {saving ? "Saving..." : editing ? "Update Plan" : "Create Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}
