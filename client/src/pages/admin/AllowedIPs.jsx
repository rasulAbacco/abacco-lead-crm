import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    fetchAllowedIPs,
    createAllowedIP,
    updateIPStatus,
    deleteAllowedIP,
} from "../../utils/allowedIPApi";
import Loader from "../../components/Loader";
import { Circle, CheckCircle, Slash, Pin, Plus, Trash2 } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AllowedIPs = () => {
    const [ips, setIps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ ipAddress: "", label: "" });

    const loadIPs = async () => {
        try {
            setLoading(true);
            const res = await fetchAllowedIPs();
            setIps(res.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadIPs(); }, []);

    const handleAddIP = async () => {
        if (!form.ipAddress) return alert("IP address required");
        try {
            await createAllowedIP(form);
            setShowModal(false);
            setForm({ ipAddress: "", label: "" });
            loadIPs();
        } catch (err) {
            alert(err?.response?.data?.message || "Failed to add IP");
        }
    };

    const handleToggle = async (id, currentStatus) => {
        try {
            await updateIPStatus(id, !currentStatus);
            setIps((prev) =>
                prev.map((ip) => ip.id === id ? { ...ip, status: !currentStatus } : ip)
            );
        } catch (err) {
            alert("Failed to update status");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this IP?")) return;
        try {
            await deleteAllowedIP(id);
            setIps((prev) => prev.filter((ip) => ip.id !== id));
        } catch (err) {
            alert("Failed to delete IP");
        }
    };

    const handleAddCurrentIP = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/my-ip`);
            setForm({ ipAddress: res.data.ip, label: "Admin Network (Auto)" });
            setShowModal(true);
        } catch (err) {
            alert("Failed to fetch current IP");
        }
    };

    const totalIPs = ips.length;
    const activeIPs = ips.filter(ip => ip.status).length;
    const disabledIPs = totalIPs - activeIPs;

    if (loading) return <Loader />;

    return (
        <div className="min-h-screen bg-[#F6F8FB] p-4 md:p-6 font-sans text-[#333E53]">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-[18px] font-bold text-[#111A2C]">Allowed IP Management</h1>
                    <p className="text-[12px] text-[#7E8591]">Control network access • Admin console</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleAddCurrentIP} className="flex items-center gap-1 px-4 py-2 bg-white border border-[#D9DFE8] rounded-full text-[#5B63E6] font-semibold text-[12px] shadow-sm hover:bg-slate-50 transition-all">
                        <Pin size={14} /> Add Current IP
                    </button>
                    <button onClick={() => setShowModal(true)} className="flex items-center gap-1 px-4 py-2 bg-[#5B63E6] rounded-full text-white font-semibold text-[12px] shadow-md hover:bg-[#4D55D8] transition-all">
                        <Plus size={14} /> Add IP
                    </button>
                </div>
            </div>

            {/* Small Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl border border-[#EEF1F6] shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0"><Circle size={18} /></div>
                    <div>
                        <p className="text-[20px] font-extrabold leading-none text-[#111A2C]">{totalIPs}</p>
                        <p className="text-[12px] font-medium text-[#7E8591] mt-1">Total IPs</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-[#EEF1F6] shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0"><CheckCircle size={18} /></div>
                    <div>
                        <p className="text-[20px] font-extrabold leading-none text-[#111A2C]">{activeIPs}</p>
                        <p className="text-[12px] font-medium text-[#7E8591] mt-1">Active</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-[#EEF1F6] shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 shrink-0"><Slash size={18} /></div>
                    <div>
                        <p className="text-[20px] font-extrabold leading-none text-[#111A2C]">{disabledIPs}</p>
                        <p className="text-[12px] font-medium text-[#7E8591] mt-1">Disabled</p>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-2xl border border-[#EEF1F6] shadow-lg shadow-[#DCE6F1]/20 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="bg-[#5B63E6]">
                            <tr>
                                <th className="p-4 text-[12px] font-bold text-white uppercase tracking-wider pl-6">IP Address</th>
                                <th className="p-4 text-[12px] font-bold text-white uppercase tracking-wider">Label</th>
                                <th className="p-4 text-[12px] font-bold text-white uppercase tracking-wider text-center">Status</th>
                                <th className="p-4 text-[12px] font-bold text-white uppercase tracking-wider">Created At</th>
                                <th className="p-4 text-[12px] font-bold text-white uppercase tracking-wider text-center pr-6">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EEF1F6]">
                            {ips.length === 0 ? (
                                <tr><td colSpan="5" className="p-10 text-center text-[12px] text-[#7E8591] italic">No IPs found</td></tr>
                            ) : (
                                ips.map((ip) => (
                                    <tr key={ip.id} className="hover:bg-[#F9FAFC] transition-colors">
                                        <td className="p-4 pl-6 text-[12px] font-bold text-[#111A2C] font-mono">{ip.ipAddress}</td>
                                        <td className="p-4 text-[12px] text-[#7E8591] font-medium">{ip.label || "-"}</td>
                                        <td className="p-4 text-center">
                                            {/* Toggle Switch */}
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleToggle(ip.id, ip.status)}
                                                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${ip.status ? 'bg-[#5B63E6]' : 'bg-slate-300'}`}
                                                >
                                                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${ip.status ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </button>
                                                <span className={`text-[11px] font-bold uppercase ${ip.status ? 'text-[#5B63E6]' : 'text-slate-400'}`}>
                                                    {ip.status ? "Active" : "Off"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-[12px] text-[#7E8591] font-medium">
                                            {new Date(ip.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
                                            <span className="text-[10px] opacity-60 block">{new Date(ip.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </td>
                                        <td className="p-4 text-center pr-6">
                                            <button onClick={() => handleDelete(ip.id)} className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#FDF0F0] text-[#E05B5B] border border-[#FADEDE] hover:bg-[#FADEDE] flex items-center gap-1 mx-auto transition-all">
                                                <Trash2 size={12} /> Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Compact Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-[#090D18]/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#EEF1F6] overflow-hidden">
                        <div className="p-6 border-b border-[#EEF1F6] bg-[#F9FAFC]">
                            <h3 className="text-[14px] font-bold text-[#111A2C]">Authorize Access Network</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-[#A3AEB9] uppercase mb-1 ml-1 tracking-wider">IP Address</label>
                                <input className="w-full bg-[#F6F8FB] border border-[#DCE3EE] px-4 py-2.5 rounded-lg text-[12px] outline-none font-mono" placeholder="0.0.0.0" value={form.ipAddress} onChange={(e) => setForm({ ...form, ipAddress: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-[#A3AEB9] uppercase mb-1 ml-1 tracking-wider">Label</label>
                                <input className="w-full bg-[#F6F8FB] border border-[#DCE3EE] px-4 py-2.5 rounded-lg text-[12px] outline-none" placeholder="e.g. Office" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
                            </div>
                        </div>
                        <div className="p-6 bg-[#F9FAFC] border-t border-[#EEF1F6] flex justify-end gap-2">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-[12px] font-bold text-[#7E8591]">CANCEL</button>
                            <button onClick={handleAddIP} className="px-6 py-2 bg-[#5B63E6] text-white rounded-full text-[12px] font-bold shadow-md">AUTHORIZE IP</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AllowedIPs;