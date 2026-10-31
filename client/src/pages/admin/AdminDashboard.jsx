import { useState } from "react";
import { Link } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { FileUp, Users, Clock, Target, BarChart3, ArrowUp, ArrowDown, CalendarCheck, Users2 } from "lucide-react";
import { useApi } from "../../lib/api";
import { fmtDate, num } from "../../lib/format";
import { Bar, Button, ErrorNote, PageHeader, Panel, RefreshButton, Select, Spinner, StatCard } from "../../components/ui";
import TeamTable from "../../components/TeamTable";
import Leaderboard from "../../components/Leaderboard";

const SERIES = [
  { key: "association", name: "Association", color: "#2563eb" },
  { key: "attendees", name: "Attendees", color: "#38bdf8" },
  { key: "industry", name: "Industry", color: "#8b5cf6" },
  { key: "memberAttendees", name: "Member attendees", color: "#64748b" },
];

function Trend({ now, before, invert = false }) {
  if (!before) return null;
  const pct = Math.round(((now - before) / before) * 100);
  if (!isFinite(pct) || pct === 0) return null;
  const up = pct > 0;
  const good = invert ? !up : up;
  return (
    <span title="Compared with yesterday" className={`inline-flex items-center gap-0.5 text-xs font-semibold mt-1 ${good ? "text-active" : "text-leave"}`}>
      {up ? <ArrowUp size={13} /> : <ArrowDown size={13} />} {Math.abs(pct)}%
    </span>
  );
}

function LeadsChart({ data, view }) {
  const rows = view === "week" ? data.weekly : data.months.map((m) => ({ ...m, label: m.label.split(" ")[0].slice(0, 3) }));
  return (
    <div className="h-72">
      <ResponsiveContainer>
        <AreaChart data={rows} margin={{ left: -18, right: 8, top: 10 }}>
          <defs>
            {SERIES.map((s) => (
              <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke="#edf1f7" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6b7690" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#6b7690" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e6ebf3", fontSize: 13 }} />
          <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 13, paddingTop: 8 }} />
          {SERIES.map((s) => (
            <Area key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2.5} fill={`url(#fill-${s.key})`} dot={{ r: 3.5, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 5 }} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function AdminDashboard() {
  const stats = useApi("/employees/stats");
  const summary = useApi("/leads/summary", { ttl: 2 * 60 * 1000 });
  const review = useApi("/leads/review/summary");
  const today = useApi("/attendance/admin/today", { ttl: 2 * 60 * 1000 });
  const [view, setView] = useState("week");
  const refresh = () => { stats.reload(); summary.reload(); review.reload(); today.reload(); };

  if (stats.loading) return <Spinner />;
  const rows = stats.data || [];
  const month = rows.reduce((s, r) => s + r.monthlyLeads, 0);
  const withTarget = rows.filter((r) => r.target > 0);
  const achieved = withTarget.filter((r) => r.achievementRate >= 100).length;
  const pendingToday = (review.data?.employees || []).reduce((s, e) => s + e.dayPending, 0);
  const pendingOlder = (review.data?.employees || []).reduce((s, e) => s + e.olderPending, 0);
  const weekly = summary.data?.weekly || [];
  const todayCount = summary.data?.today?.total || 0;
  const yesterday = weekly.length > 1 ? weekly[weekly.length - 2]?.total : 0;
  const present = (today.data?.rows || []).filter((r) => r.firstPunchIST || r.clockedIn).length;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`${fmtDate(new Date(), "EEEE, MMMM d")} in US Central time`}
        actions={<>
          <RefreshButton onClick={refresh} spinning={stats.refreshing || summary.refreshing} />
          <Link to="/lead-review"><Button variant="primary" icon={CalendarCheck}>Review leads</Button></Link>
        </>}
      />
      <ErrorNote error={stats.error} onRetry={stats.reload} />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Uploaded today" value={num(todayCount)} icon={FileUp} tone="blue" spark={weekly.map((w) => w.total)} trend={<Trend now={todayCount} before={yesterday} />} />
        <StatCard label="This month" value={num(month)} hint={`${rows.length} active employees`} icon={Users} tone="green" spark={(summary.data?.months || []).map((m) => m.total)} />
        <StatCard label="Waiting for a status" value={num(pendingToday + pendingOlder)} hint={`${num(pendingToday)} from today`} icon={Clock} tone="orange" valueTone={pendingToday + pendingOlder ? "text-noresp" : ""} />
        <div className="card p-4 sm:p-5 flex gap-3.5 min-w-0">
          <span className="inline-flex items-center justify-center rounded-xl bg-violet-soft text-violet size-11 shrink-0"><Target size={21} /></span>
          <div className="flex-1 min-w-0">
            <div className="text-muted text-[13px] font-medium">Reached monthly target</div>
            <div className="num text-[28px] font-bold leading-tight">{achieved} <span className="text-base font-semibold text-muted">of {withTarget.length}</span></div>
            <div className="mt-2"><Bar value={achieved} max={withTarget.length || 1} tone="bg-violet" /></div>
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-[1fr_320px] gap-6 mb-6">
        <Panel
          title="Leads by type"
          icon={BarChart3}
          actions={
            <Select value={view} onChange={(e) => setView(e.target.value)} className="h-9 w-40 text-[13px]" aria-label="Chart range">
              <option value="week">Last 7 days</option>
              <option value="months">Last 4 months</option>
            </Select>
          }
        >
          {summary.loading ? <Spinner /> : summary.data ? <LeadsChart data={summary.data} view={view} /> : null}
        </Panel>
        <Panel title="At work today" icon={Users2} iconTone="teal" bodyClass="p-0" actions={<Link to="/attendance" className="text-[13px] font-semibold text-blue hover:underline">Attendance</Link>}>
          <div className="px-5 py-3 border-b border-line text-[13px] text-muted"><b className="text-ink num">{present}</b> of {today.data?.rows?.length || 0} punched in or clocked in</div>
          <ul className="max-h-72 overflow-y-auto">
            {(today.data?.rows || []).map((r) => (
              <li key={r.employeeId} className="flex items-center justify-between gap-2 px-5 py-2.5 border-b border-line/70 text-[13px]">
                <span className="flex items-center gap-2 min-w-0"><span className={`size-2 rounded-full shrink-0 ${r.clockedIn ? "bg-active" : r.firstPunchIST ? "bg-blue" : "bg-line-strong"}`} /><span className="truncate font-medium">{r.name}</span></span>
                <span className="text-muted num shrink-0">{r.firstPunchIST ? `In ${r.firstPunchIST}` : r.clockInIST ? `Clock ${r.clockInIST}` : "Not in"}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Team this month" icon={Users} bodyClass="p-0" className="mb-6">
        <TeamTable rows={rows} linkToLeads showStatuses />
      </Panel>

      <Leaderboard />
    </>
  );
}
