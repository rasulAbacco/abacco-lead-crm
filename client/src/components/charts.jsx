/* eslint-disable react-refresh/only-export-components */
// Dashboard charts (recharts) styled for the spatial design: soft gradients, glass tooltips.
import {
  ResponsiveContainer,
  BarChart,
  Bar as RBar,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { num } from "../lib/format";

export const CAT_SERIES = [
  { key: "association", name: "Association", color: "#2563eb" },
  { key: "attendees", name: "Attendees", color: "#0ea5e9" },
  { key: "industry", name: "Industry", color: "#8b5cf6" },
  { key: "memberAttendees", name: "Member attendees", color: "#14b8a6" },
];

const AXIS = { fontSize: 12, fill: "#66718c" };

export function GlassTooltip({ active, payload, label, suffix = "leads" }) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((p) =>
    p.value !== undefined && p.dataKey !== "target" ? true : p.value > 0,
  );
  return (
    <div className="rounded-2xl border border-white bg-white/90 backdrop-blur-xl px-3.5 py-2.5 shadow-[0_18px_40px_-16px_rgba(15,27,61,0.45)] text-[13px]">
      <div className="font-bold text-ink mb-1">
        {payload[0]?.payload?.tip || label}
      </div>
      {rows.map((p) => (
        <div
          key={p.dataKey}
          className="flex items-center justify-between gap-5"
        >
          <span className="flex items-center gap-1.5 text-ink-soft">
            <span
              className="size-2 rounded-full"
              style={{ background: p.color || p.fill }}
            />
            {p.name}
          </span>
          <span className="num font-semibold text-ink">
            {num(p.value)} {p.dataKey === "target" ? "" : suffix}
          </span>
        </div>
      ))}
    </div>
  );
}

function Grad({ id, color, top = 0.35 }) {
  return (
    <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stopColor={color} stopOpacity={top} />
      <stop offset="100%" stopColor={color} stopOpacity={0.02} />
    </linearGradient>
  );
}

/** Simple bar chart; the highlighted bar (today / current) is full blue, the rest lighter */
export function SoftBars({
  data,
  x = "label",
  y = "leads",
  name = "Leads",
  height = 260,
  highlight = "isToday",
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{ left: -20, right: 6, top: 10 }}
          barCategoryGap="28%"
        >
          <defs>
            <linearGradient id="bar-hi" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
            <linearGradient id="bar-lo" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#bfdbfe" />
              <stop offset="100%" stopColor="#93c5fd" />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(148,163,196,0.25)" />
          <XAxis dataKey={x} tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis
            tick={AXIS}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(37,99,235,0.06)", radius: 10 }}
            content={<GlassTooltip />}
          />
          <RBar dataKey={y} name={name} radius={[10, 10, 4, 4]} maxBarSize={44}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={d[highlight] ? "url(#bar-hi)" : "url(#bar-lo)"}
              />
            ))}
          </RBar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Smooth area, optional dashed target line */
export function SoftArea({
  data,
  x = "label",
  y = "leads",
  name = "Leads",
  color = "#2563eb",
  target = false,
  height = 260,
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ left: -20, right: 8, top: 10 }}>
          <defs>
            <Grad id="area-main" color={color} />
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(148,163,196,0.25)" />
          <XAxis dataKey={x} tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis
            tick={AXIS}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<GlassTooltip />} />
          <Area
            type="monotone"
            dataKey={y}
            name={name}
            stroke={color}
            strokeWidth={3}
            fill="url(#area-main)"
            dot={{ r: 4, strokeWidth: 2.5, fill: "#fff" }}
            activeDot={{ r: 6 }}
          />
          {target && (
            <Line
              type="monotone"
              dataKey="target"
              name="Target"
              stroke="#f97316"
              strokeWidth={2}
              strokeDasharray="6 6"
              dot={false}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Lead types over time (stacked look, one area per type) */
export function TypeAreas({ data, height = 280 }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ left: -18, right: 8, top: 10 }}>
          <defs>
            {CAT_SERIES.map((s) => (
              <Grad
                key={s.key}
                id={`fill-${s.key}`}
                color={s.color}
                top={0.28}
              />
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(148,163,196,0.25)" />
          <XAxis
            dataKey="label"
            tick={AXIS}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={AXIS}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<GlassTooltip />} />
          <Legend
            iconType="circle"
            iconSize={9}
            wrapperStyle={{ fontSize: 12.5, paddingTop: 8 }}
          />
          {CAT_SERIES.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2.5}
              fill={`url(#fill-${s.key})`}
              dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
              activeDot={{ r: 5 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Leads per employee, stacked by lead type (horizontal, so long names fit) */
export function EmployeeBars({ data, stacked = true, height }) {
  const h = height || Math.max(220, data.length * 34 + 40);
  return (
    <div style={{ height: h }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 4, right: 16, top: 4 }}
          barCategoryGap="26%"
        >
          <defs>
            <linearGradient id="emp-total" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#93c5fd" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>
          <CartesianGrid horizontal={false} stroke="rgba(148,163,196,0.25)" />
          <XAxis
            type="number"
            tick={AXIS}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ ...AXIS, fill: "#3f4a63" }}
            axisLine={false}
            tickLine={false}
            width={110}
            interval={0}
          />
          <Tooltip
            cursor={{ fill: "rgba(37,99,235,0.06)" }}
            content={<GlassTooltip />}
          />
          {stacked ? (
            CAT_SERIES.map((s, i) => (
              <RBar
                key={s.key}
                dataKey={s.key}
                name={s.name}
                stackId="a"
                fill={s.color}
                radius={i === CAT_SERIES.length - 1 ? [0, 8, 8, 0] : 0}
                maxBarSize={22}
              />
            ))
          ) : (
            <RBar
              dataKey="total"
              name="Leads"
              fill="url(#emp-total)"
              radius={[0, 8, 8, 0]}
              maxBarSize={22}
            />
          )}
          {stacked && (
            <Legend
              iconType="circle"
              iconSize={9}
              wrapperStyle={{ fontSize: 12.5, paddingTop: 6 }}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Donut with the big number in the middle */
export function Donut({ data, center, sub, height = 220 }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={total ? data : [{ name: "None", value: 1, color: "#e2e8f0" }]}
            dataKey="value"
            nameKey="name"
            innerRadius="64%"
            outerRadius="90%"
            paddingAngle={total ? 3 : 0}
            cornerRadius={8}
            stroke="none"
            startAngle={90}
            endAngle={-270}
          >
            {(total ? data : [{ color: "#e2e8f0" }]).map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          {total > 0 && <Tooltip content={<GlassTooltip suffix="people" />} />}
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="num text-[30px] font-extrabold text-ink leading-none">
          {center}
        </span>
        {sub && <span className="text-xs text-muted mt-1">{sub}</span>}
      </div>
    </div>
  );
}
