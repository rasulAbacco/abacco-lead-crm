import { useState } from "react";
import { Link } from "react-router-dom";
import {
  UploadCloud,
  FileText,
  BarChart3,
  Target,
  Trophy,
  Gift,
  Users,
  Fingerprint,
  LogIn,
  LogOut,
  Timer,
  Award,
  LineChart,
  Info,
} from "lucide-react";
import { useApi } from "../../lib/api";
import { getSession } from "../../lib/session";
import { fmtDate, money, num } from "../../lib/format";
import {
  Avatar,
  Bar,
  Button,
  ErrorNote,
  PageHeader,
  Panel,
  RefreshButton,
  Segmented,
  Spinner,
  StatCard,
  Empty,
  cx,
} from "../../components/ui";
import { SoftArea, SoftBars } from "../../components/charts";
import Leaderboard from "../../components/Leaderboard";
import TeamTable from "../../components/TeamTable";

const CATS = [
  {
    key: "association",
    label: "Association",
    pct: "associationPercent",
    tone: "bg-teal-deep",
  },
  {
    key: "attendees",
    label: "Attendees",
    pct: "attendeesPercent",
    tone: "bg-lime",
  },
  {
    key: "industry",
    label: "Industry",
    pct: "industryPercent",
    tone: "bg-teal-deep/60",
  },
  {
    key: "memberAttendees",
    label: "Member attendees",
    pct: "memberAttendeesPercent",
    tone: "bg-muted",
  },
];

function TargetMix({ me }) {
  if (!me?.target)
    return (
      <Empty emoji="🎯" title="No monthly target set yet">
        Your admin sets your target and lead mix.
      </Empty>
    );
  const t = me.categoryTargets;
  return (
    <div className="space-y-4">
      {t ? (
        CATS.filter((c) => t[c.key] > 0 || me.categories[c.key] > 0).map(
          (c) => (
            <div key={c.key}>
              <div className="flex justify-between text-[14px] mb-1.5">
                <span className="font-medium">
                  {c.label}{" "}
                  <span className="text-muted font-normal">
                    ({me.distribution[c.pct]}%)
                  </span>
                </span>
                <span className="num text-ink-soft">
                  {num(me.categories[c.key])} / {num(t[c.key])}
                </span>
              </div>
              <Bar
                value={me.categories[c.key]}
                max={t[c.key]}
                tone={me.categories[c.key] >= t[c.key] ? "bg-lime" : c.tone}
                height="h-2.5"
              />
            </div>
          ),
        )
      ) : (
        <div>
          <div className="flex justify-between text-[14px] mb-1.5">
            <span className="font-medium">All lead types</span>
            <span className="num">
              {num(me.monthlyLeads)} / {num(me.target)}
            </span>
          </div>
          <Bar value={me.monthlyLeads} max={me.target} height="h-2.5" />
        </div>
      )}
      <div className="pt-4 border-t border-dashed border-line-strong">
        <div className="flex justify-between text-[14px] mb-1.5">
          <span className="font-semibold">
            Double target bonus ({money(me.doubleTargetBonus)})
          </span>
          <span className="num text-ink-soft">
            {num(me.monthlyLeads)} / {num(me.target * 2)}
          </span>
        </div>
        <Bar
          value={me.monthlyLeads}
          max={me.target * 2}
          tone={me.doubleTargetAchieved ? "bg-lime" : "bg-teal-deep"}
          height="h-2.5"
        />
        <p className="glass-inset !rounded-xl flex items-center gap-2 px-3 py-2 text-[13px] text-ink-soft mt-3">
          {me.doubleTargetAchieved ? (
            <>
              <Info size={15} className="text-teal-deep shrink-0" /> Bonus
              unlocked for this month!
            </>
          ) : (
            <>
              <Info size={15} className="text-blue shrink-0" />{" "}
              {num(Math.max(0, me.target * 2 - me.monthlyLeads))} more leads
              this month to unlock it.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function TodayIncentive({ progress }) {
  const plans = progress?.plans || [];
  if (!plans.length)
    return <Empty emoji="💤" title="No active incentive plan" />;
  return (
    <div className="space-y-5">
      {plans.map((p) => (
        <div key={p.planId}>
          <div
            className={cx("font-semibold", p.description ? "mb-0.5" : "mb-2.5")}
          >
            {p.title}
          </div>
          {p.description && (
            <p className="text-[12.5px] leading-snug text-muted mb-2.5 whitespace-pre-line [overflow-wrap:anywhere]">
              {p.description}
            </p>
          )}
          <div className="space-y-3">
            {p.rules.map((r) => {
              const done = r.count >= r.leadsRequired;
              return (
                <div
                  key={r.id}
                  className="grid grid-cols-[1fr_auto] gap-x-4 items-center"
                >
                  <div className="min-w-0">
                    <div className="flex justify-between gap-2 text-[13px] mb-1">
                      <span className="truncate">
                        {r.leadType}
                        {r.country && (
                          <span className="text-muted">, {r.country}</span>
                        )}
                        {r.attendeesMinCount && (
                          <span className="text-muted">
                            , {r.attendeesMinCount}+ attendees
                          </span>
                        )}
                      </span>
                      <span className="num text-ink-soft shrink-0">
                        {Math.min(r.count, r.leadsRequired)} / {r.leadsRequired}
                      </span>
                    </div>
                    <Bar
                      value={r.count}
                      max={r.leadsRequired}
                      tone={done ? "bg-lime" : "bg-blue"}
                    />
                  </div>
                  <span
                    className={cx(
                      "num text-[14px] font-bold w-[72px] text-right",
                      done ? "text-active" : "text-ink",
                    )}
                  >
                    {money(r.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <p className="glass-inset !rounded-xl flex items-start gap-2 px-3 py-2 text-xs text-muted">
        <Info size={14} className="text-blue shrink-0 mt-px" /> Counts are
        today's uploads by lead type. Country and attendee conditions are
        checked when the amount is calculated.
      </p>
    </div>
  );
}

/* Top 3 achievers of the month: glass podium */
function TopAchievers({ rows }) {
  const top = [...rows]
    .filter((r) => r.monthlyLeads > 0)
    .sort(
      (a, b) =>
        b.monthlyLeads - a.monthlyLeads ||
        b.achievementRate - a.achievementRate,
    )
    .slice(0, 3);
  if (!top.length) {
    return (
      <div className="flex flex-col items-center pt-2 pb-1">
        <div className="flex items-end gap-1.5 mb-4" aria-hidden="true">
          <div className="w-14 h-8 rounded-t-xl bg-pearl border border-line" />
          <div className="w-16 h-12 rounded-t-xl bg-lime flex items-center justify-center text-ink font-bold">
            1
          </div>
          <div className="w-14 h-6 rounded-t-xl bg-pearl border border-line" />
        </div>
        <p className="font-semibold">No uploads this month yet</p>
        <p className="text-muted text-[13px]">
          The first leads of the month put you on top.
        </p>
      </div>
    );
  }
  const order = [top[1], top[0], top[2]].filter(Boolean);
  const style = {
    1: { h: "h-28", bar: "bg-lime text-ink", size: 60 },
    2: { h: "h-20", bar: "bg-teal-deep text-lime", size: 50 },
    3: { h: "h-14", bar: "bg-teal-deep/70 text-white", size: 50 },
  };
  const me = getSession()?.employeeId;
  return (
    <div className="flex items-end justify-center gap-3 sm:gap-6 pt-2">
      {order.map((r) => {
        const rank = top.indexOf(r) + 1;
        const s = style[rank];
        return (
          <div
            key={r.employeeId}
            className="flex flex-col items-center w-24 sm:w-32 min-w-0"
          >
            <div className="relative">
              <Avatar name={r.name} size={s.size} />
            </div>
            <div
              className={cx(
                "mt-3 text-center font-bold text-[13px] truncate w-full",
                r.employeeId === me && "text-blue",
              )}
            >
              {r.employeeId === me ? "You" : r.name}
            </div>
            <div className="num text-xs text-muted">
              {num(r.monthlyLeads)} leads
              {r.target ? `, ${r.achievementRate}%` : ""}
            </div>
            <div
              className={cx(
                "mt-2 w-full rounded-t-2xl flex items-start justify-center pt-2 shadow-[0_12px_24px_-14px_rgba(11,48,72,0.5)]",
                s.h,
                s.bar,
              )}
            >
              <span className="num text-lg font-extrabold">{rank}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* Today + yesterday biometric punch and system clock-in */
function MyAttendance() {
  const { data, loading } = useApi("/attendance/me", { ttl: 2 * 60 * 1000 });
  if (loading) return <Spinner />;
  const label = (i) => (i === 0 ? "Today" : "Yesterday");
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {(data?.days || []).map((d, i) => (
        <div key={d.date} className="glass-inset p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold">{label(i)}</span>
            <span className="text-xs text-muted">
              {fmtDate(`${d.date}T12:00:00-06:00`, "EEE, MMM d")}
            </span>
          </div>
          <div className="space-y-2 text-[13px]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted">
                <LogIn size={15} className="text-active" /> Punch in
              </span>
              <span className="num font-semibold">
                {d.firstPunchIST ? `${d.firstPunchIST} IST` : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted">
                <LogOut size={15} className="text-leave" />{" "}
                {d.status === "IN" ? "Last punch" : "Punch out"}
              </span>
              <span className="num font-semibold">
                {d.lastPunchIST
                  ? `${d.lastPunchIST} IST`
                  : d.status === "IN"
                    ? "Still working"
                    : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted">
                <Timer size={15} className="text-blue" /> Working hours
              </span>
              <span className="num font-bold">
                {d.status === "IN" ? "After punch out" : d.hours || "—"}
              </span>
            </div>
          </div>
          {d.system && (
            <p className="mt-3 pt-3 border-t border-line text-xs text-muted">
              System clock-in {d.system.clockInIST} IST
              {d.system.notClockedOut ? (
                <span className="text-leave font-semibold">
                  , not clocked out
                </span>
              ) : d.system.open ? (
                ", still clocked in"
              ) : (
                `, ${d.system.hours}`
              )}
            </p>
          )}
        </div>
      ))}
      {!data?.hasBiometric && (
        <p className="sm:col-span-2 text-xs text-muted">
          Your biometric card is not linked yet. Ask the admin to add it under
          Attendance.
        </p>
      )}
    </div>
  );
}

/* My lead trend: the old dashboard's weekly / monthly charts in one panel */
function MyTrend() {
  const [view, setView] = useState("week");
  const { data, loading } = useApi("/employees/me/trend", {
    ttl: 2 * 60 * 1000,
  });
  if (loading) return <Spinner />;
  if (!data) return null;
  const week = data.week.map((d) => ({
    ...d,
    tip: fmtDate(`${d.date}T12:00:00-06:00`, "EEE, MMM d"),
  }));
  const weeks = data.weeks.map((w) => ({
    ...w,
    tip: `${w.label} (${w.range})`,
  }));
  const months = data.months;
  const rows = view === "week" ? week : view === "month" ? weeks : months;
  const total = rows.reduce((a, r) => a + r.leads, 0);
  const best = rows.reduce((a, r) => (r.leads > (a?.leads || 0) ? r : a), null);
  const chips = [
    ["Total", num(total)],
    [
      view === "week"
        ? "Best day"
        : view === "month"
          ? "Best week"
          : "Best month",
      best ? `${best.label} (${best.leads})` : "—",
    ],
    view === "months" && data.target
      ? ["Target / month", num(data.target)]
      : [
          view === "week" ? "Days with uploads" : "Weeks with uploads",
          num(rows.filter((r) => r.leads > 0).length),
        ],
  ];
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <Segmented
          value={view}
          onChange={setView}
          options={[
            ["week", "This week"],
            ["month", "This month"],
            ["months", "Monthly"],
          ]}
        />
        <div className="flex flex-wrap gap-2">
          {chips.map(([l, v]) => (
            <span
              key={l}
              className="glass-inset !rounded-full inline-flex items-center gap-1.5 px-3 h-8 text-[12.5px]"
            >
              <span className="text-muted">{l}</span>
              <b className="num text-ink">{v}</b>
            </span>
          ))}
        </div>
      </div>
      {view === "week" && <SoftBars data={week} />}
      {view === "month" && <SoftBars data={weeks} highlight="isCurrent" />}
      {view === "months" && <SoftArea data={months} target={data.target > 0} />}
    </>
  );
}

export default function EmployeeDashboard() {
  const session = getSession();
  const me = useApi("/employees/me/progress");
  const progress = useApi("/incentives/progress/me");
  const team = useApi("/employees/stats");
  const refresh = () => {
    me.reload();
    progress.reload();
    team.reload();
  };

  if (me.loading) return <Spinner />;
  const m = me.data || {};
  const first = (session?.fullName || "").split(" ")[0];
  const spark = (m.last7 || []).map((d) => d.count);
  const incentiveMonth =
    (progress.data?.month?.amount || 0) +
    (m.doubleTargetAchieved ? m.doubleTargetBonus : 0);

  return (
    <>
      <PageHeader
        title={`Hello, ${first}`}
        emoji="👋"
        subtitle={`${fmtDate(new Date(), "EEEE, MMMM d")} in US Central time`}
        actions={
          <>
            <RefreshButton
              onClick={refresh}
              spinning={me.refreshing || team.refreshing}
            />
            <Link to="/leadform">
              <Button variant="primary" icon={UploadCloud}>
                Upload lead
              </Button>
            </Link>
          </>
        }
      />
      <ErrorNote error={me.error} onRetry={me.reload} />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-6">
        <StatCard
          label="Uploaded today"
          value={num(m.dailyLeads)}
          icon={FileText}
          tone="blue"
          spark={spark}
        />
        <StatCard
          label="This month"
          value={num(m.monthlyLeads)}
          hint={m.target ? `Target ${num(m.target)}` : "No target set"}
          icon={BarChart3}
          tone="green"
          spark={spark.map((_, i) =>
            spark.slice(0, i + 1).reduce((a, b) => a + b, 0),
          )}
        />
        <StatCard
          label="Target achieved"
          value={m.target ? `${m.achievementRate}%` : "—"}
          icon={Target}
          tone="orange"
          valueTone={m.achievementRate >= 100 ? "text-active" : ""}
        />
        <StatCard
          label="Incentive this month"
          value={money(incentiveMonth)}
          hint={`Today ${money(progress.data?.today?.amount)}`}
          icon={Trophy}
          tone="violet"
        />
      </div>

      <div className="grid xl:grid-cols-[1.15fr_1fr] gap-6 mb-6">
        <Panel
          title="Top achievers this month"
          emoji="🏆"
          icon={Award}
          iconTone="orange"
        >
          {team.loading ? <Spinner /> : <TopAchievers rows={team.data || []} />}
        </Panel>
        <Panel
          title="My attendance"
          emoji="🗓️"
          icon={Fingerprint}
          iconTone="teal"
        >
          <MyAttendance />
        </Panel>
      </div>

      <Panel
        title="My lead trend"
        emoji="📈"
        icon={LineChart}
        iconTone="sky"
        className="mb-6"
      >
        <MyTrend />
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Panel title="Monthly target" emoji="🎯" icon={Target}>
          {<TargetMix me={m} />}
        </Panel>
        <Panel
          title="Today's incentive progress"
          emoji="💰"
          icon={Gift}
          iconTone="violet"
        >
          {progress.loading ? (
            <Spinner />
          ) : (
            <TodayIncentive progress={progress.data} />
          )}
        </Panel>
      </div>

      <Panel
        title="Team this month"
        emoji="👥"
        icon={Users}
        bodyClass="p-0"
        className="mb-6"
      >
        {team.loading ? <Spinner /> : <TeamTable rows={team.data || []} />}
      </Panel>

      <Leaderboard />
    </>
  );
}
