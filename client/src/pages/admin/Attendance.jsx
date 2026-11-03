// Admin attendance: monthly report (biometric + system clock-in), punch log, machines & cards.
import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  Download,
  Mail,
  Fingerprint,
  Cpu,
  Plus,
  Search,
  UserX,
  Clock,
  Radio,
} from "lucide-react";
import { api, download, useApi, useMutation } from "../../lib/api";
import { fmtDate, num, recentMonths } from "../../lib/format";
import {
  Avatar,
  Badge,
  Button,
  Chip,
  Empty,
  ErrorNote,
  Field,
  Input,
  Modal,
  PageHeader,
  Pagination,
  Panel,
  RefreshButton,
  Select,
  Spinner,
  StatCard,
  Tabs,
  TH,
  TD,
  useToast,
  cx,
} from "../../components/ui";

/* calendar tiles (employee month view) */
const CODE_STYLE = {
  P: "bg-active-soft text-active border-active/25",
  HD: "bg-noresp-soft text-noresp border-noresp/25",
  MP: "bg-orange-soft text-orange border-orange/25",
  A: "bg-leave-soft text-leave border-leave/25",
  WO: "bg-pending-soft text-pending border-pending/20",
  H: "bg-violet-soft text-violet border-violet/20",
  IN: "bg-blue-soft text-blue border-blue/25",
  NP: "bg-pending-soft text-pending border-pending/20",
};
/* plain status text: dot + coloured words, no boxes */
const CODE_TEXT = {
  P: "text-active",
  HD: "text-noresp",
  MP: "text-orange",
  A: "text-leave",
  WO: "text-muted",
  H: "text-violet",
  IN: "text-blue",
  NP: "text-muted",
};
const CODE_DOT = {
  P: "bg-active",
  HD: "bg-noresp",
  MP: "bg-orange",
  A: "bg-leave",
  WO: "bg-muted",
  H: "bg-violet",
  IN: "bg-blue",
  NP: "bg-muted",
};
const CODE_LABEL = {
  P: "Present",
  HD: "Half day",
  MP: "Missing punch-out",
  A: "Absent",
  WO: "Week off",
  H: "Holiday",
  IN: "Working now",
  NP: "Not punched yet",
};
const SAT = {
  WORKING: "Every Saturday",
  OFF: "Saturday off",
  ALTERNATE: "Alternate Saturdays",
};
const WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function StatusText({ code, label }) {
  if (!code) return <span className="text-muted">-</span>;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 font-semibold",
        CODE_TEXT[code],
      )}
    >
      <span className={cx("size-2 rounded-full shrink-0", CODE_DOT[code])} />
      {label || CODE_LABEL[code]}
    </span>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[12.5px] text-ink-soft">
      {Object.entries(CODE_LABEL)
        .filter(([c]) => c !== "NP")
        .map(([c, l]) => (
          <span key={c} className="inline-flex items-center gap-1.5">
            <span className={cx("size-2 rounded-full", CODE_DOT[c])} />
            <b className="text-ink">{c}</b> {l}
          </span>
        ))}
    </div>
  );
}

/* Calendar for one employee */
function EmployeeMonth({ row, report, onClose }) {
  const lead = report.days[0]?.weekday || 0;
  return (
    <Modal
      open
      onClose={onClose}
      width="max-w-4xl"
      title={`${row.name}, ${report.label}`}
    >
      <div className="flex flex-wrap gap-2 mb-4 text-[13px]">
        <Badge>{SAT[row.saturdayRule]}</Badge>
        <Badge className="bg-violet-soft text-violet">{row.team}</Badge>
        <Chip tone="active">{row.summary.present} present</Chip>
        <Chip tone="noresp">{row.summary.halfDay} half</Chip>
        <Chip tone="leave">{row.summary.absent} absent</Chip>
        <Chip tone="pending">{row.summary.missingOut} missing out</Chip>
        <span className="text-muted self-center">
          Total {row.summary.hours || "0h"}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-muted mb-1.5">
        {WEEK.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: lead }, (_, i) => (
          <div key={`x${i}`} />
        ))}
        {row.days.map((d) => (
          <div
            key={d.date}
            className={cx(
              "rounded-lg border p-1.5 sm:p-2 min-h-[78px] text-left",
              d.code ? CODE_STYLE[d.code] : "border-white bg-white/60",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="num font-bold text-[13px] text-ink">
                {Number(d.date.slice(-2))}
              </span>
              {d.code && (
                <span className="text-[11px] font-bold">
                  {d.code}
                  {d.offDayWork ? "*" : ""}
                </span>
              )}
            </div>
            {d.firstPunchIST && (
              <div className="num text-[10px] sm:text-[11px] mt-1 text-ink-soft leading-tight">
                {d.firstPunchIST}
                {d.lastPunchIST ? (
                  <>
                    <br />
                    {d.lastPunchIST}
                  </>
                ) : (
                  ""
                )}
              </div>
            )}
            {d.hours && (
              <div className="num text-[10px] sm:text-[11px] font-semibold text-ink">
                {d.hours}
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted mt-3">
        Times are IST. * = worked on a week off or holiday. Full day ={" "}
        {report.fullDayHours} hours or more.
      </p>
    </Modal>
  );
}

const numCell = (v, cls) => (
  <span className={cx("num font-semibold", v ? cls : "text-muted/50")}>
    {v || 0}
  </span>
);

/* stacked present / half / absent bar */
function AttendanceBar({ s }) {
  const t = Math.max(s.workingDays, 1);
  const w = (v) => `${Math.min(100, (v / t) * 100)}%`;
  return (
    <div className="min-w-[110px]">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-line">
        <div className="bg-active" style={{ width: w(s.present) }} />
        <div className="bg-noresp" style={{ width: w(s.halfDay) }} />
        <div className="bg-leave" style={{ width: w(s.absent) }} />
      </div>
      <div className="num text-[11px] text-muted mt-1">
        {Math.round((s.attendedDays / t) * 100)}% of {s.workingDays} working
        days
      </div>
    </div>
  );
}

function MonthlyReport() {
  const toast = useToast();
  const months = recentMonths(2);
  const [key, setKey] = useState(months[0].key);
  const [y, m] = key.split("-").map(Number);
  const { data, loading, error, reload, refreshing } = useApi(
    `/attendance/admin/monthly?year=${y}&month=${m}`,
    { ttl: 2 * 60 * 1000 },
  );
  const [open, setOpen] = useState(null);
  const [q, setQ] = useState("");
  const [team, setTeam] = useState("");
  const [busy, setBusy] = useState("");
  const rows = useMemo(
    () =>
      (data?.rows || []).filter(
        (r) =>
          r.role !== "ADMIN" &&
          (!team || r.team === team) &&
          (!q ||
            r.name.toLowerCase().includes(q.toLowerCase()) ||
            r.employeeId.toLowerCase().includes(q.toLowerCase())),
      ),
    [data, q, team],
  );
  const tot = (k, sub = "summary") =>
    rows.reduce((s, r) => s + (r[sub][k] || 0), 0);

  async function emailNow() {
    if (!window.confirm(`Email the ${data?.label} attendance report now?`))
      return;
    setBusy("mail");
    try {
      const r = await api("/attendance/admin/monthly/email", {
        method: "POST",
        body: { year: y, month: m },
      });
      toast(`Report emailed to ${r.to}`);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setBusy("");
    }
  }
  async function exportFile(kind, path, name) {
    setBusy(kind);
    try {
      await download(
        `/attendance/admin/monthly/${path}?year=${y}&month=${m}`,
        name,
      );
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setBusy("");
    }
  }

  return (
    <>
      {/* toolbar */}
      <div className="card p-3 sm:p-4 mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
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
          <div className="relative w-56">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search employee"
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RefreshButton onClick={reload} spinning={refreshing} />
          <Button icon={Mail} loading={busy === "mail"} onClick={emailNow}>
            Email
          </Button>
          <Button
            icon={Download}
            loading={busy === "xl"}
            onClick={() => exportFile("xl", "export", `attendance-${key}.xlsx`)}
          >
            Summary Excel
          </Button>
          <Button
            variant="blue"
            icon={Download}
            loading={busy === "punch"}
            onClick={() =>
              exportFile("punch", "punch-export", `punch-in-out-${key}.xlsx`)
            }
          >
            Punch in/out Excel
          </Button>
        </div>
      </div>

      <ErrorNote error={error} onRetry={reload} />
      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <StatCard
              label="Present days"
              value={num(tot("present"))}
              icon={CalendarCheck}
              tone="green"
            />
            <StatCard
              label="Half days"
              value={num(tot("halfDay"))}
              hint={`Under ${data.fullDayHours} hours`}
              icon={Clock}
              tone="orange"
            />
            <StatCard
              label="Absent days"
              value={num(tot("absent"))}
              icon={UserX}
              tone="red"
            />
          </div>

          <Panel
            bodyClass="p-0"
            title={`${data.label} attendance`}
            icon={CalendarCheck}
            actions={
              <span className="text-[13px] text-muted">
                {rows.length} employees
              </span>
            }
          >
            <div className="px-5 py-3 border-b border-line bg-white/40">
              <Legend />
            </div>
            {!rows.length ? (
              <Empty title="No employees found" />
            ) : (
              <table className="w-full text-sm table-fixed">
                <thead>
                  <tr>
                    <TH className="w-[40%] md:w-[26%]">Employee</TH>
                    <TH className="hidden md:table-cell">Attendance</TH>
                    <TH className="text-center w-12 sm:w-16">P</TH>
                    <TH className="text-center w-12 sm:w-16">HD</TH>
                    <TH className="text-center w-12 sm:w-16">A</TH>
                    <TH className="text-center w-12 sm:w-16 hidden sm:table-cell">
                      MP
                    </TH>
                    <TH className="text-right w-28 hidden md:table-cell">
                      Hours
                    </TH>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.employeeId}
                      className="hover:bg-white/60 cursor-pointer transition-colors"
                      onClick={() => setOpen(r)}
                    >
                      <TD>
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar name={r.name} size={36} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-semibold truncate text-ink">
                                {r.name}
                              </span>
                              {r.role === "DEVELOPER" && (
                                <Badge className="h-5 px-1.5 text-[10px] bg-violet-soft text-violet">
                                  Dev
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted truncate">
                              {r.employeeId} · {SAT[r.saturdayRule]}
                              {!r.hasBiometric && " · no punches"}
                            </div>
                          </div>
                        </div>
                      </TD>
                      <TD className="hidden md:table-cell pr-6">
                        <AttendanceBar s={r.summary} />
                      </TD>
                      <TD className="text-center">
                        {numCell(r.summary.present, "text-active")}
                      </TD>
                      <TD className="text-center">
                        {numCell(r.summary.halfDay, "text-noresp")}
                      </TD>
                      <TD className="text-center">
                        {numCell(r.summary.absent, "text-leave")}
                      </TD>
                      <TD className="text-center hidden sm:table-cell">
                        {numCell(r.summary.missingOut, "text-orange")}
                      </TD>
                      <TD className="text-right hidden md:table-cell">
                        <div className="num font-semibold text-ink">
                          {r.summary.hours || "-"}
                        </div>
                      </TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </>
      )}
      {open && (
        <EmployeeMonth row={open} report={data} onClose={() => setOpen(null)} />
      )}
    </>
  );
}

/* US Central calendar date helpers (the attendance "day") */
const usToday = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(
    new Date(),
  );
const shiftKey = (key, days) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};
const prettyKey = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

function MiniStat({ label, value, tone = "text-ink", hint }) {
  return (
    <div className="card px-4 py-3">
      <div className="text-[12px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </div>
      <div className={cx("num text-2xl font-bold mt-0.5", tone)}>{value}</div>
      {hint && <div className="text-[11.5px] text-muted mt-0.5">{hint}</div>}
    </div>
  );
}

function PunchLog({ employees }) {
  const today = usToday();
  const [f, setF] = useState({
    page: 1,
    mapped: "",
    employeeId: "",
    date: today,
  });
  // bumping this changes the request URL, so Refresh / auto-refresh can never
  // be answered from the cache with old data
  const [nonce, setNonce] = useState(0);
  const params = Object.entries(f).filter(([, v]) => v !== "");
  if (nonce) params.push(["_r", nonce]);
  const qs = new URLSearchParams(params).toString();
  const { data, loading, error, reload, refreshing } = useApi(
    `/attendance/admin/punches?${qs}`,
    { ttl: 15 * 1000, keepPrevious: true },
  );
  const refresh = () => {
    setNonce((n) => n + 1);
    reload();
  };
  useEffect(() => {
    if (f.date !== today) return;
    const t = setInterval(() => setNonce((n) => n + 1), 60 * 1000);
    return () => clearInterval(t);
  }, [f.date, today]);

  const set = (k) => (e) =>
    setF((x) => ({ ...x, [k]: e.target.value, page: 1 }));
  const setDate = (date) => setF((x) => ({ ...x, date, page: 1 }));
  const quick = [
    { label: "Today", value: today },
    { label: "Yesterday", value: shiftKey(today, -1) },
    { label: "Day before", value: shiftKey(today, -2) },
    { label: "All", value: "all" },
  ];
  const single = data && data.date !== "all";
  const live = single && !data.dayClosed && data.date === data.todayKey;

  return (
    <div className="grid gap-5">
      {/* date + filters */}
      <div className="card p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl bg-white/70 border border-line p-1 gap-1">
            {quick.map((q) => (
              <button
                key={q.value}
                onClick={() => setDate(q.value)}
                className={cx(
                  "rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
                  f.date === q.value
                    ? "bg-navy text-white shadow-sm"
                    : "text-ink-soft hover:bg-white",
                )}
              >
                {q.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {live && (
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-active">
                <Radio size={14} className="animate-pulse" /> Live, updates
                every minute
              </span>
            )}
            <RefreshButton onClick={refresh} spinning={refreshing} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          <Input
            type="date"
            value={f.date === "all" ? "" : f.date}
            max={today}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            aria-label="Pick a date"
          />
          <Select
            value={f.employeeId}
            onChange={set("employeeId")}
            aria-label="Employee"
          >
            <option value="">All employees</option>
            {employees.map((e) => (
              <option key={e.employeeId} value={e.employeeId}>
                {e.name}
              </option>
            ))}
          </Select>
          <Select value={f.mapped} onChange={set("mapped")} aria-label="Card">
            <option value="">All punches</option>
            <option value="true">Linked to an employee</option>
            <option value="false">Card not linked</option>
          </Select>
        </div>
      </div>

      {/* day summary */}
      {single && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniStat
            label="Date"
            value={prettyKey(data.date)}
            hint="US workday"
          />
          <MiniStat
            label="Punched"
            value={data.summary.punched}
            tone="text-active"
          />
          {data.dayClosed ? (
            <MiniStat
              label="Absent"
              value={data.summary.absent}
              tone="text-leave"
              hint="Day is closed"
            />
          ) : (
            <MiniStat
              label="Not punched yet"
              value={data.summary.notPunched}
              tone="text-pending"
              hint="Absent after 4:30 AM IST"
            />
          )}
          <MiniStat
            label="Total listed"
            value={data.total}
            hint={data.dayClosed ? "Final" : "Shift still running"}
          />
        </div>
      )}

      <Panel bodyClass="p-0" title="Punch log" icon={Fingerprint}>
        <ErrorNote error={error} onRetry={reload} />
        {loading ? (
          <Spinner />
        ) : !data?.rows?.length ? (
          <Empty title="No punches found">
            Punches appear here as soon as the machine sends them.
          </Empty>
        ) : (
          <>
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr>
                  <TH className="w-[44%] sm:w-[28%]">Employee</TH>
                  <TH className="w-36 hidden sm:table-cell">Punch in (IST)</TH>
                  <TH className="w-36 hidden sm:table-cell">Punch out (IST)</TH>
                  <TH>Status</TH>
                  <TH className="w-24 text-right hidden md:table-cell">
                    Hours
                  </TH>
                  <TH className="hidden xl:table-cell">Machine</TH>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-white/60 transition-colors"
                  >
                    <TD>
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={r.name || "?"} size={34} />
                        <div className="min-w-0">
                          {r.name ? (
                            <div className="font-semibold truncate text-ink">
                              {r.name}
                            </div>
                          ) : (
                            <div className="font-semibold truncate text-noresp">
                              Card not linked
                            </div>
                          )}
                          <div className="text-xs text-muted truncate">
                            Card {r.enrollmentId}
                            {data.date === "all" &&
                              ` · ${prettyKey(r.workDate)}`}
                          </div>
                          {/* phone: times under the name */}
                          <div className="sm:hidden num text-[11.5px] text-ink-soft mt-0.5">
                            {r.inPunchIST || "-"} to {r.outPunchIST || "-"}
                          </div>
                        </div>
                      </div>
                    </TD>
                    <TD className="num hidden sm:table-cell font-medium text-ink">
                      {r.inPunchIST || <span className="text-muted">-</span>}
                    </TD>
                    <TD className="num hidden sm:table-cell font-medium text-ink">
                      {r.outPunchIST || <span className="text-muted">-</span>}
                    </TD>
                    <TD>
                      <StatusText code={r.code} label={r.status} />
                    </TD>
                    <TD className="num text-right hidden md:table-cell font-semibold">
                      {r.hours || (
                        <span className="text-muted font-normal">-</span>
                      )}
                    </TD>
                    <TD className="hidden xl:table-cell text-ink-soft truncate">
                      {r.device ? `${r.device}, ` : ""}
                      {r.location}
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              onPage={(p) => setF((x) => ({ ...x, page: p }))}
            />
          </>
        )}
      </Panel>
    </div>
  );
}

function Machines({ employees }) {
  const toast = useToast();
  const devices = useApi("/attendance/admin/devices");
  const mappings = useApi("/attendance/admin/mappings");
  const { run, busy } = useMutation();
  const [dev, setDev] = useState(null);
  const [map, setMap] = useState(null);
  const locations = [...new Set((devices.data || []).map((d) => d.location))];
  const unmapped = employees.filter(
    (e) => !(mappings.data || []).some((m) => m.employeeId === e.employeeId),
  );
  const endpoint = `${import.meta.env.VITE_API_BASE_URL || window.location.origin}/api/attendance/device/punch`;

  async function saveDevice() {
    try {
      await run("/attendance/admin/devices", {
        body: dev,
        invalidates: ["/attendance/admin/devices"],
      });
      toast("Machine added");
      setDev(null);
    } catch (e) {
      toast(e.message, "error");
    }
  }
  async function saveMap() {
    try {
      const r = await run("/attendance/admin/mappings", {
        body: map,
        invalidates: ["/attendance"],
      });
      toast(
        r.linkedPunches
          ? `Card linked, ${r.linkedPunches} earlier punches attached`
          : "Card linked",
      );
      setMap(null);
    } catch (e) {
      toast(e.message, "error");
    }
  }

  return (
    <div className="grid xl:grid-cols-[1fr_1.4fr] gap-6 items-start">
      <Panel
        title="Biometric machines"
        icon={Cpu}
        bodyClass="p-0"
        actions={
          <Button
            size="sm"
            variant="primary"
            icon={Plus}
            onClick={() =>
              setDev({
                deviceCode: "",
                serialNo: "",
                deviceName: "",
                location: "",
              })
            }
          >
            Add machine
          </Button>
        }
      >
        {devices.loading ? (
          <Spinner />
        ) : !devices.data?.length ? (
          <Empty title="No machine added yet">
            Add the machine's device code and serial number so its punches are
            accepted.
          </Empty>
        ) : (
          <ul>
            {devices.data.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-3 px-5 py-3 border-b border-line"
              >
                <div className="min-w-0">
                  <div className="font-semibold truncate">
                    {d.deviceName || `Device ${d.deviceCode}`}
                  </div>
                  <div className="text-xs text-muted">
                    Code {d.deviceCode}, serial {d.serialNo}, {d.location}
                  </div>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await run(`/attendance/admin/devices/${d.id}/toggle`, {
                        method: "PATCH",
                        invalidates: ["/attendance/admin/devices"],
                      });
                    } catch (e) {
                      toast(e.message, "error");
                    }
                  }}
                  className={cx(
                    "text-[13px] font-semibold hover:underline",
                    d.isActive ? "text-active" : "text-leave",
                  )}
                >
                  {d.isActive ? "Active" : "Off"}
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="p-5 text-[13px] text-ink-soft bg-white/40 rounded-b-[22px]">
          <div className="font-semibold text-ink mb-1">Machine setup</div>
          Point the machine (or its sync software) to:
          <code className="block mt-1.5 mb-1.5 break-all rounded-xl bg-white/80 border border-white px-3 py-2 text-[12px] text-ink">
            POST {endpoint}
          </code>
          Same format as the HR CRM: EnrollmentId, DevicesId, SerialNo,
          PunchMode, PunchDateAndTime (IST).
        </div>
      </Panel>

      <Panel
        title="Cards"
        icon={Fingerprint}
        bodyClass="p-0"
        actions={
          <Button
            size="sm"
            variant="primary"
            icon={Plus}
            disabled={!locations.length}
            onClick={() =>
              setMap({
                employeeId: unmapped[0]?.employeeId || "",
                enrollmentId: "",
                location: locations[0] || "",
              })
            }
          >
            Link card
          </Button>
        }
      >
        {mappings.loading ? (
          <Spinner />
        ) : !mappings.data?.length ? (
          <Empty title="No cards linked">
            Link each employee's machine enrollment ID to see their attendance.
          </Empty>
        ) : (
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr>
                <TH>Employee</TH>
                <TH className="w-24">Card ID</TH>
                <TH className="hidden md:table-cell">Saturday rule</TH>
                <TH className="w-24 text-right">Punches</TH>
                <TH className="w-24" />
              </tr>
            </thead>
            <tbody>
              {mappings.data.map((m) => (
                <tr key={m.id}>
                  <TD className="truncate font-medium">{m.name}</TD>
                  <TD className="num">{m.enrollmentId}</TD>
                  <TD className="hidden md:table-cell text-ink-soft truncate">
                    {m.saturdayRule}
                  </TD>
                  <TD className="num text-right">{num(m.punches)}</TD>
                  <TD className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        if (
                          !window.confirm(
                            `Remove card ${m.enrollmentId} from ${m.name}?`,
                          )
                        )
                          return;
                        try {
                          await run(
                            `/attendance/admin/mappings/${m.id}/deactivate`,
                            { method: "PATCH", invalidates: ["/attendance"] },
                          );
                        } catch (e) {
                          toast(e.message, "error");
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </TD>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {unmapped.length > 0 && (
          <p className="px-5 py-3 text-xs text-noresp border-t border-line">
            {unmapped.length} active employee
            {unmapped.length > 1 ? "s have" : " has"} no card:{" "}
            {unmapped.map((e) => e.name).join(", ")}
          </p>
        )}
      </Panel>

      {dev && (
        <Modal
          open
          onClose={() => setDev(null)}
          title="Add biometric machine"
          footer={
            <>
              <Button onClick={() => setDev(null)}>Cancel</Button>
              <Button variant="primary" loading={busy} onClick={saveDevice}>
                Add machine
              </Button>
            </>
          }
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <Field
              label="Device code"
              required
              hint="DevicesId sent by the machine"
            >
              <Input
                value={dev.deviceCode}
                onChange={(e) => setDev({ ...dev, deviceCode: e.target.value })}
              />
            </Field>
            <Field label="Serial number" required>
              <Input
                value={dev.serialNo}
                onChange={(e) => setDev({ ...dev, serialNo: e.target.value })}
              />
            </Field>
            <Field label="Name">
              <Input
                value={dev.deviceName}
                onChange={(e) => setDev({ ...dev, deviceName: e.target.value })}
                placeholder="Main entrance"
              />
            </Field>
            <Field label="Location" required>
              <Input
                value={dev.location}
                onChange={(e) => setDev({ ...dev, location: e.target.value })}
                placeholder="Bengaluru Office"
              />
            </Field>
          </div>
        </Modal>
      )}
      {map && (
        <Modal
          open
          onClose={() => setMap(null)}
          title="Link a card to an employee"
          footer={
            <>
              <Button onClick={() => setMap(null)}>Cancel</Button>
              <Button variant="primary" loading={busy} onClick={saveMap}>
                Link card
              </Button>
            </>
          }
        >
          <div className="grid gap-4">
            <Field label="Employee" required>
              <Select
                value={map.employeeId}
                onChange={(e) => setMap({ ...map, employeeId: e.target.value })}
              >
                {unmapped.map((e) => (
                  <option key={e.employeeId} value={e.employeeId}>
                    {e.name} ({e.employeeId})
                    {e.role === "DEVELOPER" ? ", Developer" : ""}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Card / enrollment ID"
              required
              hint="The user number on the machine"
            >
              <Input
                value={map.enrollmentId}
                onChange={(e) =>
                  setMap({ ...map, enrollmentId: e.target.value })
                }
              />
            </Field>
            <Field label="Location" required>
              <Select
                value={map.location}
                onChange={(e) => setMap({ ...map, location: e.target.value })}
              >
                {locations.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </Select>
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function Attendance() {
  const [tab, setTab] = useState("monthly");
  // marketing employees + developers (people who can have a biometric card)
  const employees = useApi("/attendance/admin/people");
  return (
    <>
      <PageHeader
        title="Attendance"
        emoji="🗓️"
        subtitle={`Biometric punches and system clock-in. Day = US workday, times in IST. ${fmtDate(new Date(), "MMMM yyyy")}`}
      />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "monthly", label: "Monthly report" },
          { value: "log", label: "Punch log" },
          { value: "setup", label: "Machines & cards" },
        ]}
      />
      {tab === "monthly" && <MonthlyReport />}
      {tab === "log" && <PunchLog employees={employees.data || []} />}
      {tab === "setup" && <Machines employees={employees.data || []} />}
    </>
  );
}
