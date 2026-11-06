// Admin team tools: view team reports, enter monthly numbers, deal amounts, manage teams.
import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Crown, Users, Check } from "lucide-react";
import { useApi, useMutation } from "../../lib/api";
import { money, num, recentMonths } from "../../lib/format";
import {
  Avatar,
  Bar,
  Button,
  Empty,
  ErrorNote,
  Field,
  IconButton,
  Input,
  Modal,
  Panel,
  Segmented,
  Select,
  Spinner,
  TH,
  TD,
  useToast,
  cx,
} from "../../components/ui";

const FIELDS = [
  ["totalLeads", "Leads"],
  ["deal", "Deals"],
  ["invoicePending", "Invoice pending"],
  ["invoiceCancel", "Invoice cancelled"],
  ["activeClients", "Active clients"],
  ["leaveOutClients", "Leave out"],
  ["noResponse", "No response"],
  ["dealValue", "Deal value (₹)"],
];

function MonthSelect({ value, onChange }) {
  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-48"
      aria-label="Month"
    >
      {recentMonths(12).map((m) => (
        <option key={m.key} value={m.key}>
          {m.label}
        </option>
      ))}
    </Select>
  );
}
const splitKey = (k) => k.split("-").map(Number);
const membersOf = (t) =>
  [t.leader, ...t.members.map((m) => m.employee)].filter(Boolean);

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
      <div className="flex justify-end">
        <MonthSelect value={key} onChange={setKey} />
      </div>
      {loading ? (
        <Spinner />
      ) : (
        teams.map((t) => {
          const rows = byTeam[t.id] || [];
          const total = rows.reduce((s, r) => s + Number(r.dealValue || 0), 0);
          return (
            <Panel
              key={t.id}
              title={t.name}
              icon={Users}
              bodyClass="p-0"
              actions={
                t.leader && (
                  <span className="inline-flex items-center gap-2 text-[13px] text-ink-soft">
                    <Crown size={15} className="text-teal-deep" />{" "}
                    {t.leader.fullName}
                  </span>
                )
              }
            >
              <div className="grid sm:grid-cols-3 gap-3 p-5 border-b border-line">
                <div className="rounded-2xl bg-pearl px-4 py-3">
                  <div className="text-muted text-[12px] font-semibold">
                    Target
                  </div>
                  <div className="num font-[family-name:var(--font-display)] font-extrabold text-[20px]">
                    {money(t.targetValue)}
                  </div>
                </div>
                <div className="rounded-2xl bg-lime px-4 py-3">
                  <div className="text-ink/70 text-[12px] font-semibold">
                    Deal value
                  </div>
                  <div className="num font-[family-name:var(--font-display)] font-extrabold text-[20px]">
                    {money(total)}
                  </div>
                </div>
                <div className="rounded-2xl bg-teal-deep text-white px-4 py-3">
                  <div className="text-pearl/75 text-[12px] font-semibold mb-2">
                    {t.targetValue
                      ? Math.round((total / t.targetValue) * 100)
                      : 0}
                    % of target
                  </div>
                  <div className="h-2 rounded-full bg-white/15 overflow-hidden">
                    <div
                      className="h-full bg-lime rounded-full"
                      style={{
                        width: `${t.targetValue ? Math.min(100, (total / t.targetValue) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
              {!rows.length ? (
                <Empty title="No report entered for this month" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <TH>Member</TH>
                        {FIELDS.map(([k, l]) => (
                          <TH key={k} className="text-right">
                            {l}
                          </TH>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.id}>
                          <TD className="font-medium whitespace-nowrap">
                            <span className="inline-flex items-center gap-2">
                              <Avatar
                                name={r.employee?.fullName || ""}
                                size={28}
                              />
                              {r.employee?.fullName}
                            </span>
                          </TD>
                          {FIELDS.map(([k]) => (
                            <TD key={k} className="num text-right">
                              {k === "dealValue" ? money(r[k]) : num(r[k])}
                            </TD>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          );
        })
      )}
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
  const existing = useApi(
    teamId
      ? `/teams/admin/reports?teamId=${teamId}&month=${m}&year=${y}`
      : null,
  );
  const [rows, setRows] = useState({});

  useEffect(() => {
    if (!team || !existing.data) return;
    const prev = Object.fromEntries(
      (existing.data.reports || []).map((r) => [r.employeeId, r]),
    );
    setRows(
      Object.fromEntries(
        membersOf(team).map((e) => [
          e.employeeId,
          Object.fromEntries(
            FIELDS.map(([k]) => [k, prev[e.employeeId]?.[k] ?? 0]),
          ),
        ]),
      ),
    );
  }, [team, existing.data]);

  if (!teams.length)
    return (
      <Panel>
        <Empty title="Create a team first" />
      </Panel>
    );

  async function save() {
    try {
      await run("/teams/admin/reports", {
        body: {
          teamId: Number(teamId),
          month: m,
          year: y,
          reports: Object.entries(rows).map(([employeeId, v]) => ({
            employeeId,
            ...v,
          })),
        },
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
          <Select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="w-48"
            aria-label="Team"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
          <MonthSelect value={key} onChange={setKey} />
        </div>
      }
    >
      {existing.loading || !team ? (
        <Spinner />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <TH>Member</TH>
                  {FIELDS.map(([k, l]) => (
                    <TH key={k}>{l}</TH>
                  ))}
                </tr>
              </thead>
              <tbody>
                {membersOf(team).map((e) => (
                  <tr key={e.employeeId}>
                    <TD className="font-medium whitespace-nowrap">
                      <span className="inline-flex items-center gap-2">
                        <Avatar name={e.fullName} size={28} />
                        {e.fullName}
                      </span>
                    </TD>
                    {FIELDS.map(([k]) => (
                      <TD key={k}>
                        <Input
                          type="number"
                          min="0"
                          className={cx(
                            "h-8 text-right num",
                            k === "dealValue" ? "w-28" : "w-20",
                          )}
                          value={rows[e.employeeId]?.[k] ?? 0}
                          onChange={(ev) =>
                            setRows((r) => ({
                              ...r,
                              [e.employeeId]: {
                                ...r[e.employeeId],
                                [k]: ev.target.value,
                              },
                            }))
                          }
                        />
                      </TD>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end p-4 border-t border-line">
            <Button variant="primary" loading={busy} onClick={save}>
              Save report
            </Button>
          </div>
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
    teams.forEach((t) =>
      membersOf(t).forEach((e) =>
        map.set(e.employeeId, { ...e, team: t.name }),
      ),
    );
    return [...map.values()];
  }, [teams]);
  const [amounts, setAmounts] = useState({});
  useEffect(() => {
    if (ann.data)
      setAmounts(
        Object.fromEntries(
          ann.data.announcements.map((a) => [a.employeeId, a.amount]),
        ),
      );
  }, [ann.data]);

  async function save() {
    try {
      await run("/teams/admin/announcements", {
        body: {
          month: m,
          year: y,
          announcements: people.map((p) => ({
            employeeId: p.employeeId,
            amount: Number(amounts[p.employeeId] || 0),
          })),
        },
        invalidates: ["/teams"],
      });
      toast("Deal amounts saved");
    } catch (e) {
      toast(e.message, "error");
    }
  }
  const total = people.reduce(
    (s, p) => s + Number(amounts[p.employeeId] || 0),
    0,
  );

  return (
    <Panel
      title="Deal amounts"
      bodyClass="p-0"
      actions={<MonthSelect value={key} onChange={setKey} />}
    >
      {ann.loading ? (
        <Spinner />
      ) : !people.length ? (
        <Empty title="Create a team first" />
      ) : (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <TH>Employee</TH>
                <TH>Team</TH>
                <TH className="text-right">Amount (₹)</TH>
              </tr>
            </thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.employeeId}>
                  <TD className="font-medium">
                    <span className="inline-flex items-center gap-2">
                      <Avatar name={p.fullName} size={28} />
                      {p.fullName}
                    </span>
                  </TD>
                  <TD className="text-ink-soft">{p.team}</TD>
                  <TD className="text-right">
                    <Input
                      type="number"
                      min="0"
                      className="h-8 w-36 text-right num ml-auto"
                      value={amounts[p.employeeId] ?? ""}
                      onChange={(e) =>
                        setAmounts((a) => ({
                          ...a,
                          [p.employeeId]: e.target.value,
                        }))
                      }
                    />
                  </TD>
                </tr>
              ))}
              <tr className="bg-pearl font-semibold">
                <TD>Total</TD>
                <TD />
                <TD className="num text-right">{money(total)}</TD>
              </tr>
            </tbody>
          </table>
          <div className="flex justify-end p-4 border-t border-line">
            <Button variant="primary" loading={busy} onClick={save}>
              Save amounts
            </Button>
          </div>
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
  const taken = new Set(
    teams
      .filter((t) => t.id !== team?.id)
      .flatMap((t) => [t.leaderId, ...t.members.map((m) => m.employeeId)]),
  );
  const options = (employees.data || []).filter(
    (e) => !taken.has(e.employeeId),
  );

  async function save() {
    try {
      await run(
        isNew ? "/teams/admin/teams" : `/teams/admin/teams/${team.id}`,
        {
          method: isNew ? "POST" : "PUT",
          body: {
            ...f,
            members: f.members
              .filter((m) => m !== f.teamLeader)
              .map((employeeId) => ({ employeeId })),
          },
          invalidates: ["/teams"],
        },
      );
      toast(isNew ? "Team created" : "Team saved");
      onClose();
    } catch (e) {
      toast(e.message, "error");
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? "Create team" : `Edit ${team.name}`}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={busy} onClick={save}>
            {isNew ? "Create team" : "Save team"}
          </Button>
        </>
      }
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Team name">
          <Input
            value={f.teamName}
            onChange={(e) => setF({ ...f, teamName: e.target.value })}
          />
        </Field>
        <Field label="Monthly target (₹)">
          <Input
            type="number"
            min="0"
            value={f.targetValue}
            onChange={(e) => setF({ ...f, targetValue: e.target.value })}
          />
        </Field>
        <Field label="Team leader" className="sm:col-span-2">
          <Select
            value={f.teamLeader}
            onChange={(e) => setF({ ...f, teamLeader: e.target.value })}
          >
            <option value="">Choose a leader</option>
            {options.map((e) => (
              <option key={e.employeeId} value={e.employeeId}>
                {e.name} ({e.employeeId})
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-semibold text-ink">Members</span>
          <span className="text-[12px] text-muted">
            {f.members.filter((m) => m !== f.teamLeader).length} chosen
          </span>
        </div>
        <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto rounded-2xl border border-line bg-pearl/60 p-3">
          {options
            .filter((e) => e.employeeId !== f.teamLeader)
            .map((e) => {
              const on = f.members.includes(e.employeeId);
              return (
                <button
                  key={e.employeeId}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    setF({
                      ...f,
                      members: on
                        ? f.members.filter((x) => x !== e.employeeId)
                        : [...f.members, e.employeeId],
                    })
                  }
                  className={cx(
                    "inline-flex items-center gap-2 rounded-full border pl-1 pr-3 h-9 text-[13px] font-medium transition",
                    on
                      ? "bg-teal-deep border-teal-deep text-white"
                      : "bg-white border-line hover:border-teal-deep/40",
                  )}
                >
                  <Avatar name={e.name} size={26} />
                  {e.name}
                  {on && <Check size={14} className="text-lime" />}
                </button>
              );
            })}
          {!options.length && (
            <p className="text-muted text-[13px] p-1">
              Everyone is already in a team.
            </p>
          )}
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
    if (!window.confirm(`Delete team "${t.name}" and all its monthly reports?`))
      return;
    try {
      await run(`/teams/admin/teams/${t.id}`, {
        method: "DELETE",
        invalidates: ["/teams"],
      });
      toast("Team deleted");
    } catch (e) {
      toast(e.message, "error");
    }
  }
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[13px] text-muted">
          {teams.length} team{teams.length === 1 ? "" : "s"}
        </span>
        <Button variant="primary" icon={Plus} onClick={() => setEditing({})}>
          Create team
        </Button>
      </div>
      {!teams.length ? (
        <div className="card">
          <Empty title="No teams yet">
            Create a team to track its monthly numbers.
          </Empty>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {teams.map((t) => (
            <article key={t.id} className="card p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-[family-name:var(--font-display)] text-[18px] font-extrabold truncate">
                    {t.name}
                  </h3>
                  <div className="text-[13px] text-muted">
                    Target{" "}
                    <b className="num text-ink">{money(t.targetValue)}</b> /
                    month
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <IconButton
                    icon={Pencil}
                    label={`Edit ${t.name}`}
                    onClick={() => setEditing(t)}
                  />
                  <IconButton
                    icon={Trash2}
                    label={`Delete ${t.name}`}
                    tone="danger"
                    onClick={() => remove(t)}
                  />
                </div>
              </div>
              {t.leader && (
                <div className="flex items-center gap-2.5 rounded-2xl bg-teal-deep text-white px-3 py-2">
                  <Avatar name={t.leader.fullName} size={30} />
                  <span className="min-w-0 flex-1 truncate font-semibold text-[13.5px]">
                    {t.leader.fullName}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-lime">
                    <Crown size={13} /> Leader
                  </span>
                </div>
              )}
              <div>
                <div className="text-[12px] font-semibold text-muted mb-2">
                  {t.members.length} member{t.members.length === 1 ? "" : "s"}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {t.members.map((m) => (
                    <span
                      key={m.employeeId}
                      className="inline-flex items-center gap-1.5 rounded-full bg-pearl border border-line pl-0.5 pr-2.5 h-7 text-[12.5px]"
                    >
                      <Avatar name={m.employee?.fullName || ""} size={22} />
                      {m.employee?.fullName}
                    </span>
                  ))}
                  {!t.members.length && (
                    <span className="text-[13px] text-muted">
                      No members yet
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {editing && (
        <TeamModal
          team={editing}
          teams={teams}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

export default function TeamsAdmin() {
  const { data, loading, error, reload } = useApi("/teams/admin/teams");
  const [view, setView] = useState("report");
  const teams = data?.teams || [];
  const VIEWS = [
    ["report", "Team report"],
    ["enter", "Enter numbers"],
    ["deals", "Deal amounts"],
    ["manage", "Manage teams"],
  ];
  return (
    <>
      <div className="mb-5">
        <Segmented value={view} onChange={setView} options={VIEWS} />
      </div>
      <ErrorNote error={error} onRetry={reload} />
      {loading ? (
        <Spinner />
      ) : (
        <>
          {view === "report" &&
            (teams.length ? (
              <TeamReports teams={teams} />
            ) : (
              <Panel>
                <Empty
                  title="No teams yet"
                  action={
                    <Button onClick={() => setView("manage")}>
                      Create a team
                    </Button>
                  }
                />
              </Panel>
            ))}
          {view === "enter" && <EnterReport teams={teams} />}
          {view === "deals" && <DealAmounts teams={teams} />}
          {view === "manage" && <ManageTeams teams={teams} />}
        </>
      )}
    </>
  );
}
