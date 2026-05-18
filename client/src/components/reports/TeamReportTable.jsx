//src/components/reports/TeamReportTable.jsx
import React, { useEffect, useState } from "react";

const TeamReportTable = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

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

  // ======================================================
  // FETCH REPORTS
  // ======================================================
  const fetchReports = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/api/team-reports/reports?month=${month}&year=${year}`;
      if (selectedTeam) {
        url += `&teamId=${selectedTeam}`;
      }

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      setReports(data.reports || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [selectedTeam, month, year]);

  return (
    <div className="w-full text-[#1D1D1F]">
      {/* ====================================================== */}
      {/* FILTER CONTROL PANEL                                  */}
      {/* ====================================================== */}
      <div className="flex flex-wrap items-center gap-4 pb-6 border-b border-[#E8E8ED]">
        {/* TEAM SELECT */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px] max-w-sm">
          <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
            Team Window
          </label>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="w-full bg-[#F5F5F7] border border-[#E8E8ED] rounded-lg px-3 py-2 text-xs font-medium text-[#1D1D1F] outline-none transition-colors duration-200 focus:border-[#1D1D1F] cursor-pointer"
          >
            <option value="">All Active Teams</option>
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
            Statement Month
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
        <div className="flex flex-col gap-1.5 w-[100px]">
          <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
            Fiscal Year
          </label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-full bg-[#F5F5F7] border border-[#E8E8ED] rounded-lg px-3 py-2 text-xs font-medium text-[#1D1D1F] outline-none transition-colors duration-200 focus:border-[#1D1D1F]"
          />
        </div>
      </div>

      {/* ====================================================== */}
      {/* DATA AREA                                              */}
      {/* ====================================================== */}
      <div className="mt-6">
        {loading ? (
          <div className="py-20 text-center text-xs font-medium text-[#86868B] tracking-wide">
            Syncing matrix reports...
          </div>
        ) : reports.length > 0 ? (
          teams
            .filter((team) =>
              !selectedTeam ? true : team.id === Number(selectedTeam),
            )
            .map((team) => {
              const teamReports = reports.filter(
                (report) => report.team?.id === team.id,
              );
              if (teamReports.length === 0) return null;

              // Compute Totals
              const totals = teamReports.reduce(
                (acc, report) => {
                  acc.deal += report.deal || 0;
                  acc.invoicePending += report.invoicePending || 0;
                  acc.invoiceCancel += report.invoiceCancel || 0;
                  acc.activeClients += report.activeClients || 0;
                  acc.leaveOutClients += report.leaveOutClients || 0;
                  acc.noResponse += report.noResponse || 0;
                  acc.totalLeads += report.totalLeads || 0;
                  acc.dealValue += report.dealValue || 0;
                  return acc;
                },
                {
                  deal: 0,
                  invoicePending: 0,
                  invoiceCancel: 0,
                  activeClients: 0,
                  leaveOutClients: 0,
                  noResponse: 0,
                  totalLeads: 0,
                  dealValue: 0,
                },
              );

              const achievementRate =
                team.targetValue > 0
                  ? ((totals.dealValue / team.targetValue) * 100).toFixed(1)
                  : "0.0";

              return (
                <div
                  key={team.id}
                  className="mb-10 last:mb-0 border border-[#E8E8ED] rounded-xl overflow-hidden bg-white"
                >
                  {/* Performance Target Summary Ribbon */}
                  <div className="bg-[#FBFBFD] px-5 py-4 border-b border-[#E8E8ED] flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold tracking-widest text-[#86868B] uppercase">
                        {new Date(year, month - 1).toLocaleString("default", {
                          month: "long",
                        })}{" "}
                        {year}
                      </span>
                      <h2 className="text-base font-semibold text-[#1D1D1F] mt-0.5">
                        {team.name} Matrix
                      </h2>
                    </div>

                    <div className="flex items-center gap-6 text-right md:text-right">
                      <div>
                        <span className="text-[10px] font-bold tracking-widest text-[#86868B] uppercase block">
                          Value Pipeline
                        </span>
                        <div className="text-sm font-semibold text-[#1D1D1F] mt-0.5">
                          ₹{totals.dealValue.toLocaleString()}
                          <span className="text-[#86868B] font-normal mx-1">
                            /
                          </span>
                          <span className="text-[#6E6E73] font-medium">
                            ₹{Number(team.targetValue || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="border-l border-[#E8E8ED] pl-6">
                        <span className="text-[10px] font-bold tracking-widest text-[#86868B] uppercase block">
                          Performance
                        </span>
                        <span className="text-xs font-bold text-[#008060] bg-[#E6F4EA] px-2 py-0.5 rounded mt-0.5 inline-block">
                          {achievementRate}% Target
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* High Density Metrics Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#F5F5F7] border-b border-[#E8E8ED]">
                          <th className="px-4 py-2.5 text-xs font-semibold text-[#1D1D1F] whitespace-nowrap">
                            Employee
                          </th>
                          <th className="px-4 py-2.5 text-xs font-semibold text-[#1D1D1F] text-center whitespace-nowrap">
                            Deals
                          </th>
                          <th className="px-4 py-2.5 text-xs font-semibold text-[#1D1D1F] text-center whitespace-nowrap">
                            Inv Pending
                          </th>
                          <th className="px-4 py-2.5 text-xs font-semibold text-[#1D1D1F] text-center whitespace-nowrap">
                            Inv Cancel
                          </th>
                          <th className="px-4 py-2.5 text-xs font-semibold text-[#1D1D1F] text-center whitespace-nowrap">
                            Active Clients
                          </th>
                          <th className="px-4 py-2.5 text-xs font-semibold text-[#1D1D1F] text-center whitespace-nowrap">
                            Leave Out
                          </th>
                          <th className="px-4 py-2.5 text-xs font-semibold text-[#1D1D1F] text-center whitespace-nowrap">
                            No Response
                          </th>
                          <th className="px-4 py-2.5 text-xs font-semibold text-[#1D1D1F] text-center whitespace-nowrap">
                            Total Leads
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8E8ED] text-xs">
                        {teamReports.map((report) => (
                          <tr
                            key={report.id}
                            className="hover:bg-[#FBFBFD] transition-colors"
                          >
                            <td className="px-4 py-3 font-medium text-[#1D1D1F] whitespace-nowrap">
                              {report.employee?.fullName}
                            </td>
                            <td className="px-4 py-3 text-center text-[#6E6E73]">
                              {report.deal}
                            </td>
                            <td className="px-4 py-3 text-center text-[#6E6E73]">
                              {report.invoicePending}
                            </td>
                            <td className="px-4 py-3 text-center text-[#E0B400] font-medium">
                              {report.invoiceCancel}
                            </td>
                            <td className="px-4 py-3 text-center text-[#6E6E73]">
                              {report.activeClients}
                            </td>
                            <td className="px-4 py-3 text-center text-[#6E6E73]">
                              {report.leaveOutClients}
                            </td>
                            <td className="px-4 py-3 text-center text-[#6E6E73]">
                              {report.noResponse}
                            </td>
                            <td className="px-4 py-3 text-center font-medium text-[#1D1D1F]">
                              {report.totalLeads}
                            </td>
                          </tr>
                        ))}

                        {/* Aggregation Row */}
                        <tr className="bg-[#F5F5F7] font-semibold text-[#1D1D1F]">
                          <td className="px-4 py-3 tracking-wide">
                            TOTAL CONTRIB
                          </td>
                          <td className="px-4 py-3 text-center">
                            {totals.deal}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {totals.invoicePending}
                          </td>
                          <td className="px-4 py-3 text-center text-[#D02E2E]">
                            {totals.invoiceCancel}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {totals.activeClients}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {totals.leaveOutClients}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {totals.noResponse}
                          </td>
                          <td className="px-4 py-3 text-center bg-[#E8E8ED]/50">
                            {totals.totalLeads}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
        ) : (
          <div className="py-16 text-center border border-[#E8E8ED] rounded-xl bg-white">
            <h3 className="text-sm font-semibold text-[#1D1D1F]">
              No data matrix registered
            </h3>
            <p className="text-xs text-[#86868B] mt-1">
              There are no reports verified under the chosen timeframe
              parameters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamReportTable;
