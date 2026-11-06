// Full details of one lead (review, all leads, my leads).
import { useState } from "react";
import {
  Copy,
  Check,
  ExternalLink,
  Mail,
  Phone,
  User,
  Globe,
  Link2,
  CalendarDays,
  CloudUpload,
  Users,
} from "lucide-react";
import { fmtDate, fmtDateTime } from "../lib/format";

function CopyButton({ value }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="text-muted hover:text-teal-deep hover:bg-lime/40 rounded-md p-0.5 -m-0.5 shrink-0"
      title="Copy"
      onClick={() => {
        navigator.clipboard?.writeText(value);
        setDone(true);
        setTimeout(() => setDone(false), 1200);
      }}
    >
      {done ? (
        <Check size={15} className="text-teal-deep" />
      ) : (
        <Copy size={15} />
      )}
    </button>
  );
}

const href = (u) => (/^https?:\/\//i.test(u) ? u : `http://${u}`);
const dash = <span className="text-muted">—</span>;

/* One field: small label on top, full-width value below (no squeezing) */
function Field({ icon: Icon, label, children, wide }) {
  return (
    <div className={wide ? "col-span-2" : undefined}>
      <dt className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-muted">
        <Icon size={14} className="text-teal-deep" /> {label}
      </dt>
      <dd className="mt-1 min-w-0 text-[14.5px] font-medium text-ink [overflow-wrap:anywhere]">
        {children}
      </dd>
    </div>
  );
}

const Copyable = ({ value }) =>
  value ? (
    <span className="inline-flex items-start gap-2 max-w-full">
      <span className="[overflow-wrap:anywhere]">{value}</span>
      <CopyButton value={value} />
    </span>
  ) : (
    dash
  );

const LinkOut = ({ value }) =>
  value ? (
    <a
      className="text-teal-deep underline decoration-lime decoration-2 underline-offset-[3px] hover:bg-lime/40 rounded inline-flex items-start gap-1 [overflow-wrap:anywhere]"
      href={href(value)}
      target="_blank"
      rel="noreferrer"
    >
      {value}
      <ExternalLink size={13} className="shrink-0 mt-1" />
    </a>
  ) : (
    dash
  );

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-4 sm:p-5">
      <h4 className="text-[13px] font-bold text-teal-deep mb-3.5">{title}</h4>
      <dl className="grid grid-cols-2 gap-x-5 gap-y-4">{children}</dl>
    </section>
  );
}

export default function LeadDetails({ lead }) {
  const phones = (lead.phone || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const ccs = (lead.ccEmail || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return (
    <div className="@container space-y-4">
      <div className="grid @[860px]:grid-cols-2 gap-4">
        <Section title="Contact">
          <Field icon={Mail} label="Client email" wide>
            <Copyable value={lead.clientEmail} />
          </Field>
          <Field icon={Mail} label="Lead email" wide>
            <Copyable value={lead.leadEmail} />
          </Field>
          <Field icon={Phone} label="Phone">
            {phones.length ? (
              <div className="space-y-0.5">
                {phones.map((p) => (
                  <div key={p}>{p}</div>
                ))}
              </div>
            ) : (
              dash
            )}
          </Field>
          <Field icon={User} label="Agent name">
            {lead.agentName || dash}
          </Field>
          {ccs.length > 0 && (
            <Field icon={Mail} label="CC emails" wide>
              <div className="space-y-0.5">
                {ccs.map((c) => (
                  <div key={c}>
                    <Copyable value={c} />
                  </div>
                ))}
              </div>
            </Field>
          )}
        </Section>
        <Section title="Event & dates">
          <Field icon={Link2} label="Website" wide>
            <LinkOut value={lead.website} />
          </Field>
          <Field icon={Link2} label="Event link" wide>
            <LinkOut value={lead.link} />
          </Field>
          <Field icon={Globe} label="Country">
            {lead.country || dash}
          </Field>
          {lead.attendeesCount ? (
            <Field icon={Users} label="Attendees">
              {lead.attendeesCount}
            </Field>
          ) : (
            <Field icon={CalendarDays} label="Contact date">
              {fmtDate(lead.date)}
            </Field>
          )}
          {lead.attendeesCount ? (
            <Field icon={CalendarDays} label="Contact date">
              {fmtDate(lead.date)}
            </Field>
          ) : null}
          <Field icon={CloudUpload} label="Uploaded">
            {fmtDateTime(lead.createdAt)} CT{lead.isEdited ? " (edited)" : ""}
          </Field>
        </Section>
      </div>
      <section className="rounded-2xl border border-line bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="flex items-center gap-2 text-[13px] font-bold text-teal-deep">
            <Mail size={15} /> Email pitch
          </h4>
          {lead.emailPitch && <CopyButton value={lead.emailPitch} />}
        </div>
        <div className="whitespace-pre-wrap [overflow-wrap:anywhere] rounded-xl bg-pearl p-4 text-[14.5px] leading-relaxed text-ink">
          {lead.emailPitch || "—"}
        </div>
      </section>
    </div>
  );
}
