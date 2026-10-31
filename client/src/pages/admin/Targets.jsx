import { useState } from "react";
import { Info } from "lucide-react";
import { useApi, useMutation } from "../../lib/api";
import { num } from "../../lib/format";
import { Button, Empty, ErrorNote, Input, PageHeader, Panel, Spinner, TH, TD, useToast, cx } from "../../components/ui";

const FIELDS = [
  { key: "associationPercent", label: "Association" },
  { key: "attendeesPercent", label: "Attendees" },
  { key: "industryPercent", label: "Industry" },
  { key: "memberAttendeesPercent", label: "Member att." },
];

function Row({ emp }) {
  const toast = useToast();
  const { run, busy } = useMutation();
  const initial = { target: emp.target, ...Object.fromEntries(FIELDS.map((f) => [f.key, emp[f.key]])) };
  const [v, setV] = useState(initial);
  const dirty = JSON.stringify(v) !== JSON.stringify(initial);
  const total = FIELDS.reduce((s, f) => s + Number(v[f.key] || 0), 0);
  const valid = total === 100 || total === 0;

  async function save() {
    try {
      await run(`/employees/targets/${emp.employeeId}`, { method: "PUT", body: v, invalidates: ["/employees", "/incentives"] });
      toast(`Target saved for ${emp.fullName}`);
    } catch (e) {
      toast(e.message, "error");
    }
  }

  const cell = (k) => (
    <Input type="number" min="0" max={k === "target" ? undefined : 100} value={v[k]} onChange={(e) => setV((x) => ({ ...x, [k]: e.target.value === "" ? "" : Number(e.target.value) }))} className="h-8 w-20 text-right num" aria-label={k} />
  );

  return (
    <tr className={cx(dirty && "bg-brand-soft/40")}>
      <TD>
        <div className="font-medium">{emp.fullName}</div>
        <div className="text-xs text-muted">{emp.employeeId}, {emp.experience}</div>
      </TD>
      <TD>{cell("target")}</TD>
      {FIELDS.map((f) => (
        <TD key={f.key}>
          <div className="flex items-center gap-2">
            {cell(f.key)}
            <span className="num text-xs text-muted w-10">{v.target ? `${Math.round((v.target * (v[f.key] || 0)) / 100)}` : ""}</span>
          </div>
        </TD>
      ))}
      <TD className={cx("num font-medium", valid ? "text-active" : "text-leave")}>{total}%</TD>
      <TD className="text-right">
        <Button size="sm" variant={dirty ? "primary" : "secondary"} disabled={!dirty || !valid} loading={busy} onClick={save}>Save</Button>
      </TD>
    </tr>
  );
}

export default function Targets() {
  const { data, loading, error, reload } = useApi("/employees/targets");
  const total = (data || []).reduce((s, e) => s + (e.target || 0), 0);
  return (
    <>
      <PageHeader title="Targets" subtitle="Set each employee's monthly lead target and how it splits across lead types. The split must add up to 100%." />
      <ErrorNote error={error} onRetry={reload} />
      {data && (
        <div className="flex items-center gap-3 rounded-xl bg-blue-soft border border-blue/15 px-4 py-3 mb-4">
          <Info size={18} className="text-blue shrink-0" />
          <span className="font-semibold">Team target <span className="text-blue num">{num(total)}</span> leads per month</span>
        </div>
      )}
      <Panel bodyClass="p-0">
        {loading ? <Spinner /> : !data?.length ? <Empty title="No active employees" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <TH>Employee</TH>
                  <TH>Monthly target</TH>
                  {FIELDS.map((f) => <TH key={f.key}>{f.label} %</TH>)}
                  <TH>Total</TH>
                  <TH />
                </tr>
              </thead>
              <tbody>{data.map((e) => <Row key={`${e.employeeId}-${e.target}-${e.associationPercent}-${e.attendeesPercent}-${e.industryPercent}-${e.memberAttendeesPercent}`} emp={e} />)}</tbody>
            </table>
          </div>
        )}
      </Panel>
      <p className="text-xs text-muted mt-3">The small number next to each percentage is the lead count for that type.</p>
    </>
  );
}
