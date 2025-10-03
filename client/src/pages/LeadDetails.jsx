// LeadDetails.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const LeadDetails = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state?.lead) {
    return <p className="p-6">No lead data found.</p>;
  }

  const { lead } = state;

  return (
    <div className="p-6 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
      >
        ← Back
      </button>

      <div className="bg-white p-6 shadow rounded-xl">
        <h2 className="text-2xl font-bold mb-4">Lead Management System</h2>
        <p className="text-sm text-gray-600 mb-6">
          Employee ID: <span className="font-semibold">{lead.agentName}</span> | Date:{" "}
          {lead.contactDate} | Lead ID: {lead.id}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-semibold">Agent Name:</label>
            <p>{lead.agentName}</p>
          </div>
          <div>
            <label className="font-semibold">Lead Type:</label>
            <p>{lead.leadType}</p>
          </div>
          <div>
            <label className="font-semibold">Client Email:</label>
            <p>{lead.clientEmail}</p>
          </div>
          <div>
            <label className="font-semibold">Lead Email:</label>
            <p>{lead.leadEmail}</p>
          </div>
          <div>
            <label className="font-semibold">CC Email:</label>
            <p>{lead.ccEmail}</p>
          </div>
          <div>
            <label className="font-semibold">Phone:</label>
            <p>{lead.phone}</p>
          </div>
          <div>
            <label className="font-semibold">Website:</label>
            <p>{lead.website}</p>
          </div>
          <div>
            <label className="font-semibold">Country:</label>
            <p>{lead.country}</p>
          </div>
          <div>
            <label className="font-semibold">Subject Line:</label>
            <p>{lead.subjectLine}</p>
          </div>
          <div className="col-span-2">
            <label className="font-semibold">Email Pitch:</label>
            <p className="bg-gray-50 p-3 rounded">{lead.emailPitch}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetails;
