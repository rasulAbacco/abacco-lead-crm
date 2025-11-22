import { TrendingUp, Flame } from "lucide-react";

export default function TodaysLeadsActivity({ sortedLeads, totalLeadsToday, highestLeads }) {
    return (
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-gray-200 p-4 md:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 md:mb-6">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                        <Flame className="w-6 h-6 md:w-7 md:h-7 text-white" />
                    </div>
                    <div>
                        <h3 className="font-black text-gray-900 text-xl md:text-2xl">Today's Leads Activity</h3>
                        <p className="text-xs text-gray-600 font-medium mt-0.5">Last 24 hours</p>
                    </div>
                </div>
                <div className="px-4 md:px-5 py-2.5 md:py-3 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl md:rounded-2xl border border-cyan-200 shadow-md">
                    <div className="text-xs text-cyan-700 font-bold uppercase tracking-wide">Total</div>
                    <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent">
                        {totalLeadsToday}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {sortedLeads.map((emp, index) => {
                    const isHighest = emp.leads === highestLeads && emp.leads > 0;
                    const isTop3 = index < 3 && emp.leads > 0;

                    return (
                        <div
                            key={emp.id}
                            className={`group relative p-4 rounded-xl border transition-all duration-300 cursor-pointer ${isHighest
                                    ? 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-amber-300 hover:border-amber-400 hover:shadow-xl shadow-lg shadow-amber-200/50 animate-pulse-glow'
                                    : isTop3
                                        ? 'bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200 hover:border-cyan-300 hover:shadow-lg'
                                        : 'bg-gradient-to-br from-gray-50 to-blue-50 border-gray-200 hover:border-blue-300 hover:shadow-md'
                                }`}
                        >
                            {/* Highest performer special effects */}
                            {isHighest && (
                                <>
                                    {/* Glowing border animation */}
                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 opacity-0 group-hover:opacity-20 blur-xl animate-glow-pulse"></div>

                                    {/* Top badge */}
                                    <div className="absolute -top-2 -right-2 bg-gradient-to-br from-amber-400 to-orange-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg animate-bounce-gentle z-10">
                                        🔥 TOP
                                    </div>

                                    {/* Sparkle effects */}
                                    <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-amber-400 rounded-full animate-sparkle-1"></div>
                                    <div className="absolute top-2 right-3 w-1 h-1 bg-yellow-400 rounded-full animate-sparkle-2"></div>
                                    <div className="absolute bottom-2 left-2 w-1 h-1 bg-orange-400 rounded-full animate-sparkle-3"></div>

                                    {/* Shine sweep */}
                                    <div className="absolute inset-0 rounded-xl overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-shine-sweep"></div>
                                    </div>
                                </>
                            )}

                            {/* Top 3 badge (for 2nd and 3rd place) */}
                            {isTop3 && !isHighest && (
                                <div className="absolute -top-2 -right-2 bg-gradient-to-br from-amber-400 to-orange-500 text-black text-[10px] font-black px-2 py-1 rounded-full shadow-md z-10">
                                    #{index + 1}
                                </div>
                            )}

                            <div className="flex justify-between items-center relative z-10">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {/* Trending icon for top performers */}
                                    {isTop3 && (
                                        <div className={`${isHighest
                                                ? 'text-amber-500 animate-bounce-gentle'
                                                : 'text-cyan-500'
                                            }`}>
                                            <TrendingUp className="w-4 h-4" />
                                        </div>
                                    )}

                                    <span className={`font-bold transition-colors text-sm truncate ${isHighest
                                            ? 'text-amber-900 group-hover:text-orange-900'
                                            : 'text-gray-800 group-hover:text-gray-900'
                                        }`}>
                                        {emp.name}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className={`text-xl md:text-2xl font-black ${isHighest
                                            ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent animate-gradient-shift'
                                            : isTop3
                                                ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent'
                                                : 'bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent'
                                        }`}>
                                        {emp.leads}
                                    </span>

                                    <div className={`w-2 h-2 rounded-full shadow-lg transition-transform ${isHighest
                                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-amber-500/50 animate-pulse-dot'
                                            : 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-cyan-500/50 group-hover:scale-125'
                                        }`}></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(251, 191, 36, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(251, 191, 36, 0.5), 0 0 40px rgba(251, 191, 36, 0.2);
          }
        }

        @keyframes glow-pulse {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 0.3;
          }
        }

        @keyframes bounce-gentle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }

        @keyframes sparkle-1 {
          0%, 100% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1.5);
          }
        }

        @keyframes sparkle-2 {
          0%, 100% {
            opacity: 0;
            transform: scale(0);
          }
          33% {
            opacity: 1;
            transform: scale(1.5);
          }
        }

        @keyframes sparkle-3 {
          0%, 100% {
            opacity: 0;
            transform: scale(0);
          }
          66% {
            opacity: 1;
            transform: scale(1.5);
          }
        }

        @keyframes shine-sweep {
          0% {
            transform: translateX(-100%) skewX(-20deg);
          }
          100% {
            transform: translateX(200%) skewX(-20deg);
          }
        }

        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes pulse-dot {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.3);
            opacity: 0.8;
          }
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .animate-glow-pulse {
          animation: glow-pulse 2s ease-in-out infinite;
        }

        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }

        .animate-sparkle-1 {
          animation: sparkle-1 2s ease-in-out infinite;
        }

        .animate-sparkle-2 {
          animation: sparkle-2 2s ease-in-out infinite 0.3s;
        }

        .animate-sparkle-3 {
          animation: sparkle-3 2s ease-in-out infinite 0.6s;
        }

        .animate-shine-sweep {
          animation: shine-sweep 3s ease-in-out infinite;
        }

        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite;
        }

        .animate-pulse-dot {
          animation: pulse-dot 1.5s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
}