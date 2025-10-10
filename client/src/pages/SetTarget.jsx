import React, { useEffect, useState } from "react";
import axios from "axios";
import { Target, Users, TrendingUp, CheckCircle, Edit3, Save } from "lucide-react";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SetTarget = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(null);
    const [editedTargets, setEditedTargets] = useState({});
    const [editingRow, setEditingRow] = useState(null);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/targets`);
            const data = Array.isArray(res.data) ? res.data : [];

            // ✅ Sort by experience (descending)
            const sortedData = data.sort((a, b) => b.expInMonths - a.expInMonths);

            setEmployees(sortedData);
        } catch (err) {
            console.error("Error fetching employees", err);
            setEmployees([]);
        }
    };


    const handleInputChange = (id, value) => {
        setEditedTargets((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    const handleUpdate = async (id) => {
        const newTarget = editedTargets[id];
        if (!newTarget || newTarget < 0) return alert("Enter a valid target!");

        setLoading(id);
        try {
            await axios.put(`${API_BASE_URL}/api/targets/${Number(id)}`, {
                target: Number(newTarget),
            });
            await fetchEmployees();
            setEditingRow(null);
            setEditedTargets((prev) => {
                const updated = { ...prev };
                delete updated[id];
                return updated;
            });
        } catch (err) {
            console.error("Error updating target", err.response?.data || err);
        }
        setLoading(null);
    };

    const startEditing = (id, currentTarget) => {
        setEditingRow(id);
        setEditedTargets((prev) => ({
            ...prev,
            [id]: currentTarget,
        }));
    };

    const cancelEditing = () => {
        setEditingRow(null);
        setEditedTargets({});
    };

    const totalTargets = employees.reduce((sum, emp) => sum + (emp.target || 0), 0);
    const avgTarget = employees.length > 0 ? (totalTargets / employees.length).toFixed(0) : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                            <Target className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Target Management
                            </h1>
                            <p className="text-slate-600 mt-1">Set and track employee performance targets</p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-sm font-medium">Total Employees</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{employees.length}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-sm font-medium">Total Targets</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{totalTargets}</p>
                            </div>
                            <div className="p-3 bg-indigo-100 rounded-xl">
                                <TrendingUp className="w-6 h-6 text-indigo-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-sm font-medium">Average Target</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{avgTarget}</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-xl">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Employee ID
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Full Name
                                    </th>
                                    <th className="px-6 py-4  text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Tenure
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Target
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {employees.length > 0 ? (
                                    employees.map((emp) => (
                                        <tr
                                            key={emp.id}
                                            className="hover:bg-slate-50 transition-colors group"
                                        >
                                            <td className="px-6 py-4 text-center text-sm font-medium text-slate-700">
                                                <span className="px-3 py-1 bg-slate-100 rounded-lg">
                                                    {emp.employeeId}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm font-medium text-slate-800">
                                                {emp.fullName}
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm text-slate-600">
                                                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg font-medium">
                                                    {emp.experience}
                                                </span>

                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {editingRow === emp.id ? (
                                                    <input
                                                        type="number"
                                                        value={editedTargets[emp.id] || emp.target}
                                                        className="w-32 px-4 py-2 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-semibold text-slate-800"
                                                        onChange={(e) =>
                                                            handleInputChange(emp.id, e.target.value)
                                                        }
                                                    />
                                                ) : (
                                                    <span className="text-lg font-bold text-slate-800">
                                                        {emp.target}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4  text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {editingRow === emp.id ? (
                                                        <>
                                                            <button
                                                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:from-slate-300 disabled:to-slate-400 transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed font-medium"
                                                                disabled={loading === emp.id}
                                                                onClick={() => handleUpdate(emp.id)}
                                                            >
                                                                {loading === emp.id ? (
                                                                    <>
                                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                        <span>Saving...</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Save className="w-4 h-4" />
                                                                        <span>Save</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                            <button
                                                                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all font-medium"
                                                                onClick={cancelEditing}
                                                                disabled={loading === emp.id}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-medium opacity-100 group-hover:opacity-100"
                                                            onClick={() => startEditing(emp.id, emp.target)}
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                            <span>Edit</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="5"
                                            className="px-6 py-12 text-center text-slate-500"
                                        >
                                            <div className="flex flex-col items-center gap-3">
                                                <Users className="w-12 h-12 text-slate-300" />
                                                <p className="text-lg font-medium">No employees found</p>
                                                <p className="text-sm">Add employees to start setting targets</p>
                                            </div>
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