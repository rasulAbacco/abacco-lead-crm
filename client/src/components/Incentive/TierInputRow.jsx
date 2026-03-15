// src/components/Incentive/TierInputRow.jsx
import { Trash2 } from "lucide-react";

export default function TierInputRow({ index, label = "", amount = 0, onChange, onRemove }) {
    return (
        <div className="flex gap-3 items-center bg-white p-3 rounded-lg shadow-sm border border-gray-100">
            <label className="flex-1">
                <input
                    className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 transition-shadow"
                    placeholder="Tier label (e.g., Gold, 50+ sales)"
                    value={label}
                    onChange={(e) => onChange(index, "label", e.target.value)}
                />
            </label>
            <label className="w-32">
                <input
                    type="number"
                    className="w-full border border-gray-300 p-2 rounded-lg text-sm text-right focus:border-blue-500 focus:ring-blue-500 transition-shadow"
                    placeholder="Amount (₹)"
                    value={amount}
                    onChange={(e) => onChange(index, "amount", Number(e.target.value))}
                />
            </label>
            <button 
                className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 transition duration-150 flex-shrink-0" 
                onClick={() => onRemove(index)}
                title="Remove Tier"
            >
                <Trash2 size={20} />
            </button>
        </div>
    );
}