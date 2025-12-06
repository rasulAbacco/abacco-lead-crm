import React, { useEffect, useState } from "react";
import axios from "axios";
import { ExternalLink, Trash2, Calendar, Globe, Tag, CheckCircle, XCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const MyLinks = () => {
    const [myLinks, setMyLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);

    useEffect(() => {
        fetchLinks();
    }, []);

    const fetchLinks = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_URL}/api/links/my`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = Array.isArray(res.data) ? res.data : [];

            // Normalize old + new format
            const normalized = data.map((rl) => ({
                ...rl,
                sharedLink: {
                    ...rl.sharedLink,
                    allUrls:
                        rl.sharedLink.urls?.length > 0
                            ? rl.sharedLink.urls.map((u) => ({
                                id: u.id,
                                url: u.url,
                            }))
                            : rl.sharedLink.link
                                ? [
                                    {
                                        id: null,
                                        url: rl.sharedLink.link,
                                    },
                                ]
                                : [],
                },
            }));

            setMyLinks(normalized);
        } catch (err) {
            console.error("Error fetching my links:", err);
            setMyLinks([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (linkId) => {
        if (!window.confirm("Are you sure you want to delete this link?")) return;

        try {
            setDeleting(linkId);
            const token = localStorage.getItem("token");

            await axios.delete(`${API_URL}/api/links/received/${linkId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setMyLinks(myLinks.filter((link) => link.id !== linkId));
        } catch (err) {
            console.error("Error deleting link:", err);
            alert("Failed to delete link. Please try again.");
        } finally {
            setDeleting(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-100 p-4 md:p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="animate-pulse space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-xl shadow-sm p-5">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="h-5 bg-gray-200 rounded w-24"></div>
                                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                                </div>
                                <div className="space-y-3">
                                    {[1, 2].map((j) => (
                                        <div key={j} className="flex justify-between items-center">
                                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                            <div className="h-8 bg-gray-200 rounded w-16"></div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                                    <div className="h-6 bg-gray-200 rounded w-24"></div>
                                    <div className="h-6 bg-gray-200 rounded w-28"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-100 p-4 md:p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                        My Shared Links
                    </h1>
                    <p className="text-gray-600 text-sm font-semibold">
                        Access and manage links shared with you
                    </p>
                </div>

                {/* Links Grid */}
                <div className="space-y-4">
                    {myLinks.length > 0 ? (
                        myLinks.map((rl) => (
                            <div
                                key={rl.id}
                                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100"
                            >
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        {/* Link Type Badge */}
                                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold bg-indigo-100 text-indigo-800">
                                            <Tag className="w-4 h-4 mr-1.5" />
                                            {rl.sharedLink.linkType}
                                        </span>

                                        {/* Delete Button */}
                                        <button
                                            onClick={() => handleDelete(rl.id)}
                                            disabled={deleting === rl.id}
                                            className="px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-bold flex items-center gap-1.5 disabled:opacity-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            {deleting === rl.id ? "..." : "Delete"}
                                        </button>
                                    </div>

                                    {/* URLs with Open Buttons */}
                                    <div className="mb-4 space-y-3">
                                        {rl.sharedLink.allUrls.map((u, idx) => (
                                            <div key={idx} className="flex items-center justify-between group">
                                                <div className="flex items-center flex-1 min-w-0">
                                                    <ExternalLink className="w-6 h-6 text-indigo-600 mr-2.5 font-bold text-lg flex-shrink-0" />
                                                    <span className="text-indigo-600 group-hover:text-indigo-800 text-md font-bold truncate">
                                                        {u.url}
                                                    </span>
                                                </div>
                                                <a
                                                    href={
                                                        u.id
                                                            ? `${API_URL}/api/links/open/${u.id}`
                                                            : `${API_URL}/api/links/open/${rl.id}`
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold flex items-center gap-2 ml-4 flex-shrink-0"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                    Open
                                                </a>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Metadata */}
                                    <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-100">
                                        {/* Country - in uppercase */}
                                        <div className="flex items-center text-sm bg-blue-50 px-3 py-2 rounded-lg">
                                            <Globe className="w-4 h-4 text-blue-600 mr-2" />
                                            <span className="text-blue-800 text-sm font-bold">
                                                {rl.sharedLink.country.toUpperCase()}
                                            </span>
                                        </div>

                                        {/* Received */}
                                        <div className="flex items-center text-sm bg-green-50 px-3 py-2 rounded-lg">
                                            <Calendar className="w-4 h-4 text-green-600 mr-2" />
                                            <span className="text-green-600 text-sm font-bold">
                                                {new Date(rl.receivedDate).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {/* Status */}
                                        <div className={`flex items-center text-sm px-3 py-2 rounded-lg ${rl.isOpen ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                                            {rl.isOpen ? (
                                                <CheckCircle className="w-4 h-4 text-emerald-600 mr-2" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-amber-600 mr-2" />
                                            )}
                                            <span className={`text-sm font-bold ${rl.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                                                {rl.isOpen
                                                    ? `Opened ${new Date(rl.openedAt).toLocaleDateString()}`
                                                    : 'Not opened'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Accent */}
                                <div className="h-0.5 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm p-8 text-center max-w-md mx-auto">
                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ExternalLink className="w-8 h-8 text-indigo-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                No Shared Links Yet
                            </h3>
                            <p className="text-gray-600 text-sm font-semibold mb-4">
                                Links shared with you will appear here
                            </p>
                            <button
                                onClick={fetchLinks}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold"
                            >
                                Refresh
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyLinks;