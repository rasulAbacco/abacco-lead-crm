import React, { useEffect, useState } from "react";
import axios from "axios";
import { ExternalLink, Trash2, Calendar, Globe, Tag } from "lucide-react";

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
            setMyLinks(data);
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
            setMyLinks(myLinks.filter(link => link.id !== linkId));
        } catch (err) {
            console.error("Error deleting link:", err);
            alert("Failed to delete link. Please try again.");
        } finally {
            setDeleting(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="animate-pulse space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-40 bg-white/50 rounded-2xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-2">
                        My Shared Links
                    </h1>
                    <p className="text-gray-600">Access and manage links shared with you</p>
                </div>

                {/* Links Grid */}
                <div className="space-y-4">
                    {Array.isArray(myLinks) && myLinks.length > 0 ? (
                        myLinks.map((rl) => (
                            <div
                                key={rl.id}
                                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden"
                            >
                                <div className="p-6">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        {/* Left Content */}
                                        <div className="flex-1 space-y-3">
                                            {/* Link */}
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1 p-2 bg-indigo-50 rounded-lg">
                                                    <ExternalLink className="w-5 h-5 text-indigo-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-medium text-gray-500 mb-1">
                                                        Shared Link
                                                    </p>
                                                    <a
                                                        href={`${API_URL}/api/links/open/${rl.id}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-indigo-600 hover:text-indigo-700 font-medium break-all inline-flex items-center gap-2 group/link"
                                                    >
                                                        <span className="underline decoration-2 underline-offset-4">
                                                            {rl.sharedLink.link}
                                                        </span>
                                                        <ExternalLink className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                                                    </a>

                                                </div>
                                            </div>

                                            {/* Metadata Row */}
                                            <div className="flex flex-wrap gap-4">
                                                {/* Link Type */}
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-purple-50 rounded-lg">
                                                        <Tag className="w-4 h-4 text-purple-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Type</p>
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {rl.sharedLink.linkType}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Country */}
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-blue-50 rounded-lg">
                                                        <Globe className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Country</p>
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {rl.sharedLink.country}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Received Date */}
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-green-50 rounded-lg">
                                                        <Calendar className="w-4 h-4 text-green-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Received</p>
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {new Date(rl.receivedDate).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 p-3 bg-white rounded-lg  transition-all duration-200 hover:shadow-md">
                                                    {/* Icon Container */}
                                                    <div className={`p-2 rounded-lg ${rl.isOpen ? 'bg-gradient-to-br from-emerald-50 to-teal-50' : 'bg-gradient-to-br from-red-50 to-orange-50'} border ${rl.isOpen ? 'border-emerald-200' : 'border-red-200'} transition-all duration-300`}>
                                                        <Tag className={`w-3 h-3 ${rl.isOpen ? 'text-emerald-600' : 'text-red-500'} transition-colors duration-300`} />
                                                    </div>

                                                    {/* Text Content */}
                                                    <div className="space-y-0.5">
                                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</p>
                                                        <p className={`text-sm font-medium ${rl.isOpen ? 'text-emerald-700' : 'text-red-600'}`}>
                                                            {rl.isOpen ? (
                                                                <span className="flex items-center gap-1">
                                                                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                    </svg>
                                                                    Opened {new Date(rl.openedAt).toLocaleDateString()}
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-1">
                                                                    <svg className="w-3.5 h-3.5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                                    </svg>
                                                                    Not opened yet
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                            </div>
                                        </div>

                                        {/* Right Actions */}
                                        <div className="flex lg:flex-col gap-3">
                                            <a
                                                href={`${API_URL}/api/links/open/${rl.id}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex-1 lg:flex-none px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 font-medium text-center shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                Open Link
                                            </a>

                                            <button
                                                onClick={() => handleDelete(rl.id)}
                                                disabled={deleting === rl.id}
                                                className="flex-1 lg:flex-none px-6 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all duration-300 font-medium text-center flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                {deleting === rl.id ? "Deleting..." : "Delete"}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Gradient Border Effect */}
                                <div className="h-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600"></div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ExternalLink className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                No Links Yet
                            </h3>
                            <p className="text-gray-600">
                                Links shared with you will appear here
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyLinks;