// Admin team tools: view team reports, enter monthly numbers, deal amounts, manage teams.
import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useApi, useMutation } from "../../lib/api";
import { money, num, recentMonths } from "../../lib/format";
import { Bar, Button, Empty, ErrorNote, Field, Input, Modal, Panel, Select, Spinner, TH, TD, useToast, cx } from "../../components/ui";

const FIELDS = [
  ["totalLeads", "Leads"], ["deal", "Deals"], ["invoicePending", "Invoice pending"], ["invoiceCancel", "Invoice cancelled"],
  ["activeClients", "Active clients"], ["leaveOutClients", "Leave out"], ["noResponse", "No response"], ["dealValue", "Deal value (₹)"],
];

function MonthSelect({ value, onChange }) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-auto text-[13px]" aria-label="Month">
      {recentMonths(12).map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
    </Select>
  );
}
const splitKey = (k) => k.split("-").map(Number);
const membersOf = (t) => [t.leader, ...t.members.map((m) => m.employee)].filter(Boolean);

/* ---------------- view ---------------- */
function TeamReports({ teams }) {
  const [key, setKey] = useState(recentMonths(1)[0].key);
  const [y, m] = splitKey(key);
  const { data, loading } = useApi(`/teams/admin/reports?month=${m}&year=${y}`);
  const byTeam = useMemo(() => {
    const g = {};
    (data?.reports || []).forEach((r) => (g[r.teamId] ||= []).push(r));
    return g;
  }, [data]);
  return (
    <div className="space-y-5">
      <div className="flex justify-end"><MonthSelect value={key} onChange={setKey} /></div>
      {loading ? <Spinner /> : teams.map((t) => {
        const rows = byTeam[t.id] || [];
        const total = rows.reduce((s, r) => s + Number(r.dealValue || 0), 0);
        return (
          <Panel key={t.id} title={t.name} bodyClass="p-0" actions={<span className="text-[13px] text-muted">Leader {t.leader?.fullName}</span>}>
            <div className="grid sm:grid-cols-3 gap-4 px-5 py-4 border-b border-line">
              <div><div className="text-muted text-[13px]">Target</div><div className="num font-semibold text-lg">{money(t.targetValue)}</div></div>
              <div><div className="text-muted text-[13px]">Deal value</div><div className="num font-semibold text-lg text-active">{money(total)}</div></div>
              <div><div className="text-muted text-[13px] mb-2">{t.targetValue ? Math.round((total / t.targetValue) * 100) : 0}% of target</div><Bar value={total} max={t.targetValue} tone="bg-active" /></div>
            </div>
            {!rows.length ? <Empty title="No report entered for this month" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr><TH>Member</TH>{FIELDS.map(([k, l]) => <TH key={k} className="text-right">{l}</TH>)}</tr></thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <TD className="font-medium">{r.employee?.fullName}</TD>
                        {FIELDS.map(([k]) => <TD key={k} className="num text-right">{k === "dealValue" ? money(r[k]) : num(r[k])}</TD>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        );
      })}
    </div>
  );
}

/* ---------------- enter monthly numbers ---------------- */
function EnterReport({ teams }) {
  const toast = useToast();
  const { run, busy } = useMutation();
  const [teamId, setTeamId] = useState(teams[0]?.id || "");
  const [key, setKey] = useState(recentMonths(1)[0].key);
  const [y, m] = splitKey(key);
  const team = teams.find((t) => t.id === Number(teamId));
  const existing = useApi(teamId ? `/teams/admin/reports?teamId=${teamId}&month=${m}&year=${y}` : null);
  const [rows, setRows] = useState({});

  useEffect(() => {
    if (!team || !existing.data) return;
    const prev = Object.fromEntries((existing.data.reports || []).map((r) => [r.employeeId, r]));
    setRows(Object.fromEntries(membersOf(team).map((e) => [e.employeeId, Object.fromEntries(FIELDS.map(([k]) => [k, prev[e.employeeId]?.[k] ?? 0]))])));
  }, [team, existing.data]);

  if (!teams.length) return <Panel><Empty title="Create a team first" /></Panel>;

  async function save() {
    try {
      await run("/teams/admin/reports", {
        body: { teamId: Number(teamId), month: m, year: y, reports: Object.entries(rows).map(([employeeId, v]) => ({ employeeId, ...v })) },
        invalidates: ["/teams"],
      });
      toast("Team report saved");
    } catch (e) {
      toast(e.message, "error");
    }
  }

  return (
    <Panel
      title="Enter monthly numbers"
      bodyClass="p-0"
      actions={
        <div className="flex gap-2">
          <Select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="h-8 w-auto text-[13px]" aria-label="Team">
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
          <MonthSelect value={key} onChange={setKey} />
        </div>
      }
    >
      {existing.loading || !team ? <Spinner /> : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr><TH>Member</TH>{FIELDS.map(([k, l]) => <TH key={k}>{l}</TH>)}</tr></thead>
              <tbody>
                {membersOf(team).map((e) => (
                  <tr key={e.employeeId}>
                    <TD className="font-medium whitespace-nowrap">{e.fullName}</TD>
                    {FIELDS.map(([k]) => (
                      <TD key={k}>
                        <Input type="number" min="0" className={cx("h-8 text-right num", k === "dealValue" ? "w-28" : "w-20")} value={rows[e.employeeId]?.[k] ?? 0}
                          onChange={(ev) => setRows((r) => ({ ...r, [e.employeeId]: { ...r[e.employeeId], [k]: ev.target.value } }))} />
                      </TD>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end p-4 border-t border-line"><Button variant="primary" loading={busy} onClick={save}>Save report</Button></div>
        </>
      )}
    </Panel>
  );
}

/* ---------------- deal amounts ---------------- */
function DealAmounts({ teams }) {
  const toast = useToast();
  const { run, busy } = useMutation();
  const [key, setKey] = useState(recentMonths(1)[0].key);
  const [y, m] = splitKey(key);
  const ann = useApi(`/teams/admin/announcements?month=${m}&year=${y}`);
  const people = useMemo(() => {
    const map = new Map();
    teams.forEach((t) => membersOf(t).forEach((e) => map.set(e.employeeId, { ...e, team: t.name })));
    return [...map.values()];
  }, [teams]);
  const [amounts, setAmounts] = useState({});
  useEffect(() => {
    if (ann.data) setAmounts(Object.fromEntries(ann.data.announcements.map((a) => [a.employeeId, a.amount])));
  }, [ann.data]);

  async function save() {
    try {
      await run("/teams/admin/announcements", {
        body: { month: m, year: y, announcements: people.map((p) => ({ employeeId: p.employeeId, amount: Number(amounts[p.employeeId] || 0) })) },
        invalidates: ["/teams"],
      });
      toast("Deal amounts saved");
    } catch (e) {
      toast(e.message, "error");
    }
  }
  const total = people.reduce((s, p) => s + Number(amounts[p.employeeId] || 0), 0);

  return (
    <Panel title="Deal amounts" bodyClass="p-0" actions={<MonthSelect value={key} onChange={setKey} />}>
      {ann.loading ? <Spinner /> : !people.length ? <Empty title="Create a team first" /> : (
        <>
          <table className="w-full text-sm">
            <thead><tr><TH>Employee</TH><TH>Team</TH><TH className="text-right">Amount (₹)</TH></tr></thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.employeeId}>
                  <TD className="font-medium">{p.fullName}</TD>
                  <TD className="text-ink-soft">{p.team}</TD>
                  <TD className="text-right"><Input type="number" min="0" className="h-8 w-36 text-right num ml-auto" value={amounts[p.employeeId] ?? ""} onChange={(e) => setAmounts((a) => ({ ...a, [p.employeeId]: e.target.value }))} /></TD>
                </tr>
              ))}
              <tr className="bg-paper/60 font-semibold"><TD>Total</TD><TD /><TD className="num text-right">{money(total)}</TD></tr>
            </tbody>
          </table>
          <div className="flex justify-end p-4 border-t border-line"><Button variant="primary" loading={busy} onClick={save}>Save amounts</Button></div>
        </>
      )}
    </Panel>
  );
}

/* ---------------- manage teams ---------------- */
function TeamModal({ team, teams, onClose }) {
  const toast = useToast();
  const { run, busy } = useMutation();
  const employees = useApi("/employees/stats");
  const isNew = !team?.id;
  const [f, setF] = useState({
    teamName: team?.name || "",
    teamLeader: team?.leaderId || "",
    targetValue: team?.targetValue ?? "",
    members: team?.members?.map((m) => m.employeeId) || [],
  });
  const taken = new Set(teams.filter((t) => t.id !== team?.id).flatMap((t) => [t.leaderId, ...t.members.map((m) => m.employeeId)]));
  const options = (employees.data || []).filter((e) => !taken.has(e.employeeId));

  async function save() {
    try {
      await run(isNew ? "/teams/admin/teams" : `/teams/admin/teams/${team.id}`, {
        method: isNew ? "POST" : "PUT",
        body: { ...f, members: f.members.filter((m) => m !== f.teamLeader).map((employeeId) => ({ employeeId })) },
        invalidates: ["/teams"],
      });
      toast(isNew ? "Team created" : "Team saved");
      onClose();
    } catch (e) {
      toast(e.message, "error");
    }
  }

  return (
    <Modal open onClose={onClose} title={isNew ? "Create team" : `Edit ${team.name}`} footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" loading={busy} onClick={save}>{isNew ? "Create team" : "Save team"}</Button></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Team name"><Input value={f.teamName} onChange={(e) => setF({ ...f, teamName: e.target.value })} /></Field>
        <Field label="Monthly target (₹)"><Input type="number" min="0" value={f.targetValue} onChange={(e) => setF({ ...f, targetValue: e.target.value })} /></Field>
        <Field label="Team leader" className="sm:col-span-2">
          <Select value={f.teamLeader} onChange={(e) => setF({ ...f, teamLeader: e.target.value })}>
            <option value="">Choose a leader</option>
            {options.map((e) => <option key={e.employeeId} value={e.employeeId}>{e.name} ({e.employeeId})</option>)}
          </Select>
        </Field>
      </div>
      <div className="mt-4">
        <div className="text-[13px] font-medium text-ink-soft mb-2">Members</div>
        <div className="grid sm:grid-cols-2 gap-1 max-h-60 overflow-y-auto border border-line rounded-md p-2">
          {options.filter((e) => e.employeeId !== f.teamLeader).map((e) => (
            <label key={e.employeeId} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-paper">
              <input type="checkbox" className="accent-[var(--color-brand)]" checked={f.members.includes(e.employeeId)}
                onChange={(ev) => setF({ ...f, members: ev.target.checked ? [...f.members, e.employeeId] : f.members.filter((x) => x !== e.employeeId) })} />
              {e.name}
            </label>
          ))}
          {!options.length && <p className="text-muted text-[13px] p-2">Everyone is already in a team.</p>}
        </div>
      </div>
    </Modal>
  );
}

function ManageTeams({ teams }) {
  const toast = useToast();
  const { run } = useMutation();
  const [editing, setEditing] = useState(null);
  async function remove(t) {
    if (!window.confirm(`Delete team "${t.name}" and all its monthly reports?`)) return;
    try {
      await run(`/teams/admin/teams/${t.id}`, { method: "DELETE", invalidates: ["/teams"] });
      toast("Team deleted");
    } catch (e) {
      toast(e.message, "error");
    }
  }
  return (
    <Panel title="Teams" bodyClass="p-0" actions={<Button size="sm" variant="primary" icon={Plus} onClick={() => setEditing({})}>Create team</Button>}>
      {!teams.length ? <Empty title="No teams yet" /> : (
        <table className="w-full text-sm">
          <thead><tr><TH>Team</TH><TH>Leader</TH><TH>Members</TH><TH className="text-right">Target</TH><TH /></tr></thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.id}>
                <TD className="font-medium">{t.name}</TD>
                <TD>{t.leader?.fullName}</TD>
                <TD className="text-ink-soft">{t.members.map((m) => m.employee?.fullName).join(", ") || "—"}</TD>
                <TD className="num text-right">{money(t.targetValue)}</TD>
                <TD className="text-right whitespace-nowrap">
                  <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEditing(t)}>Edit</Button>
                  <Button size="sm" variant="ghost" icon={Trash2} onClick={() => remove(t)} aria-label={`Delete ${t.name}`} />
                </TD>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {editing && <TeamModal team={editing} teams={teams} onClose={() => setEditing(null)} />}
    </Panel>
  );
}

export default function TeamsAdmin() {
  const { data, loading, error, reload } = useApi("/teams/admin/teams");
  const [view, setView] = useState("report");
  const teams = data?.teams || [];
  const VIEWS = [["report", "Team report"], ["enter", "Enter numbers"], ["deals", "Deal amounts"], ["manage", "Manage teams"]];
  return (
    <>
      <div className="inline-flex rounded-md border border-line-strong bg-white overflow-hidden mb-5">
        {VIEWS.map(([v, l], i) => (
          <button key={v} onClick={() => setView(v)} className={cx("h-8 px-3.5 text-[13px] font-medium", i > 0 && "border-l border-line-strong", view === v ? "bg-ink text-white" : "text-ink-soft hover:bg-paper")}>{l}</button>
        ))}
      </div>
      <ErrorNote error={error} onRetry={reload} />
      {loading ? <Spinner /> : (
        <>
          {view === "report" && (teams.length ? <TeamReports teams={teams} /> : <Panel><Empty title="No teams yet" action={<Button onClick={() => setView("manage")}>Create a team</Button>} /></Panel>)}
          {view === "enter" && <EnterReport teams={teams} />}
          {view === "deals" && <DealAmounts teams={teams} />}
          {view === "manage" && <ManageTeams teams={teams} />}
        </>
      )}
    </>
  );
}
