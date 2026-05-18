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

    // TEAM LEADER
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

    // TEAM MEMBERS
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

    // FETCH EXISTING REPORTS
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

      // MERGE EXISTING DATA
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

  // REFETCH ON MONTH/YEAR CHANGE
  useEffect(() => {
    if (selectedTeam) {
      handleTeamChange(selectedTeam);
    }
  }, [month, year]);

  // HANDLE INPUT CHANGE
  const handleInputChange = (index, field, value) => {
    const updatedRows = [...reportRows];
    updatedRows[index][field] = value;
    setReportRows(updatedRows);
  };

  // SAVE REPORTS
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
      handleTeamChange(selectedTeam);
    } catch (err) {
      console.error(err);
      alert(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full text-[#1D1D1F]">
      {/* ====================================================== */}
      {/* STATUS RIBBON / LAST UPDATED AREA                     */}
      {/* ====================================================== */}
      {lastUpdated && (
        <div className="mb-5 flex items-center justify-between bg-[#F5F5F7] border border-[#E8E8ED] rounded-lg px-4 py-2.5 transition-all">
          <div className="flex items-center gap-2 text-xs font-medium text-[#6E6E73]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#008060] animate-pulse"></span>
            Sync status verified
          </div>
          <p className="text-[11px] font-medium text-[#86868B]">
            Saved Stamp:{" "}
            <span className="text-[#1D1D1F] font-semibold">{lastUpdated}</span>
          </p>
        </div>
      )}

      {/* ====================================================== */}
      {/* CONTROL ACTIONS PANEL                                  */}
      {/* ====================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#E8E8ED]">
        <div className="flex flex-wrap items-center gap-4 flex-1 md:flex-initial">
          {/* TEAM SELECT */}
          <div className="flex flex-col gap-1.5 min-w-[200px]">
            <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
              Target Team
            </label>
            <select
              value={selectedTeam}
              onChange={(e) => handleTeamChange(e.target.value)}
              className="w-full bg-[#F5F5F7] border border-[#E8E8ED] rounded-lg px-3 py-2 text-xs font-medium text-[#1D1D1F] outline-none transition-colors duration-200 focus:border-[#1D1D1F] cursor-pointer"
            >
              <option value="">Select Team target...</option>
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
              Billing Month
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
              ].map((m, idx) => (
                <option key={idx} value={idx + 1}>
                  {m}
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

        {/* TOP CONTEXT ACTION BUTTON */}
        {reportRows.length > 0 && (
          <div className="pt-4 md:pt-0 self-end">
            <button
              onClick={handleSaveReports}
              disabled={loading}
              className="bg-[#1D1D1F] text-white px-5 py-2 rounded-lg text-xs font-medium tracking-wide hover:bg-[#323234] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? "Writing Ledger..." : "Save Updates"}
            </button>
          </div>
        )}
      </div>

      {/* ====================================================== */}
      {/* HIGH-DENSITY GRID REGISTER                            */}
      {/* ====================================================== */}
      <div className="mt-6">
        {reportRows.length > 0 ? (
          <div className="border border-[#E8E8ED] rounded-xl overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F5F5F7] border-b border-[#E8E8ED]">
                    <th className="px-4 py-2.5 text-xs font-semibold text-[#1D1D1F] whitespace-nowrap">
                      Employee
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-[#1D1D1F] text-center whitespace-nowrap w-[100px]">
                      Deals
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-[#1D1D1F] text-center whitespace-nowrap w-[110px]">
                      Inv Pending
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-[#1D1D1F] text-center whitespace-nowrap w-[110px]">
                      Inv Cancel
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-[#1D1D1F] text-center whitespace-nowrap w-[110px]">
                      Active Clients
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-[#1D1D1F] text-center whitespace-nowrap w-[100px]">
                      Leave Out
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-[#1D1D1F] text-center whitespace-nowrap w-[110px]">
                      No Response
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-[#1D1D1F] text-center whitespace-nowrap w-[100px]">
                      Total Leads
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-[#1D1D1F] text-center whitespace-nowrap w-[130px]">
                      Deal Value (₹)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E8ED] text-xs">
                  {reportRows.map((row, index) => (
                    <tr
                      key={index}
                      className="hover:bg-[#FBFBFD] transition-colors"
                    >
                      {/* EMPLOYEE NAME COLUMN */}
                      <td className="px-4 py-2.5 font-medium text-[#1D1D1F] whitespace-nowrap max-w-[180px] truncate">
                        {row.fullName}
                      </td>

                      {/* DATA INPUT CELLS */}
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
                        <td key={field} className="px-2 py-2 text-center">
                          <input
                            type="number"
                            value={row[field]}
                            placeholder="0"
                            onChange={(e) =>
                              handleInputChange(index, field, e.target.value)
                            }
                            className="w-full text-center bg-white border border-[#E8E8ED] rounded-md px-2 py-1 text-xs font-medium text-[#1D1D1F] transition-all duration-150 outline-none hover:border-[#CCCCCC] focus:border-[#1D1D1F] focus:bg-white focus:ring-1 focus:ring-[#1D1D1F]/10"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="py-16 text-center border border-[#E8E8ED] rounded-xl bg-white">
            <h3 className="text-sm font-semibold text-[#1D1D1F]">
              Matrix Registry Dormant
            </h3>
            <p className="text-xs text-[#86868B] mt-1">
              Select an active team to populate work rows and update performance
              ledgers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateReport;
