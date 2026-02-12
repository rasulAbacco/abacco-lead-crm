import React, { useEffect, useState } from "react";
import axios from "axios";
import { UserPlus, X, ChevronDown, CheckCircle2 } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AssignSalesModal({ open, lead, onClose, onSuccess }) {
  const [salesEmployees, setSalesEmployees] = useState([]);
  const [selectedSalesId, setSelectedSalesId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    const token = localStorage.getItem("token");
    axios
      .get(`${API_BASE_URL}/api/admin/sales-employees`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setSalesEmployees(res.data))
      .catch((err) => console.error(err));
  }, [open]);

  const handleAssign = async () => {
    setIsSubmitting(true);
    const token = localStorage.getItem("token");

    try {
      await axios.put(
        `${API_BASE_URL}/api/admin/leads/${lead.id}/assign-sales`,
        { salesEmployeeId: selectedSalesId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Assignment failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Background Overlay - Glassmorphism */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-10 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl border border-white/20 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                Assign Sales
              </h2>
              <p className="text-sm font-medium text-slate-500">
                Select a team member for this lead
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="px-8 py-6">
          <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
            Sales Personnel
          </label>
          <div className="relative group">
            <select
              className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-700 font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all cursor-pointer"
              value={selectedSalesId}
              onChange={(e) => setSelectedSalesId(e.target.value)}
            >
              <option value="" disabled>
                Choose an employee...
              </option>
              {salesEmployees.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} — {s.email.split("@")[0]}
                </option>
              ))}
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
              <ChevronDown className="w-5 h-5" />
            </div>
          </div>

          {/* Lead Context Snippet */}
          <div className="mt-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter mb-1">
              Target Lead
            </p>
            <p className="text-sm font-bold text-slate-700 truncate">
              {lead?.clientEmail || lead?.name || "Selected Lead"}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 pb-8 pt-2 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedSalesId || isSubmitting}
            className="flex-[1.5] bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Assign Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
