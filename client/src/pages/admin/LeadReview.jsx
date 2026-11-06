// Admin daily work screen, built as a review queue:
//  1) pick an employee (chips at the top)
//  2) their leads as a compact list (left)
//  3) one lead at a time with the status at the top (right); setting a status can jump to the next lead.
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ArrowLeft,
  Inbox,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useApi } from "../../lib/api";
import { fmtDate, leadCategory, num, todayKey } from "../../lib/format";
import {
  Avatar,
  Badge,
  Button,
  Empty,
  ErrorNote,
  Input,
  PageHeader,
  RefreshButton,
  Spinner,
  StatusBadge,
  STATUS_STYLE,
  Tabs,
  cx,
} from "../../components/ui";
import StatusSelector from "../../components/StatusSelector";
import LeadDetails from "../../components/LeadDetails";

const PAGE = 20;
const AUTO_KEY = "review:autoNext";
const LIST_KEY = "review:listOpen";
const STATUS_NAME = {
  PENDING: "Pending",
  ACTIVE: "Active",
  NO_RESPONSE: "No Response",
  LEAVE_OUT: "Leave Out",
};

/* ---------- slim side strip: one numbered button per lead, coloured by status ---------- */
function QueueRail({
  leads,
  selectedId,
  onSelect,
  total,
  onMore,
  loadingMore,
  onExpand,
}) {
  return (
    <div className="card p-2 flex flex-col items-center gap-1.5">
      <button
        onClick={onExpand}
        className="size-10 rounded-xl bg-teal-deep text-lime hover:bg-teal-deep/90 flex items-center justify-center mb-1"
        title="Show the lead list"
        aria-label="Show the lead list"
      >
        <PanelLeftOpen size={18} />
      </button>
      <div className="flex flex-col items-center gap-1.5 max-h-[calc(100vh-330px)] overflow-y-auto p-1.5 -mx-1">
        {leads.map((l, i) => {
          const on = l.id === selectedId;
          return (
            <button
              key={l.id}
              onClick={() => onSelect(l.id)}
              title={`${i + 1}. ${l.subjectLine} (${STATUS_NAME[l.status] || l.status})`}
              aria-label={`Lead ${i + 1}: ${l.subjectLine}`}
              aria-current={on ? "true" : undefined}
              className={cx(
                "num shrink-0 size-10 rounded-xl border text-[13px] font-bold transition",
                STATUS_STYLE[l.status] || STATUS_STYLE.PENDING,
                on && "ring-[3px] ring-lime ring-offset-2 ring-offset-white",
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      {total > leads.length && (
        <button
          onClick={onMore}
          disabled={loadingMore}
          className="mt-1 text-[11px] font-semibold text-teal-deep hover:bg-lime/40 rounded-lg px-1.5 py-1 disabled:opacity-50"
          title="Load more leads"
        >
          +{Math.min(PAGE, total - leads.length)}
        </button>
      )}
    </div>
  );
}

/* ---------- employee chips ---------- */
function EmployeeStrip({ employees, value, onChange, countOf, scope }) {
  const [q, setQ] = useState("");
  const list = employees.filter(
    (e) =>
      countOf(e) > 0 &&
      (!q ||
        e.name.toLowerCase().includes(q.toLowerCase()) ||
        e.employeeId.toLowerCase().includes(q.toLowerCase())),
  );
  return (
    <div className="card p-3 mb-5">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative md:w-60 shrink-0">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find employee"
            className="pl-9"
            aria-label="Find employee"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mb-1 min-w-0">
          {list.map((e) => {
            const on = e.employeeId === value;
            const pending = scope === "day" ? e.dayPending : e.olderPending;
            return (
              <button
                key={e.employeeId}
                onClick={() => onChange(e.employeeId)}
                aria-pressed={on}
                className={cx(
                  "shrink-0 flex items-center gap-2.5 rounded-full pl-1 pr-3.5 h-11 border transition",
                  on
                    ? "bg-teal-deep border-teal-deep text-white"
                    : "bg-white border-line text-ink hover:border-teal-deep/40",
                )}
              >
                <Avatar name={e.name} size={34} />
                <span className="text-left leading-tight">
                  <span className="block text-[13px] font-semibold whitespace-nowrap">
                    {e.name}
                  </span>
                  <span
                    className={cx(
                      "block text-[11px] whitespace-nowrap",
                      on ? "text-pearl/70" : "text-muted",
                    )}
                  >
                    {num(countOf(e))} lead{countOf(e) === 1 ? "" : "s"}
                    {scope === "day" && pending ? `, ${pending} pending` : ""}
                  </span>
                </span>
              </button>
            );
          })}
          {!list.length && (
            <span className="text-[13px] text-muted px-2 py-3">
              No employee matches "{q}"
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- compact lead list ---------- */
function LeadList({ leads, selectedId, onSelect, total, onMore, loadingMore }) {
  return (
    <div className="card overflow-hidden">
      <ul className="xl:max-h-[calc(100vh-300px)] overflow-y-auto divide-y divide-line">
        {leads.map((l, i) => {
          const on = l.id === selectedId;
          return (
            <li key={l.id}>
              <button
                onClick={() => onSelect(l.id)}
                className={cx(
                  "w-full text-left px-4 py-3 flex gap-3 border-l-4 transition",
                  on
                    ? "bg-lime/25 border-l-lime"
                    : "border-l-transparent hover:bg-pearl",
                )}
                aria-current={on ? "true" : undefined}
              >
                <span className="num text-[12px] text-muted w-6 shrink-0 pt-0.5">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-[14px] truncate">
                    {l.subjectLine}
                  </span>
                  <span className="block text-[12.5px] text-muted truncate">
                    {l.clientEmail}
                  </span>
                  <span className="mt-1.5 flex flex-wrap items-center gap-2">
                    <StatusBadge status={l.status} />
                    <span className="text-[12px] text-ink-soft">
                      {leadCategory(l.leadType)}
                    </span>
                    <span className="text-[12px] text-muted">
                      {fmtDate(l.date, "MMM d")}
                    </span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {total > leads.length && (
        <div className="p-3 border-t border-line text-center">
          <Button
            size="sm"
            variant="secondary"
            onClick={onMore}
            loading={loadingMore}
          >
            Show {Math.min(PAGE, total - leads.length)} more (
            {num(total - leads.length)} left)
          </Button>
        </div>
      )}
    </div>
  );
}

/* ---------- one lead, status on top ---------- */
function LeadPanel({
  lead,
  index,
  count,
  onPrev,
  onNext,
  onStatus,
  autoNext,
  setAutoNext,
  onBack,
  loadingNext,
}) {
  return (
    <article className="card overflow-hidden">
      {/* action bar */}
      <div className="flex flex-wrap items-center gap-3 px-4 sm:px-6 py-3 bg-teal-deep text-white">
        <button
          onClick={onBack}
          className="xl:hidden inline-flex items-center gap-1.5 text-[13px] font-semibold text-pearl/85 hover:text-lime mr-1"
        >
          <ArrowLeft size={16} /> List
        </button>
        <span className="text-[13px] font-semibold text-pearl/80">Status</span>
        <StatusSelector
          key={lead.id}
          lead={lead}
          className="w-48"
          onChange={onStatus}
        />
        <label className="inline-flex items-center gap-2 text-[13px] text-pearl/85 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoNext}
            onChange={(e) => setAutoNext(e.target.checked)}
            className="size-4 accent-lime"
          />
          Go to next after setting
        </label>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="num text-[13px] text-pearl/80 mr-1">
            {index + 1} of {count}
          </span>
          <button
            onClick={onPrev}
            disabled={index <= 0}
            className="size-9 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-35 flex items-center justify-center"
            aria-label="Previous lead"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={onNext}
            disabled={index >= count - 1 || loadingNext}
            className="size-9 rounded-full bg-lime text-ink hover:bg-lime-dark disabled:opacity-35 flex items-center justify-center"
            aria-label="Next lead"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* title */}
      <header className="px-4 sm:px-6 pt-5 pb-4 border-b border-line">
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
          <Badge>{leadCategory(lead.leadType)}</Badge>
          <span>#{lead.id}</span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays size={14} /> Contact date{" "}
            <b className="text-ink font-semibold">{fmtDate(lead.date)}</b>
          </span>
        </div>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-[20px] sm:text-[22px] font-extrabold leading-snug text-ink [overflow-wrap:anywhere]">
          {lead.subjectLine}
        </h2>
      </header>

      <div className="p-4 sm:p-6 bg-pearl/50">
        <LeadDetails lead={lead} />
      </div>
    </article>
  );
}

export default function LeadReview() {
  const [date, setDate] = useState(todayKey());
  const [scope, setScope] = useState("day");
  const [emp, setEmp] = useState(null);
  const [limit, setLimit] = useState(PAGE);
  const [selectedId, setSelectedId] = useState(null);
  const [lastIndex, setLastIndex] = useState(0);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [listOpen, setListOpenState] = useState(() => {
    try {
      return localStorage.getItem(LIST_KEY) === "1";
    } catch {
      return false;
    }
  });
  const setListOpen = (v) => {
    setListOpenState(v);
    try {
      localStorage.setItem(LIST_KEY, v ? "1" : "0");
    } catch {
      /* storage blocked: ignore */
    }
  };
  const [autoNext, setAutoNextState] = useState(() => {
    try {
      return localStorage.getItem(AUTO_KEY) !== "0";
    } catch {
      return true;
    }
  });
  const setAutoNext = (v) => {
    setAutoNextState(v);
    try {
      localStorage.setItem(AUTO_KEY, v ? "1" : "0");
    } catch {
      /* storage blocked: ignore */
    }
  };

  const summary = useApi(`/leads/review/summary?date=${date}`, {
    ttl: 60 * 1000,
  });
  const employees = useMemo(
    () => summary.data?.employees || [],
    [summary.data],
  );
  const countOf = (e) => (scope === "day" ? e.dayCount : e.olderPending);
  const withLeads = useMemo(
    () =>
      employees.filter(
        (e) => (scope === "day" ? e.dayCount : e.olderPending) > 0,
      ),
    [employees, scope],
  );

  // keep a valid employee selected
  useEffect(() => {
    if (!summary.data) return;
    if (!emp || !withLeads.some((e) => e.employeeId === emp))
      setEmp(withLeads[0]?.employeeId || null);
  }, [summary.data, scope]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLimit(PAGE);
    setSelectedId(null);
    setLastIndex(0);
    setMobileDetail(false);
  }, [emp, scope, date]);

  const leadsQ = useApi(
    emp
      ? `/leads/review/leads?employeeId=${emp}&scope=${scope}&date=${date}&limit=${limit}`
      : null,
    { ttl: 60 * 1000, keepPrevious: true },
  );
  const leads = useMemo(() => leadsQ.data?.leads || [], [leadsQ.data]);
  const total = leadsQ.data?.total || 0;

  // keep a valid lead selected (a status change can remove it from "older without status")
  useEffect(() => {
    if (!leads.length) return;
    if (!selectedId || !leads.some((l) => l.id === selectedId))
      setSelectedId(leads[Math.min(lastIndex, leads.length - 1)].id);
  }, [leads]); // eslint-disable-line react-hooks/exhaustive-deps

  const found = leads.findIndex((l) => l.id === selectedId);
  const index =
    found < 0 ? Math.max(0, Math.min(lastIndex, leads.length - 1)) : found;
  const lead = leads[index];
  const go = (i) => {
    // past the loaded ones: load the next page, the effect above then opens that lead
    if (i >= leads.length && total > leads.length) {
      setLastIndex(i);
      setSelectedId(null);
      setLimit((n) => n + PAGE);
      return;
    }
    const n = Math.max(0, Math.min(leads.length - 1, i));
    setLastIndex(n);
    setSelectedId(leads[n]?.id);
  };
  const onStatus = () => {
    // in "older without status" the lead leaves the list, so the same position becomes the next lead
    setLastIndex(index);
    if (autoNext && scope === "day" && index < total - 1)
      setTimeout(() => go(index + 1), 250);
  };

  const totalDay = employees.reduce((s, e) => s + e.dayCount, 0);
  const totalOlder = employees.reduce((s, e) => s + e.olderPending, 0);
  const current = employees.find((e) => e.employeeId === emp);

  return (
    <>
      <PageHeader
        title="Lead review"
        emoji="📝"
        subtitle="Pick an employee, go through their leads and give each one a status."
        actions={
          <>
            <Input
              type="date"
              value={date}
              max={todayKey()}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="w-44"
              aria-label="Day"
            />
            <RefreshButton
              onClick={() => {
                summary.reload();
                leadsQ.reload();
              }}
              spinning={summary.refreshing || leadsQ.refreshing}
            />
          </>
        }
      />
      <Tabs
        value={scope}
        onChange={setScope}
        tabs={[
          {
            value: "day",
            label:
              date === todayKey()
                ? "Today's leads"
                : `Leads of ${fmtDate(`${date}T12:00:00-06:00`, "MMM d")}`,
            count: totalDay,
          },
          {
            value: "pending",
            label: "Older leads without status",
            count: totalOlder,
          },
        ]}
      />
      <ErrorNote error={summary.error} onRetry={summary.reload} />

      {summary.loading ? (
        <Spinner />
      ) : !withLeads.length ? (
        <div className="card">
          <Empty
            title={
              scope === "day"
                ? "No leads uploaded on this day"
                : "Every older lead has a status"
            }
          >
            {scope === "day"
              ? "Pick another day above, or check the older leads tab."
              : "New uploads will show up under today's leads."}
          </Empty>
        </div>
      ) : (
        <>
          <EmployeeStrip
            employees={employees}
            value={emp}
            onChange={setEmp}
            countOf={countOf}
            scope={scope}
          />

          <ErrorNote error={leadsQ.error} onRetry={leadsQ.reload} />
          {leadsQ.loading && !leadsQ.data ? (
            <Spinner />
          ) : !leads.length ? (
            <div className="card">
              <Empty title="Nothing left to review">
                {current?.name || "This employee"} has no leads here.
              </Empty>
            </div>
          ) : (
            <div
              className={cx(
                "grid gap-5 items-start",
                listOpen
                  ? "xl:grid-cols-[340px_minmax(0,1fr)]"
                  : "xl:grid-cols-[64px_minmax(0,1fr)]",
              )}
            >
              {/* desktop: slim strip by default, full list when opened */}
              <div className="hidden xl:block min-w-0 xl:sticky xl:top-[100px]">
                {listOpen ? (
                  <>
                    <div className="flex items-center justify-between gap-2 mb-2 px-1 text-[13px] text-muted">
                      <span className="flex items-center gap-2 min-w-0">
                        <Inbox size={15} className="text-teal-deep shrink-0" />{" "}
                        <b className="text-ink truncate">{current?.name}</b>{" "}
                        {num(total)}
                      </span>
                      <button
                        onClick={() => setListOpen(false)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-semibold text-teal-deep hover:bg-lime/40"
                        title="Hide the list for more space"
                      >
                        <PanelLeftClose size={16} /> Hide
                      </button>
                    </div>
                    <LeadList
                      leads={leads}
                      selectedId={lead?.id}
                      onSelect={(id) => go(leads.findIndex((l) => l.id === id))}
                      total={total}
                      onMore={() => setLimit((n) => n + PAGE)}
                      loadingMore={leadsQ.refreshing}
                    />
                  </>
                ) : (
                  <QueueRail
                    leads={leads}
                    selectedId={lead?.id}
                    onSelect={(id) => go(leads.findIndex((l) => l.id === id))}
                    total={total}
                    onMore={() => setLimit((n) => n + PAGE)}
                    loadingMore={leadsQ.refreshing}
                    onExpand={() => setListOpen(true)}
                  />
                )}
              </div>

              {/* phones / tablets: full list, hidden while a lead is open */}
              <div
                className={cx("xl:hidden min-w-0", mobileDetail && "hidden")}
              >
                <div className="flex items-center gap-2 mb-2 px-1 text-[13px] text-muted">
                  <Inbox size={15} className="text-teal-deep" />{" "}
                  <b className="text-ink">{current?.name}</b> {num(total)} lead
                  {total === 1 ? "" : "s"}
                </div>
                <LeadList
                  leads={leads}
                  selectedId={lead?.id}
                  onSelect={(id) => {
                    go(leads.findIndex((l) => l.id === id));
                    setMobileDetail(true);
                  }}
                  total={total}
                  onMore={() => setLimit((n) => n + PAGE)}
                  loadingMore={leadsQ.refreshing}
                />
              </div>

              {/* one lead */}
              <div
                className={cx("min-w-0", !mobileDetail && "hidden xl:block")}
              >
                {lead && (
                  <LeadPanel
                    lead={lead}
                    index={index}
                    count={total}
                    loadingNext={leadsQ.refreshing}
                    onPrev={() => go(index - 1)}
                    onNext={() => go(index + 1)}
                    onStatus={onStatus}
                    autoNext={autoNext}
                    setAutoNext={setAutoNext}
                    onBack={() => setMobileDetail(false)}
                  />
                )}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
