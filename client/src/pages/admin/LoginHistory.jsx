import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const LoginHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const limit = 50;

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const res = await axios.get(
                `${API_BASE_URL}/api/admin/login-history?page=${page}&limit=${limit}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setHistory(res.data.data);
        } catch (err) {
            console.error("Login history fetch error", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [page]);

    const filteredHistory = history.filter((item) =>
        item.email?.toLowerCase().includes(search.toLowerCase())
    );

    const formatDuration = (seconds) => {
        if (!seconds) return "-";
        const mins = Math.floor(seconds / 60);
        const hrs = Math.floor(mins / 60);
        return hrs > 0 ? `${hrs}h ${mins % 60}m` : `${mins}m`;
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-10 font-sans text-slate-900">
            <div className="max-w-[1600px] mx-auto">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-serif font-semibold text-slate-800 border-b-2 border-indigo-600 pb-1 inline-block">
                            System Access Logs
                        </h1>
                        <p className="text-slate-500 text-sm mt-2 font-medium uppercase tracking-wider">
                            Detailed Login & Session History
                        </p>
                    </div>

                    <div className="w-full md:w-80">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Search Database</label>
                        <input
                            type="text"
                            placeholder="Enter email address..."
                            className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-md shadow-sm focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-none transition-all text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table Container */}
                <div className="bg-white border border-slate-200 rounded-sm shadow-xl shadow-slate-200/50 overflow-hidden">
                    {loading ? (
                        <div className="p-20 text-center text-slate-400 italic">Retrieving secure logs...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Identity</th>
                                        <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Network Info</th>
                                        <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Platform</th>
                                        <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Session Timing</th>
                                        <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                        <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Security</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredHistory.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                            {/* Identity */}
                                            <td className="p-4">
                                                <div className="font-semibold text-slate-800">{item.employeeName || "N/A"}</div>
                                                <div className="text-xs text-slate-500">{item.email}</div>
                                                <div className="text-[10px] text-slate-400 mt-1">ID: {item.employeeId || "-"}</div>
                                            </td>

                                            {/* Network */}
                                            <td className="p-4 text-sm text-slate-600">
                                                <div className="font-medium text-slate-700">{item.ipAddress}</div>
                                                <div className="text-xs opacity-75">{item.location || "Remote"}</div>
                                                <div className="text-[10px] italic truncate max-w-[150px]">{item.isp}</div>
                                            </td>

                                            {/* Platform */}
                                            <td className="p-4">
                                                <div className="text-sm text-slate-700 capitalize">{item.deviceType}</div>
                                                <div className="text-xs text-slate-500">{item.browser} / {item.os}</div>
                                            </td>

                                            {/* Timing */}
                                            <td className="p-4">
                                                <div className="text-xs font-medium text-slate-800">In: {new Date(item.loginTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">
                                                    Out: {item.logoutTime ? new Date(item.logoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : <span className="text-emerald-600 font-bold underline decoration-emerald-200">Live Now</span>}
                                                </div>
                                                <div className="text-[11px] font-bold text-indigo-500 mt-1 uppercase tracking-tighter">Dur: {formatDuration(item.sessionDuration)}</div>
                                            </td>

                                            {/* Status */}
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold border ${item.status === "SUCCESS"
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                        : "bg-rose-50 text-rose-700 border-rose-100"
                                                    }`}>
                                                    {item.status}
                                                </span>
                                                <div className="text-[10px] text-slate-400 mt-1 ml-1">{item.attemptCount} Attempts</div>
                                            </td>

                                            {/* Security flags */}
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1.5">
                                                    {item.otpVerified && (
                                                        <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 w-fit font-bold">OTP VERIFIED</span>
                                                    )}
                                                    {item.suspiciousFlag && (
                                                        <span className="text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 w-fit font-bold">⚠️ SUSPICIOUS</span>
                                                    )}
                                                    {!item.otpVerified && !item.suspiciousFlag && <span className="text-slate-300">-</span>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-slate-400 font-medium">
                        Showing page <span className="text-slate-800 font-bold">{page}</span> of entries
                    </p>
                    <div className="flex border border-slate-200 rounded overflow-hidden shadow-sm">
                        <button
                            disabled={page === 1}
                            className="px-6 py-2 bg-white text-slate-600 text-sm font-bold hover:bg-slate-50 disabled:opacity-30 transition-all border-r border-slate-200"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                            PREVIOUS
                        </button>
                        <button
                            className="px-6 py-2 bg-white text-slate-600 text-sm font-bold hover:bg-slate-50 transition-all"
                            onClick={() => setPage((p) => p + 1)}
                        >
                            NEXT
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginHistory;