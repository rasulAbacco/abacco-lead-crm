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

    // TEAM LEADER
    if (selected.leader) {
      employeeRows.push({
        employeeId: selected.leader.employeeId,
        fullName: `${selected.leader.fullName} (TL)`,
        amount: "",
        teamName: selected.name,
      });
    }

    // MEMBERS
    selected.members.forEach((member) => {
      employeeRows.push({
        employeeId: member.employee.employeeId,
        fullName: member.employee.fullName,
        amount: "",
        teamName: selected.name,
      });
    });

    // FETCH EXISTING DATA
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

      // MERGE DATA
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

  const totalAmount = rows.reduce(
    (acc, row) => acc + Number(row.amount || 0),
    0,
  );

  return (
    <div className="w-full text-[#1D1D1F]">
      {/* ====================================================== */}
      {/* HEADER / STATUS UPDATE METADATA ST strip               */}
      {/* ====================================================== */}
      {lastUpdated && (
        <div className="mb-5 flex items-center justify-between bg-[#F5F5F7] border border-[#E8E8ED] rounded-lg px-4 py-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#6E6E73]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1D1D1F]"></span>
            Ledger Balanced
          </div>
          <p className="text-[11px] font-medium text-[#86868B]">
            Sync Stamp:{" "}
            <span className="text-[#1D1D1F] font-semibold">{lastUpdated}</span>
          </p>
        </div>
      )}

      {/* ====================================================== */}
      {/* CONTROL ACTIONS PANEL                                  */}
      {/* ====================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#E8E8ED]">
        <div className="flex flex-wrap items-center gap-4 flex-1 md:flex-initial">
          {/* TEAM FILTER */}
          <div className="flex flex-col gap-1.5 min-w-[200px]">
            <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
              Scope Window
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
              className="w-full bg-[#F5F5F7] border border-[#E8E8ED] rounded-lg px-3 py-2 text-xs font-medium text-[#1D1D1F] outline-none transition-colors duration-200 focus:border-[#1D1D1F] cursor-pointer"
            >
              <option value="">All Teams Pipeline</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* MONTH SELECT */}
          <div className="flex flex-col gap-1.5 min-w-[140px]">
            <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
              Calendar Month
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full bg-[#F5F5F7] border border-[#E8E8ED] rounded-lg px-3 py-2 text-xs font-medium text-[#1D1D1F] outline-none transition-colors duration-200 focus:border-[#1D1D1F] cursor-pointer"
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

          {/* YEAR INPUT */}
          <div className="flex flex-col gap-1.5 w-[90px]">
            <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
              Year
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full bg-[#F5F5F7] border border-[#E8E8ED] rounded-lg px-3 py-2 text-xs font-medium text-[#1D1D1F] outline-none transition-colors duration-200 focus:border-[#1D1D1F]"
            />
          </div>
        </div>

        {/* WRITE ACTION BUTTON */}
        {selectedTeam && rows.length > 0 && (
          <div className="self-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-[#1D1D1F] text-white px-5 py-2 rounded-lg text-xs font-medium tracking-wide hover:bg-[#323234] active:scale-[0.98] transition-all duration-200"
            >
              {loading ? "Committing changes..." : "Save Value Matrix"}
            </button>
          </div>
        )}
      </div>

      {/* ====================================================== */}
      {/* HIGH-DENSITY AGGREGATION BANNER                       */}
      {/* ====================================================== */}
      {rows.length > 0 && (
        <div className="mt-6 bg-[#FBFBFD] border border-[#E8E8ED] rounded-xl px-5 py-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#86868B] uppercase block">
              Cumulative Pipeline Vol.
            </span>
            <h2 className="text-2xl font-semibold text-[#1D1D1F] tracking-tight mt-0.5">
              ₹{totalAmount.toLocaleString()}
            </h2>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center shadow-sm">
            <Trophy size={16} />
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* TWO COLUMN / REFINED STACKED WORKSPACE                */}
      {/* ====================================================== */}
      {rows.length > 0 && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEADERBOARD VIEW BLOCK */}
          <div
            className={`border border-[#E8E8ED] rounded-xl overflow-hidden bg-white ${selectedTeam ? "lg:col-span-6" : "lg:col-span-12"}`}
          >
            <div className="px-4 py-3 border-b border-[#E8E8ED] bg-[#FBFBFD]">
              <h3 className="text-xs font-semibold text-[#1D1D1F]">
                {selectedTeam
                  ? "Team Performance Rankings"
                  : "Global Performance Standings"}
              </h3>
            </div>

            <div className="divide-y divide-[#E8E8ED]">
              {[...rows]
                .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
                .map((row, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-[#FBFBFD] transition-colors text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-md bg-[#F5F5F7] text-[#1D1D1F] flex items-center justify-center font-bold text-[10px]">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-[#1D1D1F]">
                          {row.fullName}
                        </p>
                        <p className="text-[10px] text-[#86868B]">
                          {row.teamName || "Deal Announcement"}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-[#1D1D1F]">
                      ₹{Number(row.amount || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* EDITABLE RECORD MODIFICATION DATA SHEET */}
          {selectedTeam && (
            <div className="lg:col-span-6 border border-[#E8E8ED] rounded-xl overflow-hidden bg-white">
              <div className="px-4 py-3 border-b border-[#E8E8ED] bg-[#FBFBFD]">
                <h3 className="text-xs font-semibold text-[#1D1D1F]">
                  Adjustment Matrix Data Sheet
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F5F5F7] border-b border-[#E8E8ED] text-xs">
                      <th className="px-4 py-2 text-xs font-semibold text-[#1D1D1F]">
                        Employee
                      </th>
                      <th className="px-4 py-2 text-xs font-semibold text-[#1D1D1F] w-[180px]">
                        Announced Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E8ED] text-xs">
                    {rows.map((row, index) => (
                      <tr
                        key={index}
                        className="hover:bg-[#FBFBFD] transition-colors"
                      >
                        <td className="px-4 py-2 font-medium text-[#1D1D1F] whitespace-nowrap">
                          {row.fullName}
                        </td>
                        <td className="px-4 py-1.5">
                          <div className="relative flex items-center w-full">
                            <IndianRupee
                              size={12}
                              className="absolute left-2.5 text-[#86868B]"
                            />
                            <input
                              type="number"
                              value={row.amount}
                              onChange={(e) =>
                                handleChange(index, e.target.value)
                              }
                              className="w-full bg-white border border-[#E8E8ED] rounded-md pl-7 pr-3 py-1 text-xs font-medium text-[#1D1D1F] transition-colors outline-none hover:border-[#CCCCCC] focus:border-[#1D1D1F]"
                              placeholder="0"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DealAnnouncement;
