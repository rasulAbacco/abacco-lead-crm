import { useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useApi, useMutation } from "../../lib/api";
import { fmtDate, money, todayKey } from "../../lib/format";
import { Button, Empty, ErrorNote, Field, Input, Modal, PageHeader, Panel, Select, Spinner, Textarea, TH, TD, useToast, cx } from "../../components/ui";

const TYPES = ["Attendees", "Member Attendees", "Association", "Industry"];
const blankRule = () => ({ leadType: "Association", country: "", attendeesMinCount: "", industryDomain: "", leadsRequired: "", amount: "" });

function PlanModal({ plan, onClose }) {
  const toast = useToast();
  const { run, busy } = useMutation();
  const isNew = !plan?.id;
  const [f, setF] = useState({
    title: plan?.title || "",
    description: plan?.description || "",
    validFrom: plan?.validFrom ? plan.validFrom.slice(0, 10) : todayKey(),
  });
  const [rules, setRules] = useState(
    plan?.rules?.length
      ? plan.rules.map((r) => ({ ...r, country: r.country || "", attendeesMinCount: r.attendeesMinCount ?? "", industryDomain: r.industryDomain || "" }))
      : [blankRule()],
  );
  const setRule = (i, k, v) => setRules((rs) => rs.map((r, j) => (j === i ? { ...r, [k]: v } : r)));

  async function save() {
    const clean = rules
      .filter((r) => Number(r.leadsRequired) > 0 && Number(r.amount) > 0)
      .map((r) => ({
        leadType: r.leadType,
        country: r.leadType === "Industry" ? null : r.country.trim() || null,
        attendeesMinCount: /attend/i.test(r.leadType) && r.attendeesMinCount ? Number(r.attendeesMinCount) : null,
        industryDomain: r.leadType === "Industry" ? r.industryDomain.trim() || null : null,
        leadsRequired: Number(r.leadsRequired),
        amount: Number(r.amount),
        isActive: r.isActive !== false,
      }));
    if (!f.title.trim()) return toast("Give the plan a title", "error");
    if (!clean.length) return toast("Add at least one rule with leads and amount", "error");
    try {
      await run(isNew ? "/incentives/plans" : `/incentives/plans/${plan.id}`, {
        method: isNew ? "POST" : "PUT",
        body: { ...f, validFrom: `${f.validFrom}T06:00:00.000Z`, rules: clean },
        invalidates: ["/incentives"],
      });
      toast(isNew ? "Plan created" : "Plan saved");
      onClose();
    } catch (e) {
      toast(e.message, "error");
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      width="max-w-4xl"
      title={isNew ? "New incentive plan" : `Edit ${plan.title}`}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" loading={busy} onClick={save}>{isNew ? "Create plan" : "Save plan"}</Button></>}
    >
      <div className="grid sm:grid-cols-[1fr_180px] gap-4 mb-4">
        <Field label="Title"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Daily lead incentive" /></Field>
        <Field label="Valid from"><Input type="date" value={f.validFrom} onChange={(e) => setF({ ...f, validFrom: e.target.value })} /></Field>
        <Field label="Description" className="sm:col-span-2"><Textarea rows={2} className="min-h-0" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
      </div>
      <h3 className="font-medium mb-1">Rules</h3>
      <p className="text-[13px] text-muted mb-3">Each rule pays the amount when an employee uploads the required number of matching leads in one day. Bigger tiers are paid first.</p>
      <div className="space-y-2">
        {rules.map((r, i) => (
          <div key={i} className="grid grid-cols-2 md:grid-cols-[150px_1fr_110px_110px_32px] gap-2 items-end bg-paper/60 border border-line rounded-md p-3">
            <Field label="Lead type">
              <Select value={r.leadType} onChange={(e) => setRule(i, "leadType", e.target.value)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</Select>
            </Field>
            {r.leadType === "Industry" ? (
              <Field label="Industry domain (optional)"><Input value={r.industryDomain} onChange={(e) => setRule(i, "industryDomain", e.target.value)} /></Field>
            ) : (
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Field label="Countries (optional)"><Input value={r.country} onChange={(e) => setRule(i, "country", e.target.value)} placeholder="USA, Canada" /></Field>
                {/attend/i.test(r.leadType) && (
                  <Field label="Min. attendees"><Input type="number" min="0" className="w-24" value={r.attendeesMinCount} onChange={(e) => setRule(i, "attendeesMinCount", e.target.value)} /></Field>
                )}
              </div>
            )}
            <Field label="Leads per day"><Input type="number" min="1" value={r.leadsRequired} onChange={(e) => setRule(i, "leadsRequired", e.target.value)} /></Field>
            <Field label="Amount (₹)"><Input type="number" min="1" value={r.amount} onChange={(e) => setRule(i, "amount", e.target.value)} /></Field>
            <button onClick={() => setRules((rs) => rs.filter((_, j) => j !== i))} className="h-9 flex items-center justify-center text-muted hover:text-leave" aria-label="Remove rule">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <Button size="sm" icon={Plus} className="mt-3" onClick={() => setRules((rs) => [...rs, blankRule()])}>Add rule</Button>
    </Modal>
  );
}

export default function Incentives() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi("/incentives/plans");
  const { run } = useMutation();
  const [editing, setEditing] = useState(null);

  async function toggle(p) {
    if (p.isActive && !window.confirm(`Stop "${p.title}"? It stops paying from today. Past days keep their incentive.`)) return;
    try {
      await run(`/incentives/plans/${p.id}/${p.isActive ? "deactivate" : "activate"}`, { invalidates: ["/incentives"] });
      toast(p.isActive ? "Plan stopped" : "Plan restarted");
    } catch (e) {
      toast(e.message, "error");
    }
  }

  return (
    <>
      <PageHeader title="Incentives" subtitle="Daily incentive plans. Every uploaded lead counts." actions={<Button variant="primary" icon={Plus} onClick={() => setEditing({})}>New plan</Button>} />
      <ErrorNote error={error} onRetry={reload} />
      {loading ? <Spinner /> : !data?.length ? (
        <Panel><Empty title="No incentive plans yet" action={<Button variant="primary" icon={Plus} onClick={() => setEditing({})}>Create the first plan</Button>} /></Panel>
      ) : (
        <div className="space-y-5">
          {data.map((p) => (
            <Panel
              key={p.id}
              title={<span className="flex items-center gap-2.5">{p.title}<span className={cx("text-xs font-medium", p.isActive ? "text-active" : "text-muted")}>{p.isActive ? "Running" : "Stopped"}</span></span>}
              actions={
                <div className="flex gap-2">
                  <Button size="sm" icon={Pencil} onClick={() => setEditing(p)}>Edit</Button>
                  <Button size="sm" variant={p.isActive ? "danger" : "secondary"} onClick={() => toggle(p)}>{p.isActive ? "Stop plan" : "Restart plan"}</Button>
                </div>
              }
              bodyClass="p-0"
            >
              <p className="px-5 pt-3 text-[13px] text-muted">
                From {fmtDate(p.validFrom)}{p.validTo ? ` to ${fmtDate(p.validTo)}` : ""}{p.description ? `. ${p.description}` : ""}
              </p>
              <table className="w-full text-sm mt-2">
                <thead><tr><TH>Lead type</TH><TH>Condition</TH><TH className="text-right">Leads per day</TH><TH className="text-right">Pays</TH></tr></thead>
                <tbody>
                  {p.rules.map((r) => (
                    <tr key={r.id} className={cx(!r.isActive && "text-muted line-through")}>
                      <TD className="font-medium">{r.leadType}</TD>
                      <TD className="text-ink-soft">{[r.country, r.attendeesMinCount && `${r.attendeesMinCount}+ attendees`, r.industryDomain].filter(Boolean).join(", ") || "Any"}</TD>
                      <TD className="num text-right">{r.leadsRequired}</TD>
                      <TD className="num text-right font-medium">{money(r.amount)}</TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          ))}
        </div>
      )}
      {editing && <PlanModal plan={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
