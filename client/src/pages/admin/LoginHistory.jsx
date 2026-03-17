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
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
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

        if (hrs > 0) return `${hrs}h ${mins % 60}m`;
        return `${mins}m`;
    };

    return (
        <div className="p-6">

            <h1 className="text-2xl font-bold mb-4">Login History</h1>

            {/* Search */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by email..."
                    className="border px-3 py-2 rounded w-64"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="overflow-auto bg-white shadow rounded-lg">

                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3 text-left">Employee</th>
                                <th className="p-3 text-left">Employee ID</th>
                                <th className="p-3 text-left">Email</th>
                                <th className="p-3 text-left">IP</th>
                                <th className="p-3 text-left">Location</th>
                                <th className="p-3 text-left">ISP</th>
                                <th className="p-3 text-left">Device</th>
                                <th className="p-3 text-left">Browser</th>
                                <th className="p-3 text-left">OS</th>
                                <th className="p-3 text-left">Login Time</th>
                                <th className="p-3 text-left">Logout Time</th>
                                <th className="p-3 text-left">Duration</th>
                                <th className="p-3 text-left">Method</th>
                                <th className="p-3 text-left">OTP</th>
                                <th className="p-3 text-left">Attempts</th>
                                <th className="p-3 text-left">Status</th>
                                <th className="p-3 text-left">Suspicious</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredHistory.map((item) => (
                                <tr key={item.id} className="border-t">

                                    <td className="p-3">{item.employeeName || "-"}</td>

                                    <td className="p-3">{item.employeeId || "-"}</td>

                                    <td className="p-3">{item.email}</td>

                                    <td className="p-3">{item.ipAddress || "-"}</td>

                                    <td className="p-3">{item.location || "-"}</td>

                                    <td className="p-3">{item.isp || "-"}</td>

                                    <td className="p-3 capitalize">{item.deviceType || "-"}</td>

                                    <td className="p-3">
                                        {item.browser ? `${item.browser}` : "-"}
                                    </td>

                                    <td className="p-3">{item.os || "-"}</td>

                                    <td className="p-3">
                                        {new Date(item.loginTime).toLocaleString()}
                                    </td>

                                    <td className="p-3">
                                        {item.logoutTime
                                            ? new Date(item.logoutTime).toLocaleString()
                                            : (
                                                <span className="text-green-600 font-semibold">
                                                    Active
                                                </span>
                                            )}
                                    </td>

                                    <td className="p-3">
                                        {formatDuration(item.sessionDuration)}
                                    </td>

                                    <td className="p-3">{item.loginMethod || "-"}</td>

                                    <td className="p-3">
                                        {item.otpVerified ? (
                                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">
                                                Yes
                                            </span>
                                        ) : (
                                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">
                                                No
                                            </span>
                                        )}
                                    </td>

                                    <td className="p-3">{item.attemptCount}</td>

                                    <td className="p-3">
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-semibold ${item.status === "SUCCESS"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-red-100 text-red-700"
                                                }`}
                                        >
                                            {item.status}
                                        </span>
                                    </td>

                                    <td className="p-3">
                                        {item.suspiciousFlag ? (
                                            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-semibold">
                                                ⚠ Suspicious
                                            </span>
                                        ) : (
                                            "-"
                                        )}
                                    </td>

                                </tr>
                            ))}
                        </tbody>
                    </table>

                </div>
            )}

            {/* Pagination */}
            <div className="flex gap-3 mt-4">
                <button
                    className="px-4 py-2 bg-gray-200 rounded"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                    Previous
                </button>

                <button
                    className="px-4 py-2 bg-gray-200 rounded"
                    onClick={() => setPage((p) => p + 1)}
                >
                    Next
                </button>
            </div>

        </div>
    );
};

export default LoginHistory;