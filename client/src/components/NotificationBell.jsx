import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Bell, ExternalLink, CheckCircle, Trash2 } from "lucide-react";
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

            // ✅ Clear all from dropdown (UI only)
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

            // ✅ Remove that notification from UI list
            setNotifications((prev) => prev.filter((n) => n.id !== id));

            // ✅ Update unseen count
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
        <div className="relative" ref={dropdownRef}>
            {/* 🔔 Bell button */}
            <motion.button
                onClick={() => setShowNotifications((prev) => !prev)}
                animate={
                    unseenCount > 0
                        ? { rotate: [0, -55, 55, -20, 20, 0] }
                        : { rotate: 0 }
                }
                transition={
                    unseenCount > 0
                        ? { repeat: Infinity, duration: 0.5, ease: "easeInOut" }
                        : { duration: 0 }
                }
                className="relative p-3 bg-white rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
                <Bell className="w-6 h-6 text-purple-600" />
                {unseenCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {unseenCount}
                    </span>
                )}
            </motion.button>

            {/* 🪄 Dropdown */}
            <AnimatePresence>
                {showNotifications && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="absolute right-0 top-12 w-90 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-3 border-b bg-gray-50">
                            <h3 className="font-semibold text-gray-800">Notifications</h3>
                            <button
                                onClick={() => setShowNotifications(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Scrollable notifications */}
                        <div className="max-h-100 w-full overflow-y-auto divide-y divide-gray-200 bg-gray-100">
                            {notifications.length > 0 ? (
                                notifications.map((note) => (
                                    <motion.div
                                        key={note.id}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        transition={{ duration: 0.2 }}
                                        className={`p-3 flex items-start gap-3 hover:bg-gray-50 transition-all ${!note.isSeen ? "bg-purple-50/60" : ""
                                            }`}
                                    >
                                        <ExternalLink className="w-5 h-5 text-purple-500 mt-1 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-800 font-medium">
                                                New Link:{" "}
                                                <a
                                                    href={note.sharedLink.link}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-purple-600 underline"
                                                >
                                                    {note.sharedLink.link.slice(0, 40)}...
                                                </a>
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatDistanceToNow(new Date(note.receivedDate), {
                                                    addSuffix: true,
                                                })}
                                            </p>
                                        </div>

                                        {/* Single item actions */}
                                        <div className="flex flex-col items-center gap-2 ml-2 shrink-0 mt-3">
                                            {!note.isSeen && (
                                                <button
                                                    onClick={() => markSingleAsRead(note.id)}
                                                    className="text-green-600 hover:text-green-800"
                                                    title="Mark as read"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => clearSingleNotification(note.id)}
                                                className="text-red-500 hover:text-red-700"
                                                title="Clear"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                    No notifications
                                </div>
                            )}
                        </div>

                        {/* Fixed Footer (Always visible) */}
                        {notifications.length > 0 && (
                            <div className="sticky bottom-0 bg-gray-50 border-t flex justify-between items-center p-3">
                                <button
                                    onClick={markAllAsRead}
                                    className="flex items-center gap-1 text-sm text-green-600 hover:underline"
                                >
                                    <CheckCircle className="w-4 h-4" /> Mark all read
                                </button>
                                <button
                                    onClick={clearAllNotifications}
                                    className="flex items-center gap-1 text-sm text-red-600 hover:underline"
                                >
                                    <Trash2 className="w-4 h-4" /> Clear all
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
