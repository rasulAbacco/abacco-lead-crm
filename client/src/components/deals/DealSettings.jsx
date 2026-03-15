import React from "react";

const DealSettings = ({
  industries,
  leadTypes,
  dealStatuses,
  newMaster,
  setNewMaster,
  handleAddMaster,
  handleDeleteMaster,
}) => {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ================= ADD MASTER ACTION BAR ================= */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              Pipeline Configuration
            </h3>
            <p className="text-xs font-medium text-slate-500">
              Expand your CRM capabilities by adding custom properties to your
              dropdown menus.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative">
              <select
                value={newMaster.type}
                onChange={(e) =>
                  setNewMaster({ ...newMaster, type: e.target.value })
                }
                className="w-full sm:w-44 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 appearance-none cursor-pointer"
              >
                <option value="industries">Industries</option>
                <option value="lead-types">Lead Types</option>
                <option value="deal-status">Statuses</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            <input
              value={newMaster.value}
              onChange={(e) =>
                setNewMaster({ ...newMaster, value: e.target.value })
              }
              placeholder="e.g. Real Estate, Hot Lead..."
              className="flex-1 sm:w-64 bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
            />

            <button
              onClick={handleAddMaster}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all active:scale-95"
            >
              Add Property
            </button>
          </div>
        </div>
      </div>

      {/* ================= MASTER LISTS GRID ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { title: "Industries", data: industries, type: "industries" },
          { title: "Lead Types", data: leadTypes, type: "lead-types" },
          { title: "Statuses", data: dealStatuses, type: "deal-status" },
        ].map((list) => (
          <div
            key={list.type}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden"
          >
            <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                {list.title}
              </h4>
              <span className="bg-slate-200/50 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {list.data.length}
              </span>
            </div>

            <div className="flex-1 h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
              {list.data.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {list.data.map((item) => (
                    <div
                      key={item.id}
                      className="group flex justify-between items-center px-5 py-3.5 hover:bg-slate-50/80 transition-all"
                    >
                      <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">
                        {item.name}
                      </span>
                      <button
                        onClick={() => handleDeleteMaster(list.type, item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all"
                        title="Delete Property"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                    <svg
                      className="w-6 h-6 text-slate-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    No Items
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* --- Footer Hint --- */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 items-center">
        <div className="text-amber-500">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <p className="text-xs text-amber-800 font-medium">
          <span className="font-bold">Pro Tip:</span> Changes made here will
          instantly reflect in the "New Deal" form and search filters across the
          platform.
        </p>
      </div>
    </div>
  );
};

export default DealSettings;
