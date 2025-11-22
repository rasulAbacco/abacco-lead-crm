import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

export default function IndividualPerformance({
    activeMetric,
    chartData,
    employees,
    setSelectedEmployee
}) {
    const CustomTick = ({ x, y, payload }) => {
        return (
            <g transform={`translate(${x},${y})`}>
                <text
                    x={0}
                    y={0}
                    dy={10}
                    textAnchor="end"
                    fill="#475569"
                    fontSize={11}
                    fontWeight="600"
                    transform="rotate(-35)"
                >
                    {payload.value}
                </text>
            </g>
        );
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white backdrop-blur-xl px-6 py-4 rounded-2xl shadow-2xl border border-gray-200 w-full">
                    <p className="font-bold text-gray-900 mb-3 text-base">{data.name}</p>
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-6">
                            <span className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"></div>
                                Total Leads
                            </span>
                            <span className="font-bold text-cyan-600">{data.totalLeads}</span>
                        </div>
                        <div className="flex items-center justify-between gap-6">
                            <span className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-green-600"></div>
                                Qualified
                            </span>
                            <span className="font-bold text-emerald-600">{data.qualified}</span>
                        </div>
                        <div className="flex items-center justify-between gap-6">
                            <span className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-600"></div>
                                Disqualified
                            </span>
                            <span className="font-bold text-rose-600">{data.disqualified}</span>
                        </div>
                        <div className="flex items-center justify-between gap-6">
                            <span className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600"></div>
                                Pending
                            </span>
                            <span className="font-bold text-amber-600">{data.pending}</span>
                        </div>
                        <div className="pt-2.5 mt-2.5 border-t border-gray-200">
                            <div className="flex items-center justify-between gap-6 mb-1.5">
                                <span className="text-sm text-gray-600">Target</span>
                                <span className="font-bold text-gray-900">{data.target}</span>
                            </div>
                            <div className="flex items-center justify-between gap-6">
                                <span className="text-sm text-gray-600">Achievement</span>
                                <span className={`font-bold ${data.achievement >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {data.achievement}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white w-full rounded-2xl md:rounded-3xl shadow-xl border border-gray-200 p-4 md:p-6 lg:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 mb-4 md:mb-6">
                <div>
                    <h3 className="text-xl md:text-2xl font-black text-gray-900">Individual Performance</h3>
                    <p className="text-gray-600 text-xs md:text-sm mt-1">Click on bars to view details</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"></div>
                        <span className="text-gray-700 font-semibold">Total</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-green-600"></div>
                        <span className="text-gray-700 font-semibold">Qualified</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-rose-500 to-pink-600"></div>
                        <span className="text-gray-700 font-semibold">Disqualified</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                        <span className="text-gray-700 font-semibold">Target</span>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl md:rounded-2xl p-3 md:p-6 border border-gray-200 overflow-x-auto custom-scrollbar">
                <div style={{ minWidth: '700px', height: '350px' }}>
                    <ResponsiveContainer>
                        <BarChart
                            data={chartData}
                            barCategoryGap="10%"
                            margin={{ top: 20, right: 10, left: 0, bottom: 80 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e4" vertical={false} opacity={0.5} />
                            <XAxis
                                dataKey="name"
                                interval={0}
                                height={5}
                                tick={<CustomTick />}
                                axisLine={{ stroke: '#000000' }}
                            />
                            <YAxis
                                tick={{ fill: "#000000", fontSize: 12, fontWeight: 600 }}
                                axisLine={{ stroke: '#000000' }}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(6, 182, 212, 0.08)' }} />

                            {activeMetric === 'all' && (
                                <>
                                    <Bar
                                        dataKey="totalLeads"
                                        fill="url(#colorTotal)"
                                        radius={[12, 12, 0, 0]}
                                        cursor="pointer"
                                        onClick={(data) => setSelectedEmployee(employees.find((e) => e.employeeId === data.id))}
                                        animationDuration={1200}
                                        barSize={25}
                                    />
                                    <Bar
                                        dataKey="target"
                                        fill="url(#colorTarget)"
                                        radius={[12, 12, 0, 0]}
                                        barSize={25}
                                        animationDuration={1200}
                                        animationBegin={200}
                                    />
                                </>
                            )}

                            {activeMetric === 'qualified' && (
                                <>
                                    <Bar
                                        dataKey="qualified"
                                        fill="url(#colorQualified)"
                                        radius={[12, 12, 0, 0]}
                                        cursor="pointer"
                                        onClick={(data) => setSelectedEmployee(employees.find((e) => e.employeeId === data.id))}
                                        animationDuration={1200}
                                        barSize={25}
                                    />
                                    <Bar
                                        dataKey="target"
                                        fill="url(#colorTargetQualified)"
                                        radius={[12, 12, 0, 0]}
                                        barSize={25}
                                        animationDuration={1200}
                                        animationBegin={200}
                                    />
                                </>
                            )}

                            {activeMetric === 'disqualified' && (
                                <>
                                    <Bar
                                        dataKey="disqualified"
                                        fill="url(#colorDisqualified)"
                                        radius={[12, 12, 0, 0]}
                                        cursor="pointer"
                                        onClick={(data) => setSelectedEmployee(employees.find((e) => e.employeeId === data.id))}
                                        animationDuration={1200}
                                        barSize={25}
                                    />
                                    <Bar
                                        dataKey="target"
                                        fill="url(#colorTargetDisqualified)"
                                        radius={[12, 12, 0, 0]}
                                        barSize={25}
                                        animationDuration={1200}
                                        animationBegin={200}
                                    />
                                </>
                            )}

                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#7F27FF" stopOpacity={1} />
                                    <stop offset="50%" stopColor="#7F27FF" stopOpacity={0.95} />
                                    <stop offset="100%" stopColor="#a927ff" stopOpacity={0.9} />
                                </linearGradient>

                                <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#00D4FF" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#020024" stopOpacity={1} />
                                </linearGradient>

                                <linearGradient id="colorQualified" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#08CB00" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#08CB00" stopOpacity={0.3} />
                                </linearGradient>

                                <linearGradient id="colorTargetQualified" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#7F27FF" stopOpacity={1} />
                                    <stop offset="50%" stopColor="#7F27FF" stopOpacity={0.95} />
                                    <stop offset="100%" stopColor="#a927ff" stopOpacity={0.9} />
                                </linearGradient>

                                <linearGradient id="colorDisqualified" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
                                    <stop offset="50%" stopColor="#e11d48" stopOpacity={0.95} />
                                    <stop offset="100%" stopColor="#be123c" stopOpacity={0.9} />
                                </linearGradient>

                                <linearGradient id="colorTargetDisqualified" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#7F27FF" stopOpacity={1} />
                                    <stop offset="50%" stopColor="#7F27FF" stopOpacity={0.95} />
                                    <stop offset="100%" stopColor="#a927ff" stopOpacity={0.9} />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}