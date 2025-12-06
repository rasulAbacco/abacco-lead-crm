import { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
    Bell,
    ExternalLink,
    Trash2,
    BellRing,
    Sparkles,
    Check,
    Clock,
    CheckCircle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unseenCount, setUnseenCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const dropdownRef = useRef(null);

    // ✅ Fetch notifications
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // ✅ Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_URL}/api/links/my`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = Array.isArray(res.data) ? res.data : [];
            const sorted = data.sort((a, b) => new Date(b.receivedDate) - new Date(a.receivedDate));
            const unseen = data.filter((n) => !n.isSeen).length;

            // Filter to show only unread/unseen items based on your logic
            setNotifications(sorted.filter((n) => !n.isRead).slice(0, 8));
            setUnseenCount(unseen);
        } catch (err) {
            console.error("Error fetching notifications:", err);
        }
    };

    // ✅ FUNCTION: Mark all as read (Hits API + Clears list)
    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(`${API_URL}/api/links/mark-seen`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setNotifications([]);
            setUnseenCount(0);
        } catch (err) {
            console.error("Error marking all read:", err);
        }
    };

    const markSingleAsRead = async (id) => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(`${API_URL}/api/links/mark-read/${id}`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setNotifications((prev) => prev.filter((n) => n.id !== id));
            setUnseenCount((prev) => Math.max(prev - 1, 0));
        } catch (err) {
            console.error("Error marking single read:", err);
        }
    };

    const clearSingleNotification = (id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setUnseenCount((prev) => Math.max(prev - 1, 0));
    };

    // ✅ FUNCTION: Clear all (Local clear)
    const clearAllNotifications = () => {
        setNotifications([]);
        setUnseenCount(0);
    };

    return (
        <div className="relative mr-7" ref={dropdownRef}>

            {/* ==================================================================================
                👇 SECTION 1: YOUR ORIGINAL BUTTON (UNCHANGED) 
               ================================================================================== */}
            <motion.button
                onClick={() => setShowNotifications((prev) => !prev)}
                className="relative p-4 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 group overflow-visible"
                whileHover={{ scale: 1.05, rotate: [0, -10, 10, -10, 0] }}
                whileTap={{ scale: 0.95 }}
            >
                {/* Wave style animations */}
                {unseenCount > 0 && (
                    <>
                        <motion.div
                            className="absolute inset-0 rounded-full"
                            animate={{
                                boxShadow: [
                                    "0 0 0 0 rgba(236, 72, 153, 0.6)",
                                    "0 0 0 15px rgba(236, 72, 153, 0.4)",
                                    "0 0 0 30px rgba(236, 72, 153, 0)"
                                ]
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                        />
                        <motion.div
                            className="absolute inset-0 rounded-full"
                            animate={{
                                boxShadow: [
                                    "0 0 0 0 rgba(147, 51, 234, 0.5)",
                                    "0 0 0 20px rgba(147, 51, 234, 0.3)",
                                    "0 0 0 40px rgba(147, 51, 234, 0)"
                                ]
                            }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
                        />
                        <motion.div
                            className="absolute inset-0 rounded-full"
                            animate={{
                                boxShadow: [
                                    "0 0 0 0 rgba(59, 130, 246, 0.4)",
                                    "0 0 0 25px rgba(59, 130, 246, 0.2)",
                                    "0 0 0 50px rgba(59, 130, 246, 0)"
                                ]
                            }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeOut", delay: 0.8 }}
                        />
                    </>
                )}

                {/* Animated gradient background */}
                <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                />

                <motion.div
                    animate={unseenCount > 0 ? { rotate: [0, 14, -8, 14, -4, 10, 0] } : {}}
                    transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2 }}
                >
                    <Bell className="w-6 h-6 text-white relative z-10 drop-shadow-lg" />
                </motion.div>

                {/* Badge with sparkle effect */}
                {unseenCount > 0 && (
                    <motion.div
                        className="absolute -top-1 -right-1 z-20"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    >
                        <div className="relative">
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-md"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                            <div className="relative bg-gradient-to-r from-red-500 via-pink-500 to-orange-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                                {unseenCount > 9 ? "9+" : unseenCount}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Sparkle effect */}
                <motion.div
                    className="absolute top-0.5 right-0.5 text-yellow-300 opacity-0 group-hover:opacity-100 z-10"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                    <Sparkles className="w-3 h-3" />
                </motion.div>
            </motion.button>

            {/* ==================================================================================
                👇 SECTION 2: THE REDESIGNED PANEL (WHITE BG + WORKING ACTIONS)
               ================================================================================== */}
            <AnimatePresence>
                {showNotifications && (
                    <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        className="absolute right-0 top-20 w-[420px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden origin-top-right ring-1 ring-black/5"
                    >
                        {/* --- Header --- */}
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-2.5">
                                <h3 className="font-bold text-gray-800 text-lg">Inbox</h3>
                                {unseenCount > 0 && (
                                    <span className="bg-indigo-50 text-indigo-600 text-xs px-2.5 py-0.5 rounded-full font-bold">
                                        {unseenCount}
                                    </span>
                                )}
                            </div>

                            {/* Short Clear All (Optional, can rely on footer) */}
                            {notifications.length > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs font-medium text-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-1"
                                >
                                    <CheckCircle className="w-3.5 h-3.5" /> Mark all read
                                </button>
                            )}
                        </div>

                        {/* --- Notification List --- */}
                        <div className="max-h-[380px] overflow-y-auto custom-scrollbar bg-white">
                            <style>{`
                                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
                            `}</style>

                            {notifications.length > 0 ? (
                                <div className="divide-y divide-gray-50">
                                    {notifications.map((note, index) => (
                                        <motion.div
                                            key={note.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className={`group relative p-4 flex gap-4 transition-all duration-200 hover:bg-gray-50 bg-white`}
                                        >
                                            {/* Unread Indicator Bar */}
                                            {!note.isSeen && (
                                                <div className="absolute left-0 top-4 bottom-4 w-1 bg-indigo-500 rounded-r-full" />
                                            )}

                                            {/* Icon Container */}
                                            <div className="shrink-0 pt-1">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm transition-colors ${!note.isSeen
                                                        ? "bg-indigo-50 border-indigo-100 text-indigo-600"
                                                        : "bg-gray-50 border-gray-100 text-gray-400"
                                                    }`}>
                                                    <ExternalLink className="w-5 h-5" />
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0 pr-8">
                                                <div className="flex justify-between items-baseline mb-0.5">
                                                    <p className={`text-sm ${!note.isSeen ? "font-bold text-gray-900" : "font-medium text-gray-600"}`}>
                                                        New Link Shared
                                                    </p>
                                                    <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDistanceToNow(new Date(note.receivedDate), { addSuffix: false })} ago
                                                    </span>
                                                </div>

                                                <a
                                                    href={note.sharedLink.link}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline block truncate"
                                                >
                                                    {note.sharedLink.link}
                                                </a>
                                            </div>

                                            {/* Floating Actions (Visible on Hover) */}
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all bg-white p-1 rounded-lg shadow-sm border border-gray-100">
                                                {!note.isSeen && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); markSingleAsRead(note.id); }}
                                                        className="p-1.5 hover:bg-emerald-50 text-emerald-500 rounded-md transition-colors"
                                                        title="Mark as read"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); clearSingleNotification(note.id); }}
                                                    className="p-1.5 hover:bg-red-50 text-red-500 rounded-md transition-colors"
                                                    title="Remove"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                        <BellRing className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <h4 className="text-gray-900 font-medium">No notifications</h4>
                                    <p className="text-sm text-gray-400 mt-1">
                                        We'll let you know when something arrives.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* --- Footer with WORKING Actions --- */}
                        {notifications.length > 0 && (
                            <div className="p-3 bg-white border-t border-gray-100 grid grid-cols-2 gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={markAllAsRead}
                                    className="flex items-center justify-center gap-2 text-xs font-semibold bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 py-2.5 rounded-xl transition-colors border border-gray-100"
                                >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Mark all read
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={clearAllNotifications}
                                    className="flex items-center justify-center gap-2 text-xs font-semibold bg-gray-50 hover:bg-red-50 text-gray-700 hover:text-red-600 py-2.5 rounded-xl transition-colors border border-gray-100"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Clear all
                                </motion.button>
                                
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;