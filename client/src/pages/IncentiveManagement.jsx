// src/admin/IncentiveManagement.jsx

import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Pencil, PowerOff, Power, Loader2, Award } from "lucide-react";
import IncentiveForm from "../components/Incentive/IncentiveForm";

export default function IncentiveManagement() {
    const [incentives, setIncentives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);

    const API_BASE = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchIncentives();
    }, []);

    const fetchIncentives = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");

            const res = await axios.get(`${API_BASE}/api/incentives`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setIncentives(res.data);
        } catch (err) {
            console.error("Failed to load incentives:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (plan) => {
        setEditing(plan);
        setShowForm(true);
    };

    const handleCreate = () => {
        setEditing(null);
        setShowForm(true);
    };

    const activatePlan = async (id) => {
        try {
            const token = localStorage.getItem("token");
            await axios.post(
                `${API_BASE}/api/incentives/${id}/activate`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchIncentives();
        } catch (err) {
            console.error("Failed to activate:", err);
        }
    };

    const deactivatePlan = async (id) => {
        try {
            const token = localStorage.getItem("token");
            await axios.post(
                `${API_BASE}/api/incentives/${id}/deactivate`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchIncentives();
        } catch (err) {
            console.error("Failed to deactivate:", err);
        }
    };

    const groupRulesByType = (rules) => {
        const groups = {
            Attendees: [],
            Association: [],
            Industry: [],
        };

        rules.forEach((rule) => {
            const type = rule.leadType || "Other";
            if (groups[type]) groups[type].push(rule);
        });

        return groups;
    };

    const renderIcon = (icon) => {
        return <Award size={24} className="text-white" />;
    };

    return (
        <div className="p-4 md:p-10 min-h-screen bg-gray-50">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 flex items-center gap-2">
                    <Award className="text-purple-600" size={30} />
                    Incentive Management
                </h1>

                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 bg-purple-600 text-white font-semibold px-4 py-2 rounded-xl shadow-lg hover:bg-purple-700 transition duration-200"
                >
                    <Plus size={20} /> Add New Plan
                </button>
            </header>

            {/* INCENTIVE LIST */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center p-10">
                        <Loader2 className="animate-spin text-purple-600" size={32} />
                        <p className="ml-3 text-lg text-gray-600">Loading incentive plans...</p>
                    </div>
                ) : incentives.length === 0 ? (
                    <div className="text-gray-500 text-center py-12">
                        <Award size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-lg">No incentive plans found.</p>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr className="text-gray-700 text-sm uppercase tracking-wider">
                                <th className="px-6 py-3 text-left">Title</th>
                                <th className="px-6 py-3 text-left hidden md:table-cell">Description</th>
                                <th className="px-6 py-3 text-left hidden md:table-cell">Rules</th>
                                <th className="px-6 py-3 text-right">Status</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="bg-white divide-y divide-gray-100">
                            {incentives.map((plan) => {
                                const groups = groupRulesByType(plan.rules || []);

                                return (
                                    <tr key={plan.id} className="hover:bg-purple-50 transition">
                                        <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                                            <div className="p-2 rounded-full bg-purple-600">
                                                {renderIcon(plan.icon)}
                                            </div>
                                            {plan.title}
                                        </td>

                                        <td className="px-6 py-4 text-gray-600 hidden md:table-cell">{plan.description}</td>

                                        {/* RULES COLUMN */}
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <div className="space-y-2 text-sm">

                                                {/* Attendees */}
                                                {groups.Attendees.length > 0 && (
                                                    <div>
                                                        <p className="font-bold text-purple-700">Attendees</p>
                                                        <ul className="ml-3 space-y-1">
                                                            {groups.Attendees.map((r) => (
                                                                <li key={r.id} className="flex justify-between">
                                                                    <span>
                                                                        {r.country ? `${r.country} - ` : ""} Min Count: {r.attendeesMinCount} → {r.leadsRequired} leads
                                                                    </span>
                                                                    <span className="font-semibold text-purple-600">₹{r.amount}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Association */}
                                                {groups.Association.length > 0 && (
                                                    <div>
                                                        <p className="font-bold text-blue-700">Association</p>
                                                        <ul className="ml-3 space-y-1">
                                                            {groups.Association.map((r) => (
                                                                <li key={r.id} className="flex justify-between">
                                                                    <span>
                                                                        {r.country ? `${r.country} - ` : ""}{r.leadsRequired} leads
                                                                    </span>
                                                                    <span className="font-semibold text-blue-600">₹{r.amount}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Industry */}
                                                {groups.Industry.length > 0 && (
                                                    <div>
                                                        <p className="font-bold text-green-700">Industry</p>
                                                        <ul className="ml-3 space-y-1">
                                                            {groups.Industry.map((r) => (
                                                                <li key={r.id} className="flex justify-between">
                                                                    <span>
                                                                        {r.industryDomain} → {r.leadsRequired} leads
                                                                    </span>
                                                                    <span className="font-semibold text-green-600">₹{r.amount}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                            </div>
                                        </td>

                                        {/* STATUS */}
                                        <td className="px-6 py-4 text-right">
                                            {plan.isActive ? (
                                                <span className="text-green-600 font-bold">Active</span>
                                            ) : (
                                                <span className="text-red-500 font-bold">Inactive</span>
                                            )}
                                        </td>

                                        {/* ACTIONS */}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-3">

                                                {/* EDIT */}
                                                <button
                                                    onClick={() => handleEdit(plan)}
                                                    title="Edit Incentive"
                                                    className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-100 rounded-full"
                                                >
                                                    <Pencil size={18} />
                                                </button>

                                                {/* ACTIVATE / DEACTIVATE */}
                                                {plan.isActive ? (
                                                    <button
                                                        onClick={() => deactivatePlan(plan.id)}
                                                        title="Deactivate Plan"
                                                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-100 rounded-full"
                                                    >
                                                        <PowerOff size={18} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => activatePlan(plan.id)}
                                                        title="Activate Plan"
                                                        className="text-green-600 hover:text-green-800 p-2 hover:bg-green-100 rounded-full"
                                                    >
                                                        <Power size={18} />
                                                    </button>
                                                )}

                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* FORM MODAL */}
            {showForm && (
                <IncentiveForm
                    onClose={() => setShowForm(false)}
                    onSaved={fetchIncentives}
                    editing={editing}
                />
            )}
        </div>
    );
}
