//src/components/reports/DealAnnouncement.jsx

import React, { useEffect, useState } from "react";

import { Trophy, IndianRupee } from "lucide-react";

const DealAnnouncement = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [loading, setLoading] = useState(false);

  const [teams, setTeams] = useState([]);

  const [selectedTeam, setSelectedTeam] = useState("");

  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const [year, setYear] = useState(new Date().getFullYear());

  const [rows, setRows] = useState([]);

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
  // FETCH ALL ANNOUNCEMENTS
  // ======================================================

  const fetchAllAnnouncements = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/team-reports/deal-announcements?month=${month}&year=${year}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const data = await res.json();

      const announcements = data.announcements || [];

      const formatted = announcements.map((item) => ({
        employeeId: item.employeeId,

        fullName: item.employee?.fullName || "",

        amount: item.amount || 0,

        teamName:
          teams.find(
            (team) =>
              team.leader?.employeeId === item.employeeId ||
              team.members.some(
                (m) => m.employee?.employeeId === item.employeeId,
              ),
          )?.name || "",
      }));

      setRows(formatted);

      if (announcements.length > 0) {
        setLastUpdated(new Date(announcements[0].updatedAt).toLocaleString());
      } else {
        setLastUpdated("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ======================================================
  // HANDLE TEAM CHANGE
  // ======================================================

  const handleTeamChange = async (teamId) => {
    setSelectedTeam(teamId);

    const selected = teams.find((team) => team.id === Number(teamId));

    if (!selected) return;

    const employeeRows = [];

    // ============================================
    // TEAM LEADER
    // ============================================

    if (selected.leader) {
      employeeRows.push({
        employeeId: selected.leader.employeeId,

        fullName: `${selected.leader.fullName} (TL)`,

        amount: "",

        teamName: selected.name,
      });
    }

    // ============================================
    // MEMBERS
    // ============================================

    selected.members.forEach((member) => {
      employeeRows.push({
        employeeId: member.employee.employeeId,

        fullName: member.employee.fullName,

        amount: "",

        teamName: selected.name,
      });
    });

    // ============================================
    // FETCH EXISTING DATA
    // ============================================

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/team-reports/deal-announcements?month=${month}&year=${year}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const data = await res.json();

      const announcements = data.announcements || [];

      // ============================================
      // MERGE DATA
      // ============================================

      const mergedRows = employeeRows.map((row) => {
        const existing = announcements.find(
          (item) => item.employeeId === row.employeeId,
        );

        if (!existing) return row;

        return {
          ...row,

          amount: existing.amount || "",
        };
      });

      setRows(mergedRows);

      if (announcements.length > 0) {
        setLastUpdated(new Date(announcements[0].updatedAt).toLocaleString());
      } else {
        setLastUpdated("");
      }
    } catch (err) {
      console.error(err);

      setRows(employeeRows);
    }
  };

  // ======================================================
  // REFETCH
  // ======================================================

  useEffect(() => {
    if (selectedTeam) {
      handleTeamChange(selectedTeam);
    } else if (teams.length > 0) {
      fetchAllAnnouncements();
    }
  }, [month, year, teams]);

  // ======================================================
  // HANDLE CHANGE
  // ======================================================

  const handleChange = (index, value) => {
    const updatedRows = [...rows];

    updatedRows[index].amount = value;

    setRows(updatedRows);
  };

  // ======================================================
  // SAVE
  // ======================================================

  const handleSave = async () => {
    try {
      setLoading(true);

      const payload = {
        month,
        year,
        announcements: rows,
      };

      const res = await fetch(
        `${API_BASE_URL}/api/team-reports/deal-announcements`,
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
        throw new Error(data.message || "Failed to save");
      }

      setLastUpdated(new Date().toLocaleString());

      alert("Deal announcements updated successfully");

      if (selectedTeam) {
        handleTeamChange(selectedTeam);
      } else {
        fetchAllAnnouncements();
      }
    } catch (err) {
      console.error(err);

      alert(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // TOTAL
  // ======================================================

  const totalAmount = rows.reduce(
    (acc, row) => acc + Number(row.amount || 0),
    0,
  );

  return (
    <div className="bg-white min-h-screen px-8 py-6">
      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <div className="border-b border-gray-200 pb-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Deal Amount</h1>

          <p className="text-sm text-gray-500 mt-1">
            Manage final announced deal amounts
          </p>
        </div>

        {lastUpdated && (
          <div className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 px-4 py-2 rounded-full text-sm text-gray-700">
            <span className="w-2 h-2 rounded-full bg-black"></span>
            Last Updated:
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
            onChange={(e) => {
              const value = e.target.value;

              if (!value) {
                setSelectedTeam("");

                fetchAllAnnouncements();

                return;
              }

              handleTeamChange(value);
            }}
            className="min-w-[240px] border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-black"
          >
            <option value="">All Teams</option>

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
            {[
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ].map((monthName, index) => (
              <option key={index} value={index + 1}>
                {monthName}
              </option>
            ))}
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

        {/* SAVE */}

        {selectedTeam && rows.length > 0 && (
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-black text-white px-6 py-3 rounded-xl text-sm font-medium hover:opacity-90"
          >
            {loading ? "Saving..." : "Save Amounts"}
          </button>
        )}
      </div>

      {/* ====================================================== */}
      {/* TOTAL CARD */}
      {/* ====================================================== */}

      {rows.length > 0 && (
        <div className="mt-8 border border-gray-200 rounded-3xl p-8 bg-[#fafafa]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide">
                Total Announced
              </p>

              <h2 className="text-5xl font-bold text-black mt-3">
                ₹{totalAmount.toLocaleString()}
              </h2>
            </div>

            <div className="w-20 h-20 rounded-full bg-black text-white flex items-center justify-center">
              <Trophy size={34} />
            </div>
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* ANNOUNCEMENT LIST */}
      {/* ====================================================== */}

      {rows.length > 0 && (
        <div className="mt-8 border border-gray-200 rounded-3xl overflow-hidden">
          {/* HEADER */}

          <div className="px-6 py-5 border-b border-gray-200 bg-[#fafafa]">
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedTeam
                ? "Team Announcement Leaderboard"
                : "All Teams Announcement Leaderboard"}
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Highest announced amounts
            </p>
          </div>

          {/* LIST */}

          <div className="divide-y divide-gray-100">
            {[...rows]
              .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
              .map((row, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-6 py-5 hover:bg-gray-50 transition-all"
                >
                  {/* LEFT */}

                  <div className="flex items-center gap-4">
                    {/* RANK */}

                    <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold">
                      #{index + 1}
                    </div>

                    {/* INFO */}

                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {row.fullName}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {row.teamName || "Deal Announcement"}
                      </p>
                    </div>
                  </div>

                  {/* AMOUNT */}

                  <div className="text-right">
                    <h2 className="text-2xl font-bold text-black">
                      ₹{Number(row.amount || 0).toLocaleString()}
                    </h2>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* TABLE */}
      {/* ====================================================== */}

      {selectedTeam && rows.length > 0 && (
        <div className="mt-8 overflow-x-auto border border-gray-200 rounded-3xl">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f8f8f8] border-b border-gray-200">
                <th className="py-5 px-6 text-left text-sm font-semibold text-gray-700">
                  Employee
                </th>

                <th className="py-5 px-6 text-left text-sm font-semibold text-gray-700">
                  Final Amount
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  {/* EMPLOYEE */}

                  <td className="py-5 px-6 font-medium text-gray-800 whitespace-nowrap">
                    {row.fullName}
                  </td>

                  {/* AMOUNT */}

                  <td className="py-4 px-6">
                    <div className="relative max-w-[250px]">
                      <IndianRupee
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                      />

                      <input
                        type="number"
                        value={row.amount}
                        onChange={(e) => handleChange(index, e.target.value)}
                        className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-black"
                        placeholder="Enter amount"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DealAnnouncement;
