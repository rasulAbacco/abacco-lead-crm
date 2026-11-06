import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FileUp,
  Users,
  Clock,
  Target,
  BarChart3,
  ArrowUp,
  ArrowDown,
  CalendarCheck,
  Users2,
  PieChart as PieIcon,
  UserRound,
} from "lucide-react";
import { useApi } from "../../lib/api";
import { fmtDate, num } from "../../lib/format";
import {
  Bar,
  Button,
  ErrorNote,
  PageHeader,
  Panel,
  RefreshButton,
  Segmented,
  Select,
  Spinner,
  StatCard,
} from "../../components/ui";
import { Donut, EmployeeBars, TypeAreas } from "../../components/charts";
import TeamTable from "../../components/TeamTable";
import Leaderboard from "../../components/Leaderboard";

function Trend({ now, before, invert = false }) {
  if (!before) return null;
  const pct = Math.round(((now - before) / before) * 100);
  if (!isFinite(pct) || pct === 0) return null;
  const up = pct > 0;
  const good = invert ? !up : up;
  return (
    <span
      title="Compared with yesterday"
      className={`inline-flex items-center gap-0.5 text-xs font-semibold mt-1 ${good ? "text-active" : "text-leave"}`}
    >
      {up ? <ArrowUp size={13} /> : <ArrowDown size={13} />} {Math.abs(pct)}%
    </span>
  );
}

function LeadsChart({ data, view }) {
  const rows =
    view === "week"
      ? data.weekly
      : data.months.map((m) => ({
          ...m,
          label: m.label.split(" ")[0].slice(0, 3),
          tip: m.label,
        }));
  return <TypeAreas data={rows} />;
}

/* Achievement split for the donut */
function achievementSplit(rows) {
  const withTarget = rows.filter((r) => r.target > 0);
  const done = withTarget.filter((r) => r.achievementRate >= 100).length;
  const half = withTarget.filter(
    (r) => r.achievementRate >= 50 && r.achievementRate < 100,
  ).length;
  return [
    { name: "Target reached", value: done, color: "#B9F12F" },
    { name: "Halfway or more", value: half, color: "#0B3048" },
    {
      name: "Below halfway",
      value: withTarget.length - done - half,
      color: "#D8DAD5",
    },
  ];
}

export default function AdminDashboard() {
  const stats = useApi("/employees/stats");
  const summary = useApi("/leads/summary", { ttl: 2 * 60 * 1000 });
  const review = useApi("/leads/review/summary");
  const today = useApi("/attendance/admin/today", { ttl: 2 * 60 * 1000 });
  const [view, setView] = useState("week");
  const [empView, setEmpView] = useState("month");
  const refresh = () => {
    stats.reload();
    summary.reload();
    review.reload();
    today.reload();
  };

  if (stats.loading) return <Spinner />;
  const rows = stats.data || [];
  const month = rows.reduce((s, r) => s + r.monthlyLeads, 0);
  const withTarget = rows.filter((r) => r.target > 0);
  const achieved = withTarget.filter((r) => r.achievementRate >= 100).length;
  const pendingToday = (review.data?.employees || []).reduce(
    (s, e) => s + e.dayPending,
    0,
  );
  const pendingOlder = (review.data?.employees || []).reduce(
    (s, e) => s + e.olderPending,
    0,
  );
  const weekly = summary.data?.weekly || [];
  const todayCount = summary.data?.today?.total || 0;
  const yesterday = weekly.length > 1 ? weekly[weekly.length - 2]?.total : 0;
  const present = (today.data?.rows || []).filter(
    (r) => r.firstPunchIST || r.clockedIn,
  ).length;

  return (
    <>
      <PageHeader
        title="Dashboard"
        emoji="📊"
        subtitle={`${fmtDate(new Date(), "EEEE, MMMM d")} in US Central time`}
        actions={
          <>
            <RefreshButton
              onClick={refresh}
              spinning={stats.refreshing || summary.refreshing}
            />
            <Link to="/lead-review">
              <Button variant="primary" icon={CalendarCheck}>
                Review leads
              </Button>
            </Link>
          </>
        }
      />
      <ErrorNote error={stats.error} onRetry={stats.reload} />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-6">
        <StatCard
          label="Uploaded today"
          value={num(todayCount)}
          icon={FileUp}
          tone="blue"
          spark={weekly.map((w) => w.total)}
          trend={<Trend now={todayCount} before={yesterday} />}
        />
        <StatCard
          label="This month"
          value={num(month)}
          hint={`${rows.length} employees`}
          icon={Users}
          tone="green"
          spark={(summary.data?.months || []).map((m) => m.total)}
        />
        <StatCard
          label="Waiting for a status"
          value={num(pendingToday + pendingOlder)}
          hint={`${num(pendingToday)} from today`}
          icon={Clock}
          tone="orange"
          valueTone={pendingToday + pendingOlder ? "text-noresp" : ""}
        />
        <StatCard
          label="Reached monthly target"
          value={
            <>
              {achieved}{" "}
              <span className="text-base font-semibold text-muted">
                of {withTarget.length}
              </span>
            </>
          }
          icon={Target}
          tone="violet"
        >
          <div className="mt-2">
            <Bar value={achieved} max={withTarget.length || 1} tone="bg-lime" />
          </div>
        </StatCard>
      </div>

      <div className="grid xl:grid-cols-[1fr_320px] gap-6 mb-6">
        <Panel
          title="Leads by type"
          emoji="📈"
          icon={BarChart3}
          actions={
            <Select
              value={view}
              onChange={(e) => setView(e.target.value)}
              className="h-9 w-40 text-[13px]"
              aria-label="Chart range"
            >
              <option value="week">Last 7 days</option>
              <option value="months">Last 4 months</option>
            </Select>
          }
        >
          {summary.loading ? (
            <Spinner />
          ) : summary.data ? (
            <LeadsChart data={summary.data} view={view} />
          ) : null}
        </Panel>
        <Panel
          title="At work today"
          emoji="🟢"
          icon={Users2}
          iconTone="teal"
          bodyClass="p-0"
          actions={
            <Link
              to="/attendance"
              className="text-[13px] font-semibold text-blue hover:underline"
            >
              Attendance
            </Link>
          }
        >
          <div className="px-5 py-3 border-b border-line text-[13px] text-muted">
            <b className="text-ink num">{present}</b> of{" "}
            {today.data?.rows?.length || 0} punched in or clocked in
          </div>
          <ul className="max-h-72 overflow-y-auto">
            {(today.data?.rows || []).map((r) => (
              <li
                key={r.employeeId}
                className="flex items-center justify-between gap-2 px-5 py-2.5 border-b border-line/70 text-[13px] hover:bg-white/50"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className={`size-2 rounded-full shrink-0 ${r.clockedIn ? "bg-lime ring-2 ring-teal-deep/20" : r.firstPunchIST ? "bg-blue" : "bg-line-strong"}`}
                  />
                  <span className="truncate font-medium">{r.name}</span>
                </span>
                <span className="text-muted num shrink-0">
                  {r.firstPunchIST
                    ? `In ${r.firstPunchIST}`
                    : r.clockInIST
                      ? `Clock ${r.clockInIST}`
                      : "Not in"}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid xl:grid-cols-[1fr_340px] gap-6 mb-6">
        <Panel
          title="Leads by employee"
          emoji="🧑‍💼"
          icon={UserRound}
          iconTone="sky"
          actions={
            <Segmented
              value={empView}
              onChange={setEmpView}
              options={[
                ["today", "Today"],
                ["month", "This month"],
              ]}
            />
          }
        >
          {(() => {
            const data = rows
              .map((r) => ({
                name: r.name.split(" ").slice(0, 2).join(" "),
                tip: `${r.name} (${r.employeeId})`,
                total: empView === "today" ? r.dailyLeads : r.monthlyLeads,
                ...r.categories,
              }))
              .filter((r) => r.total > 0)
              .sort((a, b) => b.total - a.total);
            if (!data.length)
              return (
                <div className="text-center text-muted py-12">
                  No uploads {empView === "today" ? "today" : "this month"} yet.
                </div>
              );
            return <EmployeeBars data={data} stacked={empView === "month"} />;
          })()}
        </Panel>
        <Panel
          title="Target achievement"
          emoji="🎯"
          icon={PieIcon}
          iconTone="violet"
        >
          {(() => {
            const split = achievementSplit(rows);
            return (
              <>
                <Donut
                  data={split}
                  center={`${withTarget.length ? Math.round((achieved / withTarget.length) * 100) : 0}%`}
                  sub="reached target"
                />
                <ul className="mt-3 space-y-2">
                  {split.map((d) => (
                    <li
                      key={d.name}
                      className="glass-inset !rounded-xl flex items-center justify-between px-3 py-2 text-[13px]"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ background: d.color }}
                        />
                        {d.name}
                      </span>
                      <b className="num">{d.value}</b>
                    </li>
                  ))}
                </ul>
              </>
            );
          })()}
        </Panel>
      </div>

      <Panel
        title="Team this month"
        emoji="👥"
        icon={Users}
        bodyClass="p-0"
        className="mb-6"
      >
        <TeamTable rows={rows} linkToLeads showStatuses />
      </Panel>

      <Leaderboard />
    </>
  );
}
