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
    <div className="bg-[#f8f8f8] min-h-screen px-8 py-6">
      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-semibold text-gray-900">Team Reports</h1>

        <p className="text-sm text-gray-500 mt-1">
          View monthly team performance reports
        </p>
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
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="min-w-[240px] bg-white border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-black"
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
            className="bg-white border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-black"
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
            className="w-[120px] bg-white border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-black"
          />
        </div>
      </div>

      {/* ====================================================== */}
      {/* TEAM REPORTS */}
      {/* ====================================================== */}

      <div className="mt-10 space-y-8">
        {loading ? (
          <div className="py-24 text-center text-gray-500">
            Loading reports...
          </div>
        ) : reports.length > 0 ? (
          teams
            .filter((team) => {
              if (!selectedTeam) return true;

              return team.id === Number(selectedTeam);
            })
            .map((team) => {
              const teamReports = reports.filter(
                (report) => report.team?.id === team.id,
              );

              if (teamReports.length === 0) return null;

              // ======================================================
              // TOTALS
              // ======================================================

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

              return (
                <div
                  key={team.id}
                  className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm"
                >
                  {/* ====================================================== */}
                  {/* TOP HEADER */}
                  {/* ====================================================== */}

                  <div className="bg-[#fafafa] border-b border-gray-200">
                    <div className="grid grid-cols-1 lg:grid-cols-3">
                      {/* TEAM */}
                      <div className="px-8 py-7 border-b lg:border-b-0 lg:border-r border-gray-200">
                        <p className="text-sm text-gray-500 uppercase tracking-wide">
                          Team
                        </p>

                        <h2 className="text-3xl font-semibold text-gray-900 mt-2">
                          {team.name}
                        </h2>
                      </div>

                      {/* MONTH */}
                      <div className="px-8 py-7 border-b lg:border-b-0 lg:border-r border-gray-200 text-center">
                        <p className="text-sm text-gray-500 uppercase tracking-wide">
                          Report Period
                        </p>

                        <h2 className="text-3xl font-semibold text-gray-900 mt-2">
                          {new Date(year, month - 1).toLocaleString("default", {
                            month: "long",
                          })}
                        </h2>

                        <p className="text-lg text-gray-500 mt-1">{year}</p>
                      </div>

                      {/* DEAL VALUE */}
                      {/* ACHIEVEMENT */}
                      <div className="px-8 py-7 text-right">
                        <p className="text-sm text-gray-500 uppercase tracking-wide">
                          Achievement
                        </p>

                        <div className="mt-2">
                          <h2 className="text-4xl font-bold text-black">
                            ₹{totals.dealValue.toLocaleString()}
                            <span className="text-2xl text-gray-400 font-medium">
                              /
                            </span>
                            <span className="text-2xl text-gray-500 font-semibold">
                              ₹{Number(team.targetValue || 0).toLocaleString()}
                            </span>
                          </h2>

                          {/* PERCENTAGE */}

                          <p className="text-sm text-gray-500 mt-2">
                            {team.targetValue > 0
                              ? (
                                  (totals.dealValue / team.targetValue) *
                                  100
                                ).toFixed(1)
                              : 0}
                            % achieved
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ====================================================== */}
                  {/* TABLE */}
                  {/* ====================================================== */}

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-[#f3f4f6] text-gray-800">
                          <th className="px-6 py-5 text-left text-sm font-semibold whitespace-nowrap border-b border-gray-200">
                            Employee
                          </th>

                          <th className="px-6 py-5 text-center text-sm font-semibold whitespace-nowrap border-b border-gray-200">
                            Deals
                          </th>

                          <th className="px-6 py-5 text-center text-sm font-semibold whitespace-nowrap border-b border-gray-200">
                            Invoice Pending
                          </th>

                          <th className="px-6 py-5 text-center text-sm font-semibold whitespace-nowrap border-b border-gray-200">
                            Invoice Cancel
                          </th>

                          <th className="px-6 py-5 text-center text-sm font-semibold whitespace-nowrap border-b border-gray-200">
                            Active Clients
                          </th>

                          <th className="px-6 py-5 text-center text-sm font-semibold whitespace-nowrap border-b border-gray-200">
                            Leave Out
                          </th>

                          <th className="px-6 py-5 text-center text-sm font-semibold whitespace-nowrap border-b border-gray-200">
                            No Response
                          </th>

                          <th className="px-6 py-5 text-center text-sm font-semibold whitespace-nowrap border-b border-gray-200">
                            Total Leads
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {teamReports.map((report) => (
                          <tr
                            key={report.id}
                            className="hover:bg-[#fafafa] transition-all"
                          >
                            {/* EMPLOYEE */}

                            <td className="px-6 py-5 border-b border-gray-100 whitespace-nowrap">
                              <div className="font-medium text-gray-900">
                                {report.employee?.fullName}
                              </div>
                            </td>

                            {/* DEAL */}

                            <td className="px-6 py-5 text-center border-b border-gray-100">
                              {report.deal}
                            </td>

                            {/* INVOICE PENDING */}

                            <td className="px-6 py-5 text-center border-b border-gray-100">
                              {report.invoicePending}
                            </td>

                            {/* INVOICE CANCEL */}

                            <td className="px-6 py-5 text-center border-b border-gray-100">
                              {report.invoiceCancel}
                            </td>

                            {/* ACTIVE CLIENTS */}

                            <td className="px-6 py-5 text-center border-b border-gray-100">
                              {report.activeClients}
                            </td>

                            {/* LEAVE OUT */}

                            <td className="px-6 py-5 text-center border-b border-gray-100">
                              {report.leaveOutClients}
                            </td>

                            {/* NO RESPONSE */}

                            <td className="px-6 py-5 text-center border-b border-gray-100">
                              {report.noResponse}
                            </td>

                            {/* TOTAL LEADS */}

                            <td className="px-6 py-5 text-center border-b border-gray-100">
                              {report.totalLeads}
                            </td>
                          </tr>
                        ))}

                        {/* ====================================================== */}
                        {/* TOTAL ROW */}
                        {/* ====================================================== */}

                        <tr className="bg-[#fafafa] font-semibold text-gray-900">
                          <td className="px-6 py-5 whitespace-nowrap">TOTAL</td>

                          <td className="px-6 py-5 text-center">
                            {totals.deal}
                          </td>

                          <td className="px-6 py-5 text-center">
                            {totals.invoicePending}
                          </td>

                          <td className="px-6 py-5 text-center">
                            {totals.invoiceCancel}
                          </td>

                          <td className="px-6 py-5 text-center">
                            {totals.activeClients}
                          </td>

                          <td className="px-6 py-5 text-center">
                            {totals.leaveOutClients}
                          </td>

                          <td className="px-6 py-5 text-center">
                            {totals.noResponse}
                          </td>

                          <td className="px-6 py-5 text-center">
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
          <div className="bg-white rounded-3xl border border-gray-200 py-24 text-center">
            <h3 className="text-2xl font-semibold text-gray-700">
              No Reports Found
            </h3>

            <p className="text-gray-500 mt-2">
              No reports available for selected filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamReportTable;
