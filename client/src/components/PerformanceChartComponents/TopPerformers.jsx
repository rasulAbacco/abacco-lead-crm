import { Award, CheckCircle } from "lucide-react";

export default function TopPerformers({ topPerformers, showBlast, blastKey }) {
    return (
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-gray-200 p-4 md:p-6 lg:p-8">
            <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <Award className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <div>
                    <h3 className="font-black text-gray-900 text-xl md:text-2xl">Top Performers</h3>
                    <p className="text-xs text-gray-600 font-medium mt-0.5">This month's champions</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {topPerformers.map((emp, index) => (
                    <div
                        key={emp.id}
                        className="group relative bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-5 rounded-xl md:rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 overflow-visible"
                    >
                        {/* First Place Crown and Blast Effect */}
                        {index === 0 && (
                            <>
                                {/* 3D Crown */}
                                <div className="absolute -top-6 md:-top-8 left-1/2 -translate-x-1/2 z-20">
                                    <div className="relative animate-float">
                                        {/* Crown glow */}
                                        <div className="absolute inset-0 blur-2xl bg-yellow-400 opacity-60 animate-pulse rounded-full"></div>

                                        {/* 3D Crown using SVG for better rendering */}
                                        <div className="relative w-10 h-10 md:w-12 md:h-12">
                                            {/* Shadow layers for 3D effect */}
                                            <svg className="absolute top-1 left-1 w-full h-full opacity-20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12 2L15 8L21 9L16.5 13.5L18 20L12 16L6 20L7.5 13.5L3 9L9 8L12 2Z" fill="#78350f" />
                                            </svg>
                                            <svg className="absolute top-0.5 left-0.5 w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12 2L15 8L21 9L16.5 13.5L18 20L12 16L6 20L7.5 13.5L3 9L9 8L12 2Z" fill="url(#crownGradient)" />
                                                <defs>
                                                    <linearGradient id="crownGradient" x1="12" y1="2" x2="12" y2="20" gradientUnits="userSpaceOnUse">
                                                        <stop offset="0%" stopColor="#fbbf24" />
                                                        <stop offset="50%" stopColor="#f59e0b" />
                                                        <stop offset="100%" stopColor="#d97706" />
                                                    </linearGradient>
                                                </defs>
                                            </svg>
                                            <svg className="relative w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.8)) drop-shadow(0 2px 8px rgba(217, 119, 6, 0.6))' }}>
                                                <path d="M12 2L15 8L21 9L16.5 13.5L18 20L12 16L6 20L7.5 13.5L3 9L9 8L12 2Z" fill="#fde047" />
                                            </svg>

                                            {/* Shine effects */}
                                            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full opacity-90 animate-ping"></div>
                                            <div className="absolute top-2 right-2 w-1 h-1 bg-white rounded-full opacity-80"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Blast Animation - Spotlight Style */}
                                {showBlast && (
                                    <div key={blastKey} className="absolute inset-0 pointer-events-none z-30 overflow-visible">
                                        {/* Large spotlight burst from top */}
                                        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-64 h-64 animate-spotlight-burst">
                                            <div className="w-full h-full bg-gradient-radial from-yellow-300 via-orange-300 to-transparent opacity-80 rounded-full blur-2xl"></div>
                                        </div>

                                        {/* Side spotlights */}
                                        <div className="absolute top-1/2 -left-20 w-40 h-40 animate-spotlight-left">
                                            <div className="w-full h-full bg-gradient-radial from-amber-300 via-yellow-200 to-transparent opacity-60 rounded-full blur-xl"></div>
                                        </div>

                                        <div className="absolute top-1/2 -right-20 w-40 h-40 animate-spotlight-right">
                                            <div className="w-full h-full bg-gradient-radial from-amber-300 via-yellow-200 to-transparent opacity-60 rounded-full blur-xl"></div>
                                        </div>

                                        {/* Colorful confetti explosion from center */}
                                        {[...Array(25)].map((_, i) => {
                                            const angle = (i * 360) / 25;
                                            const distance = 120 + Math.random() * 80;
                                            const colors = ['bg-yellow-400', 'bg-orange-500', 'bg-red-500', 'bg-pink-500', 'bg-purple-500', 'bg-blue-500', 'bg-green-500'];
                                            const color = colors[i % colors.length];

                                            return (
                                                <div
                                                    key={`confetti-${i}`}
                                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-confetti-burst"
                                                    style={{
                                                        '--angle': `${angle}deg`,
                                                        '--distance': `${distance}px`,
                                                        '--duration': `${1.2 + Math.random() * 0.5}s`,
                                                        '--delay': `${Math.random() * 0.2}s`,
                                                        animationDelay: `var(--delay)`,
                                                    }}
                                                >
                                                    <div className={`w-2 h-3 ${color} shadow-lg transform rotate-45`}></div>
                                                </div>
                                            );
                                        })}

                                        {/* Sparkles */}
                                        {[...Array(15)].map((_, i) => {
                                            const angle = (i * 360) / 15;
                                            const distance = 100;

                                            return (
                                                <div
                                                    key={`sparkle-${i}`}
                                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-sparkle-burst"
                                                    style={{
                                                        '--angle': `${angle}deg`,
                                                        '--distance': `${distance}px`,
                                                        '--delay': `${i * 0.05}s`,
                                                        animationDelay: `var(--delay)`,
                                                    }}
                                                >
                                                    <div className="text-yellow-400 text-xl animate-twinkle">✨</div>
                                                </div>
                                            );
                                        })}

                                        {/* Glowing rings expanding outward */}
                                        {[...Array(4)].map((_, i) => (
                                            <div
                                                key={`ring-${i}`}
                                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-ring-wave"
                                                style={{
                                                    '--delay': `${i * 0.2}s`,
                                                    animationDelay: `var(--delay)`,
                                                    border: '3px solid rgba(251, 191, 36, 0.6)',
                                                }}
                                            ></div>
                                        ))}

                                        {/* Golden shimmer overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/20 via-transparent to-orange-200/20 animate-shimmer"></div>
                                    </div>
                                )}

                                {/* Star of the Month badge */}
                                <div className="absolute top-2 right-2 bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-[10px] md:text-xs font-black px-2 md:px-3 py-1 rounded-full shadow-lg animate-bounce-slow z-20 whitespace-nowrap">
                                    ⭐ STAR OF THE MONTH
                                </div>
                            </>
                        )}

                        <div className="flex items-center gap-3 md:gap-4 relative z-10">
                            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-xl md:text-2xl shadow-lg ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-yellow-500/30 animate-pulse-slow' :
                                index === 1 ? 'bg-gradient-to-br from-blue-500 to-blue-900 shadow-blue-900/30' :
                                    'bg-gradient-to-br from-orange-500 to-amber-600 shadow-orange-500/30'
                                } text-white`}>
                                {index === 0 ? '1' : index === 1 ? '2' : '3'}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-gray-900 text-base md:text-lg truncate">{emp.name}</div>
                                <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1.5">
                                    <div className="text-sm text-gray-600">
                                        <span className="font-bold text-cyan-600">{emp.totalLeads}</span> leads
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-emerald-600 font-semibold bg-emerald-100 px-2 py-0.5 rounded-md">
                                            ✓ {emp.qualified}
                                        </span>
                                        <span className="text-xs text-rose-600 font-semibold bg-rose-100 px-2 py-0.5 rounded-md">
                                            ✗ {emp.disqualified}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className={`text-2xl md:text-2xl font-black ${emp.achievement >= 100
                                    ? 'bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent'
                                    : 'bg-gradient-to-r from-amber-600 to-orange-700 bg-clip-text text-transparent'
                                    }`}>
                                    {emp.achievement}%
                                </div>
                                {emp.achievement >= 100 && (
                                    <div className="flex justify-end mt-1">
                                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                            <CheckCircle className="w-4 h-4 text-white" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-5deg); }
          50% { transform: translateY(-8px) rotate(5deg); }
        }

        @keyframes spotlight-burst {
          0% {
            transform: translate(-50%, 0) scale(0.3);
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
          100% {
            transform: translate(-50%, 50px) scale(1.5);
            opacity: 0;
          }
        }

        @keyframes spotlight-left {
          0% {
            transform: translateX(0) scale(0.5);
            opacity: 0;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translateX(-30px) scale(1);
            opacity: 0;
          }
        }

        @keyframes spotlight-right {
          0% {
            transform: translateX(0) scale(0.5);
            opacity: 0;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translateX(30px) scale(1);
            opacity: 0;
          }
        }

        @keyframes confetti-burst {
          0% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0) scale(0) rotate(0deg);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateY(calc(-1 * var(--distance))) scale(1) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes sparkle-burst {
          0% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0) scale(0);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateY(calc(-1 * var(--distance))) scale(1);
            opacity: 0;
          }
        }

        @keyframes ring-wave {
          0% {
            width: 30px;
            height: 30px;
            opacity: 1;
          }
          100% {
            width: 250px;
            height: 250px;
            opacity: 0;
          }
        }

        @keyframes shimmer {
          0% {
            opacity: 0;
          }
          50% {
            opacity: 0.3;
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes twinkle {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: scale(1.3) rotate(180deg);
            opacity: 0.7;
          }
        }

        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-spotlight-burst {
          animation: spotlight-burst 1.5s ease-out forwards;
        }

        .animate-spotlight-left {
          animation: spotlight-left 1.2s ease-out forwards;
        }

        .animate-spotlight-right {
          animation: spotlight-right 1.2s ease-out forwards;
        }

        .animate-confetti-burst {
          animation: confetti-burst var(--duration) ease-out forwards;
        }

        .animate-sparkle-burst {
          animation: sparkle-burst 1.5s ease-out forwards;
        }

        .animate-ring-wave {
          animation: ring-wave 1.8s ease-out forwards;
        }

        .animate-shimmer {
          animation: shimmer 1.5s ease-in-out forwards;
        }

        .animate-twinkle {
          animation: twinkle 1s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }

        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
      `}</style>
        </div>
    );
}