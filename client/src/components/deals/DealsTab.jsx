import React, { useRef } from "react";

const DealsTab = ({
  deals,
  industries,
  events,          // ✅ STEP 1: NEW PROP
  associations,    // ✅ STEP 1: NEW PROP
  dealStatuses,
  leadTypes,
  formData,
  setFormData,
  filters,
  setFilters,
  showForm,
  editingId,
  setEditingId,
  setShowForm,
  handleSaveDeal,
  handleDeleteDeal,
  loading,
  saving,
}) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear + 1 - 2010 + 1 },
    (_, i) => currentYear + 1 - i,
  );

  const formRef = useRef(null);

  const monthShort = [
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

  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const getMonthLabel = (val) =>
    monthShort.find((m) => m.value === String(val))?.label || val;

  const getStatusStyle = (status) => {
    const s = status?.toLowerCase();
    if (s?.includes("deal")) return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (s?.includes("lost") || s?.includes("cancel")) return "bg-rose-50 text-rose-700 border-rose-100";
    if (s?.includes("pending")) return "bg-amber-50 text-amber-700 border-amber-100";
    return "bg-slate-50 text-slate-700 border-slate-100";
  };

  // ✅ STEP 2: FIX EDIT MODE - Ensures IDs are mapped for the selects
  const handleEditClick = (deal) => {
    setFormData({
      ...deal,
      industryId: deal.industryId || "",
      eventId: deal.eventId || "",
      associationId: deal.associationId || "",
    });

    setEditingId(deal.id);
    setShowForm(true);

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  return (
    <div className="space-y-6">
      <div ref={formRef} />

      {/* ================= FORM SECTION ================= */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.15em]">
              {editingId ? "Edit Transaction Details" : "New Deal Entry"}
            </h2>
          </div>

          <form onSubmit={handleSaveDeal} className="p-6">
            {/* ✅ STEP 3: UPDATED GRID TO lg:grid-cols-5 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">
                  Agent Email
                </label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  required
                  value={formData.clientEmail || ""}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">
                  Industry
                </label>
                <select
                  required
                  value={formData.industry || ""}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 appearance-none cursor-pointer"
                >
                  <option value="">Select Industry</option>
                  {industries.map((i) => (
                    <option key={i.id} value={i.name}>{i.name}</option>
                  ))}
                </select>
              </div>

              {/* ✅ STEP 3: EVENT DROPDOWN */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">
                  Event
                </label>
                <select
                  value={formData.eventId || ""}
                  onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 appearance-none cursor-pointer"
                >
                  <option value="">Select Event</option>
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              {/* ✅ STEP 3: ASSOCIATION DROPDOWN */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">
                  Association
                </label>
                <select
                  value={formData.associationId || ""}
                  onChange={(e) => setFormData({ ...formData, associationId: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 appearance-none cursor-pointer"
                >
                  <option value="">Select Association</option>
                  {associations.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">
                  Lead Type
                </label>
                <select
                  required
                  value={formData.leadType || ""}
                  onChange={(e) => setFormData({ ...formData, leadType: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 appearance-none cursor-pointer"
                >
                  <option value="">Select Type</option>
                  {leadTypes.map((l) => (
                    <option key={l.id} value={l.name}>{l.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">
                  Status
                </label>
                <select
                  required
                  value={formData.dealStatus || ""}
                  onChange={(e) => setFormData({ ...formData, dealStatus: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 appearance-none cursor-pointer"
                >
                  <option value="">Set Status</option>
                  {dealStatuses.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">
                  Deal Month
                </label>
                <select
                  required
                  value={formData.month || ""}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value ? Number(e.target.value) : "" })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm appearance-none cursor-pointer"
                >
                  <option value="">Select Month</option>
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">
                  Deal Year
                </label>
                <select
                  required
                  value={formData.year || ""}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value ? Number(e.target.value) : "" })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm appearance-none cursor-pointer"
                >
                  <option value="">Select Year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-6">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={saving}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="min-w-[160px] inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-70"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {editingId ? "Updating..." : "Saving..."}
                  </>
                ) : editingId ? "Update Transaction" : "Save Entry"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= FILTER BAR ================= */}
      <div className="bg-white border border-slate-200 p-2 rounded-2xl shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-r border-slate-100 mr-2">
            Filters
          </div>

          {/* ✅ STEP 4: UPDATED FILTER LIST */}
          {[
            {
              label: "All Industries",
              key: "industry",
              options: industries.map((i) => i.name),
            },
            {
              label: "All Events",
              key: "eventId",
              options: events.map((e) => ({ label: e.name, value: e.id })),
            },
            {
              label: "All Associations",
              key: "associationId",
              options: associations.map((a) => ({ label: a.name, value: a.id })),
            },
            {
              label: "All Lead Types",
              key: "leadType",
              options: leadTypes.map((l) => l.name),
            },
            {
              label: "All Statuses",
              key: "dealStatus",
              options: dealStatuses.map((s) => s.name),
            },
          ].map((filter) => (
            <select
              key={filter.key}
              value={filters[filter.key] || ""}
              onChange={(e) => setFilters({ ...filters, [filter.key]: e.target.value })}
              className="bg-slate-50 border-none rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 focus:ring-2 focus:ring-indigo-500/10 cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <option value="">{filter.label}</option>
              {/* ✅ STEP 4: UPDATED SELECT RENDER */}
              {filter.options.map((opt) => (
                <option
                  key={typeof opt === "object" ? opt.value : opt}
                  value={typeof opt === "object" ? opt.value : opt}
                >
                  {typeof opt === "object" ? opt.label : opt}
                </option>
              ))}
            </select>
          ))}

          <div className="flex items-center gap-1 bg-slate-50 rounded-lg px-2">
            <select
              value={filters.month || ""}
              onChange={(e) => setFilters({ ...filters, month: e.target.value })}
              className="bg-transparent border-none text-xs font-semibold text-slate-600 focus:ring-0 py-2"
            >
              <option value="">Month</option>
              {monthShort.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <div className="h-4 w-[1px] bg-slate-200" />
            <select
              value={filters.year || ""}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="bg-transparent border-none text-xs font-semibold text-slate-600 focus:ring-0 py-2"
            >
              <option value="">Year</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {(filters.industry ||
            filters.eventId ||
            filters.associationId ||
            filters.leadType ||
            filters.dealStatus ||
            filters.month ||
            filters.year) && (
              <button
                onClick={() =>
                  // ✅ STEP 5: RESET FILTER FIX
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
                className="ml-auto px-4 py-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-tight"
              >
                Reset Filters
              </button>
            )}
        </div>
      </div>

      {/* ================= DATA TABLE ================= */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Agent Name</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Agent Mail</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Industry</th>
                {/* ✅ STEP 6: NEW HEADER COLUMNS */}
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Event</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Association</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Type</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Period</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {deals.map((deal) => (
                <tr key={deal.id} className="group hover:bg-slate-50/80 transition-all duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-semibold">
                    {deal.employee?.fullName || deal.manualAgentName || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-slate-900">{deal.clientEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{deal.industry}</td>
                  {/* ✅ STEP 6: NEW ROW DATA */}
                  <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">{deal.eventName || "—"}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">{deal.associationName || "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">{deal.leadType}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${getStatusStyle(deal.dealStatus)}`}>
                      {deal.dealStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {deal.month && deal.year ? `${getMonthLabel(deal.month)} ${deal.year}` : "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => handleEditClick(deal)}
                        className="text-indigo-600 hover:text-indigo-900 text-xs font-bold uppercase tracking-wider transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteDeal(deal.id)}
                        className="text-slate-300 hover:text-rose-600 text-xs font-bold uppercase tracking-wider transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Synchronizing Data...</span>
          </div>
        )}

        {!loading && deals.length === 0 && (
          <div className="p-16 text-center">
            <p className="text-sm text-slate-400 font-medium">No records found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DealsTab;