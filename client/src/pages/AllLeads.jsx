import React, { useEffect, useState } from "react";
import axios from "axios";
import AllLeadsSummary from "../components/AllLeadsSummary";
import AllLeadsTable from "../components/AllLeadsTable";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AllLeadsPage = () => {
  const [leadStatuses, setLeadStatuses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLeadStatuses();
  }, []);

  const fetchLeadStatuses = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No token found. Please login again.");
        return;
      }

      const res = await axios.get(`${API_BASE_URL}/api/admin/lead-status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setLeadStatuses(res.data);
    } catch (error) {
      console.error(
        "Failed to fetch lead statuses:",
        error.response?.data || error.message,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <AllLeadsSummary />
      <AllLeadsTable leadStatuses={leadStatuses} loading={loading} />
    </div>
  );
};

export default AllLeadsPage;
