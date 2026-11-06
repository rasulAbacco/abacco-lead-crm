import { useState } from "react";
import {
  Play,
  Archive,
  CalendarRange,
  Mail,
  Hourglass,
  FileText,
  Trash2,
  MailCheck,
  ShieldAlert,
  History,
} from "lucide-react";
import { useApi, useMutation } from "../../lib/api";
import { fmtDateTime, num, timeLeft } from "../../lib/format";
import {
  Button,
  Empty,
  ErrorNote,
  MiniStat,
  PageHeader,
  Panel,
  Pill,
  Spinner,
  StatRow,
  TH,
  TD,
  useToast,
  cx,
} from "../../components/ui";
import { DownloadMonthButton } from "../../components/RetentionBanner";

const STATE = {
  PENDING: { label: "Email not sent yet", tone: "white" },
  NOTIFIED: { label: "Emailed, deleting soon", tone: "lime" },
  DELETED: { label: "Deleted", tone: "teal" },
};

export default function DataRetention() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi("/system/retention", {
    ttl: 60 * 1000,
  });
  const { run, busy } = useMutation();
  const [ran, setRan] = useState(false);

  async function runNow() {
    try {
      await run("/system/retention/run", {
        invalidates: [
          "/system",
          "/leads",
          "/employees",
          "/reports",
          "/incentives",
        ],
      });
      setRan(true);
      reload();
      toast("Check finished");
    } catch (e) {
      toast(e.message, "error");
    }
  }

  if (loading) return <Spinner />;
  const s = data?.settings;
  const kept = data?.keptMonths || [];
  const steps = s && [
    {
      icon: CalendarRange,
      title: `Keep ${s.months} months`,
      text: `Leads uploaded this month and the ${s.months - 1} before it stay in the CRM (US Central dates).`,
    },
    {
      icon: MailCheck,
      title: "Email the oldest month",
      text: `On the 1st, the month that expires is emailed as Excel to ${s.reportEmail}, and everyone sees a download notice.`,
    },
    {
      icon: Trash2,
      title: `Delete after ${s.noticeHours} hours`,
      text: "Then every lead of that month is deleted for good. Whole months only, never single days.",
    },
    {
      icon: ShieldAlert,
      title: "Safe if email fails",
      text: `If the email can't be sent, nothing is deleted and it retries every hour. Login history older than ${s.loginHistoryDays} days is removed.`,
    },
  ];

  return (
    <>
      <PageHeader
        title="Data retention"
        icon={Archive}
        subtitle="How long lead data is kept and what happens to older months."
        actions={
          <Button icon={Play} loading={busy} onClick={runNow}>
            Run check now
          </Button>
        }
      />
      <ErrorNote error={error} onRetry={reload} />
      {data && (
        <>
          <StatRow>
            <MiniStat
              label="Months kept"
              value={s.months}
              icon={CalendarRange}
              tone="teal"
            />
            <MiniStat
              label="Leads kept"
              value={num(kept.reduce((a, m) => a + m.leads, 0))}
              icon={FileText}
            />
            <MiniStat
              label="Expires next"
              value={data.nextExpiry.month}
              hint={`Emailed ${data.nextExpiry.reportOn}`}
              icon={Hourglass}
              tone="lime"
            />
            <MiniStat
              label="Reports go to"
              value={s.reportEmail}
              icon={Mail}
              small
            />
          </StatRow>

          <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {steps.map((st, i) => (
              <div key={st.title} className="card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="num size-8 rounded-full bg-lime text-ink font-extrabold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <st.icon size={20} className="text-teal-deep" />
                </div>
                <h3 className="font-bold text-[15px] mb-1">{st.title}</h3>
                <p className="text-[13px] text-ink-soft leading-relaxed">
                  {st.text}
                </p>
              </div>
            ))}
          </section>

          <Panel title="Months kept now" icon={CalendarRange} className="mb-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {kept.map((m, i) => (
                <div
                  key={`${m.year}-${m.month}`}
                  className={cx(
                    "rounded-2xl border p-4",
                    i === 0
                      ? "bg-teal-deep border-teal-deep text-white"
                      : "bg-pearl/60 border-line",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{m.label}</span>
                    {i === 0 && (
                      <span className="text-[11px] font-bold text-lime">
                        Expires next
                      </span>
                    )}
                    {i === kept.length - 1 && (
                      <span className="text-[11px] font-bold text-teal-deep">
                        This month
                      </span>
                    )}
                  </div>
                  <div className="num mt-1 font-[family-name:var(--font-display)] text-[26px] font-extrabold">
                    {num(m.leads)}
                  </div>
                  <div
                    className={cx(
                      "text-[12px]",
                      i === 0 ? "text-pearl/70" : "text-muted",
                    )}
                  >
                    leads uploaded
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[13px] text-muted">
              {data.nextExpiry.month} will be emailed on{" "}
              {data.nextExpiry.reportOn} and deleted {s.noticeHours} hours
              later.
            </p>
          </Panel>

          <Panel title="History" icon={History} bodyClass="p-0">
            {!data.runs.length ? (
              <Empty title="No month has expired yet" />
            ) : (
              <>
                <table className="hidden lg:table w-full text-sm">
                  <thead>
                    <tr>
                      <TH>Month</TH>
                      <TH>State</TH>
                      <TH className="text-right">Leads</TH>
                      <TH>Emailed</TH>
                      <TH>Deleted / deletes</TH>
                      <TH />
                    </tr>
                  </thead>
                  <tbody>
                    {data.runs.map((r) => (
                      <tr key={r.id} className="hover:bg-pearl/60">
                        <TD className="font-semibold whitespace-nowrap">
                          {r.label}
                        </TD>
                        <TD>
                          <Pill tone={STATE[r.status].tone}>
                            {STATE[r.status].label}
                          </Pill>
                          {r.emailError && r.status === "PENDING" && (
                            <div
                              className="text-xs text-muted mt-1 max-w-64 truncate"
                              title={r.emailError}
                            >
                              {r.emailError}
                            </div>
                          )}
                        </TD>
                        <TD className="num text-right font-semibold">
                          {num(r.deletedCount ?? r.leadCount)}
                        </TD>
                        <TD className="whitespace-nowrap text-ink-soft">
                          {r.emailedAt ? fmtDateTime(r.emailedAt) : "—"}
                        </TD>
                        <TD className="whitespace-nowrap text-ink-soft">
                          {r.status === "DELETED"
                            ? fmtDateTime(r.deletedAt)
                            : r.deleteAfter
                              ? `${fmtDateTime(r.deleteAfter)} (${timeLeft(r.deleteAfter)} left)`
                              : "—"}
                        </TD>
                        <TD className="text-right">
                          {r.status !== "DELETED" && (
                            <DownloadMonthButton notice={r} isAdmin short />
                          )}
                        </TD>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <ul className="lg:hidden divide-y divide-line">
                  {data.runs.map((r) => (
                    <li key={r.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{r.label}</span>
                        <Pill tone={STATE[r.status].tone}>
                          {STATE[r.status].label}
                        </Pill>
                      </div>
                      <div className="text-[12.5px] text-ink-soft">
                        {num(r.deletedCount ?? r.leadCount)} leads
                        {r.emailedAt
                          ? `, emailed ${fmtDateTime(r.emailedAt)}`
                          : ""}
                      </div>
                      <div className="text-[12.5px] text-muted">
                        {r.status === "DELETED"
                          ? `Deleted ${fmtDateTime(r.deletedAt)}`
                          : r.deleteAfter
                            ? `Deletes ${fmtDateTime(r.deleteAfter)} (${timeLeft(r.deleteAfter)} left)`
                            : ""}
                      </div>
                      {r.status !== "DELETED" && (
                        <DownloadMonthButton notice={r} isAdmin short />
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Panel>
          {ran && (
            <p className="text-[13px] text-muted mt-3">
              Last manual check ran just now.
            </p>
          )}
        </>
      )}
    </>
  );
}
