// Attendance → Punch in / out
// Every date with punch in + punch out per employee (grid), or one row per person per day (list).
// Same data as the monthly report; Excel export and email use the same filters.
import { useEffect, useMemo, useState } from "react";
import {
  Download,
  Mail,
  Fingerprint,
  LogOut,
  UserX,
  Users,
  LayoutGrid,
  List,
} from "lucide-react";
import { api, download, useApi } from "../../lib/api";
import { recentMonths, todayKey } from "../../lib/format";
import {
  Avatar,
  Button,
  Empty,
  ErrorNote,
  Input,
  MiniStat,
  Pagination,
  RefreshButton,
  SearchInput,
  Segmented,
  Select,
  Spinner,
  StatRow,
  Toolbar,
  useToast,
  cx,
} from "../../components/ui";

const WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const dayLabel = (key) =>
  `${Number(key.slice(8))} ${MON[Number(key.slice(5, 7)) - 1]}`;
const OFF = { A: "Absent", WO: "Week off", H: "Holiday" };
const STATUS = {
  P: ["Present", "bg-lime text-ink border-lime"],
  HD: ["Half day", "bg-lime/35 text-ink border-lime"],
  MP: [
    "No punch-out",
    "bg-white text-teal-deep border-teal-deep border-dashed",
  ],
  A: ["Absent", "bg-teal-deep text-white border-teal-deep"],
  WO: ["Week off", "bg-pearl text-muted border-line"],
  H: ["Holiday", "bg-pearl text-teal-deep border-teal-deep/30"],
  IN: ["Working now", "bg-white text-teal-deep border-lime border-2"],
};
const PAGE = 60;

function StatusTag({ code, offDay }) {
  if (!code) return <span className="text-muted">—</span>;
  const [label, cls] = STATUS[code] || [code, "bg-white border-line"];
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2 h-6 text-[11.5px] font-semibold whitespace-nowrap",
        cls,
      )}
    >
      {label}
      {offDay ? " (day off)" : ""}
    </span>
  );
}

/* one In / Out pair in the grid */
function PunchCells({ d, today }) {
  const edge = today ? "bg-lime/10" : "";
  if (!d || (!d.code && !d.firstPunchIST)) {
    return (
      <>
        <td
          className={cx(
            "px-2 py-2 border-b border-line border-l border-l-line/70 whitespace-nowrap group-hover:bg-[#f6fbe6] text-center text-muted/60",
            edge,
          )}
        >
          ·
        </td>
        <td
          className={cx(
            "px-2 py-2 border-b border-line whitespace-nowrap group-hover:bg-[#f6fbe6] text-center text-muted/60",
            edge,
          )}
        >
          ·
        </td>
      </>
    );
  }
  if (!d.firstPunchIST) {
    const absent = d.code === "A";
    return (
      <td
        colSpan={2}
        className={cx(
          "px-2 py-2 border-b border-line border-l border-l-line/70 whitespace-nowrap group-hover:bg-[#f6fbe6] text-center",
          edge,
        )}
      >
        <span
          className={cx(
            "inline-flex items-center rounded-full px-2.5 h-6 text-[11.5px] font-semibold",
            absent ? "bg-teal-deep text-white" : "bg-pearl text-muted",
          )}
        >
          {OFF[d.code] || d.code}
        </span>
      </td>
    );
  }
  const noOut = !d.lastPunchIST;
  return (
    <>
      <td
        className={cx(
          "px-2 py-2 border-b border-line border-l border-l-line/70 whitespace-nowrap group-hover:bg-[#f6fbe6] text-center num font-semibold text-ink",
          d.offDayWork && "bg-lime/25",
          edge,
        )}
        title={d.hours ? `${d.hours} worked` : undefined}
      >
        {d.firstPunchIST}
        {d.offDayWork && (
          <span className="text-teal-deep" title="Worked on a day off">
            {" "}
            *
          </span>
        )}
      </td>
      <td
        className={cx(
          "px-2 py-2 border-b border-line whitespace-nowrap group-hover:bg-[#f6fbe6] text-center num",
          noOut ? "" : "font-semibold text-ink",
          d.offDayWork && "bg-lime/25",
          edge,
        )}
        title={d.hours ? `${d.hours} worked` : undefined}
      >
        {noOut ? (
          d.code === "IN" ? (
            <span className="rounded-full bg-lime px-2 py-0.5 text-[11px] font-bold text-ink">
              Working
            </span>
          ) : (
            <span className="rounded-full border border-dashed border-teal-deep px-2 py-0.5 text-[11px] font-bold text-teal-deep">
              No out
            </span>
          )
        ) : (
          d.lastPunchIST
        )}
      </td>
    </>
  );
}

export default function PunchReport() {
  const toast = useToast();
  const months = useMemo(() => recentMonths(2), []); // punches are kept for 2 months
  const [key, setKey] = useState(months[0].key);
  const [y, m] = key.split("-").map(Number);
  const { data, loading, error, reload, refreshing } = useApi(
    `/attendance/admin/monthly?year=${y}&month=${m}`,
    { ttl: 2 * 60 * 1000 },
  );

  const today = todayKey();
  const [range, setRange] = useState("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [team, setTeam] = useState("");
  const [q, setQ] = useState("");
  const [show, setShow] = useState("all");
  const [view, setView] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 640 ? "list" : "grid",
  );
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState("");
  useEffect(() => {
    setRange("month");
    setFrom("");
    setTo("");
  }, [key]);
  useEffect(() => setPage(1), [key, range, from, to, team, q, show, view]);

  // dates that have happened (no empty future columns)
  const monthDays = useMemo(
    () => (data?.days || []).filter((d) => d.date <= today),
    [data, today],
  );
  const first = monthDays[0]?.date;
  const last = monthDays[monthDays.length - 1]?.date;
  const [rFrom, rTo] = useMemo(() => {
    if (!first) return [null, null];
    if (range === "7")
      return [monthDays[Math.max(0, monthDays.length - 7)].date, last];
    if (range === "today") return [last, last];
    if (range === "custom") {
      const f = from && from >= first && from <= last ? from : first;
      const t = to && to >= f && to <= last ? to : last;
      return [f, t];
    }
    return [first, last];
  }, [range, from, to, first, last, monthDays]);
  const days = monthDays.filter((d) => d.date >= rFrom && d.date <= rTo);

  const rows = useMemo(() => {
    const text = q.trim().toLowerCase();
    return (data?.rows || [])
      .filter(
        (r) =>
          (!team || r.team === team) &&
          (!text ||
            r.name.toLowerCase().includes(text) ||
            r.employeeId.toLowerCase().includes(text)),
      )
      .map((r) => {
        const byDate = new Map(r.days.map((d) => [d.date, d]));
        const list = days.map((d) => byDate.get(d.date)).filter(Boolean);
        const t = { punched: 0, noOut: 0, absent: 0, present: 0, minutes: 0 };
        for (const d of list) {
          if (d.firstPunchIST) t.punched++;
          if (d.code === "MP") t.noOut++;
          if (d.code === "A") t.absent++;
          if (d.code === "P") t.present++;
          t.minutes += d.minutes || 0;
        }
        return { ...r, byDate, t };
      })
      .filter((r) =>
        show === "noout" ? r.t.noOut : show === "absent" ? r.t.absent : true,
      );
  }, [data, days, team, q, show]);

  const totals = rows.reduce(
    (a, r) => ({
      punched: a.punched + r.t.punched,
      noOut: a.noOut + r.t.noOut,
      absent: a.absent + r.t.absent,
    }),
    { punched: 0, noOut: 0, absent: 0 },
  );
  const rangeText = !rFrom
    ? data?.label
    : rFrom === first && rTo === last && range === "month"
      ? data?.label
      : rFrom === rTo
        ? dayLabel(rFrom)
        : `${dayLabel(rFrom)} to ${dayLabel(rTo)}`;
  const filterQs = () => {
    const p = new URLSearchParams({ year: y, month: m });
    if (rFrom && !(range === "month")) {
      p.set("from", rFrom);
      p.set("to", rTo);
    }
    if (team) p.set("team", team);
    if (q.trim()) p.set("q", q.trim());
    return p;
  };

  // list view: one row per person per day, newest day first
  const listItems = useMemo(() => {
    if (view !== "list") return [];
    const out = [];
    for (const d of [...days].reverse())
      for (const r of rows) {
        const x = r.byDate.get(d.date);
        if (!x || (!x.code && !x.firstPunchIST)) continue;
        if (show === "noout" && x.code !== "MP") continue;
        if (show === "absent" && x.code !== "A") continue;
        out.push({ r, x });
      }
    return out;
  }, [view, days, rows, show]);

  async function exportXlsx() {
    setBusy("xl");
    try {
      await download(
        `/attendance/admin/monthly/punch-export?${filterQs()}`,
        `punch-in-out-${key}.xlsx`,
      );
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setBusy("");
    }
  }
  async function emailIt() {
    if (
      !window.confirm(
        `Email the punch report (${rangeText}${team ? `, ${team}` : ""}${q.trim() ? `, "${q.trim()}"` : ""}) to the report address (info@abaccotech.com)?`,
      )
    )
      return;
    setBusy("mail");
    try {
      const body = Object.fromEntries(filterQs());
      body.year = y;
      body.month = m;
      const r = await api("/attendance/admin/monthly/punch-email", {
        method: "POST",
        body,
      });
      toast(`Punch report sent to ${r.to}`);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setBusy("");
    }
  }

  return (
    <>
      <Toolbar>
        <Select
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="w-44"
          aria-label="Month"
        >
          {months.map((mm) => (
            <option key={mm.key} value={mm.key}>
              {mm.label}
            </option>
          ))}
        </Select>
        <Segmented
          value={range}
          onChange={setRange}
          options={[
            ["month", "Whole month"],
            ["7", "Last 7 days"],
            ["today", "Latest day"],
            ["custom", "Dates…"],
          ]}
        />
        {range === "custom" && first && (
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={from || rFrom}
              min={first}
              max={last}
              onChange={(e) => setFrom(e.target.value)}
              className="w-[150px]"
              aria-label="From date"
            />
            <span className="text-muted text-[13px]">to</span>
            <Input
              type="date"
              value={to || rTo}
              min={first}
              max={last}
              onChange={(e) => setTo(e.target.value)}
              className="w-[150px]"
              aria-label="To date"
            />
          </div>
        )}
        <div className="flex flex-wrap gap-2 ml-auto">
          <RefreshButton onClick={reload} spinning={refreshing} />
          <Button
            icon={Mail}
            loading={busy === "mail"}
            onClick={emailIt}
            disabled={!rows.length}
          >
            Email report
          </Button>
          <Button
            variant="blue"
            icon={Download}
            loading={busy === "xl"}
            onClick={exportXlsx}
            disabled={!rows.length}
          >
            Excel
          </Button>
        </div>
      </Toolbar>
      <Toolbar>
        <SearchInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search employee name or ID"
        />
        <Select
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          className="w-40"
          aria-label="Team"
        >
          <option value="">Everyone</option>
          <option value="Marketing">Marketing</option>
          <option value="Developer">Developers</option>
        </Select>
        <Segmented
          value={show}
          onChange={setShow}
          options={[
            ["all", "All"],
            ["noout", "No punch-out"],
            ["absent", "Absent"],
          ]}
        />
        <Segmented
          value={view}
          onChange={setView}
          options={[
            [
              "grid",
              <span key="g" className="inline-flex items-center gap-1.5">
                <LayoutGrid size={14} />
                Grid
              </span>,
            ],
            [
              "list",
              <span key="l" className="inline-flex items-center gap-1.5">
                <List size={14} />
                List
              </span>,
            ],
          ]}
        />
      </Toolbar>
      <ErrorNote error={error} onRetry={reload} />

      {loading && !data ? (
        <Spinner />
      ) : !data ? null : (
        <>
          <StatRow cols={4}>
            <MiniStat
              label="Employees"
              value={rows.length}
              hint={rangeText}
              icon={Users}
              tone="teal"
            />
            <MiniStat
              label="Days punched"
              value={totals.punched}
              hint={`${days.length} day${days.length === 1 ? "" : "s"} shown`}
              icon={Fingerprint}
              tone="lime"
            />
            <MiniStat
              label="No punch-out"
              value={totals.noOut}
              hint="Forgot to punch out"
              icon={LogOut}
            />
            <MiniStat
              label="Absent"
              value={totals.absent}
              hint="Working day, no punch"
              icon={UserX}
            />
          </StatRow>

          {!rows.length || !days.length ? (
            <div className="card">
              <Empty
                title={
                  !days.length ? "No days to show yet" : "No employees match"
                }
              >
                Try another month, date range or filter.
              </Empty>
            </div>
          ) : view === "grid" ? (
            <section className="card overflow-hidden">
              <header className="px-5 py-3.5 border-b border-line flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold">Punch in / out, {rangeText}</h3>
                <span className="text-[12px] text-muted">
                  Times in IST. Scroll sideways for more dates. * = worked on a
                  day off.
                </span>
              </header>
              <div className="overflow-auto max-h-[72vh]">
                <table className="border-separate border-spacing-0 text-[12.5px] min-w-full">
                  <thead className="sticky top-0 z-20">
                    <tr>
                      <th
                        rowSpan={2}
                        className="sticky left-0 z-30 bg-teal-deep text-white text-left font-bold px-3 sm:px-4 h-[46px] min-w-[150px] sm:min-w-[210px] border-b border-r border-white/15"
                      >
                        Employee
                      </th>
                      {days.map((d) => {
                        const off = d.weekday === 0 || d.weekday === 6;
                        return (
                          <th
                            key={d.date}
                            colSpan={2}
                            className={cx(
                              "px-2 h-[46px] text-center border-l border-white/15",
                              off ? "bg-[#1d4560]" : "bg-teal-deep",
                              d.date === today && "!bg-lime !text-ink",
                            )}
                          >
                            <div
                              className={cx(
                                "text-[10.5px] font-semibold uppercase tracking-wide",
                                d.date === today
                                  ? "text-ink/70"
                                  : "text-pearl/70",
                              )}
                            >
                              {WEEK[d.weekday]}
                            </div>
                            <div
                              className={cx(
                                "num text-[13px] font-extrabold whitespace-nowrap",
                                d.date === today ? "text-ink" : "text-white",
                              )}
                            >
                              {dayLabel(d.date)}
                            </div>
                          </th>
                        );
                      })}
                      <th
                        colSpan={3}
                        className="bg-teal-deep text-lime px-2 h-[46px] text-center font-bold border-l border-white/15"
                      >
                        Total
                      </th>
                    </tr>
                    <tr>
                      {days.map((d) => (
                        <FragmentPair key={d.date} today={d.date === today} />
                      ))}
                      {["Days", "No out", "Hours"].map((t) => (
                        <th
                          key={t}
                          className="bg-pearl text-teal-deep text-[11px] font-bold h-[26px] px-2 border-b border-line border-l border-line/70 whitespace-nowrap"
                        >
                          {t}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.employeeId} className="group">
                        <td className="sticky left-0 z-10 bg-white group-hover:bg-[#f6fbe6] px-3 sm:px-4 py-2 border-b border-r border-line">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="hidden sm:inline-flex">
                              <Avatar name={r.name} size={28} />
                            </span>
                            <div className="min-w-0">
                              <div
                                className="font-semibold text-[13px] truncate max-w-[120px] sm:max-w-[150px]"
                                title={r.name}
                              >
                                {r.name}
                              </div>
                              <div className="text-[11px] text-muted truncate">
                                {r.employeeId}
                                {r.role === "DEVELOPER" ? ", Developer" : ""}
                              </div>
                            </div>
                          </div>
                        </td>
                        {days.map((d) => (
                          <PunchCells
                            key={d.date}
                            d={r.byDate.get(d.date)}
                            today={d.date === today}
                          />
                        ))}
                        <td className="px-2 py-2 border-b border-line border-l border-l-line/70 whitespace-nowrap group-hover:bg-[#f6fbe6] text-center num font-bold">
                          {r.t.punched}
                        </td>
                        <td
                          className={cx(
                            "px-2 py-2 border-b border-line border-l border-l-line/70 whitespace-nowrap group-hover:bg-[#f6fbe6] text-center num font-bold",
                            r.t.noOut ? "text-teal-deep" : "text-muted",
                          )}
                        >
                          {r.t.noOut || "—"}
                        </td>
                        <td className="px-2 py-2 border-b border-line border-l border-l-line/70 whitespace-nowrap group-hover:bg-[#f6fbe6] text-center num font-semibold whitespace-nowrap">
                          {r.t.minutes
                            ? `${Math.floor(r.t.minutes / 60)}h ${String(r.t.minutes % 60).padStart(2, "0")}m`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-line flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span className="rounded-full border border-dashed border-teal-deep px-1.5 font-bold text-teal-deep">
                    No out
                  </span>{" "}
                  forgot to punch out
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="rounded-full bg-lime px-1.5 font-bold text-ink">
                    Working
                  </span>{" "}
                  still in today
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="rounded-full bg-teal-deep px-1.5 font-bold text-white">
                    Absent
                  </span>{" "}
                  working day, no punch
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="rounded-full bg-pearl px-1.5 font-bold">
                    Week off
                  </span>{" "}
                  / Holiday
                </span>
                <span>Hover a time to see hours worked.</span>
              </div>
            </section>
          ) : (
            <section className="card overflow-hidden">
              <header className="px-5 py-3.5 border-b border-line flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold">Punch list, {rangeText}</h3>
                <span className="num text-[12px] text-muted">
                  {listItems.length} entries, newest first
                </span>
              </header>
              {!listItems.length ? (
                <Empty title="Nothing to show" />
              ) : (
                <>
                  <ul className="divide-y divide-line">
                    {listItems
                      .slice((page - 1) * PAGE, page * PAGE)
                      .map(({ r, x }) => (
                        <li
                          key={`${x.date}|${r.employeeId}`}
                          className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[110px_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_80px_150px] items-center gap-x-4 gap-y-1.5 px-4 sm:px-5 py-3 hover:bg-pearl/50"
                        >
                          <div className="num text-[13px] font-bold text-teal-deep sm:order-none order-1 col-span-2 sm:col-span-1">
                            {WEEK[x.weekday]}, {dayLabel(x.date)}
                          </div>
                          <div className="flex items-center gap-2.5 min-w-0 order-2 sm:order-none">
                            <Avatar name={r.name} size={28} />
                            <div className="min-w-0">
                              <div className="font-semibold text-[13.5px] truncate">
                                {r.name}
                              </div>
                              <div className="text-[11px] text-muted">
                                {r.employeeId}
                              </div>
                            </div>
                          </div>
                          <div className="order-4 sm:order-none text-[13px]">
                            <span className="text-muted text-[11px] block">
                              Punch in
                            </span>
                            <span className="num font-semibold">
                              {x.firstPunchIST || "—"}
                            </span>
                          </div>
                          <div className="order-5 sm:order-none text-[13px]">
                            <span className="text-muted text-[11px] block">
                              Punch out
                            </span>
                            <span className="num font-semibold">
                              {x.lastPunchIST ||
                                (x.firstPunchIST
                                  ? x.code === "IN"
                                    ? "Working"
                                    : "No punch-out"
                                  : "—")}
                            </span>
                          </div>
                          <div className="order-6 sm:order-none num text-[13px] text-ink-soft hidden sm:block">
                            {x.hours || "—"}
                          </div>
                          <div className="order-3 sm:order-none justify-self-end sm:justify-self-start">
                            <StatusTag code={x.code} offDay={x.offDayWork} />
                          </div>
                        </li>
                      ))}
                  </ul>
                  <div className="px-4 py-3 border-t border-line">
                    <Pagination
                      page={page}
                      totalPages={Math.ceil(listItems.length / PAGE)}
                      total={listItems.length}
                      onPage={setPage}
                    />
                  </div>
                </>
              )}
            </section>
          )}
          <p className="text-[12px] text-muted mt-3">
            Punch in = first punch, punch out = last punch of the US workday
            (times in IST). Excel has the same grid plus a "Punch list" sheet
            with filters. "Email report" sends it to info@abaccotech.com; last
            month's full report is also emailed automatically on the 1st.
          </p>
        </>
      )}
    </>
  );
}

function FragmentPair({ today }) {
  const cls = cx(
    "text-[11px] font-bold h-[26px] px-2 border-b border-line whitespace-nowrap",
    today ? "bg-lime/50 text-ink" : "bg-pearl text-teal-deep",
  );
  return (
    <>
      <th className={cx(cls, "border-l border-line/70 min-w-[78px]")}>In</th>
      <th className={cx(cls, "min-w-[78px]")}>Out</th>
    </>
  );
}
