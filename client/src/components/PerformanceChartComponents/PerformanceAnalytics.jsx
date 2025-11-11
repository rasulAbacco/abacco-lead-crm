import { TrendingUp, Target, Users, Award, CheckCircle, XCircle, Clock, Activity, Zap } from "lucide-react";

export default function PerformanceAnalytics({
    activeMetric,
    setActiveMetric,
    totalLeads,
    totalQualified,
    totalDisqualified,
    totalPending,
    totalTarget,
    overallAchievement
}) {
    return (
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="relative bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 px-4 md:px-8 py-6 md:py-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>

                <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 md:gap-6">
                    <div className="flex items-center gap-3 md:gap-5">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-white/20 backdrop-blur-lg flex items-center justify-center shadow-xl border border-white/20">
                            <Zap className="w-6 h-6 md:w-8 md:h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">
                                Performance Analytics
                            </h2>
                            <p className="text-cyan-100 mt-1 md:mt-1.5 font-medium text-xs md:text-sm">Real-time team insights & lead tracking</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-xl md:rounded-2xl p-1 md:p-1.5 border border-white/10 shadow-xl">
                        <button
                            onClick={() => setActiveMetric('all')}
                            className={`px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all duration-200 ${activeMetric === 'all'
                                    ? 'bg-white text-blue-600 shadow-lg'
                                    : 'text-white/80 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            All Leads
                        </button>
                        <button
                            onClick={() => setActiveMetric('qualified')}
                            className={`px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all duration-200 ${activeMetric === 'qualified'
                                    ? 'bg-white text-emerald-600 shadow-lg'
                                    : 'text-white/80 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            Qualified
                        </button>
                        <button
                            onClick={() => setActiveMetric('disqualified')}
                            className={`px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all duration-200 ${activeMetric === 'disqualified'
                                    ? 'bg-white text-rose-600 shadow-lg'
                                    : 'text-white/80 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            Disqualified
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 p-4 md:p-6 lg:p-8">
                <div className="group relative bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl md:rounded-2xl p-4 md:p-5 border border-cyan-200 hover:border-cyan-300 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                        <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                            <Target className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        </div>
                        <span className="text-xs font-bold text-cyan-600 bg-cyan-100 px-2 md:px-3 py-1 rounded-full">
                            Total
                        </span>
                    </div>
                    <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent">
                        {totalLeads}
                    </div>
                    <div className="text-xs text-gray-600 mt-1 md:mt-1.5 font-semibold">All Leads</div>
                </div>

                <div className="group relative bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl md:rounded-2xl p-4 md:p-5 border border-emerald-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                        <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                            <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        </div>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 md:px-3 py-1 rounded-full">
                            Success
                        </span>
                    </div>
                    <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
                        {totalQualified}
                    </div>
                    <div className="text-xs text-gray-600 mt-1 md:mt-1.5 font-semibold">Qualified</div>
                </div>

                <div className="group relative bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl md:rounded-2xl p-4 md:p-5 border border-rose-200 hover:border-rose-300 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                        <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
                            <XCircle className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        </div>
                        <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 md:px-3 py-1 rounded-full">
                            Lost
                        </span>
                    </div>
                    <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-rose-600 to-pink-700 bg-clip-text text-transparent">
                        {totalDisqualified}
                    </div>
                    <div className="text-xs text-gray-600 mt-1 md:mt-1.5 font-semibold">Disqualified</div>
                </div>

                <div className="group relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl md:rounded-2xl p-4 md:p-5 border border-amber-200 hover:border-amber-300 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                        <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                            <Clock className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        </div>
                        <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 md:px-3 py-1 rounded-full">
                            Review
                        </span>
                    </div>
                    <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-amber-600 to-orange-700 bg-clip-text text-transparent">
                        {totalPending}
                    </div>
                    <div className="text-xs text-gray-600 mt-1 md:mt-1.5 font-semibold">Pending</div>
                </div>

                <div className="group relative bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl md:rounded-2xl p-4 md:p-5 border border-purple-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 col-span-2 md:col-span-1">
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                        <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        </div>
                        <span className={`text-xs font-bold px-2 md:px-3 py-1 rounded-full ${overallAchievement >= 100
                                ? 'text-emerald-600 bg-emerald-100'
                                : 'text-amber-600 bg-amber-100'
                            }`}>
                            {overallAchievement}%
                        </span>
                    </div>
                    <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-purple-600 to-violet-700 bg-clip-text text-transparent">
                        {totalTarget}
                    </div>
                    <div className="text-xs text-gray-600 mt-1 md:mt-1.5 font-semibold">Target</div>
                </div>
            </div>
        </div>
    );
}