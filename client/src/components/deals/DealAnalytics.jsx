import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
} from "recharts";

const DealAnalytics = ({ deals = [] }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // ----------------------------
  // DATA ENGINE
  // ----------------------------
  const groupByField = (field) => {
    const map = {};
    deals.forEach((deal) => {
      const key = deal[field] || "Unknown";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.keys(map)
      .map((key) => ({ name: key, count: map[key] }))
      .sort((a, b) => b.count - a.count);
  };

  const industryData = useMemo(() => groupByField("industry"), [deals]);
  const statusData = useMemo(() => groupByField("dealStatus"), [deals]);

  const totalDeals = deals.length;
  const activeDeals = deals.filter(
    (d) => d.dealStatus?.toLowerCase() !== "closed",
  ).length;

  const closedDeals = deals.filter(
    (d) => d.dealStatus?.toLowerCase() === "closed",
  ).length;

  // ----------------------------
  // MATRIX ENGINE
  // ----------------------------
  const matrixData = useMemo(() => {
    const dataMap = {};
    const industriesSet = new Set();
    const leadTypesSet = new Set();

    deals.forEach((deal) => {
      const ind = deal.industry || "Other";
      const type = deal.leadType || "Direct";
      industriesSet.add(ind);
      leadTypesSet.add(type);

      const key = `${ind}-${type}`;
      if (!dataMap[key])
        dataMap[key] = { industry: ind, leadType: type, count: 0 };
      dataMap[key].count++;
    });

    const industryList = Array.from(industriesSet).sort();
    const typeList = Array.from(leadTypesSet).sort();

    const points = Object.values(dataMap).map((item) => ({
      x: typeList.indexOf(item.leadType),
      y: industryList.indexOf(item.industry),
      z: item.count,
      industry: item.industry,
      leadType: item.leadType,
    }));

    return { points, industryList };
  }, [deals]);

  const filteredPoints = useMemo(() => {
    if (!searchTerm) return matrixData.points.slice(0, 60);
    return matrixData.points.filter((p) =>
      p.industry.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [matrixData, searchTerm]);

  // ----------------------------
  // REUSABLE BAR CHART
  // ----------------------------
  const ChartCard = ({ title, subtitle, data, color }) => (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-400">{subtitle}</p>
      </div>

      <div className="h-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.slice(0, 10)}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip
              content={({ active, payload }) =>
                active && payload ? (
                  <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs shadow-lg">
                    {payload[0].value} deals
                  </div>
                ) : null
              }
            />
            <Bar
              dataKey="count"
              fill={color}
              radius={[8, 8, 0, 0]}
              barSize={35}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  // ----------------------------
  // UI
  // ----------------------------
  return (
    <div className="max-w-7xl mx-auto py-12 px-6 space-y-12">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Deal Intelligence Dashboard
        </h1>
        <p className="text-slate-400 mt-2">
          Strategic overview of deal performance and distribution
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 text-white p-6 rounded-3xl shadow-lg">
          <div className="text-sm opacity-80">Total Deals</div>
          <div className="text-3xl font-bold mt-2">{totalDeals}</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-400 text-white p-6 rounded-3xl shadow-lg">
          <div className="text-sm opacity-80">Active Deals</div>
          <div className="text-3xl font-bold mt-2">{activeDeals}</div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-700 text-white p-6 rounded-3xl shadow-lg">
          <div className="text-sm opacity-80">Closed Deals</div>
          <div className="text-3xl font-bold mt-2">{closedDeals}</div>
        </div>
      </div>

      {/* MATRIX SECTION */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Market Intelligence Matrix
            </h2>
            <p className="text-sm text-slate-400">
              Cross-industry deal density visualization
            </p>
          </div>

          <input
            type="text"
            placeholder="Search industry..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
          />
        </div>

        <div className="h-[480px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <XAxis type="number" dataKey="x" hide />
              <YAxis type="number" dataKey="y" hide />
              <ZAxis type="number" dataKey="z" range={[80, 800]} />
              <Tooltip
                content={({ active, payload }) =>
                  active && payload ? (
                    <div className="bg-white shadow-xl p-3 rounded-lg border text-xs">
                      <div className="font-semibold">
                        {payload[0].payload.industry}
                      </div>
                      <div>{payload[0].payload.leadType}</div>
                      <div className="mt-1 text-indigo-600 font-bold">
                        {payload[0].payload.z} deals
                      </div>
                    </div>
                  ) : null
                }
              />
              <Scatter data={filteredPoints}>
                {filteredPoints.map((entry, index) => (
                  <Cell
                    key={index}
                    fill="#6366F1"
                    fillOpacity={0.2}
                    stroke="#4F46E5"
                    strokeWidth={1.5}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* BOTTOM CHARTS */}
      <div className="grid md:grid-cols-2 gap-8">
        <ChartCard
          title="Industry Distribution"
          subtitle="Top industries by deal volume"
          data={industryData}
          color="#64748B"
        />

        <ChartCard
          title="Pipeline Status"
          subtitle="Deals grouped by lifecycle stage"
          data={statusData}
          color="#4F46E5"
        />
      </div>
    </div>
  );
};

export default DealAnalytics;
