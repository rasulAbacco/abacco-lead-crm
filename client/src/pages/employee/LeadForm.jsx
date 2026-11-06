// Lead upload form (v3 design). Collects exactly the same information as before:
// client name, lead type, client email*, lead email*, CC emails, website*, event link*,
// phone numbers*, country, contact date, attendees count (attendee types), subject*, pitch*.
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Mail,
  Globe,
  Link2,
  Phone,
  CalendarDays,
  Type,
  FileText,
  Users,
  Plus,
  X,
  Send,
  RotateCcw,
  Home,
  ChevronRight,
  ClipboardList,
  Hash,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Building2,
  UsersRound,
  Factory,
  BadgeCheck,
} from "lucide-react";
import { api, invalidate, LEAD_KEYS } from "../../lib/api";
import { getSession } from "../../lib/session";
import { fmtDate, todayKey } from "../../lib/format";
import {
  Button,
  Field,
  IconInput,
  Modal,
  Textarea,
  useToast,
  cx,
} from "../../components/ui";

const TYPE_TILES = [
  { value: "Association Lead", label: "Association", icon: Building2 },
  { value: "Attendees Lead", label: "Attendees", icon: UsersRound },
  { value: "Industry Lead", label: "Industry", icon: Factory },
  { value: "Member Attendees", label: "Member attendees", icon: BadgeCheck },
];

const LEAD_TYPES = [
  "Association Lead",
  "Attendees Lead",
  "Industry Lead",
  "Member Attendees",
];
const COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "Ireland",
  "Germany",
  "France",
  "Netherlands",
  "New Zealand",
  "Mexico",
  "India",
  "Argentina",
  "Brazil",
  "Japan",
  "China",
  "Russia",
];

const EMPTY = {
  agentName: "",
  clientEmail: "",
  leadEmail: "",
  ccEmails: [""],
  subjectLine: "",
  emailPitch: "",
  website: "",
  phones: [""],
  country: "",
  leadType: "Association Lead",
  date: "",
  link: "",
  attendeesCount: "",
};

const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const linkLabel = (t) =>
  t === "Association Lead"
    ? "Association link"
    : t === "Attendees Lead"
      ? "Expo link"
      : t === "Member Attendees"
        ? "Member link"
        : "Link";

function Step({ n, title, hint, children }) {
  return (
    <section className="card p-5 sm:p-7">
      <header className="flex items-start gap-3.5 mb-5">
        <span className="num size-9 rounded-full bg-lime text-ink font-extrabold flex items-center justify-center shrink-0">
          {n}
        </span>
        <div>
          <h2 className="font-[family-name:var(--font-display)] font-extrabold text-[18px] leading-tight">
            {title}
          </h2>
          {hint && <p className="text-muted text-[13px] mt-0.5">{hint}</p>}
        </div>
      </header>
      <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4">{children}</div>
    </section>
  );
}

function MultiInput({
  icon,
  values,
  onChange,
  placeholder,
  type = "text",
  addLabel,
  invalid,
}) {
  return (
    <div className="space-y-2">
      {values.map((v, i) => (
        <div key={i} className="flex gap-2">
          <div className="flex-1 min-w-0">
            <IconInput
              icon={icon}
              type={type}
              value={v}
              placeholder={placeholder}
              className={cx(invalid && "ring-2 !ring-teal-deep")}
              onChange={(e) =>
                onChange(values.map((x, j) => (j === i ? e.target.value : x)))
              }
            />
          </div>
          {values.length > 1 ? (
            <button
              type="button"
              onClick={() => onChange(values.filter((_, j) => j !== i))}
              className="size-10 shrink-0 rounded-full border border-line bg-white text-teal-deep hover:bg-teal-deep hover:text-white transition flex items-center justify-center"
              aria-label="Remove"
            >
              <X size={16} />
            </button>
          ) : null}
          {i === values.length - 1 && (
            <button
              type="button"
              onClick={() => onChange([...values, ""])}
              className="size-10 shrink-0 rounded-full bg-lime text-ink hover:bg-lime-dark transition flex items-center justify-center"
              aria-label={addLabel}
              title={addLabel}
            >
              <Plus size={18} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default function LeadForm() {
  const toast = useToast();
  const session = getSession();
  const [f, setF] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [dup, setDup] = useState(null);
  const [formId, setFormId] = useState(
    () => `LF-${String(Date.now()).slice(-6)}`,
  );
  const [done, setDone] = useState(false);

  const set = (k) => (e) => {
    setF((x) => ({ ...x, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: null }));
  };

  function validate() {
    const e = {};
    if (!f.clientEmail.trim()) e.clientEmail = "Client email is required";
    else if (!isEmail(f.clientEmail.trim()))
      e.clientEmail = "Enter a valid email";
    if (!f.leadEmail.trim()) e.leadEmail = "Lead email is required";
    else if (!isEmail(f.leadEmail.trim())) e.leadEmail = "Enter a valid email";
    const badCc = f.ccEmails
      .map((x) => x.trim())
      .filter(Boolean)
      .find((x) => !isEmail(x));
    if (badCc) e.ccEmails = `Invalid CC email: ${badCc}`;
    if (!f.website.trim()) e.website = "Website is required";
    if (!f.link.trim()) e.link = `${linkLabel(f.leadType)} is required`;
    if (!f.phones.some((p) => p.trim()))
      e.phones = "At least one phone number is required";
    if (!f.subjectLine.trim()) e.subjectLine = "Subject line is required";
    if (!f.emailPitch.trim()) e.emailPitch = "Email pitch is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function clear() {
    setF(EMPTY);
    setErrors({});
    setFormId(`LF-${String(Date.now()).slice(-6)}`);
  }

  async function submit(e) {
    e.preventDefault();
    if (!validate()) {
      toast("Please fix the highlighted fields", "error");
      return;
    }
    setBusy(true);
    try {
      const body = {
        leads: [
          {
            ...f,
            phones: f.phones.filter((p) => p.trim()),
            ccEmails: f.ccEmails.filter((x) => x.trim()),
          },
        ],
      };
      const data = await api("/leads", { method: "POST", body }).catch(
        (err) => {
          if (err.data?.duplicate) return err.data;
          throw err;
        },
      );
      if (data.success) {
        invalidate(...LEAD_KEYS);
        toast("Lead submitted successfully");
        setDone(true);
        setTimeout(() => setDone(false), 4000);
        clear();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (data.duplicate) {
        setDup(data.duplicateLead);
      } else {
        toast(data.message || "Submission failed", "error");
      }
    } catch (err) {
      toast(err.message || "Server error. Try again later.", "error");
    } finally {
      setBusy(false);
    }
  }

  const attendees =
    f.leadType === "Attendees Lead" || f.leadType === "Member Attendees";
  const bad = (k) => (errors[k] ? "ring-2 !ring-teal-deep" : "");

  // live checklist of required fields
  const checks = [
    ["Client email", isEmail(f.clientEmail.trim())],
    ["Lead email", isEmail(f.leadEmail.trim())],
    ["Website", !!f.website.trim()],
    [linkLabel(f.leadType), !!f.link.trim()],
    ["Phone number", f.phones.some((p) => p.trim())],
    ["Subject line", !!f.subjectLine.trim()],
    ["Email pitch", !!f.emailPitch.trim()],
  ];
  const ready = checks.filter((c) => c[1]).length;

  const actions = (
    <div className="flex flex-col gap-2.5">
      <Button
        type="submit"
        form="lead-form"
        variant="primary"
        icon={Send}
        loading={busy}
        className="w-full h-12 text-[16px]"
      >
        Submit lead
      </Button>
      <Button type="button" icon={RotateCcw} onClick={clear} className="w-full">
        Clear form
      </Button>
    </div>
  );

  return (
    <>
      <nav
        className="flex items-center gap-1.5 text-[13px] text-muted mb-4"
        aria-label="Breadcrumb"
      >
        <Link to="/employee-dashboard" className="hover:text-teal-deep">
          <Home size={15} />
        </Link>
        <ChevronRight size={14} />
        <span className="text-ink font-medium">Upload lead</span>
      </nav>

      {/* header */}
      <header className="relative overflow-hidden rounded-[24px] bg-teal-deep text-white mb-5 shadow-[0_24px_50px_-26px_rgba(11,48,72,0.8)]">
        <svg
          className="absolute right-0 top-0 h-full w-1/2 opacity-60"
          viewBox="0 0 400 200"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <circle cx="380" cy="10" r="140" fill="#0F3A56" />
          <path
            d="M240 -10 C200 60 230 120 330 150"
            fill="none"
            stroke="#B9F12F"
            strokeOpacity="0.6"
            strokeWidth="3"
          />
        </svg>
        <div className="relative flex flex-col xl:flex-row xl:items-center gap-5 p-5 sm:p-7">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <span className="relative size-16 sm:size-[72px] rounded-[22px] bg-lime text-teal-deep flex items-center justify-center shrink-0">
              <ClipboardList size={32} />
              <span className="absolute -bottom-2 -right-2 size-8 rounded-full bg-white text-teal-deep flex items-center justify-center shadow">
                <Send size={15} />
              </span>
            </span>
            <div className="min-w-0">
              <h1 className="font-[family-name:var(--font-display)] text-[24px] sm:text-[30px] font-extrabold tracking-tight leading-tight">
                Drop your lead here
              </h1>
              <p className="text-pearl/75">
                Fill in the three parts below and submit.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2.5 xl:w-[460px]">
            <div className="rounded-2xl bg-white/[0.07] border border-white/10 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[11.5px] text-pearl/70">
                <CalendarDays size={13} className="text-lime" />
                Date
              </div>
              <div className="num font-bold text-[14px]">
                {fmtDate(new Date(), "dd/MM/yyyy")}
              </div>
            </div>
            <div className="rounded-2xl bg-white/[0.07] border border-white/10 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[11.5px] text-pearl/70">
                <Hash size={13} className="text-lime" />
                Form ID
              </div>
              <div className="num font-bold text-[14px]">{formId}</div>
            </div>
            <div className="rounded-2xl bg-lime text-ink px-3 py-2.5">
              <div className="text-[11.5px] text-ink/70">Employee ID</div>
              <div className="font-extrabold text-[15px] tracking-wide">
                {session?.employeeId}
              </div>
            </div>
          </div>
        </div>
      </header>

      {done && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-2xl bg-lime text-ink px-4 py-3 mb-5 font-semibold"
        >
          <CheckCircle2 size={18} /> Lead submitted. You can add the next one.
        </div>
      )}

      <div className="grid xl:grid-cols-[minmax(0,1fr)_300px] gap-5 items-start">
        <form
          id="lead-form"
          onSubmit={submit}
          noValidate
          className="space-y-5 min-w-0"
        >
          <Step
            n={1}
            title="Lead"
            hint="What kind of lead it is and who it is for."
          >
            <div className="sm:col-span-2">
              <span className="block text-[13px] font-semibold text-ink mb-2">
                Lead type
              </span>
              <div
                className="grid grid-cols-2 lg:grid-cols-4 gap-2.5"
                role="radiogroup"
                aria-label="Lead type"
              >
                {TYPE_TILES.map((t) => {
                  const on = f.leadType === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setF((x) => ({ ...x, leadType: t.value }))}
                      className={cx(
                        "flex items-center gap-2.5 rounded-2xl border px-3.5 h-14 text-left transition",
                        on
                          ? "bg-teal-deep border-teal-deep text-white"
                          : "bg-white border-line hover:border-teal-deep/40",
                      )}
                    >
                      <span
                        className={cx(
                          "size-8 rounded-full flex items-center justify-center shrink-0",
                          on
                            ? "bg-lime text-teal-deep"
                            : "bg-pearl text-teal-deep",
                        )}
                      >
                        <t.icon size={16} />
                      </span>
                      <span className="text-[13.5px] font-semibold leading-tight">
                        {t.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <Field label="Client name">
              <IconInput
                icon={User}
                value={f.agentName}
                onChange={set("agentName")}
                placeholder="Enter client full name"
              />
            </Field>
            <Field label="Client email" required error={errors.clientEmail}>
              <IconInput
                icon={Mail}
                type="email"
                value={f.clientEmail}
                onChange={set("clientEmail")}
                placeholder="client@company.com"
                className={bad("clientEmail")}
              />
            </Field>
            <Field label="Lead email" required error={errors.leadEmail}>
              <IconInput
                icon={Mail}
                type="email"
                value={f.leadEmail}
                onChange={set("leadEmail")}
                placeholder="lead@company.com"
                className={bad("leadEmail")}
              />
            </Field>
            <Field label="CC emails" error={errors.ccEmails}>
              <MultiInput
                icon={Mail}
                type="email"
                values={f.ccEmails}
                placeholder="cc@example.com"
                addLabel="Add another CC email"
                invalid={!!errors.ccEmails}
                onChange={(v) => {
                  setF((x) => ({ ...x, ccEmails: v }));
                  setErrors((x) => ({ ...x, ccEmails: null }));
                }}
              />
            </Field>
          </Step>

          <Step
            n={2}
            title="Contact"
            hint="Where the client and the event can be found."
          >
            <Field label="Client website" required error={errors.website}>
              <IconInput
                icon={Globe}
                value={f.website}
                onChange={set("website")}
                placeholder="https://website.com"
                className={bad("website")}
              />
            </Field>
            <Field label={linkLabel(f.leadType)} required error={errors.link}>
              <IconInput
                icon={Link2}
                value={f.link}
                onChange={set("link")}
                placeholder="https://link.com"
                className={bad("link")}
              />
            </Field>
            <Field label="Phone numbers" required error={errors.phones}>
              <MultiInput
                icon={Phone}
                values={f.phones}
                placeholder="+1 (555) 123-4567"
                addLabel="Add another phone number"
                invalid={!!errors.phones}
                onChange={(v) => {
                  setF((x) => ({ ...x, phones: v }));
                  setErrors((x) => ({ ...x, phones: null }));
                }}
              />
            </Field>
            <Field label="Country" hint="Pick from the list or type a country">
              <IconInput
                icon={Globe}
                list="lead-countries"
                value={f.country}
                onChange={set("country")}
                placeholder="United States"
              />
              <datalist id="lead-countries">
                {COUNTRIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="Contact date" hint="Leave empty for today">
              <IconInput
                icon={CalendarDays}
                type="date"
                max={todayKey()}
                value={f.date}
                onChange={set("date")}
              />
            </Field>
            {attendees && (
              <Field label="Attendees count" hint="Optional">
                <IconInput
                  icon={Users}
                  type="number"
                  min="0"
                  value={f.attendeesCount}
                  onChange={set("attendeesCount")}
                  placeholder="Number of attendees"
                />
              </Field>
            )}
          </Step>

          <Step n={3} title="Email" hint="The message you sent to the client.">
            <Field
              label="Subject line"
              required
              error={errors.subjectLine}
              className="sm:col-span-2"
            >
              <IconInput
                icon={Type}
                value={f.subjectLine}
                onChange={set("subjectLine")}
                placeholder="Partnership opportunity"
                className={bad("subjectLine")}
              />
            </Field>
            <Field
              label="Email pitch"
              required
              error={errors.emailPitch}
              className="sm:col-span-2"
            >
              <span className="relative block">
                <FileText
                  size={17}
                  className="pointer-events-none absolute left-3 top-3 text-muted"
                />
                <Textarea
                  rows={8}
                  value={f.emailPitch}
                  onChange={set("emailPitch")}
                  placeholder="Enter your professional email pitch here…"
                  className={cx("pl-10", bad("emailPitch"))}
                />
              </span>
            </Field>
          </Step>

          {/* phones / tablets: buttons at the end */}
          <div className="xl:hidden card p-4">{actions}</div>
        </form>

        {/* desktop: checklist + submit, stays in view */}
        <aside className="hidden xl:block xl:sticky xl:top-[100px] card p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold">Before you submit</h2>
            <span
              className={cx(
                "num rounded-full px-2.5 h-6 inline-flex items-center text-[12px] font-bold",
                ready === checks.length
                  ? "bg-lime text-ink"
                  : "bg-teal-deep text-white",
              )}
            >
              {ready}/{checks.length}
            </span>
          </div>
          <p className="text-[12.5px] text-muted mb-4">Required fields</p>
          <ul className="space-y-2 mb-5">
            {checks.map(([label, ok]) => (
              <li
                key={label}
                className={cx(
                  "flex items-center gap-2.5 text-[13.5px]",
                  ok ? "text-ink" : "text-muted",
                )}
              >
                {ok ? (
                  <CheckCircle2 size={18} className="text-teal-deep shrink-0" />
                ) : (
                  <Circle size={18} className="text-line shrink-0" />
                )}
                <span className={cx(ok && "font-medium")}>{label}</span>
              </li>
            ))}
          </ul>
          <div className="track h-1.5 rounded-full overflow-hidden mb-5">
            <div
              className="h-full bg-lime rounded-full transition-[width] duration-300"
              style={{ width: `${(ready / checks.length) * 100}%` }}
            />
          </div>
          {actions}
        </aside>
      </div>

      {dup && (
        <Modal
          open
          onClose={() => setDup(null)}
          title="This client was already uploaded"
          footer={
            <Button variant="primary" onClick={() => setDup(null)}>
              OK
            </Button>
          }
        >
          <div className="flex gap-3 rounded-2xl bg-pearl border border-line border-l-4 border-l-lime p-4 mb-4 text-[14px]">
            <AlertTriangle size={20} className="text-teal-deep shrink-0" />
            <span>
              The same client email can be uploaded again only after 2 months.
            </span>
          </div>
          <dl className="grid grid-cols-[130px_1fr] gap-y-2 text-[14px]">
            <dt className="text-muted">Client email</dt>
            <dd className="[overflow-wrap:anywhere] font-medium">
              {dup.clientEmail}
            </dd>
            <dt className="text-muted">Subject</dt>
            <dd className="break-words">{dup.subjectLine}</dd>
            <dt className="text-muted">Uploaded by</dt>
            <dd>
              {dup.uploadedBy?.fullName} ({dup.uploadedBy?.employeeId})
            </dd>
            <dt className="text-muted">Uploaded on</dt>
            <dd>{fmtDate(dup.createdAt)}</dd>
            <dt className="text-muted">Can upload again</dt>
            <dd className="font-semibold">
              {fmtDate(dup.retryAfter)} ({dup.remainingDays} day
              {dup.remainingDays === 1 ? "" : "s"})
            </dd>
          </dl>
        </Modal>
      )}
    </>
  );
}
