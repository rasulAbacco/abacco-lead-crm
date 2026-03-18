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

  const getMonthLabel = (val) =>
    months.find((m) => m.value === String(val))?.label || val;

  const getStatusStyle = (status) => {
    const s = status?.toLowerCase();
    if (s?.includes("deal"))
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (s?.includes("lost") || s?.includes("cancel"))
      return "bg-rose-50 text-rose-700 border-rose-100";
    if (s?.includes("pending"))
      return "bg-amber-50 text-amber-700 border-amber-100";
    return "bg-slate-50 text-slate-700 border-slate-100";
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
                // ✅ STEP 3 — FIX RESET FILTER (IMPORTANT)
                setFilters({
                  industry: "",
                  industryId: "",
                  eventId: "",
                  associationId: "",
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
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
                  Agent Mail
                </th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
                  Industry
                </th>
                {/* ✅ STEP 1 — ADD COLUMNS IN HEADER */}
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
                  Event
                </th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
                  Association
                </th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
                  Type
                </th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
                  Status
                </th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
                  Period
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {deals.map((deal) => (
                <tr
                  key={deal.id}
                  className="hover:bg-slate-50/80 transition-all duration-150"
                >
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900 whitespace-nowrap">
                    {deal.clientEmail}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                    {deal.industry}
                  </td>
                  {/* ✅ STEP 2 — ADD DATA IN TABLE ROW */}
                  <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                    {deal.eventRef?.name || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                    {deal.associationRef?.name || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
                      {deal.leadType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${getStatusStyle(deal.dealStatus)}`}
                    >
                      {deal.dealStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                    {deal.month && deal.year
                      ? `${getMonthLabel(deal.month)} ${deal.year}`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Loading...
            </span>
          </div>
        )}

        {!loading && deals.length === 0 && (
          <div className="p-16 text-center">
            <p className="text-sm text-slate-400 font-medium">
              No deals found.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmpDealTab;