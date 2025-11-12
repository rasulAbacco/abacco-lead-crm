import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Bell, ExternalLink, CheckCircle, Trash2, BellRing, Sparkles } from "lucide-react";
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
            console.log("Fetched notifications:", data);

            setNotifications(sorted.filter((n) => !n.isRead).slice(0, 8));
            setUnseenCount(unseen);
        } catch (err) {
            console.error("Error fetching notifications:", err);
        }
    };

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

    const clearAllNotifications = () => {
        setNotifications([]);
        setUnseenCount(0);
    };

    return (
        <div className="relative mr-7" ref={dropdownRef}>
            {/* 🔔 Modern Bell Button with Wave Animation */}
            <motion.button
                onClick={() => setShowNotifications((prev) => !prev)}
                className="relative p-4 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 group overflow-visible"
                whileHover={{ scale: 1.05, rotate: [0, -10, 10, -10, 0] }}
                whileTap={{ scale: 0.95 }}
            >
                {/* Wave style animations - multiple layers */}
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

            {/* 🪄 Modern Dropdown Panel */}
            <AnimatePresence>
                {showNotifications && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="absolute right-0 top-16 w-[420px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden"
                    >
                        {/* Gradient header with glassmorphism */}
                        <div className="relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-90" />
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0"
                                animate={{ opacity: [0, 0.3, 0] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            />

                            <div className="relative flex justify-between items-center p-5">
                                <div className="flex items-center gap-3">
                                    <motion.div
                                        animate={{ rotate: [0, 10, -10, 0] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <BellRing className="w-6 h-6 text-white" />
                                    </motion.div>
                                    <div>
                                        <h3 className="font-bold text-white text-xl">Notifications</h3>
                                        <p className="text-xs text-white/80">{unseenCount} unread</p>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowNotifications(false)}
                                    className="text-white/80 hover:text-white bg-white/10 backdrop-blur-sm rounded-xl p-2 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </motion.button>
                            </div>
                        </div>

                        {/* Scrollable notifications with custom scrollbar */}
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            <style>{`
                                .custom-scrollbar::-webkit-scrollbar {
                                    width: 6px;
                                }
                                .custom-scrollbar::-webkit-scrollbar-track {
                                    background: transparent;
                                }
                                .custom-scrollbar::-webkit-scrollbar-thumb {
                                    background: linear-gradient(to bottom, #8b5cf6, #ec4899);
                                    border-radius: 10px;
                                }
                            `}</style>

                            {notifications.length > 0 ? (
                                <div className="p-3 space-y-2">
                                    {notifications.map((note, index) => (
                                        <motion.div
                                            key={note.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="group relative"
                                        >
                                            {/* Card with gradient border */}
                                            <div className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${!note.isSeen
                                                    ? "bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20"
                                                    : "bg-white dark:bg-slate-800/50"
                                                } hover:shadow-lg`}>
                                                {/* Gradient border effect */}
                                                {!note.isSeen && (
                                                    <div className="absolute inset-0 bg-gradient-to-r opacity-20 rounded-2xl" />
                                                )}

                                                <div className="relative p-2 flex items-start gap-3">
                                                    {/* Icon with animated gradient - ROUND */}
                                                    <motion.div
                                                        className="relative shrink-0"
                                                        whileHover={{ scale: 1.1, rotate: 360 }}
                                                        transition={{ duration: 0.5 }}
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full blur-sm opacity-50" />
                                                        <div className="relative p-2.5 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full shadow-lg">
                                                            <ExternalLink className="w-5 h-5 text-white" />
                                                        </div>
                                                    </motion.div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-slate-700 dark:text-slate-200 font-medium mb-1">
                                                            New Link Shared
                                                        </p>
                                                        <a
                                                            href={note.sharedLink.link}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 font-medium transition-all block truncate"
                                                        >
                                                            {note.sharedLink.link.slice(0, 45)}...
                                                        </a>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                {formatDistanceToNow(new Date(note.receivedDate), {
                                                                    addSuffix: true,
                                                                })}
                                                            </span>
                                                            {!note.isSeen && (
                                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 dark:text-purple-400">
                                                                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                                                                    New
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Action buttons - ROUND */}
                                                    <div className="flex flex-col gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {!note.isSeen && (
                                                            <motion.button
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={() => markSingleAsRead(note.id)}
                                                                className="p-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-full hover:shadow-lg transition-all"
                                                                title="Mark as read"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                            </motion.button>
                                                        )}
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => clearSingleNotification(note.id)}
                                                            className="p-2 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-full hover:shadow-lg transition-all"
                                                            title="Clear"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </motion.button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-12 text-center"
                                >
                                    <motion.div
                                        animate={{ y: [0, -10, 0] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="mx-auto w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-3xl flex items-center justify-center mb-4 shadow-lg"
                                    >
                                        <Bell className="w-10 h-10 text-indigo-400" />
                                    </motion.div>
                                    <p className="text-slate-600 dark:text-slate-400 font-medium">All caught up!</p>
                                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">No new notifications</p>
                                </motion.div>
                            )}
                        </div>

                        {/* Modern Footer */}
                        {notifications.length > 0 && (
                            <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 backdrop-blur-sm p-3 flex gap-2">
                                {/* <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={markAllAsRead}
                                    className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Mark all read
                                </motion.button> */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={clearAllNotifications}
                                    className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 text-white px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
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