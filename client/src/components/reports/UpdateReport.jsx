//src/components/reports/UpdateReport.jsx

import React, { useEffect, useState } from "react";

const UpdateReport = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [loading, setLoading] = useState(false);

  const [teams, setTeams] = useState([]);

  const [selectedTeam, setSelectedTeam] = useState("");

  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const [year, setYear] = useState(new Date().getFullYear());

  const [reportRows, setReportRows] = useState([]);

  const [lastUpdated, setLastUpdated] = useState("");

  // ======================================================
  // FETCH TEAMS
  // ======================================================

  const fetchTeams = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/team-reports/teams`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await res.json();

      setTeams(data.teams || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  // ======================================================
  // HANDLE TEAM CHANGE
  // ======================================================

  const handleTeamChange = async (teamId) => {
    setSelectedTeam(teamId);

    const selected = teams.find((team) => team.id === Number(teamId));

    if (!selected) return;

    const rows = [];

    // ============================================
    // TEAM LEADER
    // ============================================

    if (selected.leader) {
      rows.push({
        employeeId: selected.leader.employeeId,

        fullName: `${selected.leader.fullName} (TL)`,

        deal: "",
        invoicePending: "",
        invoiceCancel: "",
        activeClients: "",
        leaveOutClients: "",
        noResponse: "",
        totalLeads: "",
        dealValue: "",
      });
    }

    // ============================================
    // TEAM MEMBERS
    // ============================================

    selected.members.forEach((member) => {
      rows.push({
        employeeId: member.employee.employeeId,

        fullName: member.employee.fullName,

        deal: "",
        invoicePending: "",
        invoiceCancel: "",
        activeClients: "",
        leaveOutClients: "",
        noResponse: "",
        totalLeads: "",
        dealValue: "",
      });
    });

    // ============================================
    // FETCH EXISTING REPORTS
    // ============================================

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/team-reports/reports?teamId=${teamId}&month=${month}&year=${year}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const data = await res.json();

      const existingReports = data.reports || [];

      // ============================================
      // MERGE EXISTING DATA
      // ============================================

      const mergedRows = rows.map((row) => {
        const existing = existingReports.find(
          (report) => report.employeeId === row.employeeId,
        );

        if (!existing) return row;

        return {
          ...row,

          deal: existing.deal || "",

          invoicePending: existing.invoicePending || "",

          invoiceCancel: existing.invoiceCancel || "",

          activeClients: existing.activeClients || "",

          leaveOutClients: existing.leaveOutClients || "",

          noResponse: existing.noResponse || "",

          totalLeads: existing.totalLeads || "",

          dealValue: existing.dealValue || "",
        };
      });

      setReportRows(mergedRows);

      // ============================================
      // LAST UPDATED
      // ============================================

      if (existingReports.length > 0) {
        setLastUpdated(new Date(existingReports[0].updatedAt).toLocaleString());
      } else {
        setLastUpdated("");
      }
    } catch (err) {
      console.error(err);

      setReportRows(rows);
    }
  };

  // ======================================================
  // REFETCH ON MONTH/YEAR CHANGE
  // ======================================================

  useEffect(() => {
    if (selectedTeam) {
      handleTeamChange(selectedTeam);
    }
  }, [month, year]);

  // ======================================================
  // HANDLE INPUT CHANGE
  // ======================================================

  const handleInputChange = (index, field, value) => {
    const updatedRows = [...reportRows];

    updatedRows[index][field] = value;

    setReportRows(updatedRows);
  };

  // ======================================================
  // SAVE REPORTS
  // ======================================================

  const handleSaveReports = async () => {
    try {
      setLoading(true);

      const payload = {
        teamId: selectedTeam,
        month,
        year,
        reports: reportRows,
      };

      const res = await fetch(
        `${API_BASE_URL}/api/team-reports/create-report`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },

          body: JSON.stringify(payload),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save reports");
      }

      setLastUpdated(new Date().toLocaleString());

      alert("Reports updated successfully");

      // REFRESH DATA

      handleTeamChange(selectedTeam);
    } catch (err) {
      console.error(err);

      alert(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen px-8 py-6">
      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <div className="border-b border-gray-200 pb-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Update Reports
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Update monthly team reports
          </p>
        </div>

        {/* LAST UPDATED TAG */}

        {lastUpdated && (
          <div className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 px-4 py-2 rounded-full text-sm text-gray-700">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Last Updated At:
            <span className="font-medium text-black">{lastUpdated}</span>
          </div>
        )}
      </div>

      {/* ====================================================== */}
      {/* FILTERS */}
      {/* ====================================================== */}

      <div className="flex flex-wrap items-end gap-5 mt-8">
        {/* TEAM */}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Team
          </label>

          <select
            value={selectedTeam}
            onChange={(e) => handleTeamChange(e.target.value)}
            className="min-w-[240px] border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-black"
          >
            <option value="">Select Team</option>

            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        {/* MONTH */}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Month
          </label>

          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-black"
          >
            <option value={1}>January</option>

            <option value={2}>February</option>

            <option value={3}>March</option>

            <option value={4}>April</option>

            <option value={5}>May</option>

            <option value={6}>June</option>

            <option value={7}>July</option>

            <option value={8}>August</option>

            <option value={9}>September</option>

            <option value={10}>October</option>

            <option value={11}>November</option>

            <option value={12}>December</option>
          </select>
        </div>

        {/* YEAR */}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Year
          </label>

          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-[120px] border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-black"
          />
        </div>

        {/* SAVE BUTTON */}

        {reportRows.length > 0 && (
          <button
            onClick={handleSaveReports}
            disabled={loading}
            className="bg-black text-white px-6 py-3 rounded-xl text-sm font-medium hover:opacity-90 transition-all"
          >
            {loading ? "Saving..." : "Save Reports"}
          </button>
        )}
      </div>

      {/* ====================================================== */}
      {/* TABLE */}
      {/* ====================================================== */}

      {reportRows.length > 0 ? (
        <div className="mt-8 overflow-x-auto border border-gray-200 rounded-2xl">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f8f8f8] border-b border-gray-200">
                <th className="py-5 px-4 text-left text-sm font-semibold text-gray-700">
                  Employee
                </th>

                <th className="py-5 px-4 text-center text-sm font-semibold text-gray-700">
                  Deals
                </th>

                <th className="py-5 px-4 text-center text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Invoice Pending
                </th>

                <th className="py-5 px-4 text-center text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Invoice Cancel
                </th>

                <th className="py-5 px-4 text-center text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Active Clients
                </th>

                <th className="py-5 px-4 text-center text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Leave Out
                </th>

                <th className="py-5 px-4 text-center text-sm font-semibold text-gray-700 whitespace-nowrap">
                  No Response
                </th>

                <th className="py-5 px-4 text-center text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Total Leads
                </th>

                <th className="py-5 px-4 text-center text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Deal Value
                </th>
              </tr>
            </thead>

            <tbody>
              {reportRows.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  {/* EMPLOYEE */}

                  <td className="py-4 px-4 font-medium text-gray-800 whitespace-nowrap">
                    {row.fullName}
                  </td>

                  {[
                    "deal",
                    "invoicePending",
                    "invoiceCancel",
                    "activeClients",
                    "leaveOutClients",
                    "noResponse",
                    "totalLeads",
                    "dealValue",
                  ].map((field) => (
                    <td key={field} className="px-3 py-3">
                      <input
                        type="number"
                        value={row[field]}
                        onChange={(e) =>
                          handleInputChange(index, field, e.target.value)
                        }
                        className="w-full min-w-[90px] border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-black"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-24 text-center">
          <h3 className="text-xl font-medium text-gray-700">
            No Team Selected
          </h3>

          <p className="text-gray-500 mt-2">Select a team to update reports</p>
        </div>
      )}
    </div>
  );
};

export default UpdateReport;
