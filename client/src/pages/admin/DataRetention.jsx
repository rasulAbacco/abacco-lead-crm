import { useState } from "react";
import { Play } from "lucide-react";
import { useApi, useMutation } from "../../lib/api";
import { fmtDateTime, num, timeLeft } from "../../lib/format";
import { Button, Empty, ErrorNote, PageHeader, Panel, Spinner, TH, TD, useToast, cx } from "../../components/ui";
import { DownloadMonthButton } from "../../components/RetentionBanner";

const STATE = {
  PENDING: { label: "Email not sent yet", tone: "text-leave" },
  NOTIFIED: { label: "Report emailed, deleting soon", tone: "text-noresp" },
  DELETED: { label: "Deleted", tone: "text-muted" },
};

export default function DataRetention() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi("/system/retention", { ttl: 60 * 1000 });
  const { run, busy } = useMutation();
  const [ran, setRan] = useState(false);

  async function runNow() {
    try {
      await run("/system/retention/run", { invalidates: ["/system", "/leads", "/employees", "/reports", "/incentives"] });
      setRan(true);
      reload();
      toast("Check finished");
    } catch (e) {
      toast(e.message, "error");
    }
  }

  if (loading) return <Spinner />;
  const s = data?.settings;
  return (
    <>
      <PageHeader
        title="Data retention"
        subtitle="How long lead data is kept and what happens to older months."
        actions={<Button icon={Play} loading={busy} onClick={runNow}>Run check now</Button>}
      />
      <ErrorNote error={error} onRetry={reload} />
      {data && (
        <>
          <Panel title="How it works" className="mb-6">
            <ol className="space-y-2 list-decimal pl-5 max-w-3xl text-ink-soft">
              <li>The CRM keeps leads uploaded in the last <b className="text-ink">{s.months} calendar months</b> (this month and the {s.months - 1} before it), by upload date in US Central time.</li>
              <li>On the 1st of each month the oldest month expires. Its full Excel report is emailed to <b className="text-ink">{s.reportEmail}</b>, and everyone sees a notice with a download button.</li>
              <li><b className="text-ink">{s.noticeHours} hours</b> after the email, every lead of that month is permanently deleted. A whole month is always deleted together, never single days.</li>
              <li>If the email cannot be sent, nothing is deleted. The CRM tries again every hour.</li>
              <li>Login history older than {s.loginHistoryDays} days is removed automatically.</li>
            </ol>
          </Panel>

          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6 mb-6">
            <Panel title="Months kept now" bodyClass="p-0">
              <table className="w-full text-sm">
                <thead><tr><TH>Month</TH><TH className="text-right">Leads uploaded</TH></tr></thead>
                <tbody>
                  {data.keptMonths.map((m, i) => (
                    <tr key={`${m.year}-${m.month}`}>
                      <TD>
                        {m.label}
                        {i === 0 && <span className="ml-2 text-xs text-noresp">expires next</span>}
                      </TD>
                      <TD className="num text-right">{num(m.leads)}</TD>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="px-5 py-3 text-[13px] text-muted border-t border-line">
                {data.nextExpiry.month} will be emailed on {data.nextExpiry.reportOn} and deleted {s.noticeHours} hours later.
              </p>
            </Panel>

            <Panel title="History" bodyClass="p-0">
              {!data.runs.length ? <Empty title="No month has expired yet" /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr><TH>Month</TH><TH>State</TH><TH className="text-right">Leads</TH><TH>Emailed</TH><TH>Delete</TH><TH /></tr></thead>
                    <tbody>
                      {data.runs.map((r) => (
                        <tr key={r.id}>
                          <TD className="font-medium whitespace-nowrap">{r.label}</TD>
                          <TD className={cx("whitespace-nowrap", STATE[r.status].tone)}>
                            {STATE[r.status].label}
                            {r.emailError && r.status === "PENDING" && <div className="text-xs text-leave max-w-56 truncate" title={r.emailError}>{r.emailError}</div>}
                          </TD>
                          <TD className="num text-right">{num(r.deletedCount ?? r.leadCount)}</TD>
                          <TD className="whitespace-nowrap text-ink-soft">{r.emailedAt ? fmtDateTime(r.emailedAt) : "—"}</TD>
                          <TD className="whitespace-nowrap text-ink-soft">
                            {r.status === "DELETED" ? fmtDateTime(r.deletedAt) : r.deleteAfter ? `${fmtDateTime(r.deleteAfter)} (${timeLeft(r.deleteAfter)})` : "—"}
                          </TD>
                          <TD className="text-right">{r.status !== "DELETED" && <DownloadMonthButton notice={r} isAdmin />}</TD>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </div>
          {ran && <p className="text-[13px] text-muted">Last manual check ran just now.</p>}
        </>
      )}
    </>
  );
}
