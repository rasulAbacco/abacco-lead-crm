import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AssignSalesModal({ open, lead, onClose, onSuccess }) {
  const [salesEmployees, setSalesEmployees] = useState([]);
  const [selectedSalesId, setSelectedSalesId] = useState("");

  useEffect(() => {
    if (!open) return;

    const token = localStorage.getItem("token");

    axios
      .get(`${API_BASE_URL}/api/admin/sales-employees`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => setSalesEmployees(res.data))
      .catch((err) => console.error(err));
  }, [open]);

  const handleAssign = async () => {
    const token = localStorage.getItem("token");

    await axios.put(
      `${API_BASE_URL}/api/admin/leads/${lead.id}/assign-sales`,
      { salesEmployeeId: selectedSalesId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    onSuccess();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[400px]">
        <h2 className="text-lg font-bold mb-4">Assign Sales Employee</h2>

        <select
          className="w-full border p-2 rounded mb-4"
          value={selectedSalesId}
          onChange={(e) => setSelectedSalesId(e.target.value)}
        >
          <option value="">Select Sales Employee</option>
          {salesEmployees.map((s) => (
            <option key={s.id} value={s.id}>
              {s.fullName} ({s.email})
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded">
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedSalesId}
            className="px-4 py-2 bg-indigo-600 text-white rounded"
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}
