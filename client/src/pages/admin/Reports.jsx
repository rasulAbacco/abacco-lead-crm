import { useState } from "react";
import { Download } from "lucide-react";
import { download, useApi } from "../../lib/api";
import { num, recentMonths } from "../../lib/format";
import { Button, Empty, ErrorNote, PageHeader, Panel, Select, Spinner, Tabs, TH, TD, useToast, cx } from "../../components/ui";
import TeamsAdmin from "./TeamsAdmin";

function MonthlyReport() {
  const toast = useToast();
  const months = recentMonths(4);
  const [key, setKey] = useState(months[0].key);
  const [y, m] = key.split("-").map(Number);
  const { data, loading, error, reload } = useApi(`/reports/monthly?year=${y}&month=${m}`);
  const [busy, setBusy] = useState(false);
  const rows = data?.rows || [];
  const sum = (k) => rows.reduce((s, r) => s + (r[k] || 0), 0);

  return (
    <Panel
      title={`Employee report, ${data?.label || ""}`}
      bodyClass="p-0"
      actions={
        <div className="flex gap-2">
          <Select value={key} onChange={(e) => setKey(e.target.value)} className="h-8 w-auto text-[13px]" aria-label="Month">
            {months.map((mm) => <option key={mm.key} value={mm.key}>{mm.label}</option>)}
          </Select>
          <Button size="sm" icon={Download} loading={busy} onClick={async () => {
            setBusy(true);
            try { await download(`/reports/monthly/export?year=${y}&month=${m}`, `report-${key}.xlsx`); } catch (e) { toast(e.message, "error"); } finally { setBusy(false); }
          }}>Excel</Button>
        </div>
      }
    >
      <ErrorNote error={error} onRetry={reload} />
      {loading ? <Spinner /> : !rows.length ? <Empty title="No leads in this month" /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <TH>Employee</TH><TH className="text-right">Target</TH><TH className="text-right">Leads</TH><TH className="text-right">Achieved</TH>
                <TH className="text-right">Assoc.</TH><TH className="text-right">Attend.</TH><TH className="text-right">Industry</TH><TH className="text-right">Member</TH>
                <TH className="text-right">Active</TH><TH className="text-right">No resp.</TH><TH className="text-right">Leave out</TH><TH className="text-right">Pending</TH>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.employeeId} className={cx(r.achievement !== null && r.achievement < 50 && "bg-noresp-soft/50")}>
                  <TD><span className="font-medium">{r.name}</span><span className="text-xs text-muted ml-2">{r.employeeId}</span></TD>
                  <TD className="num text-right text-ink-soft">{r.target || "—"}</TD>
                  <TD className="num text-right font-semibold">{num(r.totalLeads)}</TD>
                  <TD className={cx("num text-right", r.achievement >= 100 && "text-active font-medium")}>{r.achievement === null ? "—" : `${r.achievement}%`}</TD>
                  <TD className="num text-right">{r.association}</TD>
                  <TD className="num text-right">{r.attendees}</TD>
                  <TD className="num text-right">{r.industry}</TD>
                  <TD className="num text-right">{r.memberAttendees}</TD>
                  <TD className="num text-right text-active">{r.active}</TD>
                  <TD className="num text-right text-noresp">{r.noResponse}</TD>
                  <TD className="num text-right text-leave">{r.leaveOut}</TD>
                  <TD className="num text-right text-pending">{r.pending}</TD>
                </tr>
              ))}
              <tr className="font-semibold bg-paper/60">
                <TD>Total</TD><TD className="num text-right">{num(sum("target"))}</TD><TD className="num text-right">{num(sum("totalLeads"))}</TD><TD />
                <TD className="num text-right">{num(sum("association"))}</TD><TD className="num text-right">{num(sum("attendees"))}</TD><TD className="num text-right">{num(sum("industry"))}</TD><TD className="num text-right">{num(sum("memberAttendees"))}</TD>
                <TD className="num text-right">{num(sum("active"))}</TD><TD className="num text-right">{num(sum("noResponse"))}</TD><TD className="num text-right">{num(sum("leaveOut"))}</TD><TD className="num text-right">{num(sum("pending"))}</TD>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted px-5 py-3 border-t border-line">Rows highlighted in amber are below 50% of their target.</p>
    </Panel>
  );
}

export default function Reports() {
  const [tab, setTab] = useState("monthly");
  return (
    <>
      <PageHeader title="Reports" subtitle="Monthly employee results and team reports." />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: "monthly", label: "Monthly report" }, { value: "teams", label: "Teams" }]} />
      {tab === "monthly" ? <MonthlyReport /> : <TeamsAdmin />}
    </>
  );
}
