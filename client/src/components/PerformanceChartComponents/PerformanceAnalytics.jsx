import {
  TrendingUp,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Filter,
} from "lucide-react";

export default function PerformanceAnalytics({
  activeMetric,
  setActiveMetric,
  totalLeads,
  totalQualified,
  totalDisqualified,
  totalPending,
  totalTarget,
  overallAchievement,
}) {
  // Utility for the metric buttons to avoid repetition
  const MetricBtn = ({ label, id, colorClass }) => (
    <button
      onClick={() => setActiveMetric(id)}
      className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
        activeMetric === id
          ? `bg-gray-900 text-white shadow-sm`
          : `text-gray-500 hover:bg-gray-100`
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header Section: Minimalist & Functional */}
      <div className="border-b border-gray-100 px-6 py-5 bg-gray-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center shadow-inner">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Performance Analytics
              </h2>
              <p className="text-gray-500 text-xs font-medium">
                Real-time team insights & lead tracking
              </p>
            </div>
          </div>

          {/* Classic Segmented Control */}
          <div className="inline-flex items-center p-1 bg-gray-100 rounded-lg border border-gray-200">
            <MetricBtn label="All" id="all" />
            <MetricBtn label="Qualified" id="qualified" />
            <MetricBtn label="Disqualified" id="disqualified" />
          </div>
        </div>
      </div>

      {/* Stats Grid: Clean & Uniform */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 divide-x divide-y md:divide-y-0 divide-gray-100">
        {/* Total Leads */}
        <div className="p-6 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-500" />
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Total Leads
            </span>
          </div>
          <div className="text-3xl font-black text-gray-900">{totalLeads}</div>
          <div className="mt-1 text-[10px] text-blue-600 font-bold bg-blue-50 inline-block px-2 py-0.5 rounded">
            Global Volume
          </div>
        </div>

        {/* Qualified */}
        <div className="p-6 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Qualified
            </span>
          </div>
          <div className="text-3xl font-black text-gray-900">
            {totalQualified}
          </div>
          <div className="mt-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 inline-block px-2 py-0.5 rounded">
            Converted
          </div>
        </div>

        {/* Disqualified */}
        <div className="p-6 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-rose-500" />
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Disqualified
            </span>
          </div>
          <div className="text-3xl font-black text-gray-900">
            {totalDisqualified}
          </div>
          <div className="mt-1 text-[10px] text-rose-600 font-bold bg-rose-50 inline-block px-2 py-0.5 rounded">
            Lost Leads
          </div>
        </div>

        {/* Pending */}
        <div className="p-6 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Pending
            </span>
          </div>
          <div className="text-3xl font-black text-gray-900">
            {totalPending}
          </div>
          <div className="mt-1 text-[10px] text-amber-600 font-bold bg-amber-50 inline-block px-2 py-0.5 rounded">
            In Review
          </div>
        </div>

        {/* Target & Progress */}
        <div className="p-6 bg-indigo-50/30 hover:bg-indigo-50 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Target
              </span>
            </div>
            <span
              className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                overallAchievement >= 100
                  ? "bg-green-100 text-green-700 border-green-200"
                  : "bg-indigo-100 text-indigo-700 border-indigo-200"
              }`}
            >
              {overallAchievement}%
            </span>
          </div>
          <div className="text-3xl font-black text-gray-900">{totalTarget}</div>
          <div className="mt-2 w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-1000"
              style={{ width: `${Math.min(100, overallAchievement)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
