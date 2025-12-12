// src/components/Incentive/DeleteModal.jsx
import axios from "axios";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";

export default function DeleteModal({ id, onClose, onDeleted }) {
    const API_BASE = import.meta.env.VITE_API_BASE_URL;
    const [isDeleting, setIsDeleting] = useState(false);

    const confirmDelete = async () => {
        setIsDeleting(true);
        const token = localStorage.getItem("token");

        try {
            await axios.delete(`${API_BASE}/api/incentives/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            onDeleted();
            onClose();
        } catch (error) {
            console.error("Error deleting incentive:", error);
            alert("Failed to delete incentive. Check console for details.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 transition-opacity duration-300">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm relative animate-in zoom-in-95 duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 p-2 rounded-full transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="flex flex-col items-center text-center">
                    <AlertTriangle size={40} className="text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold mb-2 text-gray-900">Confirm Deletion</h2>
                    <p className="text-gray-600 mb-6">
                        Are you sure you want to delete this incentive plan? This action cannot be undone and will permanently remove the record.
                    </p>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition font-medium"
                        disabled={isDeleting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={confirmDelete}
                        disabled={isDeleting}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md ${isDeleting
                                ? 'bg-red-400 text-white cursor-not-allowed'
                                : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" /> Deleting...
                            </>
                        ) : (
                            'Delete'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}