// Admin attendance: monthly report (biometric + system clock-in), today, punch log, machines & cards.
import { useMemo, useState } from "react";
import { CalendarCheck, Download, Mail, Fingerprint, Cpu, Plus, Search, UserX, Clock } from "lucide-react";
import { api, download, useApi, useMutation } from "../../lib/api";
import { fmtDate, num, recentMonths } from "../../lib/format";
import { Avatar, Badge, Button, Chip, Empty, ErrorNote, Field, Input, Modal, PageHeader, Pagination, Panel, RefreshButton, Select, Spinner, StatCard, Tabs, TH, TD, useToast, cx } from "../../components/ui";

const CODE_STYLE = {
  P: "bg-active-soft text-active border-active/25",
  HD: "bg-noresp-soft text-noresp border-noresp/25",
  MP: "bg-orange-soft text-orange border-orange/25",
  A: "bg-leave-soft text-leave border-leave/25",
  WO: "bg-pending-soft text-pending border-pending/20",
  H: "bg-violet-soft text-violet border-violet/20",
  IN: "bg-blue-soft text-blue border-blue/25",
};
const CODE_LABEL = { P: "Present", HD: "Half day", MP: "Missing punch-out", A: "Absent", WO: "Week off", H: "Holiday", IN: "Working now" };
const SAT = { WORKING: "Every Saturday", OFF: "Saturday off", ALTERNATE: "Alternate Saturdays" };
const WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function Legend() {
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {Object.entries(CODE_LABEL).map(([c, l]) => (
        <span key={c} className={cx("inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-semibold", CODE_STYLE[c])}>{c} <span className="font-normal">{l}</span></span>
      ))}
    </div>
  );
}

/* Calendar for one employee */
function EmployeeMonth({ row, report, onClose }) {
  const lead = report.days[0]?.weekday || 0;
  return (
    <Modal open onClose={onClose} width="max-w-4xl" title={`${row.name}, ${report.label}`}>
      <div className="flex flex-wrap gap-2 mb-4 text-[13px]">
        <Badge>{SAT[row.saturdayRule]}</Badge>
        <Chip tone="active">{row.summary.present} present</Chip>
        <Chip tone="noresp">{row.summary.halfDay} half</Chip>
        <Chip tone="leave">{row.summary.absent} absent</Chip>
        <Chip tone="pending">{row.summary.missingOut} missing out</Chip>
        <span className="text-muted self-center">Biometric {row.summary.hours || "0h"}, system {row.system.hours || "0h"}</span>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-muted mb-1.5">{WEEK.map((w) => <div key={w}>{w}</div>)}</div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: lead }, (_, i) => <div key={`x${i}`} />)}
        {row.days.map((d) => (
          <div key={d.date} className={cx("rounded-lg border p-1.5 sm:p-2 min-h-[78px] text-left", d.code ? CODE_STYLE[d.code] : "border-line bg-white")}>
            <div className="flex items-center justify-between">
              <span className="num font-bold text-[13px] text-ink">{Number(d.date.slice(-2))}</span>
              {d.code && <span className="text-[11px] font-bold">{d.code}{d.offDayWork ? "*" : ""}</span>}
            </div>
            {d.firstPunchIST && <div className="num text-[10px] sm:text-[11px] mt-1 text-ink-soft leading-tight">{d.firstPunchIST}{d.lastPunchIST ? <><br />{d.lastPunchIST}</> : ""}</div>}
            {d.hours && <div className="num text-[10px] sm:text-[11px] font-semibold text-ink">{d.hours}</div>}
            {d.system?.notClockedOut && <div className="text-[10px] font-semibold text-leave leading-tight mt-0.5">Not clocked out</div>}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted mt-3">Times are IST. * = worked on a week off or holiday. Full day = {report.fullDayHours} hours or more.</p>
    </Modal>
  );
}

function MonthlyReport() {
  const toast = useToast();
  const months = recentMonths(2);
  const [key, setKey] = useState(months[0].key);
  const [y, m] = key.split("-").map(Number);
  const { data, loading, error, reload, refreshing } = useApi(`/attendance/admin/monthly?year=${y}&month=${m}`, { ttl: 2 * 60 * 1000 });
  const [open, setOpen] = useState(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState("");
  const rows = useMemo(() => (data?.rows || []).filter((r) => !q || r.name.toLowerCase().includes(q.toLowerCase()) || r.employeeId.toLowerCase().includes(q.toLowerCase())), [data, q]);
  const tot = (k, sub = "summary") => (data?.rows || []).reduce((s, r) => s + (r[sub][k] || 0), 0);

  async function emailNow() {
    if (!window.confirm(`Email the ${data?.label} attendance report now?`)) return;
    setBusy("mail");
    try {
      const r = await api("/attendance/admin/monthly/email", { method: "POST", body: { year: y, month: m } });
      toast(`Report emailed to ${r.to}`);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setBusy("");
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-2">
          <Select value={key} onChange={(e) => setKey(e.target.value)} className="w-44" aria-label="Month">
            {months.map((mm) => <option key={mm.key} value={mm.key}>{mm.label}</option>)}
          </Select>
          <div className="relative w-56">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search employee" className="pl-9" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <RefreshButton onClick={reload} spinning={refreshing} />
          <Button icon={Mail} loading={busy === "mail"} onClick={emailNow}>Email report</Button>
          <Button variant="blue" icon={Download} loading={busy === "xl"} onClick={async () => { setBusy("xl"); try { await download(`/attendance/admin/monthly/export?year=${y}&month=${m}`, `attendance-${key}.xlsx`); } catch (e) { toast(e.message, "error"); } finally { setBusy(""); } }}>Excel</Button>
        </div>
      </div>
      <ErrorNote error={error} onRetry={reload} />
      {loading ? <Spinner /> : (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
            <StatCard label="Present days" value={num(tot("present"))} icon={CalendarCheck} tone="green" />
            <StatCard label="Half days" value={num(tot("halfDay"))} hint={`Under ${data.fullDayHours} hours`} icon={Clock} tone="orange" />
            <StatCard label="Absent days" value={num(tot("absent"))} icon={UserX} tone="red" />
            <StatCard label="Not clocked out" value={num(tot("notClockedOut", "system"))} hint="System clock-in" icon={Fingerprint} tone="violet" />
          </div>
          <Panel bodyClass="p-0" title={`${data.label} attendance`} icon={CalendarCheck}>
            <div className="px-5 py-3 border-b border-line"><Legend /></div>
            {!rows.length ? <Empty title="No employees found" /> : (
              <table className="w-full text-sm table-fixed">
                <thead>
                  <tr>
                    <TH className="w-[34%] md:w-[24%]">Employee</TH>
                    <TH className="text-center">P</TH>
                    <TH className="text-center">HD</TH>
                    <TH className="text-center">A</TH>
                    <TH className="text-center hidden sm:table-cell">MP</TH>
                    <TH className="text-center hidden lg:table-cell">WO / H</TH>
                    <TH className="text-right hidden md:table-cell">Biometric hrs</TH>
                    <TH className="text-right hidden lg:table-cell">System hrs</TH>
                    <TH className="text-center hidden md:table-cell">Not clocked out</TH>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.employeeId} className="hover:bg-[#f9fbfe] cursor-pointer" onClick={() => setOpen(r)}>
                      <TD>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar name={r.name} size={28} />
                          <div className="min-w-0">
                            <div className="font-semibold truncate text-blue hover:underline">{r.name}</div>
                            <div className="text-xs text-muted truncate">{r.employeeId}, {SAT[r.saturdayRule]}{!r.hasBiometric && ", no punches"}</div>
                          </div>
                        </div>
                      </TD>
                      <TD className="text-center"><Chip tone="active">{r.summary.present}</Chip></TD>
                      <TD className="text-center"><Chip tone="noresp">{r.summary.halfDay}</Chip></TD>
                      <TD className="text-center"><Chip tone="leave">{r.summary.absent}</Chip></TD>
                      <TD className="text-center hidden sm:table-cell"><Chip tone="pending">{r.summary.missingOut}</Chip></TD>
                      <TD className="text-center num text-ink-soft hidden lg:table-cell">{r.summary.weekOff} / {r.summary.holiday}{r.summary.offDayWork ? <span className="text-active font-semibold"> +{r.summary.offDayWork}</span> : ""}</TD>
                      <TD className="text-right num hidden md:table-cell">{r.summary.hours || "—"}</TD>
                      <TD className="text-right num hidden lg:table-cell">{r.system.hours || "—"}</TD>
                      <TD className={cx("text-center num font-semibold hidden md:table-cell", r.system.notClockedOut ? "text-leave" : "text-muted")}>{r.system.notClockedOut || "—"}</TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="text-xs text-muted px-5 py-3 border-t border-line">
              Click a name for the day-by-day calendar. Sunday is a holiday. Saturdays follow each person's Saturday rule (set it under Employees).
              The report for last month is emailed automatically on the 1st. Punch data is kept for 2 months.
            </p>
          </Panel>
        </>
      )}
      {open && <EmployeeMonth row={open} report={data} onClose={() => setOpen(null)} />}
    </>
  );
}

function PunchLog({ employees }) {
  const [f, setF] = useState({ page: 1, mapped: "", employeeId: "", date: "" });
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v !== "")).toString();
  const { data, loading, error, reload, refreshing } = useApi(`/attendance/admin/punches?${qs}`, { ttl: 30 * 1000, keepPrevious: true });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value, page: 1 }));
  return (
    <Panel bodyClass="p-0" title="Punch log" icon={Fingerprint} actions={<RefreshButton onClick={reload} spinning={refreshing} />}>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border-b border-line">
        <Select value={f.employeeId} onChange={set("employeeId")} aria-label="Employee">
          <option value="">All employees</option>
          {employees.map((e) => <option key={e.employeeId} value={e.employeeId}>{e.name}</option>)}
        </Select>
        <Select value={f.mapped} onChange={set("mapped")} aria-label="Card">
          <option value="">All punches</option>
          <option value="true">Linked to an employee</option>
          <option value="false">Card not linked</option>
        </Select>
        <Input type="date" value={f.date} onChange={set("date")} aria-label="US date" className="col-span-2 md:col-span-1" />
      </div>
      <ErrorNote error={error} onRetry={reload} />
      {loading ? <Spinner /> : !data?.rows?.length ? <Empty title="No punches found">Punches appear here as soon as the machine sends them.</Empty> : (
        <>
          <table className="w-full text-sm table-fixed">
            <thead><tr><TH>Employee</TH><TH className="w-28">Card ID</TH><TH className="w-44">Time (IST)</TH><TH className="hidden md:table-cell w-28">US workday</TH><TH className="hidden lg:table-cell">Machine</TH></tr></thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.id}>
                  <TD className="truncate">{r.name ? <span className="font-medium">{r.name}</span> : <span className="text-noresp font-medium">Card not linked</span>}</TD>
                  <TD className="num">{r.enrollmentId}</TD>
                  <TD className="num">{r.timeIST}</TD>
                  <TD className="num hidden md:table-cell text-ink-soft">{r.workDate}</TD>
                  <TD className="hidden lg:table-cell text-ink-soft truncate">{r.device}, {r.location}</TD>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPage={(p) => setF((x) => ({ ...x, page: p }))} />
        </>
      )}
    </Panel>
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
  const unmapped = employees.filter((e) => !(mappings.data || []).some((m) => m.employeeId === e.employeeId));
  const endpoint = `${import.meta.env.VITE_API_BASE_URL || window.location.origin}/api/attendance/device/punch`;

  async function saveDevice() {
    try {
      await run("/attendance/admin/devices", { body: dev, invalidates: ["/attendance/admin/devices"] });
      toast("Machine added");
      setDev(null);
    } catch (e) { toast(e.message, "error"); }
  }
  async function saveMap() {
    try {
      const r = await run("/attendance/admin/mappings", { body: map, invalidates: ["/attendance"] });
      toast(r.linkedPunches ? `Card linked, ${r.linkedPunches} earlier punches attached` : "Card linked");
      setMap(null);
    } catch (e) { toast(e.message, "error"); }
  }

  return (
    <div className="grid xl:grid-cols-[1fr_1.4fr] gap-6 items-start">
      <Panel title="Biometric machines" icon={Cpu} bodyClass="p-0" actions={<Button size="sm" variant="primary" icon={Plus} onClick={() => setDev({ deviceCode: "", serialNo: "", deviceName: "", location: "" })}>Add machine</Button>}>
        {devices.loading ? <Spinner /> : !devices.data?.length ? <Empty title="No machine added yet">Add the machine's device code and serial number so its punches are accepted.</Empty> : (
          <ul>
            {devices.data.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 px-5 py-3 border-b border-line">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{d.deviceName || `Device ${d.deviceCode}`}</div>
                  <div className="text-xs text-muted">Code {d.deviceCode}, serial {d.serialNo}, {d.location}</div>
                </div>
                <button
                  onClick={async () => { try { await run(`/attendance/admin/devices/${d.id}/toggle`, { method: "PATCH", invalidates: ["/attendance/admin/devices"] }); } catch (e) { toast(e.message, "error"); } }}
                  className={cx("text-[13px] font-semibold hover:underline", d.isActive ? "text-active" : "text-leave")}
                >
                  {d.isActive ? "Active" : "Off"}
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="p-5 text-[13px] text-ink-soft bg-[#f9fbfe] rounded-b-[14px]">
          <div className="font-semibold text-ink mb-1">Machine setup</div>
          Point the machine (or its sync software) to:
          <code className="block mt-1.5 mb-1.5 break-all rounded-lg bg-white border border-line px-3 py-2 text-[12px] text-ink">POST {endpoint}</code>
          Same format as the HR CRM: EnrollmentId, DevicesId, SerialNo, PunchMode, PunchDateAndTime (IST).
        </div>
      </Panel>

      <Panel title="Cards" icon={Fingerprint} bodyClass="p-0" actions={<Button size="sm" variant="primary" icon={Plus} disabled={!locations.length} onClick={() => setMap({ employeeId: unmapped[0]?.employeeId || "", enrollmentId: "", location: locations[0] || "" })}>Link card</Button>}>
        {mappings.loading ? <Spinner /> : !mappings.data?.length ? <Empty title="No cards linked">Link each employee's machine enrollment ID to see their attendance.</Empty> : (
          <table className="w-full text-sm table-fixed">
            <thead><tr><TH>Employee</TH><TH className="w-24">Card ID</TH><TH className="hidden md:table-cell">Saturday rule</TH><TH className="w-24 text-right">Punches</TH><TH className="w-24" /></tr></thead>
            <tbody>
              {mappings.data.map((m) => (
                <tr key={m.id}>
                  <TD className="truncate font-medium">{m.name}</TD>
                  <TD className="num">{m.enrollmentId}</TD>
                  <TD className="hidden md:table-cell text-ink-soft truncate">{m.saturdayRule}</TD>
                  <TD className="num text-right">{num(m.punches)}</TD>
                  <TD className="text-right">
                    <Button size="sm" variant="ghost" onClick={async () => { if (!window.confirm(`Remove card ${m.enrollmentId} from ${m.name}?`)) return; try { await run(`/attendance/admin/mappings/${m.id}/deactivate`, { method: "PATCH", invalidates: ["/attendance"] }); } catch (e) { toast(e.message, "error"); } }}>Remove</Button>
                  </TD>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {unmapped.length > 0 && <p className="px-5 py-3 text-xs text-noresp border-t border-line">{unmapped.length} active employee{unmapped.length > 1 ? "s have" : " has"} no card: {unmapped.map((e) => e.name).join(", ")}</p>}
      </Panel>

      {dev && (
        <Modal open onClose={() => setDev(null)} title="Add biometric machine" footer={<><Button onClick={() => setDev(null)}>Cancel</Button><Button variant="primary" loading={busy} onClick={saveDevice}>Add machine</Button></>}>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Device code" required hint="DevicesId sent by the machine"><Input value={dev.deviceCode} onChange={(e) => setDev({ ...dev, deviceCode: e.target.value })} /></Field>
            <Field label="Serial number" required><Input value={dev.serialNo} onChange={(e) => setDev({ ...dev, serialNo: e.target.value })} /></Field>
            <Field label="Name"><Input value={dev.deviceName} onChange={(e) => setDev({ ...dev, deviceName: e.target.value })} placeholder="Main entrance" /></Field>
            <Field label="Location" required><Input value={dev.location} onChange={(e) => setDev({ ...dev, location: e.target.value })} placeholder="Bengaluru Office" /></Field>
          </div>
        </Modal>
      )}
      {map && (
        <Modal open onClose={() => setMap(null)} title="Link a card to an employee" footer={<><Button onClick={() => setMap(null)}>Cancel</Button><Button variant="primary" loading={busy} onClick={saveMap}>Link card</Button></>}>
          <div className="grid gap-4">
            <Field label="Employee" required>
              <Select value={map.employeeId} onChange={(e) => setMap({ ...map, employeeId: e.target.value })}>
                {unmapped.map((e) => <option key={e.employeeId} value={e.employeeId}>{e.name} ({e.employeeId})</option>)}
              </Select>
            </Field>
            <Field label="Card / enrollment ID" required hint="The user number on the machine"><Input value={map.enrollmentId} onChange={(e) => setMap({ ...map, enrollmentId: e.target.value })} /></Field>
            <Field label="Location" required>
              <Select value={map.location} onChange={(e) => setMap({ ...map, location: e.target.value })}>{locations.map((l) => <option key={l}>{l}</option>)}</Select>
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function Attendance() {
  const [tab, setTab] = useState("monthly");
  const employees = useApi("/employees/stats");
  return (
    <>
      <PageHeader title="Attendance" subtitle={`Biometric punches and system clock-in. Day = US workday, times in IST. ${fmtDate(new Date(), "MMMM yyyy")}`} />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: "monthly", label: "Monthly report" }, { value: "log", label: "Punch log" }, { value: "setup", label: "Machines & cards" }]} />
      {tab === "monthly" && <MonthlyReport />}
      {tab === "log" && <PunchLog employees={employees.data || []} />}
      {tab === "setup" && <Machines employees={employees.data || []} />}
    </>
  );
}
