import React, { useEffect, useState } from "react";
import axios from "axios";
import { UserPlus, X, ChevronDown, CheckCircle2, Lock } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AssignSalesModal({
  open,
  lead,
  leadStatuses,
  onClose,
  onSuccess,
}) {
  const [salesEmployees, setSalesEmployees] = useState([]);
  const [selectedSalesId, setSelectedSalesId] = useState("");
  const [statusId, setStatusId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if sales is already assigned
  const isSalesAssigned =
    lead?.salesEmployeeId !== null && lead?.salesEmployeeId !== undefined;

  // ✅ preload selected values when modal opens
  useEffect(() => {
    if (lead) {
      setSelectedSalesId(lead.salesEmployeeId || "");
      setStatusId(lead.statusId || "");
    }
  }, [lead]);

  // ✅ fetch sales employees
  useEffect(() => {
    if (!open) return;

    const token = localStorage.getItem("token");

    axios
      .get(`${API_BASE_URL}/api/admin/sales-employees`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setSalesEmployees(res.data))
      .catch((err) => console.error("Failed to fetch sales employees", err));
  }, [open]);

  // ✅ assign handler
  const handleAssign = async () => {
    // If sales is already assigned, only allow status update
    if (isSalesAssigned && !statusId) {
      return; // Nothing to update
    }

    // If sales is not assigned, require sales selection
    if (!isSalesAssigned && !selectedSalesId) {
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem("token");

    try {
      const payload = {};

      // Only send salesEmployeeId if it's NOT already assigned
      if (!isSalesAssigned && selectedSalesId) {
        payload.salesEmployeeId = Number(selectedSalesId);
      }

      // Always allow status update
      if (statusId) {
        payload.statusId = Number(statusId);
      } else {
        payload.statusId = null;
      }

      await axios.put(
        `${API_BASE_URL}/api/admin/leads/${lead.id}/assign-sales`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Assignment failed", err.response?.data || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  // Get the assigned sales employee name for display
  const assignedSalesEmployee = salesEmployees.find(
    (s) => s.id === lead?.salesEmployeeId,
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl border overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">
                {isSalesAssigned ? "Update Lead Status" : "Assign Sales"}
              </h2>
              <p className="text-sm text-slate-500">
                {isSalesAssigned
                  ? "Change the status of this lead"
                  : "Select a team member for this lead"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-6">
          {/* Sales Dropdown - DISABLED if already assigned */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              Sales Personnel
              {isSalesAssigned && <Lock className="w-4 h-4 text-slate-400" />}
            </label>
            {isSalesAssigned ? (
              // Show locked/disabled view when sales is assigned
              <div className="w-full bg-slate-100 border border-slate-300 rounded-xl px-4 py-3 text-slate-600 cursor-not-allowed flex items-center justify-between">
                <span>
                  {assignedSalesEmployee?.fullName} —{" "}
                  {assignedSalesEmployee?.email}
                </span>
                <Lock className="w-4 h-4 text-slate-400" />
              </div>
            ) : (
              // Show editable dropdown when sales is not assigned
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                value={selectedSalesId}
                onChange={(e) => setSelectedSalesId(e.target.value)}
              >
                <option value="">Choose an employee...</option>
                {salesEmployees.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} — {s.email}
                  </option>
                ))}
              </select>
            )}
            {isSalesAssigned && (
              <p className="text-xs text-slate-500 mt-2">
                Sales personnel cannot be changed once assigned
              </p>
            )}
          </div>

          {/* Status Dropdown - ALWAYS ENABLED */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Lead Status {isSalesAssigned ? "" : "(Optional)"}
            </label>
            <select
              value={statusId}
              onChange={(e) => setStatusId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              <option value="">Select Status</option>
              {leadStatuses?.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </div>

          {/* Lead Info */}
          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <p className="text-xs text-indigo-400 uppercase font-bold mb-1">
              Target Lead
            </p>
            <p className="text-sm font-bold text-slate-700 truncate">
              {lead?.clientEmail || "Selected Lead"}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 pt-2 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleAssign}
            disabled={isSubmitting || (!isSalesAssigned && !selectedSalesId)}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                {isSalesAssigned ? "Update Status" : "Assign Now"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
