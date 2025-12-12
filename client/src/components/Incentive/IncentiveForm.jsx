// src/components/Incentive/IncentiveForm.jsx

import { useState, useEffect } from "react";
import axios from "axios";
import { X, Users, Globe, Building2, Save, Plus, Trash2 } from "lucide-react";

const ICON_OPTIONS = [
    { label: "Users", value: "Users", Icon: Users },
    { label: "Globe", value: "Globe", Icon: Globe },
    { label: "Building", value: "Building2", Icon: Building2 }
];

const COLOR_OPTIONS = [
    { label: "Blue", accent: "border-t-blue-500", bg: "bg-blue-50" },
    { label: "Green", accent: "border-t-green-500", bg: "bg-green-50" },
    { label: "Red", accent: "border-t-red-500", bg: "bg-red-50" },
    { label: "Purple", accent: "border-t-purple-500", bg: "bg-purple-50" },
];

const LEAD_TYPES = ["Attendees", "Association", "Industry"];

export default function IncentiveForm({ onClose, onSaved, editing }) {
    const API_BASE = import.meta.env.VITE_API_BASE_URL;
    const token = localStorage.getItem("token");

    const [title, setTitle] = useState(editing?.title || "");
    const [description, setDescription] = useState(editing?.description || "");
    const [icon, setIcon] = useState(editing?.icon || "Users");
    const [accentColor, setAccentColor] = useState(editing?.accentColor || COLOR_OPTIONS[0].accent);
    const [bgAccent, setBgAccent] = useState(editing?.bgAccent || COLOR_OPTIONS[0].bg);

    // RULES instead of tiers
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
            }
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
                .filter(r => r.amount > 0 && r.leadsRequired > 0)
                .map(r => ({
                    leadType: r.leadType,
                    country: r.leadType !== "Industry" ? r.country : null,
                    attendeesMinCount: r.leadType === "Attendees" ? Number(r.attendeesMinCount || 0) : null,
                    industryDomain: r.leadType === "Industry" ? r.industryDomain : null,
                    leadsRequired: Number(r.leadsRequired),
                    amount: Number(r.amount),
                }))
        };

        try {
            if (editing) {
                await axios.put(`${API_BASE}/api/incentives/${editing.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${API_BASE}/api/incentives`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
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
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 w-full max-w-4xl shadow-xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-600 hover:text-black">
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-bold mb-6">
                    {editing ? "Edit Incentive Plan" : "Create Incentive Plan"}
                </h2>

                {/* Left / Right layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* LEFT SIDE — PLAN INFO */}
                    <div className="space-y-4">
                        <label>
                            <span className="text-sm font-semibold block">Title</span>
                            <input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full border p-3 mt-1 rounded-xl"
                                placeholder="Example: Attendees Plan USA"
                            />
                        </label>

                        <label>
                            <span className="text-sm font-semibold block">Description</span>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full border p-3 mt-1 rounded-xl"
                                rows={4}
                            />
                        </label>

                        {/* ICON SELECTION */}
                        <div>
                            <span className="text-sm font-semibold block mb-1">Select Icon</span>
                            <div className="flex gap-3">
                                {ICON_OPTIONS.map(opt => {
                                    const Icon = opt.Icon;
                                    return (
                                        <button
                                            key={opt.value}
                                            onClick={() => setIcon(opt.value)}
                                            className={`p-3 rounded-xl border ${icon === opt.value ? "bg-purple-600 text-white" : "bg-gray-100"
                                                }`}
                                        >
                                            <Icon size={22} />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* COLOR OPTIONS */}
                        <div>
                            <span className="text-sm font-semibold block mb-1">Select Accent</span>
                            <div className="flex gap-3">
                                {COLOR_OPTIONS.map(opt => (
                                    <button
                                        key={opt.label}
                                        onClick={() => {
                                            setAccentColor(opt.accent);
                                            setBgAccent(opt.bg);
                                        }}
                                        className={`w-8 h-8 rounded-xl border ${accentColor === opt.accent ? "border-purple-600 ring-2 ring-purple-300" : ""
                                            }`}
                                        style={{ backgroundColor: opt.bg.replace("bg-", "") }}
                                    />
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* RIGHT SIDE — RULE BUILDER */}
                    <div className="bg-gray-50 border rounded-2xl p-4 space-y-4 max-h-[500px] overflow-y-auto">

                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold">Incentive Rules</h3>
                            <button
                                onClick={addRule}
                                className="flex items-center gap-1 text-white bg-green-600 px-3 py-1.5 rounded-xl"
                            >
                                <Plus size={18} /> Add Rule
                            </button>
                        </div>

                        {rules.length === 0 && (
                            <p className="text-gray-500 text-sm">No rules added yet.</p>
                        )}

                        {rules.map((rule, i) => (
                            <div key={i} className="p-4 bg-white rounded-xl border shadow-sm space-y-3">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-semibold">Rule #{i + 1}</h4>
                                    <button onClick={() => removeRule(i)} className="text-red-600">
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                {/* SELECT LEAD TYPE */}
                                <label className="block">
                                    <span className="text-sm font-medium">Lead Type</span>
                                    <select
                                        value={rule.leadType}
                                        onChange={e => updateRule(i, "leadType", e.target.value)}
                                        className="w-full border p-2 mt-1 rounded"
                                    >
                                        {LEAD_TYPES.map(t => (
                                            <option key={t}>{t}</option>
                                        ))}
                                    </select>
                                </label>

                                {/* CONDITIONAL FIELDS */}
                                {/* Attendees: country + attendeesMinCount */}
                                {rule.leadType === "Attendees" && (
                                    <>
                                        <label>
                                            <span className="text-sm">Country</span>
                                            <input
                                                className="w-full border p-2 rounded mt-1"
                                                placeholder="USA"
                                                value={rule.country}
                                                onChange={(e) => updateRule(i, "country", e.target.value)}
                                            />
                                        </label>

                                        <label>
                                            <span className="text-sm">Minimum Attendee Count</span>
                                            <input
                                                type="number"
                                                className="w-full border p-2 rounded mt-1"
                                                value={rule.attendeesMinCount || ""}
                                                onChange={(e) =>
                                                    updateRule(i, "attendeesMinCount", Number(e.target.value))
                                                }
                                            />
                                        </label>
                                    </>
                                )}

                                {/* Association: only country */}
                                {rule.leadType === "Association" && (
                                    <label>
                                        <span className="text-sm">Country</span>
                                        <input
                                            className="w-full border p-2 rounded mt-1"
                                            placeholder="USA"
                                            value={rule.country}
                                            onChange={(e) => updateRule(i, "country", e.target.value)}
                                        />
                                    </label>
                                )}

                                {/* Industry: industryDomain */}
                                {rule.leadType === "Industry" && (
                                    <label>
                                        <span className="text-sm">Industry Domain</span>
                                        <input
                                            className="w-full border p-2 rounded mt-1"
                                            placeholder="IT, Healthcare..."
                                            value={rule.industryDomain}
                                            onChange={(e) => updateRule(i, "industryDomain", e.target.value)}
                                        />
                                    </label>
                                )}

                                {/* COMMON FIELDS */}
                                <label>
                                    <span className="text-sm">Leads Required</span>
                                    <input
                                        type="number"
                                        className="w-full border p-2 rounded mt-1"
                                        value={rule.leadsRequired}
                                        onChange={(e) => updateRule(i, "leadsRequired", Number(e.target.value))}
                                    />
                                </label>

                                <label>
                                    <span className="text-sm">Incentive Amount (₹)</span>
                                    <input
                                        type="number"
                                        className="w-full border p-2 rounded mt-1"
                                        value={rule.amount}
                                        onChange={(e) => updateRule(i, "amount", Number(e.target.value))}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SUBMIT BUTTON */}
                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold shadow-md ${saving ? "bg-purple-400" : "bg-purple-600 hover:bg-purple-700"
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
