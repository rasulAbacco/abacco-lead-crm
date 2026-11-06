import { useState } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  HandCoins,
  PlayCircle,
  PauseCircle,
  Layers,
  IndianRupee,
  CalendarDays,
} from "lucide-react";
import { useApi, useMutation } from "../../lib/api";
import { fmtDate, money, todayKey } from "../../lib/format";
import {
  Button,
  Empty,
  ErrorNote,
  Field,
  Input,
  MiniStat,
  Modal,
  PageHeader,
  Pill,
  Select,
  Spinner,
  StatRow,
  Textarea,
  useToast,
  cx,
} from "../../components/ui";

const TYPES = ["Attendees", "Member Attendees", "Association", "Industry"];
const blankRule = () => ({
  leadType: "Association",
  country: "",
  attendeesMinCount: "",
  industryDomain: "",
  leadsRequired: "",
  amount: "",
});

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
      ? plan.rules.map((r) => ({
          ...r,
          country: r.country || "",
          attendeesMinCount: r.attendeesMinCount ?? "",
          industryDomain: r.industryDomain || "",
        }))
      : [blankRule()],
  );
  const setRule = (i, k, v) =>
    setRules((rs) => rs.map((r, j) => (j === i ? { ...r, [k]: v } : r)));

  async function save() {
    const clean = rules
      .filter((r) => Number(r.leadsRequired) > 0 && Number(r.amount) > 0)
      .map((r) => ({
        leadType: r.leadType,
        country: r.leadType === "Industry" ? null : r.country.trim() || null,
        attendeesMinCount:
          /attend/i.test(r.leadType) && r.attendeesMinCount
            ? Number(r.attendeesMinCount)
            : null,
        industryDomain:
          r.leadType === "Industry" ? r.industryDomain.trim() || null : null,
        leadsRequired: Number(r.leadsRequired),
        amount: Number(r.amount),
        isActive: r.isActive !== false,
      }));
    if (!f.title.trim()) return toast("Give the plan a title", "error");
    if (!clean.length)
      return toast("Add at least one rule with leads and amount", "error");
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
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={busy} onClick={save}>
            {isNew ? "Create plan" : "Save plan"}
          </Button>
        </>
      }
    >
      <div className="grid sm:grid-cols-[1fr_180px] gap-4 mb-4">
        <Field label="Title">
          <Input
            value={f.title}
            onChange={(e) => setF({ ...f, title: e.target.value })}
            placeholder="Daily lead incentive"
          />
        </Field>
        <Field label="Valid from">
          <Input
            type="date"
            value={f.validFrom}
            onChange={(e) => setF({ ...f, validFrom: e.target.value })}
          />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <Textarea
            rows={2}
            className="min-h-0"
            value={f.description}
            onChange={(e) => setF({ ...f, description: e.target.value })}
          />
        </Field>
      </div>
      <h3 className="font-bold text-teal-deep mb-1">Rules</h3>
      <p className="text-[13px] text-muted mb-3">
        Each rule pays the amount when an employee uploads the required number
        of matching leads in one day. Bigger tiers are paid first.
      </p>
      <div className="space-y-2">
        {rules.map((r, i) => (
          <div
            key={i}
            className="grid grid-cols-2 md:grid-cols-[160px_1fr_110px_110px_40px] gap-3 items-end bg-pearl border border-line rounded-2xl p-3.5"
          >
            <Field label="Lead type">
              <Select
                value={r.leadType}
                onChange={(e) => setRule(i, "leadType", e.target.value)}
              >
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            </Field>
            {r.leadType === "Industry" ? (
              <Field label="Industry domain (optional)">
                <Input
                  value={r.industryDomain}
                  onChange={(e) => setRule(i, "industryDomain", e.target.value)}
                />
              </Field>
            ) : (
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Field label="Countries (optional)">
                  <Input
                    value={r.country}
                    onChange={(e) => setRule(i, "country", e.target.value)}
                    placeholder="USA, Canada"
                  />
                </Field>
                {/attend/i.test(r.leadType) && (
                  <Field label="Min. attendees">
                    <Input
                      type="number"
                      min="0"
                      className="w-24"
                      value={r.attendeesMinCount}
                      onChange={(e) =>
                        setRule(i, "attendeesMinCount", e.target.value)
                      }
                    />
                  </Field>
                )}
              </div>
            )}
            <Field label="Leads per day">
              <Input
                type="number"
                min="1"
                value={r.leadsRequired}
                onChange={(e) => setRule(i, "leadsRequired", e.target.value)}
              />
            </Field>
            <Field label="Amount (₹)">
              <Input
                type="number"
                min="1"
                value={r.amount}
                onChange={(e) => setRule(i, "amount", e.target.value)}
              />
            </Field>
            <button
              onClick={() => setRules((rs) => rs.filter((_, j) => j !== i))}
              className="size-10 rounded-full border border-line bg-white flex items-center justify-center text-teal-deep hover:bg-teal-deep hover:text-white"
              aria-label="Remove rule"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <Button
        size="sm"
        icon={Plus}
        className="mt-3"
        onClick={() => setRules((rs) => [...rs, blankRule()])}
      >
        Add rule
      </Button>
    </Modal>
  );
}

export default function Incentives() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi("/incentives/plans");
  const { run } = useMutation();
  const [editing, setEditing] = useState(null);

  async function toggle(p) {
    if (
      p.isActive &&
      !window.confirm(
        `Stop "${p.title}"? It stops paying from today. Past days keep their incentive.`,
      )
    )
      return;
    try {
      await run(
        `/incentives/plans/${p.id}/${p.isActive ? "deactivate" : "activate"}`,
        { invalidates: ["/incentives"] },
      );
      toast(p.isActive ? "Plan stopped" : "Plan restarted");
    } catch (e) {
      toast(e.message, "error");
    }
  }

  const plans = data || [];
  const running = plans.filter((p) => p.isActive);
  const activeRules = running.flatMap((p) =>
    p.rules.filter((r) => r.isActive !== false),
  );
  const top = activeRules.reduce((m, r) => Math.max(m, r.amount), 0);

  return (
    <>
      <PageHeader
        title="Incentives"
        icon={HandCoins}
        subtitle="Daily incentive plans. Every uploaded lead counts."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setEditing({})}>
            New plan
          </Button>
        }
      />
      <ErrorNote error={error} onRetry={reload} />
      {loading ? (
        <Spinner />
      ) : !plans.length ? (
        <div className="card">
          <Empty
            title="No incentive plans yet"
            action={
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => setEditing({})}
              >
                Create the first plan
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <StatRow cols={3}>
            <MiniStat
              label="Running plans"
              value={running.length}
              hint={`${plans.length - running.length} stopped`}
              icon={PlayCircle}
              tone="teal"
            />
            <MiniStat
              label="Active rules"
              value={activeRules.length}
              icon={Layers}
            />
            <MiniStat
              label="Highest daily payout"
              value={top ? money(top) : "—"}
              icon={IndianRupee}
              tone="lime"
            />
          </StatRow>
          <div className="space-y-5">
            {plans.map((p) => (
              <section
                key={p.id}
                className={cx(
                  "card overflow-hidden",
                  !p.isActive && "opacity-80",
                )}
              >
                <header className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-line">
                  <span
                    className={cx(
                      "size-11 rounded-2xl flex items-center justify-center shrink-0",
                      p.isActive
                        ? "bg-lime text-teal-deep"
                        : "bg-teal-deep text-lime",
                    )}
                  >
                    {p.isActive ? (
                      <PlayCircle size={21} />
                    ) : (
                      <PauseCircle size={21} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-[family-name:var(--font-display)] text-[18px] font-extrabold">
                        {p.title}
                      </h2>
                      <Pill tone={p.isActive ? "lime" : "teal"}>
                        {p.isActive ? "Running" : "Stopped"}
                      </Pill>
                    </div>
                    <p className="text-[13px] text-muted flex flex-wrap items-center gap-x-2">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={13} /> From {fmtDate(p.validFrom)}
                        {p.validTo ? ` to ${fmtDate(p.validTo)}` : ""}
                      </span>
                      {p.description && <span>{p.description}</span>}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      icon={Pencil}
                      onClick={() => setEditing(p)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant={p.isActive ? "secondary" : "primary"}
                      icon={p.isActive ? PauseCircle : PlayCircle}
                      onClick={() => toggle(p)}
                    >
                      {p.isActive ? "Stop plan" : "Restart plan"}
                    </Button>
                  </div>
                </header>
                <div className="p-5 grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {p.rules.map((r) => {
                    const cond = [
                      r.country,
                      r.attendeesMinCount &&
                        `${r.attendeesMinCount}+ attendees`,
                      r.industryDomain,
                    ]
                      .filter(Boolean)
                      .join(", ");
                    return (
                      <div
                        key={r.id}
                        className={cx(
                          "rounded-2xl border border-line bg-pearl/60 p-4 flex items-center gap-3",
                          r.isActive === false && "opacity-50 line-through",
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold">{r.leadType}</div>
                          <div
                            className="text-[12.5px] text-muted truncate"
                            title={cond || "Any"}
                          >
                            {cond || "Any country"}
                          </div>
                          <div className="mt-1.5 text-[12.5px] text-ink-soft">
                            <b className="num text-ink">{r.leadsRequired}</b>{" "}
                            lead{r.leadsRequired === 1 ? "" : "s"} in a day
                          </div>
                        </div>
                        <span className="num shrink-0 rounded-full bg-lime px-3.5 py-1.5 font-[family-name:var(--font-display)] text-[17px] font-extrabold text-ink">
                          {money(r.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
      {editing && <PlanModal plan={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
