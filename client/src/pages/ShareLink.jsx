import React, { useEffect, useState } from "react";
import axios from "axios";
import { Plus, X, ExternalLink, Edit2, Trash2, Users, Link as LinkIcon, Globe, Tag } from "lucide-react";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const ShareLink = () => {
    const [linkInputs, setLinkInputs] = useState([
        { link: "", linkType: "", country: "", recipientIds: [] },
    ]);
    const [employees, setEmployees] = useState([]);
    const [showSharedInfo, setShowSharedInfo] = useState(false);
    const [sharedInfo, setSharedInfo] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingLink, setEditingLink] = useState(null);
    const [editForm, setEditForm] = useState({ link: "", linkType: "", country: "" });

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_URL}/api/all-employees`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = Array.isArray(res.data) ? res.data : res.data.employees || [];
            // Filter out admin users, only show employees
            const employeesOnly = data.filter(emp => emp.role === "EMPLOYEE");
            setEmployees(employeesOnly);
        } catch (err) {
            console.error("Error fetching employees:", err);
            setEmployees([]);
        }
    };

    const handleAddInput = () => {
        setLinkInputs((prev) => [
            ...prev,
            { link: "", linkType: "", country: "", recipientIds: [] },
        ]);
    };

    const handleRemoveInput = (index) => {
        if (linkInputs.length === 1) return;
        setLinkInputs((prev) => prev.filter((_, i) => i !== index));
    };

    const handleChange = (index, field, value) => {
        const copy = [...linkInputs];
        copy[index][field] = value;
        setLinkInputs(copy);
    };

    const handleToggleEmployee = (index, empId) => {
        const copy = [...linkInputs];
        const recs = copy[index].recipientIds;
        if (recs.includes(empId)) {
            copy[index].recipientIds = recs.filter((id) => id !== empId);
        } else {
            copy[index].recipientIds = [...recs, empId];
        }
        setLinkInputs(copy);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            for (const li of linkInputs) {
                await axios.post(`${API_URL}/api/links/share`, li, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }
            alert("✅ Links shared successfully!");
            setLinkInputs([{ link: "", linkType: "", country: "", recipientIds: [] }]);
            if (showSharedInfo) {
                loadSharedInfo();
            }
        } catch (err) {
            console.error("Error sharing links:", err);
            alert(err.response?.data?.message || "Failed to share links. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    const loadSharedInfo = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_URL}/api/links/shared-info`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSharedInfo(Array.isArray(res.data) ? res.data : []);
            setShowSharedInfo(true);
        } catch (err) {
            console.error("Error loading shared info:", err);
            setSharedInfo([]);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (link) => {
        setEditingLink(link.id);
        setEditForm({
            link: link.link,
            linkType: link.linkType,
            country: link.country,
        });
    };

    const handleUpdateLink = async (linkId) => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(`${API_URL}/api/links/${linkId}`, editForm, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert("✅ Link updated successfully!");
            setEditingLink(null);
            loadSharedInfo();
        } catch (err) {
            console.error("Error updating link:", err);
            alert("Failed to update link. Please try again.");
        }
    };

    const handleDelete = async (linkId) => {
        if (!window.confirm("Are you sure you want to delete this link and all its assignments?")) return;
        
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${API_URL}/api/links/${linkId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert("✅ Link deleted successfully!");
            loadSharedInfo();
        } catch (err) {
            console.error("Error deleting link:", err);
            alert("Failed to delete link. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                        Link Management
                    </h1>
                    <p className="text-gray-600">Share and manage links with your team</p>
                </div>

                {/* Toggle Buttons */}
                <div className="flex gap-3 mb-6">
                    <button
                        className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                            !showSharedInfo
                                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                                : "bg-white text-gray-700 hover:bg-gray-50 shadow"
                        }`}
                        onClick={() => setShowSharedInfo(false)}
                    >
                        <div className="flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            Share New Link
                        </div>
                    </button>
                    <button
                        className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                            showSharedInfo
                                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                                : "bg-white text-gray-700 hover:bg-gray-50 shadow"
                        }`}
                        onClick={loadSharedInfo}
                    >
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            View Shared Links
                        </div>
                    </button>
                </div>

                {/* Content */}
                {showSharedInfo ? (
                    /* Shared Info Cards */
                    <div className="space-y-4">
                        {loading ? (
                            <div className="animate-pulse space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-48 bg-white/50 rounded-2xl"></div>
                                ))}
                            </div>
                        ) : Array.isArray(sharedInfo) && sharedInfo.length > 0 ? (
                            sharedInfo.map((sl) => (
                                <div key={sl.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">

                                    <div className="mt-3 ml-7">
                                        <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full text-xs font-medium">
                                            Shared by: {sl.createdBy?.fullName} ({sl.createdBy?.employeeId})
                                        </span>
                                    </div>

                                    {editingLink === sl.id ? (
                                        /* Edit Mode */
                                        <div className="p-6 space-y-4">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-lg font-semibold text-gray-900">Edit Link</h3>
                                                <button
                                                    onClick={() => setEditingLink(null)}
                                                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Link URL</label>
                                                <input
                                                    type="url"
                                                    value={editForm.link}
                                                    onChange={(e) => setEditForm({...editForm, link: e.target.value})}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Link Type</label>
                                                    <select
                                                        value={editForm.linkType}
                                                        onChange={(e) => setEditForm({...editForm, linkType: e.target.value})}
                                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                    >
                                                        <option value="Association Type">Association Type</option>
                                                        <option value="Industry Type">Industry Type</option>
                                                        <option value="Attendees Type">Attendees Type</option>
                                                        <option value="World Wide">World Wide</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                                                    <input
                                                        type="text"
                                                        value={editForm.country}
                                                        onChange={(e) => setEditForm({...editForm, country: e.target.value})}
                                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleUpdateLink(sl.id)}
                                                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition font-medium"
                                                >
                                                    Save Changes
                                                </button>
                                                <button
                                                    onClick={() => setEditingLink(null)}
                                                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* View Mode */
                                        <div className="p-6">
                                            <div className="flex flex-col lg:flex-row justify-between gap-6">
                                                {/* Link Info */}
                                                <div className="flex-1 space-y-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="p-2 bg-purple-50 rounded-lg mt-1">
                                                            <LinkIcon className="w-5 h-5 text-purple-600" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-xs font-medium text-gray-500 mb-1">Link URL</p>
                                                            <a
                                                                href={sl.link}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-purple-600 hover:text-purple-700 font-medium break-all inline-flex items-center gap-2"
                                                            >
                                                                <span className="underline decoration-2">{sl.link}</span>
                                                                <ExternalLink className="w-4 h-4" />
                                                            </a>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1.5 bg-blue-50 rounded-lg">
                                                                <Tag className="w-4 h-4 text-blue-600" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-500">Type</p>
                                                                <p className="text-sm font-semibold text-gray-900">{sl.linkType}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1.5 bg-green-50 rounded-lg">
                                                                <Globe className="w-4 h-4 text-green-600" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-500">Country</p>
                                                                <p className="text-sm font-semibold text-gray-900">{sl.country}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1.5 bg-orange-50 rounded-lg">
                                                                <Users className="w-4 h-4 text-orange-600" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-500">Recipients</p>
                                                                <p className="text-sm font-semibold text-gray-900">
                                                                    {sl.recipients?.length || 0} employees
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Recipients List */}
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-500 mb-2">Shared with:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {sl.recipients?.map((r) => (
                                                                
                                                                <span
                                                                    key={r.recipientId}
                                                                    className={`
    inline-flex items-center px-4 py-1 rounded-full text-sm font-medium transition-all duration-200
    ${r.isOpen
                                                                            ? "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-800 border border-emerald-200 shadow-sm hover:shadow-md"
                                                                            : "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-800 border border-indigo-200 shadow-sm hover:shadow-md"
                                                                        }
  `}
                                                                >
                                                                    <span className="font-semibold">{r.recipient.fullName}</span>
                                                                    <span className="text-xs opacity-75 ml-1">({r.recipient.employeeId})</span>
                                                                    <span className={`ml-2 flex items-center ${r.isOpen ? "text-emerald-600" : "text-indigo-600"}`}>
                                                                        {r.isOpen ? (
                                                                            <>
                                                                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                                </svg>
                                                                                Opened
                                                                            </>
                                                                        ) : (
                                                                                <p className="text-red-500 flex items-center justify-center" >
                                                                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                                                </svg>
                                                                                Not Opened
                                                                            </p>
                                                                        )}
                                                                    </span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex lg:flex-col gap-3">
                                                    <button
                                                        onClick={() => handleEdit(sl)}
                                                        className="flex-1 lg:flex-none px-6 py-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition font-medium flex items-center justify-center gap-2"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(sl.id)}
                                                        className="flex-1 lg:flex-none px-6 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition font-medium flex items-center justify-center gap-2"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="h-1 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600"></div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <LinkIcon className="w-10 h-10 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Links Shared Yet</h3>
                                <p className="text-gray-600">Start sharing links with your team members</p>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Share Link Form */
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {linkInputs.map((li, idx) => (
                            <div key={idx} className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Link #{idx + 1}</h3>
                                    {linkInputs.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveInput(idx)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Link URL</label>
                                    <input
                                        type="url"
                                        required
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="https://example.com"
                                        value={li.link}
                                        onChange={(e) => handleChange(idx, "link", e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Link Type</label>
                                        <select
                                            required
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            value={li.linkType}
                                            onChange={(e) => handleChange(idx, "linkType", e.target.value)}
                                        >
                                            <option value="">Select type</option>
                                            <option value="Association Type">Association Type</option>
                                            <option value="Industry Type">Industry Type</option>
                                            <option value="Attendees Type">Attendees Type</option>
                                            <option value="World Wide">World Wide</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder="e.g., USA, India"
                                            value={li.country}
                                            onChange={(e) => handleChange(idx, "country", e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Employees ({li.recipientIds.length} selected)
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto border border-gray-200 rounded-xl p-4 bg-gray-50">
                                        {Array.isArray(employees) && employees.length > 0 ? (
                                            employees.map((emp) => (
                                                <button
                                                    type="button"
                                                    key={emp.id}
                                                    onClick={() => handleToggleEmployee(idx, emp.id)}
                                                    className={`px-3 py-2 text-sm rounded-lg border-2 transition-all duration-200 ${
                                                        li.recipientIds.includes(emp.id)
                                                            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white border-transparent shadow-lg scale-105"
                                                            : "bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:shadow"
                                                    }`}
                                                >
                                                    <div className="font-medium">{emp.fullName}</div>
                                                    <div className="text-xs opacity-80">({emp.employeeId})</div>
                                                </button>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-500 col-span-full text-center py-4">
                                                No employees found.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleAddInput}
                                className="px-6 py-3 rounded-xl bg-white border-2 border-dashed border-purple-300 text-purple-600 hover:bg-purple-50 hover:border-purple-400 transition font-medium flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Add Another Link
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold hover:from-purple-700 hover:to-blue-700 transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? "Sharing..." : "Share Links"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ShareLink;