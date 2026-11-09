// Attendance → Working days
// Company calendar (Saturdays, holidays) + who must work which day.
// Order that decides a day for a person: person's exception > company calendar > normal rule
// (Sunday off, Saturday per the person's Saturday rule; which Saturdays are off for
// "Alternate Saturdays" people is set per month, default 2nd & 4th).
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CalendarCheck,
  CalendarX2,
  Sun,
  Users,
  TrendingDown,
  Save,
  RotateCcw,
  Check,
} from "lucide-react";
import { useApi, useMutation } from "../../lib/api";
import { fmtDate, num } from "../../lib/format";
import {
  Avatar,
  Button,
  Empty,
  ErrorNote,
  Input,
  MiniStat,
  Pill,
  Segmented,
  Select,
  Spinner,
  StatRow,
  TH,
  TD,
  useToast,
  cx,
} from "../../components/ui";

const WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SAT_RULE = {
  WORKING: "Every Saturday",
  OFF: "Saturdays off",
  ALTERNATE: "Alternate Saturdays",
};

const ORD = ["", "1st", "2nd", "3rd", "4th", "5th"];

/* months: 3 back, this month, 6 ahead */
function monthOptions() {
  const now = new Date();
  return [-3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map((n) => {
    const d = new Date(now.getFullYear(), now.getMonth() + n, 1);
    return {
      n,
      key: `${d.getFullYear()}-${d.getMonth() + 1}`,
      label: d.toLocaleString("en-US", { month: "long", year: "numeric" }),
    };
  });
}

/* normal rule, same as the server (d.satOff = Saturdays off this month for alternate people) */
const defaultWorks = (d, rule = "ALTERNATE") => {
  if (d.weekday === 0) return false;
  if (d.weekday === 6) {
    if (rule === "OFF") return false;
    if (rule === "ALTERNATE")
      return !(d.satOff || [2, 4]).includes(d.nthWeekday);
  }
  return true;
};
/* what a person does on a day without their own exception */
const baseWorks = (d, e) =>
  d.companyType ? d.companyType === "WORKING" : defaultWorks(d, e.saturdayRule);
/* what a person does on a day, including their own exception */
const personWorks = (d, e) =>
  d.working.includes(e.employeeId)
    ? true
    : d.off.includes(e.employeeId)
      ? false
      : baseWorks(d, e);

function TargetPill({ e }) {
  if (e.role === "DEVELOPER")
    return (
      <Pill tone="white" dot={false}>
        Developer
      </Pill>
    );
  if (!e.target)
    return (
      <Pill tone="white" dot={false}>
        No target
      </Pill>
    );
  if (e.reached) return <Pill tone="lime">{e.pct}% reached</Pill>;
  if (e.behind) return <Pill tone="teal">{e.pct}% behind</Pill>;
  return <Pill tone="pearl">{e.pct}% on track</Pill>;
}

/* ---------- one calendar cell ---------- */
function DayCell({ d, employees, selected, today, onClick }) {
  const holiday = d.companyType === "HOLIDAY";
  const weekOff = d.companyType === "WEEK_OFF";
  // only count real changes: extra working day / day off that the person would not have anyway
  const byId = new Map(employees.map((e) => [e.employeeId, e]));
  const extra = d.working.filter(
    (id) => byId.has(id) && !baseWorks(d, byId.get(id)),
  ).length;
  const dayOff = d.off.filter(
    (id) => byId.has(id) && baseWorks(d, byId.get(id)),
  ).length;
  const madeWorking = d.companyType === "WORKING" && !d.defaultWorking;
  const off = !d.companyWorking;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cx(
        "relative text-left rounded-2xl border p-2 sm:p-2.5 min-h-[76px] sm:min-h-[96px] flex flex-col transition",
        holiday
          ? "bg-teal-deep border-teal-deep text-white"
          : madeWorking
            ? "bg-lime border-lime"
            : off
              ? "bg-pearl border-line"
              : "bg-white border-line hover:border-teal-deep/40",
        selected && "ring-[3px] ring-lime ring-offset-2 ring-offset-white",
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cx(
            "num text-[14px] font-extrabold",
            today && "rounded-full bg-teal-deep text-lime px-1.5",
            holiday && today && "bg-lime text-ink",
          )}
        >
          {d.day}
        </span>
        <span
          className={cx(
            "text-[10px] font-semibold uppercase",
            holiday ? "text-pearl/70" : "text-muted",
          )}
        >
          {WEEK[d.weekday]}
        </span>
      </div>
      <div
        className={cx(
          "mt-1 text-[11px] font-semibold leading-tight",
          holiday
            ? "text-lime"
            : madeWorking
              ? "text-ink"
              : off
                ? "text-muted"
                : "text-teal-deep",
        )}
      >
        {holiday
          ? "Holiday"
          : madeWorking
            ? "Working for all"
            : weekOff
              ? "Week off"
              : off
                ? d.weekday === 0
                  ? "Sunday"
                  : "Saturday off"
                : d.weekday === 6
                  ? "Working Sat"
                  : "Working"}
      </div>
      {d.note && (
        <div
          className={cx(
            "text-[10.5px] truncate",
            holiday ? "text-pearl/80" : "text-ink-soft",
          )}
          title={d.note}
        >
          {d.note}
        </div>
      )}
      <div className="mt-auto flex flex-wrap gap-1 pt-1">
        {extra > 0 && (
          <span
            className="num rounded-full bg-lime text-ink px-1.5 text-[10.5px] font-bold border border-teal-deep/10"
            title={`${extra} people work this day as an extra day`}
          >
            +{extra} work
          </span>
        )}
        {dayOff > 0 && (
          <span
            className="num rounded-full bg-teal-deep/10 text-teal-deep px-1.5 text-[10.5px] font-bold"
            title={`${dayOff} people have this day off`}
          >
            {dayOff} off
          </span>
        )}
      </div>
    </button>
  );
}

/* ---------- right panel: one day ---------- */
function DayPanel({ d, employees, onSaved }) {
  const toast = useToast();
  const { run, busy } = useMutation();
  const [type, setType] = useState(d.companyType || "DEFAULT");
  const [note, setNote] = useState(d.note || "");
  const [picked, setPicked] = useState(
    () =>
      new Set(
        employees.filter((e) => personWorks(d, e)).map((e) => e.employeeId),
      ),
  );
  useEffect(() => {
    setType(d.companyType || "DEFAULT");
    setNote(d.note || "");
    setPicked(
      new Set(
        employees.filter((e) => personWorks(d, e)).map((e) => e.employeeId),
      ),
    );
  }, [d, employees]);

  // people as they would be with the (possibly changed) company setting
  const preview = { ...d, companyType: type === "DEFAULT" ? null : type };
  const normalText = d.defaultWorking
    ? d.weekday === 6
      ? `Working Saturday (${ORD[d.nthWeekday]})`
      : "Working day"
    : d.weekday === 0
      ? "Sunday off"
      : `Saturday off (${ORD[d.nthWeekday]})`;
  const past = d.date < d.todayKey;
  const companyChanged =
    type !== (d.companyType || "DEFAULT") ||
    (type !== "DEFAULT" && note.trim() !== (d.note || ""));
  const peopleChanged = employees.some(
    (e) => picked.has(e.employeeId) !== personWorks(d, e),
  );

  const toggle = (id) =>
    setPicked((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const pick = (fn) =>
    setPicked(new Set(employees.filter(fn).map((e) => e.employeeId)));
  // changing the day for everyone resets the list to what that gives each person
  // (people's own saved exceptions are kept)
  const changeType = (v) => {
    setType(v);
    const next = { ...d, companyType: v === "DEFAULT" ? null : v };
    setPicked(
      new Set(
        employees.filter((e) => personWorks(next, e)).map((e) => e.employeeId),
      ),
    );
  };

  async function save() {
    try {
      if (companyChanged) {
        await run("/attendance/admin/calendar/day", {
          method: "PUT",
          body: { date: d.date, type, note },
          invalidates: ["/attendance"],
        });
      }
      // person exceptions only where someone differs from what the company day gives them
      const mustWork = [],
        dayOff = [],
        normal = [];
      for (const e of employees) {
        const want = picked.has(e.employeeId);
        const base = baseWorks(preview, e);
        const had =
          d.working.includes(e.employeeId) || d.off.includes(e.employeeId);
        if (want === base) {
          if (had) normal.push(e.employeeId);
        } else (want ? mustWork : dayOff).push(e.employeeId);
      }
      const call = (employeeIds, working) =>
        employeeIds.length &&
        run("/attendance/admin/calendar/people", {
          method: "PUT",
          body: {
            dates: [d.date],
            employeeIds,
            working,
            note: working ? note : null,
          },
          invalidates: ["/attendance"],
        });
      await call(normal, null);
      await call(mustWork, true);
      await call(dayOff, false);
      toast(`Saved ${fmtDate(`${d.date}T12:00:00-06:00`, "EEE, MMM d")}`);
      onSaved();
    } catch (e) {
      toast(e.message, "error");
    }
  }

  const working = employees.filter((e) => picked.has(e.employeeId)).length;
  return (
    <section className="card overflow-hidden">
      <header className="px-5 py-4 bg-teal-deep text-white">
        <div className="text-[12px] font-semibold text-pearl/70">
          Selected day
        </div>
        <h3 className="font-[family-name:var(--font-display)] text-[20px] font-extrabold">
          {fmtDate(`${d.date}T12:00:00-06:00`, "EEEE, MMM d")}
        </h3>
        <div className="text-[12.5px] text-pearl/75">
          Normally: {normalText}
        </div>
      </header>

      <div className="p-5 space-y-5">
        <div>
          <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-teal-deep mb-2">
            For everyone
          </div>
          <Segmented
            value={type}
            onChange={changeType}
            options={[
              ["DEFAULT", "Normal"],
              ["WORKING", "Working"],
              ["WEEK_OFF", "Week off"],
              ["HOLIDAY", "Holiday"],
            ]}
          />
          {type !== "DEFAULT" && (
            <Input
              className="mt-2.5"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                type === "HOLIDAY"
                  ? "Reason, e.g. Diwali"
                  : type === "WEEK_OFF"
                    ? "Reason, e.g. Saturday off"
                    : "Reason, e.g. month-end push"
              }
              maxLength={120}
            />
          )}
          {past && (
            <p className="mt-2 text-[12px] text-muted">
              This day has passed. Saving updates the attendance report: no
              punch on a day off shows as Week off / Holiday instead of Absent.
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-teal-deep">
              Who works this day
            </span>
            <span className="num text-[12px] text-muted">
              {working} of {employees.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            <Button
              size="sm"
              onClick={() => pick((e) => baseWorks(preview, e) || e.behind)}
              icon={TrendingDown}
            >
              + Behind target
            </Button>
            <Button
              size="sm"
              onClick={() => pick((e) => baseWorks(preview, e) || e.reached)}
            >
              + Reached target
            </Button>
            <Button size="sm" onClick={() => pick(() => true)}>
              Everyone
            </Button>
            <Button
              size="sm"
              onClick={() => pick((e) => baseWorks(preview, e))}
              icon={RotateCcw}
            >
              Normal
            </Button>
          </div>
          <ul className="max-h-[360px] overflow-y-auto divide-y divide-line rounded-2xl border border-line">
            {employees.map((e) => {
              const on = picked.has(e.employeeId);
              const changed = on !== baseWorks(preview, e);
              return (
                <li key={e.employeeId}>
                  <label
                    className={cx(
                      "flex items-center gap-3 px-3 py-2.5 cursor-pointer",
                      changed ? "bg-lime/20" : "hover:bg-pearl/60",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle(e.employeeId)}
                      className="size-[18px] accent-teal-deep"
                    />
                    <Avatar name={e.name} size={30} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px] font-semibold truncate">
                        {e.name}
                      </span>
                      <span className="block text-[11.5px] text-muted truncate">
                        {SAT_RULE[e.saturdayRule]}
                        {changed
                          ? on
                            ? ", extra working day"
                            : ", day off"
                          : ""}
                      </span>
                    </span>
                    <TargetPill e={e} />
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        <Button
          variant="primary"
          icon={Save}
          loading={busy}
          disabled={!companyChanged && !peopleChanged}
          onClick={save}
          className="w-full h-11"
        >
          {companyChanged || peopleChanged ? "Save this day" : "No changes"}
        </Button>
      </div>
    </section>
  );
}

/* ---------- which Saturdays are off this month (alternate-Saturday people) ---------- */
function SaturdaysOff({ data, onSaved }) {
  const toast = useToast();
  const { run, busy } = useMutation();
  const sats = data.days.filter((d) => d.weekday === 6);
  const saved = data.saturdaysOff.join(",");
  const [off, setOff] = useState(() => new Set(data.saturdaysOff));
  useEffect(
    () => setOff(new Set(data.saturdaysOff)),
    [saved, data.year, data.month],
  );
  const now = [...off].sort().join(",");
  const changed = now !== saved;
  const toggle = (n) =>
    setOff((s) => {
      const x = new Set(s);
      x.has(n) ? x.delete(n) : x.add(n);
      return x;
    });
  const preset = (list) =>
    setOff(new Set(list.filter((n) => n <= sats.length)));
  const isPreset = (list) =>
    now === list.filter((n) => n <= sats.length).join(",");
  const alternatePeople = data.employees.filter(
    (e) => e.saturdayRule === "ALTERNATE",
  ).length;

  async function save(reset = false) {
    try {
      await run("/attendance/admin/calendar/saturdays", {
        method: "PUT",
        body: {
          year: data.year,
          month: data.month,
          off: reset ? null : [...off],
        },
        invalidates: ["/attendance"],
      });
      toast(
        reset
          ? "Saturdays back to 2nd & 4th off"
          : `Saturdays saved for ${data.label}`,
      );
      onSaved();
    } catch (e) {
      toast(e.message, "error");
    }
  }

  const presets = [
    ["2nd & 4th off", [2, 4]],
    ["1st, 3rd & 5th off", [1, 3, 5]],
    ["All off", [1, 2, 3, 4, 5]],
    ["All working", []],
  ];
  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-bold text-[16px]">
            Saturdays off in {data.label}
          </h3>
          <p className="text-[13px] text-muted">
            Tap a Saturday to switch it between working and off. Applies to the{" "}
            {alternatePeople} people on alternate Saturdays
            {data.saturdaysCustom
              ? ""
              : " (now: company default, 2nd & 4th off)"}
            .
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {presets.map(([label, list]) => (
            <Button
              key={label}
              size="sm"
              variant={isPreset(list) ? "blue" : "secondary"}
              onClick={() => preset(list)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
        {sats.map((d) => {
          const isOff = off.has(d.nthWeekday);
          const special =
            d.companyType === "HOLIDAY" ||
            d.companyType === "WEEK_OFF" ||
            d.companyType === "WORKING";
          return (
            <button
              key={d.date}
              type="button"
              aria-pressed={isOff}
              onClick={() => toggle(d.nthWeekday)}
              className={cx(
                "rounded-2xl border px-3 py-2.5 text-left transition",
                isOff
                  ? "bg-pearl border-line"
                  : "bg-white border-teal-deep/30 hover:border-teal-deep/60",
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="num font-extrabold text-[15px]">
                  Sat {d.day}
                </span>
                <span className="text-[11px] font-semibold text-muted">
                  {ORD[d.nthWeekday]}
                </span>
              </div>
              <div
                className={cx(
                  "mt-0.5 inline-flex items-center gap-1 text-[12px] font-bold",
                  isOff ? "text-muted" : "text-teal-deep",
                )}
              >
                {isOff ? <CalendarX2 size={13} /> : <CalendarCheck size={13} />}
                {isOff ? "Off" : "Working"}
              </div>
              {special && (
                <div className="text-[10.5px] text-muted truncate">
                  Set for everyone:{" "}
                  {d.companyType === "WORKING"
                    ? "working"
                    : d.companyType === "HOLIDAY"
                      ? "holiday"
                      : "week off"}
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          icon={Save}
          loading={busy}
          disabled={!changed}
          onClick={() => save(false)}
        >
          {changed ? "Save Saturdays" : "Saved"}
        </Button>
        {data.saturdaysCustom && (
          <Button icon={RotateCcw} disabled={busy} onClick={() => save(true)}>
            Back to 2nd &amp; 4th off
          </Button>
        )}
      </div>
      <p className="text-[12px] text-muted mt-3">
        People on "Every Saturday" keep working and people on "Saturdays off"
        stay off. To change one Saturday for everyone, click it in the calendar
        and pick Week off or Working. Past Saturdays update the report too.
      </p>
    </section>
  );
}

/* ---------- every Saturday of the month for chosen people ---------- */
function SaturdayPlan({ data, onSaved }) {
  const toast = useToast();
  const { run, busy } = useMutation();
  const people = data.employees;
  const [picked, setPicked] = useState(() => new Set());
  useEffect(() => setPicked(new Set()), [data.year, data.month]);
  const saturdays = data.days.filter(
    (d) =>
      d.weekday === 6 &&
      d.companyType !== "HOLIDAY" &&
      d.companyType !== "WEEK_OFF",
  );
  const toggle = (id) =>
    setPicked((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  async function apply(working) {
    if (!picked.size) return toast("Pick at least one employee", "error");
    try {
      await run("/attendance/admin/calendar/people", {
        method: "PUT",
        body: {
          dates: saturdays.map((d) => d.date),
          employeeIds: [...picked],
          working,
          note: working ? "Every Saturday this month" : null,
        },
        invalidates: ["/attendance"],
      });
      toast(
        working
          ? `${picked.size} employee${picked.size > 1 ? "s" : ""} now work every Saturday of ${data.label}`
          : "Saturdays back to normal",
      );
      setPicked(new Set());
      onSaved();
    } catch (e) {
      toast(e.message, "error");
    }
  }

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-bold text-[16px]">
            Every Saturday in {data.label}
          </h3>
          <p className="text-[13px] text-muted">
            For people who must make up their target. {saturdays.length}{" "}
            Saturdays: {saturdays.map((d) => d.day).join(", ")}.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            icon={TrendingDown}
            onClick={() =>
              setPicked(
                new Set(
                  people.filter((e) => e.behind).map((e) => e.employeeId),
                ),
              )
            }
          >
            Select behind target
          </Button>
          <Button size="sm" onClick={() => setPicked(new Set())}>
            Clear
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {people.map((e) => {
          const on = picked.has(e.employeeId);
          return (
            <button
              key={e.employeeId}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(e.employeeId)}
              className={cx(
                "inline-flex items-center gap-2 rounded-full border pl-1 pr-3 h-9 text-[13px] font-medium transition",
                on
                  ? "bg-teal-deep border-teal-deep text-white"
                  : "bg-white border-line hover:border-teal-deep/40",
              )}
              title={
                e.target
                  ? `${e.leads}/${e.target} leads (${e.pct}%) in ${data.basis.label}`
                  : e.role === "DEVELOPER"
                    ? "Developer"
                    : "No target"
              }
            >
              <Avatar name={e.name} size={26} />
              {e.name}
              {e.behind && (
                <span
                  className={cx(
                    "text-[10.5px] font-bold",
                    on ? "text-lime" : "text-teal-deep",
                  )}
                >
                  {e.pct}%
                </span>
              )}
              {on && <Check size={14} className="text-lime" />}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          icon={CalendarCheck}
          loading={busy}
          disabled={!picked.size}
          onClick={() => apply(true)}
        >
          Make them work every Saturday
        </Button>
        <Button
          icon={RotateCcw}
          disabled={!picked.size || busy}
          onClick={() => apply(null)}
        >
          Back to normal Saturdays
        </Button>
      </div>
      <p className="text-[12px] text-muted mt-3">
        "Behind target" compares leads in {data.basis.label} with where they
        should be{" "}
        {data.basis.isCurrent
          ? `by today (${Math.round(data.basis.fraction * 100)}% of the month)`
          : "by month end"}
        . Each person gets a notification about their extra days.
      </p>
    </section>
  );
}

export default function WorkingDays() {
  const months = useMemo(monthOptions, []);
  const [key, setKey] = useState(months.find((mm) => mm.n === 0).key);
  const [y, m] = key.split("-").map(Number);
  const {
    data: raw,
    loading,
    error,
    reload,
  } = useApi(`/attendance/admin/calendar?year=${y}&month=${m}`, {
    ttl: 30 * 1000,
    keepPrevious: true,
  });
  // every day carries the month's Saturday setting and today's date (used by the rule helpers)
  const data = useMemo(
    () =>
      raw && {
        ...raw,
        days: raw.days.map((d) => ({
          ...d,
          satOff: raw.saturdaysOff,
          todayKey: raw.todayKey,
        })),
      },
    [raw],
  );
  const [sel, setSel] = useState(null);
  useEffect(() => setSel(null), [key]);

  if (loading && !data) return <Spinner />;
  if (!data) return <ErrorNote error={error} onRetry={reload} />;

  const day =
    data.days.find((d) => d.date === sel) ||
    data.days.find((d) => d.date === data.todayKey) ||
    data.days[0];
  const lead = data.days[0].weekday;
  const companyDays = data.days.filter((d) => d.companyWorking).length;
  const satOff = data.days.filter(
    (d) => d.weekday === 6 && !d.companyWorking,
  ).length;
  const holidays = data.days.filter((d) => d.companyType === "HOLIDAY").length;
  const extra = data.employees.reduce((s, e) => s + e.extraDays, 0);

  return (
    <>
      <div className="card p-3 sm:p-4 mb-4 flex flex-wrap items-center gap-3">
        <Select
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="w-48"
          aria-label="Month"
        >
          {months.map((mm) => (
            <option key={mm.key} value={mm.key}>
              {mm.label}
            </option>
          ))}
        </Select>
        <span className="text-[13px] text-muted">
          Click a day to change it for everyone or for chosen people. Set which
          Saturdays are off below. Sunday is always off.
        </span>
      </div>
      <ErrorNote error={error} onRetry={reload} />

      <StatRow cols={5}>
        <MiniStat
          label="Working days"
          value={companyDays}
          hint="Company calendar"
          icon={CalendarDays}
          tone="teal"
        />
        <MiniStat label="Saturdays off" value={satOff} icon={Sun} />
        <MiniStat label="Holidays set" value={holidays} icon={CalendarX2} />
        <MiniStat
          label="Extra days"
          value={extra}
          hint="People working a day off"
          icon={CalendarCheck}
          tone="lime"
        />
        <MiniStat
          label="Behind target"
          value={data.employees.filter((e) => e.behind).length}
          hint={data.basis.label}
          icon={TrendingDown}
        />
      </StatRow>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_400px] gap-5 items-start mb-5">
        <section className="card p-3 sm:p-5">
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center text-[11px] font-bold uppercase tracking-[0.06em] text-muted">
            {WEEK.map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {Array.from({ length: lead }, (_, i) => (
              <div key={`x${i}`} />
            ))}
            {data.days.map((d) => (
              <DayCell
                key={d.date}
                d={d}
                employees={data.employees}
                selected={d.date === day.date}
                today={d.date === data.todayKey}
                onClick={() => setSel(d.date)}
              />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-[12px]">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded bg-white border border-line" />{" "}
              Working
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded bg-pearl border border-line" />{" "}
              Day off / Week off
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded bg-lime" /> Off day made working
              for all
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded bg-teal-deep" /> Holiday
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="rounded-full bg-lime px-1.5 font-bold">
                +2 work
              </span>{" "}
              people with an extra day
            </span>
          </div>
        </section>
        <DayPanel d={day} employees={data.employees} onSaved={reload} />
      </div>

      <div className="mb-5">
        <SaturdaysOff data={data} onSaved={reload} />
      </div>
      <div className="mb-5">
        <SaturdayPlan data={data} onSaved={reload} />
      </div>

      <section className="card overflow-hidden">
        <header className="px-5 py-4 border-b border-line flex items-center gap-2">
          <Users size={18} className="text-teal-deep" />
          <h3 className="font-bold">People in {data.label}</h3>
        </header>
        {!data.employees.length ? (
          <Empty title="No active employees" />
        ) : (
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr>
                <TH className="w-[34%]">Employee</TH>
                <TH className="hidden md:table-cell">Saturday rule</TH>
                <TH className="w-[110px] text-right">Working days</TH>
                <TH className="w-[110px] text-right hidden sm:table-cell">
                  Extra days
                </TH>
                <TH className="w-[150px]">Target</TH>
              </tr>
            </thead>
            <tbody>
              {data.employees.map((e) => (
                <tr key={e.employeeId} className="hover:bg-pearl/60">
                  <TD>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={e.name} size={30} />
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{e.name}</div>
                        <div className="text-xs text-muted">{e.employeeId}</div>
                      </div>
                    </div>
                  </TD>
                  <TD className="hidden md:table-cell text-ink-soft">
                    {SAT_RULE[e.saturdayRule]}
                  </TD>
                  <TD className="num text-right font-bold">
                    {num(e.workingDays)}
                  </TD>
                  <TD className="num text-right hidden sm:table-cell">
                    {e.extraDays ? (
                      <span className="rounded-full bg-lime px-2 py-0.5 font-bold">
                        +{e.extraDays}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </TD>
                  <TD>
                    <TargetPill e={e} />
                  </TD>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
