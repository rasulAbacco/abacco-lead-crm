import { useState } from "react";
import {
  Target as TargetIcon,
  Users,
  AlertCircle,
  CheckCircle2,
  Save,
} from "lucide-react";
import { useApi, useMutation } from "../../lib/api";
import { num } from "../../lib/format";
import {
  Avatar,
  Button,
  Empty,
  ErrorNote,
  Input,
  MiniStat,
  PageHeader,
  Pill,
  SearchInput,
  Spinner,
  StatRow,
  Toolbar,
  useToast,
  cx,
} from "../../components/ui";

const FIELDS = [
  { key: "associationPercent", label: "Association" },
  { key: "attendeesPercent", label: "Attendees" },
  { key: "industryPercent", label: "Industry" },
  { key: "memberAttendeesPercent", label: "Member attendees" },
];
const mixTotal = (o) => FIELDS.reduce((s, f) => s + Number(o[f.key] || 0), 0);

/* One employee: target + lead-type mix */
function TargetCard({ emp }) {
  const toast = useToast();
  const { run, busy } = useMutation();
  const initial = {
    target: emp.target,
    ...Object.fromEntries(FIELDS.map((f) => [f.key, emp[f.key]])),
  };
  const [v, setV] = useState(initial);
  const dirty = JSON.stringify(v) !== JSON.stringify(initial);
  const total = mixTotal(v);
  const valid = total === 100 || total === 0;
  const set = (k) => (e) =>
    setV((x) => ({
      ...x,
      [k]: e.target.value === "" ? "" : Number(e.target.value),
    }));

  async function save() {
    try {
      await run(`/employees/targets/${emp.employeeId}`, {
        method: "PUT",
        body: v,
        invalidates: ["/employees", "/incentives"],
      });
      toast(`Target saved for ${emp.fullName}`);
    } catch (e) {
      toast(e.message, "error");
    }
  }

  return (
    <article
      className={cx("card p-5 flex flex-col", dirty && "ring-2 ring-lime")}
    >
      <header className="flex items-center gap-3">
        <Avatar name={emp.fullName} size={42} />
        <div className="min-w-0 flex-1">
          <div className="font-semibold truncate">{emp.fullName}</div>
          <div className="text-xs text-muted truncate">
            {emp.employeeId}
            {emp.experience ? `, ${emp.experience}` : ""}
          </div>
        </div>
        <label className="text-right">
          <span className="block text-[11px] font-bold uppercase tracking-[0.06em] text-teal-deep mb-1">
            Monthly target
          </span>
          <Input
            type="number"
            min="0"
            value={v.target}
            onChange={set("target")}
            className="h-10 w-24 text-right num font-bold text-[16px]"
            aria-label={`Monthly target for ${emp.fullName}`}
          />
        </label>
      </header>

      <div className="mt-4 space-y-3">
        {FIELDS.map((f) => {
          const pct = Number(v[f.key] || 0);
          const leads = v.target ? Math.round((v.target * pct) / 100) : 0;
          return (
            <div
              key={f.key}
              className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1"
            >
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-[13.5px] font-medium truncate">
                  {f.label}
                </span>
                <span className="num text-[12px] text-muted whitespace-nowrap">
                  {leads} lead{leads === 1 ? "" : "s"}
                </span>
              </div>
              <div className="relative row-span-2 self-center">
                <Input
                  type="number"
                  min="0"
                  max={100}
                  value={v[f.key]}
                  onChange={set(f.key)}
                  className="h-9 w-20 pr-7 text-right num"
                  aria-label={`${f.label} percent for ${emp.fullName}`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-muted">
                  %
                </span>
              </div>
              <div className="track h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-teal-deep transition-[width] duration-300"
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <footer className="mt-5 pt-4 border-t border-line flex items-center justify-between gap-3">
        {total === 100 ? (
          <Pill tone="lime">Mix 100%</Pill>
        ) : total === 0 ? (
          <Pill tone="white">No mix set</Pill>
        ) : (
          <Pill tone="teal">Mix {total}%, must be 100%</Pill>
        )}
        <Button
          size="sm"
          variant={dirty ? "primary" : "secondary"}
          icon={Save}
          disabled={!dirty || !valid}
          loading={busy}
          onClick={save}
        >
          {dirty ? "Save" : "Saved"}
        </Button>
      </footer>
    </article>
  );
}

export default function Targets() {
  const { data, loading, error, reload } = useApi("/employees/targets");
  const [q, setQ] = useState("");
  const list = data || [];
  const teamTarget = list.reduce((s, e) => s + (e.target || 0), 0);
  const incomplete = list.filter((e) => mixTotal(e) !== 100).length;
  const shown = list.filter(
    (e) =>
      !q ||
      e.fullName.toLowerCase().includes(q.toLowerCase()) ||
      e.employeeId.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <PageHeader
        title="Targets"
        icon={TargetIcon}
        subtitle="Each employee's monthly lead target and how it splits across lead types. The split must add up to 100%."
      />
      <ErrorNote error={error} onRetry={reload} />
      {loading ? (
        <Spinner />
      ) : !list.length ? (
        <div className="card">
          <Empty title="No active employees" />
        </div>
      ) : (
        <>
          <StatRow cols={3}>
            <MiniStat
              label="Team target"
              value={`${num(teamTarget)} / month`}
              icon={TargetIcon}
              tone="teal"
            />
            <MiniStat
              label="People with a target"
              value={list.filter((e) => e.target > 0).length}
              icon={Users}
              tone="lime"
            />
            <MiniStat
              label="Mix not 100%"
              value={incomplete}
              hint={
                incomplete ? "Fix these so incentives count right" : "All set"
              }
              icon={incomplete ? AlertCircle : CheckCircle2}
            />
          </StatRow>
          <Toolbar>
            <SearchInput
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Find employee"
            />
            <span className="text-[13px] text-muted">
              Changed cards get a lime outline until you save them.
            </span>
          </Toolbar>
          <div className="grid md:grid-cols-2 2xl:grid-cols-3 gap-4">
            {shown.map((e) => (
              <TargetCard
                key={`${e.employeeId}-${e.target}-${e.associationPercent}-${e.attendeesPercent}-${e.industryPercent}-${e.memberAttendeesPercent}`}
                emp={e}
              />
            ))}
          </div>
          {!shown.length && (
            <div className="card">
              <Empty title={`No employee matches "${q}"`} />
            </div>
          )}
        </>
      )}
    </>
  );
}
