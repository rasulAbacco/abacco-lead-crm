// EmployeeDetails.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const EmployeeDetails = () => {
    const { state } = useLocation();
    const navigate = useNavigate();

    if (!state?.employee) {
        return <p className="p-6">No employee data found.</p>;
    }

    const { employee } = state;

    return (
        <div className="p-6 space-y-4">
            <button
                onClick={() => navigate(-1)}
                className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
            >
                ← Back
            </button>

            <h1 className="text-2xl font-bold">{employee.name}'s Leads (Last 24 Hours)</h1>
            <p className="text-gray-600">
                Total Leads Today: <span className="font-semibold">{employee.dailyLeads}</span>
            </p>

            <div className="bg-white shadow rounded-xl p-4">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-100 text-left">
                            <th className="p-2 border">Lead ID</th>
                            <th className="p-2 border">Title</th>
                            <th className="p-2 border">Description</th>
                            <th className="p-2 border">Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employee.leads.map((lead) => (
                            <tr key={lead.id} className="hover:bg-gray-50">
                                <td className="p-2 border">{lead.id}</td>
                                <td className="p-2 border">{lead.subjectLine}</td>
                                <td className="p-2 border">{lead.leadType}</td>
                                <td className="p-2 border">{lead.time}</td>
                                <td className="p-2 border text-center">
                                    <button
                                        onClick={() => navigate(`/lead/${lead.id}`, { state: { lead } })}
                                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>

                </table>
            </div>
        </div>
    );
};

export default EmployeeDetails;
