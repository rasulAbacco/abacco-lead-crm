// Lead upload form (v3 design). Collects exactly the same information as before:
// client name, lead type, client email*, lead email*, CC emails, website*, event link*,
// phone numbers*, country, contact date, attendees count (attendee types), subject*, pitch*.
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  User, Tag, Mail, Globe, Link2, Phone, CalendarDays, Type, FileText, Users, Plus, X, Send, RotateCcw,
  Home, ChevronRight, ClipboardList, Hash, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { api, invalidate, LEAD_KEYS } from "../../lib/api";
import { getSession } from "../../lib/session";
import { fmtDate, todayKey } from "../../lib/format";
import { Button, Field, IconInput, Modal, Textarea, useToast, cx } from "../../components/ui";

const LEAD_TYPES = ["Association Lead", "Attendees Lead", "Industry Lead", "Member Attendees"];
const COUNTRIES = ["United States", "Canada", "United Kingdom", "Australia", "Ireland", "Germany", "France", "Netherlands", "New Zealand", "Mexico", "India", "Argentina", "Brazil", "Japan", "China", "Russia"];

const EMPTY = {
  agentName: "", clientEmail: "", leadEmail: "", ccEmails: [""], subjectLine: "", emailPitch: "", emailResponce: "",
  website: "", phones: [""], country: "", leadType: "Association Lead", date: "", link: "", attendeesCount: "",
};

const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const linkLabel = (t) => (t === "Association Lead" ? "Association link" : t === "Attendees Lead" ? "Expo link" : t === "Member Attendees" ? "Member link" : "Link");

function Section({ title, hint, children }) {
  return (
    <section className="pt-6 first:pt-0">
      <h2 className="font-bold text-[16px]">{title}</h2>
      {hint && <p className="text-muted text-[13px] mt-0.5">{hint}</p>}
      <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4 mt-4">{children}</div>
    </section>
  );
}

function MultiInput({ icon, values, onChange, placeholder, type = "text", addLabel }) {
  return (
    <div className="space-y-2">
      {values.map((v, i) => (
        <div key={i} className="flex gap-2">
          <div className="flex-1 min-w-0"><IconInput icon={icon} type={type} value={v} placeholder={placeholder} onChange={(e) => onChange(values.map((x, j) => (j === i ? e.target.value : x)))} /></div>
          {values.length > 1 ? (
            <button type="button" onClick={() => onChange(values.filter((_, j) => j !== i))} className="size-10 shrink-0 rounded-lg border border-line-strong text-muted hover:text-leave hover:border-leave/40" aria-label="Remove"><X size={16} className="mx-auto" /></button>
          ) : null}
          {i === values.length - 1 && (
            <button type="button" onClick={() => onChange([...values, ""])} className="size-10 shrink-0 rounded-lg bg-blue-soft text-blue hover:bg-blue hover:text-white transition" aria-label={addLabel} title={addLabel}><Plus size={18} className="mx-auto" /></button>
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
  const [formId, setFormId] = useState(() => `LF-${String(Date.now()).slice(-6)}`);
  const [done, setDone] = useState(false);

  const set = (k) => (e) => {
    setF((x) => ({ ...x, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: null }));
  };

  function validate() {
    const e = {};
    if (!f.clientEmail.trim()) e.clientEmail = "Client email is required";
    else if (!isEmail(f.clientEmail.trim())) e.clientEmail = "Enter a valid email";
    if (!f.leadEmail.trim()) e.leadEmail = "Lead email is required";
    else if (!isEmail(f.leadEmail.trim())) e.leadEmail = "Enter a valid email";
    const badCc = f.ccEmails.map((x) => x.trim()).filter(Boolean).find((x) => !isEmail(x));
    if (badCc) e.ccEmails = `Invalid CC email: ${badCc}`;
    if (!f.website.trim()) e.website = "Website is required";
    if (!f.link.trim()) e.link = `${linkLabel(f.leadType)} is required`;
    if (!f.phones.some((p) => p.trim())) e.phones = "At least one phone number is required";
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
      const body = { leads: [{ ...f, phones: f.phones.filter((p) => p.trim()), ccEmails: f.ccEmails.filter((x) => x.trim()) }] };
      const data = await api("/leads", { method: "POST", body }).catch((err) => {
        if (err.data?.duplicate) return err.data;
        throw err;
      });
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

  const attendees = f.leadType === "Attendees Lead" || f.leadType === "Member Attendees";

  return (
    <>
      <nav className="flex items-center gap-1.5 text-[13px] text-muted mb-4" aria-label="Breadcrumb">
        <Link to="/employee-dashboard" className="hover:text-ink"><Home size={15} /></Link>
        <ChevronRight size={14} />
        <span className="text-ink font-medium">Upload lead</span>
      </nav>

      {/* Header */}
      <div className="card relative overflow-hidden mb-5 bg-gradient-to-r from-white via-white to-blue-soft">
        <div className="absolute -right-16 -top-20 size-64 rounded-full bg-blue/10" aria-hidden="true" />
        <div className="relative flex flex-col xl:flex-row xl:items-center gap-5 p-5 sm:p-6">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="relative shrink-0 size-16 sm:size-20 rounded-2xl bg-gradient-to-br from-blue-soft to-white border border-blue/15 flex items-center justify-center">
              <ClipboardList size={34} className="text-blue" />
              <span className="absolute -bottom-2 -right-2 size-9 rounded-full btn-blue text-white flex items-center justify-center shadow-lg"><Send size={16} /></span>
            </div>
            <div className="min-w-0">
              <h1 className="text-[22px] sm:text-[26px] font-bold tracking-tight">Drop your lead here</h1>
              <p className="text-ink-soft">Employee lead submission portal</p>
              <p className="text-muted text-[13px] mt-0.5">Fill in the details below to submit a new lead.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="rounded-xl bg-white/80 border border-line px-3 py-2.5"><div className="flex items-center gap-1.5 text-xs text-muted"><Users size={14} className="text-blue" />Type</div><div className="font-semibold text-[13px]">New lead</div></div>
            <div className="rounded-xl bg-white/80 border border-line px-3 py-2.5"><div className="flex items-center gap-1.5 text-xs text-muted"><CalendarDays size={14} className="text-blue" />Date</div><div className="num font-semibold text-[13px]">{fmtDate(new Date(), "dd/MM/yyyy")}</div></div>
            <div className="rounded-xl bg-white/80 border border-line px-3 py-2.5"><div className="flex items-center gap-1.5 text-xs text-muted"><Hash size={14} className="text-violet" />Form ID</div><div className="num font-semibold text-[13px]">{formId}</div></div>
            <div className="rounded-xl bg-navy text-white px-3 py-2.5"><div className="text-xs text-white/60">Employee ID</div><div className="font-bold text-[15px] tracking-wide">{session?.employeeId}</div></div>
          </div>
        </div>
      </div>

      {done && (
        <div className="flex items-center gap-2 rounded-xl border border-active/25 bg-active-soft text-active px-4 py-3 mb-5 font-semibold">
          <CheckCircle2 size={18} /> Lead submitted. You can add the next one.
        </div>
      )}

      <form onSubmit={submit} noValidate className="card p-5 sm:p-7 divide-y divide-line [&>section+section]:mt-6">
        <Section title="Lead information" hint="Who the lead is and what kind of lead it is.">
          <Field label="Client name">
            <IconInput icon={User} value={f.agentName} onChange={set("agentName")} placeholder="Enter client full name" />
          </Field>
          <Field label="Lead type">
            <span className="relative block">
              <Tag size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <select value={f.leadType} onChange={set("leadType")} className="w-full h-10 rounded-lg border border-line-strong bg-white pl-10 pr-9 text-sm outline-none focus:border-blue focus:ring-4 focus:ring-blue/10 appearance-none cursor-pointer">
                {LEAD_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
              <ChevronRight size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-muted" />
            </span>
          </Field>
          <Field label="Client email" required error={errors.clientEmail}>
            <IconInput icon={Mail} type="email" value={f.clientEmail} onChange={set("clientEmail")} placeholder="client@company.com" className={cx(errors.clientEmail && "border-leave")} />
          </Field>
          <Field label="Lead email" required error={errors.leadEmail}>
            <IconInput icon={Mail} type="email" value={f.leadEmail} onChange={set("leadEmail")} placeholder="lead@company.com" className={cx(errors.leadEmail && "border-leave")} />
          </Field>
          <Field label="CC emails" error={errors.ccEmails} className="sm:col-span-2">
            <MultiInput icon={Mail} type="email" values={f.ccEmails} placeholder="cc@example.com" addLabel="Add another CC email" onChange={(v) => { setF((x) => ({ ...x, ccEmails: v })); setErrors((x) => ({ ...x, ccEmails: null })); }} />
          </Field>
        </Section>

        <Section title="Contact details" hint="Where the client can be reached.">
          <Field label="Client website" required error={errors.website}>
            <IconInput icon={Globe} value={f.website} onChange={set("website")} placeholder="https://website.com" className={cx(errors.website && "border-leave")} />
          </Field>
          <Field label={linkLabel(f.leadType)} required error={errors.link}>
            <IconInput icon={Link2} value={f.link} onChange={set("link")} placeholder="https://link.com" className={cx(errors.link && "border-leave")} />
          </Field>
          <Field label="Phone numbers" required error={errors.phones} className="sm:col-span-2">
            <MultiInput icon={Phone} values={f.phones} placeholder="+1 (555) 123-4567" addLabel="Add another phone number" onChange={(v) => { setF((x) => ({ ...x, phones: v })); setErrors((x) => ({ ...x, phones: null })); }} />
          </Field>
          <Field label="Country" hint="Pick from the list or type a country">
            <IconInput icon={Globe} list="lead-countries" value={f.country} onChange={set("country")} placeholder="United States" />
            <datalist id="lead-countries">{COUNTRIES.map((c) => <option key={c} value={c} />)}</datalist>
          </Field>
          <Field label="Contact date" hint="Leave empty for today">
            <IconInput icon={CalendarDays} type="date" max={todayKey()} value={f.date} onChange={set("date")} />
          </Field>
          {attendees && (
            <Field label="Attendees count" hint="Optional">
              <IconInput icon={Users} type="number" min="0" value={f.attendeesCount} onChange={set("attendeesCount")} placeholder="Number of attendees" />
            </Field>
          )}
        </Section>

        <Section title="Email" hint="The message you sent to the client.">
          <Field label="Subject line" required error={errors.subjectLine} className="sm:col-span-2">
            <IconInput icon={Type} value={f.subjectLine} onChange={set("subjectLine")} placeholder="Partnership opportunity" className={cx(errors.subjectLine && "border-leave")} />
          </Field>
          <Field label="Email pitch" required error={errors.emailPitch} className="sm:col-span-2">
            <span className="relative block">
              <FileText size={17} className="pointer-events-none absolute left-3 top-3 text-muted" />
              <Textarea rows={6} value={f.emailPitch} onChange={set("emailPitch")} placeholder="Enter your professional email pitch here…" className={cx("pl-10", errors.emailPitch && "border-leave")} />
            </span>
          </Field>
        </Section>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 pt-6 mt-6">
          <Button type="button" icon={RotateCcw} onClick={clear}>Clear form</Button>
          <Button type="submit" variant="blue" icon={Send} loading={busy} className="sm:ml-auto sm:w-80 h-11">Submit lead</Button>
        </div>
      </form>

      {dup && (
        <Modal open onClose={() => setDup(null)} title="This client was already uploaded" footer={<Button variant="primary" onClick={() => setDup(null)}>OK</Button>}>
          <div className="flex gap-3 rounded-xl bg-noresp-soft border border-noresp/25 p-4 mb-4 text-[14px]">
            <AlertTriangle size={20} className="text-noresp shrink-0" />
            <span>The same client email can be uploaded again only after 2 months.</span>
          </div>
          <dl className="grid grid-cols-[130px_1fr] gap-y-2 text-[14px]">
            <dt className="text-muted">Client email</dt><dd className="break-all font-medium">{dup.clientEmail}</dd>
            <dt className="text-muted">Subject</dt><dd className="break-words">{dup.subjectLine}</dd>
            <dt className="text-muted">Uploaded by</dt><dd>{dup.uploadedBy?.fullName} ({dup.uploadedBy?.employeeId})</dd>
            <dt className="text-muted">Uploaded on</dt><dd>{fmtDate(dup.createdAt)}</dd>
            <dt className="text-muted">Can upload again</dt><dd className="font-semibold">{fmtDate(dup.retryAfter)} ({dup.remainingDays} day{dup.remainingDays === 1 ? "" : "s"})</dd>
          </dl>
        </Modal>
      )}
    </>
  );
}
