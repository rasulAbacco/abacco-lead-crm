// Incentive leaderboard + "who earned what" summary (same calculation as the server).
import { useState } from "react";
import { Trophy, Medal } from "lucide-react";
import { useApi } from "../lib/api";
import { getSession } from "../lib/session";
import { money, num, recentMonths, leadCategory, fmtDate } from "../lib/format";
import { Avatar, Panel, Select, Spinner, Empty, Tabs, TH, TD, ErrorNote, cx } from "./ui";

const MEDAL = ["text-[#f5b301]", "text-[#9aa4b2]", "text-[#cd7f32]"];

export default function Leaderboard() {
  const months = recentMonths(4);
  const me = getSession()?.employeeId;
  const [month, setMonth] = useState(months[0].key);
  const [period, setPeriod] = useState("month");
  const [sort, setSort] = useState("amount_desc");
  const [tab, setTab] = useState("board");

  const q = period === "today" ? `period=today&sort=${sort}` : `period=month&month=${month}&sort=${sort}`;
  const board = useApi(tab === "board" ? `/incentives/leaderboard?${q}` : null, { ttl: 2 * 60 * 1000 });
  const summary = useApi(tab === "summary" ? `/incentives/summary?month=${month}` : null, { ttl: 2 * 60 * 1000 });
  const cols = board.data?.columns || [];

  return (
    <Panel
      title="Incentive leaderboard"
      icon={Trophy}
      iconTone="orange"
      bodyClass="p-0"
      actions={
        <div className="flex flex-wrap gap-2">
          {tab === "board" && (
            <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="h-9 w-28 text-[13px]" aria-label="Period">
              <option value="month">Month</option>
              <option value="today">Today</option>
            </Select>
          )}
          {(period === "month" || tab === "summary") && (
            <Select value={month} onChange={(e) => setMonth(e.target.value)} className="h-9 w-40 text-[13px]" aria-label="Month">
              {months.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
            </Select>
          )}
          {tab === "board" && (
            <Select value={sort} onChange={(e) => setSort(e.target.value)} className="h-9 w-40 text-[13px]" aria-label="Sort">
              <option value="amount_desc">Highest amount</option>
              <option value="leads_desc">Most leads</option>
              <option value="name_asc">Name</option>
            </Select>
          )}
        </div>
      }
    >
      <div className="px-5 pt-1">
        <Tabs tabs={[{ value: "board", label: "Ranking" }, { value: "summary", label: "Who earned what" }]} value={tab} onChange={setTab} />
      </div>

      {tab === "board" && (
        <>
          <ErrorNote error={board.error} onRetry={board.reload} />
          {board.loading ? <Spinner /> : !board.data?.results?.length ? <Empty title="No leads in this period yet" /> : (
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr>
                  <TH className="w-12">#</TH>
                  <TH>Employee</TH>
                  <TH className="text-right w-20">Leads</TH>
                  {cols.map((c) => <TH key={c} className="text-right hidden lg:table-cell w-20">{money(c)}</TH>)}
                  <TH className="text-right w-32">Total earned</TH>
                </tr>
              </thead>
              <tbody>
                {board.data.results.map((r, i) => (
                  <tr key={r.employeeId} className={cx(r.employeeId === me && "bg-blue-soft/50")}>
                    <TD className="num text-muted">{i < 3 && r.totalAmount > 0 ? <Medal size={20} className={MEDAL[i]} aria-label={`Rank ${i + 1}`} /> : i + 1}</TD>
                    <TD>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={r.name} size={26} />
                        <span className="font-semibold truncate">{r.name}</span>
                        <span className="text-muted text-xs hidden sm:inline">{r.employeeId}</span>
                      </div>
                    </TD>
                    <TD className="num text-right">{num(r.totalLeads)}</TD>
                    {cols.map((c) => (
                      <TD key={c} className="num text-right text-ink-soft hidden lg:table-cell">{r.countsByAmount?.[c] ? `${r.countsByAmount[c]}×` : "—"}</TD>
                    ))}
                    <TD className="text-right">
                      <span className={cx("num inline-flex rounded-md px-2.5 py-1 font-bold", r.totalAmount > 0 ? "bg-active-soft text-active" : "bg-pending-soft text-ink-soft")}>{money(r.totalAmount)}</span>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {tab === "summary" && (
        <div className="p-5 pt-0">
          <ErrorNote error={summary.error} onRetry={summary.reload} />
          {summary.loading ? <Spinner /> : (
            <div className="space-y-5">
              {summary.data?.monthlyDoubleTarget?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Double target bonus</h3>
                  <div className="flex flex-wrap gap-2">
                    {summary.data.monthlyDoubleTarget.map((d) => (
                      <span key={d.employeeId} className="rounded-lg border border-active/25 bg-active-soft px-3 py-1.5 text-[13px]">{d.name}: {num(d.monthlyLeads)} leads, <b>{money(d.total)}</b></span>
                    ))}
                  </div>
                </div>
              )}
              {!summary.data?.rules?.length && !summary.data?.monthlyDoubleTarget?.length && <Empty title="No incentives earned in this month yet" />}
              {summary.data?.rules?.map((r) => (
                <div key={r.ruleId}>
                  <h3 className="font-semibold">
                    {leadCategory(r.leadType)}: {r.leadsRequired} leads in a day earns {money(r.amount)}
                    {r.description && <span className="text-muted font-normal">, {r.description}</span>}
                  </h3>
                  <table className="w-full text-sm mt-2 table-fixed">
                    <thead><tr><TH>Employee</TH><TH className="w-28">Day</TH><TH className="text-right w-16">Leads</TH><TH className="text-right w-16">Times</TH><TH className="text-right w-24">Amount</TH></tr></thead>
                    <tbody>
                      {r.achievers.map((a, i) => (
                        <tr key={i}>
                          <TD className="truncate">{a.name}</TD>
                          <TD>{fmtDate(`${a.date}T12:00:00-06:00`, "MMM d")}</TD>
                          <TD className="num text-right">{a.count}</TD>
                          <TD className="num text-right">{a.times}</TD>
                          <TD className="num text-right font-semibold">{money(a.total)}</TD>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
