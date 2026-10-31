// Admin daily work screen: pick an employee, go through their leads, set a status.
import { useEffect, useMemo, useState } from "react";
import { Search, ChevronRight, CalendarDays } from "lucide-react";
import { useApi } from "../../lib/api";
import { fmtDate, leadCategory, num, todayKey } from "../../lib/format";
import { Avatar, Badge, Button, Empty, ErrorNote, Input, PageHeader, RefreshButton, Spinner, Tabs, cx } from "../../components/ui";
import StatusSelector from "../../components/StatusSelector";
import LeadDetails from "../../components/LeadDetails";

function LeadCard({ lead, employee }) {
  return (
    <article className="card overflow-hidden">
      <header className="flex flex-wrap items-start justify-between gap-3 px-4 sm:px-6 pt-5">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={employee?.name || lead.employee?.fullName || ""} size={46} soft />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-[17px] truncate">{employee?.name || lead.employee?.fullName}</span>
              <Badge>{leadCategory(lead.leadType)}</Badge>
              <span className="text-muted text-[13px]">#{lead.id}</span>
            </div>
            <div className="text-muted text-[13px]">{lead.employeeId}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted">Contact date</div>
          <div className="flex items-center gap-1.5 font-semibold text-[14px]"><CalendarDays size={15} className="text-ink-soft" />{fmtDate(lead.date)}</div>
        </div>
      </header>
      <h3 className="px-4 sm:px-6 pt-3 pb-4 text-[16px] font-bold break-words">{lead.subjectLine}</h3>
      <div className="px-4 sm:px-6 pb-5">
        <LeadDetails lead={lead} />
      </div>
      <footer className="flex flex-wrap items-center gap-3 px-4 sm:px-6 py-3.5 border-t border-line bg-[#f9fbfe]">
        <span className="font-semibold text-[14px]">Status</span>
        <StatusSelector lead={lead} className="w-48" />
      </footer>
    </article>
  );
}

export default function LeadReview() {
  const [date, setDate] = useState(todayKey());
  const [scope, setScope] = useState("day");
  const [emp, setEmp] = useState(null);
  const [q, setQ] = useState("");

  const summary = useApi(`/leads/review/summary?date=${date}`, { ttl: 60 * 1000 });
  const employees = summary.data?.employees || [];
  const countOf = (e) => (scope === "day" ? e.dayCount : e.olderPending);
  const visible = useMemo(() => {
    const s = q.trim().toLowerCase();
    return employees.filter((e) => countOf(e) > 0 && (!s || e.name.toLowerCase().includes(s) || e.employeeId.toLowerCase().includes(s)));
  }, [employees, scope, q]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!summary.data) return;
    if (!emp || !visible.some((e) => e.employeeId === emp)) setEmp(visible[0]?.employeeId || null);
  }, [summary.data, scope]); // eslint-disable-line react-hooks/exhaustive-deps

  const [limit, setLimit] = useState(20);
  useEffect(() => setLimit(20), [emp, scope, date]);
  const leads = useApi(emp ? `/leads/review/leads?employeeId=${emp}&scope=${scope}&date=${date}&limit=${limit}` : null, { ttl: 60 * 1000, keepPrevious: limit > 20 });
  const totalDay = employees.reduce((s, e) => s + e.dayCount, 0);
  const totalDayPending = employees.reduce((s, e) => s + e.dayPending, 0);
  const totalOlder = employees.reduce((s, e) => s + e.olderPending, 0);
  const current = employees.find((e) => e.employeeId === emp);

  return (
    <>
      <PageHeader
        title="Lead review"
        subtitle="Give each lead a status: Active, No Response or Leave Out."
        actions={<>
          <Input type="date" value={date} max={todayKey()} onChange={(e) => e.target.value && setDate(e.target.value)} className="w-44" aria-label="Day" />
          <RefreshButton onClick={() => { summary.reload(); leads.reload(); }} spinning={summary.refreshing || leads.refreshing} />
        </>}
      />
      <Tabs
        value={scope}
        onChange={setScope}
        tabs={[
          { value: "day", label: date === todayKey() ? "Today's leads" : `Leads of ${fmtDate(`${date}T12:00:00-06:00`, "MMM d")}`, count: totalDay },
          { value: "pending", label: "Older leads without status", count: totalOlder },
        ]}
      />
      <ErrorNote error={summary.error} onRetry={summary.reload} />
      {summary.loading ? <Spinner /> : !employees.some((e) => countOf(e) > 0) ? (
        <div className="card">
          <Empty title={scope === "day" ? "No leads uploaded on this day" : "Every older lead has a status"}>
            {scope === "day" ? "Pick another day above, or check the older leads tab." : "New uploads will show up under today's leads."}
          </Empty>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[320px_minmax(0,1fr)] gap-5 items-start">
          <aside className="card p-3 lg:sticky lg:top-24">
            <div className="relative mb-2">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or ID…" className="pl-9" />
            </div>
            {scope === "day" && <p className="px-2 pt-1 pb-2 text-[13px] text-muted">{num(totalDayPending)} of {num(totalDay)} still pending</p>}
            <ul className="max-h-[50vh] lg:max-h-[calc(100vh-260px)] overflow-y-auto -mx-1 px-1">
              {visible.map((e) => (
                <li key={e.employeeId}>
                  <button
                    onClick={() => setEmp(e.employeeId)}
                    className={cx("w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left mb-1 border-l-[3px] transition", emp === e.employeeId ? "bg-blue-soft border-blue" : "border-transparent hover:bg-paper")}
                  >
                    <Avatar name={e.name} size={36} soft />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold truncate">{e.name}</span>
                      <span className="block text-xs text-muted">{e.employeeId}</span>
                    </span>
                    <span className="text-right shrink-0">
                      <span className="num block font-bold">{countOf(e)}</span>
                      {scope === "day" && e.dayPending > 0 && <span className="num block text-xs text-noresp font-medium">{e.dayPending} pending</span>}
                    </span>
                    <ChevronRight size={16} className="text-muted shrink-0" />
                  </button>
                </li>
              ))}
              {!visible.length && <li className="text-center text-muted py-6 text-[13px]">No employee matches "{q}"</li>}
            </ul>
          </aside>

          <div className="min-w-0">
            {current && leads.data && leads.data.total > leads.data.leads.length && (
              <p className="text-[13px] text-muted mb-3">Showing the newest {leads.data.leads.length} of {num(leads.data.total)} for {current.name}</p>
            )}
            <ErrorNote error={leads.error} onRetry={leads.reload} />
            {leads.loading ? <Spinner /> : (
              <div className="space-y-4">
                {(leads.data?.leads || []).map((l) => <LeadCard key={l.id} lead={l} employee={current} />)}
                {leads.data && leads.data.total > leads.data.leads.length && (
                  <div className="text-center pt-1">
                    <Button onClick={() => setLimit((n) => n + 20)} loading={leads.refreshing}>Show 20 more ({num(leads.data.total - leads.data.leads.length)} left)</Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
