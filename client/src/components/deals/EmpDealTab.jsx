import React from "react";

const EmpDealTab = ({ deals, filters, setFilters, loading }) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  const months = [
    { value: "1", label: "Jan" },
    { value: "2", label: "Feb" },
    { value: "3", label: "Mar" },
    { value: "4", label: "Apr" },
    { value: "5", label: "May" },
    { value: "6", label: "Jun" },
    { value: "7", label: "Jul" },
    { value: "8", label: "Aug" },
    { value: "9", label: "Sep" },
    { value: "10", label: "Oct" },
    { value: "11", label: "Nov" },
    { value: "12", label: "Dec" },
  ];

  const getStatusStyle = (status) => {
    const s = status?.toLowerCase();
    if (s?.includes("win") || s?.includes("done"))
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (s?.includes("lost") || s?.includes("cancel"))
      return "bg-rose-50 text-rose-700 border-rose-100";
    return "bg-amber-50 text-amber-700 border-amber-100";
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white border border-slate-200 p-2 rounded-2xl shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-r border-slate-100 mr-2">
            Filters
          </div>

          <div className="flex items-center gap-1 bg-slate-50 rounded-lg px-2">
            <select
              value={filters.month || ""}
              onChange={(e) =>
                setFilters({ ...filters, month: e.target.value })
              }
              className="bg-transparent border-none text-xs font-semibold text-slate-600 py-2"
            >
              <option value="">Month</option>
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            <div className="h-4 w-[1px] bg-slate-200" />

            <select
              value={filters.year || ""}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="bg-transparent border-none text-xs font-semibold text-slate-600 py-2"
            >
              <option value="">Year</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {(filters.month || filters.year) && (
            <button
              onClick={() =>
                setFilters({
                  industry: "",
                  leadType: "",
                  dealStatus: "",
                  month: "",
                  year: "",
                })
              }
              className="ml-auto px-4 py-2 text-xs font-bold text-indigo-600 uppercase"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">
                  Client
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">
                  Industry
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">
                  Type
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {deals.map((deal) => (
                <tr key={deal.id} className="hover:bg-slate-50/80">
                  <td className="px-6 py-4 text-sm font-semibold">
                    {deal.clientEmail}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {deal.industry}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {deal.leadType}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getStatusStyle(
                        deal.dealStatus,
                      )}`}
                    >
                      {deal.dealStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="p-16 text-center text-sm text-slate-400">
            Loading deals...
          </div>
        )}

        {!loading && deals.length === 0 && (
          <div className="p-16 text-center text-sm text-slate-400">
            No deals found.
          </div>
        )}
      </div>
    </div>
  );
};

export default EmpDealTab;
