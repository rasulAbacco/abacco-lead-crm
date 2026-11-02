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
      className="text-muted hover:text-ink shrink-0"
      title="Copy"
      onClick={() => {
        navigator.clipboard?.writeText(value);
        setDone(true);
        setTimeout(() => setDone(false), 1200);
      }}
    >
      {done ? <Check size={14} className="text-active" /> : <Copy size={14} />}
    </button>
  );
}

const href = (u) => (/^https?:\/\//i.test(u) ? u : `http://${u}`);
const dash = <span className="text-muted">—</span>;

function Row({ icon: Icon, label, children }) {
  return (
    <div className="grid grid-cols-[22px_104px_minmax(0,1fr)] sm:grid-cols-[22px_120px_minmax(0,1fr)] items-start gap-2 py-2">
      <Icon size={17} className="text-ink-soft mt-0.5" />
      <dt className="text-muted text-[13px] mt-px">{label}</dt>
      <dd className="min-w-0 text-[14px] break-words">{children}</dd>
    </div>
  );
}

const Copyable = ({ value }) =>
  value ? (
    <span className="inline-flex items-start gap-1.5 max-w-full">
      <span className="break-all">{value}</span>
      <CopyButton value={value} />
    </span>
  ) : (
    dash
  );

const LinkOut = ({ value }) =>
  value ? (
    <a
      className="text-blue hover:underline inline-flex items-start gap-1 break-all"
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
    <div className="space-y-4">
      <div className="rounded-xl border border-line p-3 sm:p-4 grid lg:grid-cols-2 gap-x-8 lg:divide-x divide-line">
        <dl>
          <Row icon={Mail} label="Client email">
            <Copyable value={lead.clientEmail} />
          </Row>
          <Row icon={Mail} label="Lead email">
            <Copyable value={lead.leadEmail} />
          </Row>
          <Row icon={Mail} label="CC emails">
            {ccs.length ? (
              <div className="space-y-0.5">
                {ccs.map((c) => (
                  <div key={c}>
                    <Copyable value={c} />
                  </div>
                ))}
              </div>
            ) : (
              dash
            )}
          </Row>
          <Row icon={Phone} label="Phone">
            {phones.length ? phones.join(", ") : dash}
          </Row>
          <Row icon={User} label="Agent name">
            {lead.agentName || dash}
          </Row>
        </dl>
        <dl className="lg:pl-8">
          <Row icon={Globe} label="Country">
            {lead.country || dash}
          </Row>
          <Row icon={Link2} label="Website">
            <LinkOut value={lead.website} />
          </Row>
          <Row icon={Link2} label="Event link">
            <LinkOut value={lead.link} />
          </Row>
          {lead.attendeesCount ? (
            <Row icon={Users} label="Attendees">
              {lead.attendeesCount}
            </Row>
          ) : null}
          <Row icon={CalendarDays} label="Contact date">
            {fmtDate(lead.date)}
          </Row>
          <Row icon={CloudUpload} label="Uploaded">
            {fmtDateTime(lead.createdAt)} CT{lead.isEdited ? " (edited)" : ""}
          </Row>
        </dl>
      </div>
      <div className="rounded-xl border border-line p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="flex items-center gap-2 font-semibold text-[14px]">
            <Mail size={16} className="text-blue" /> Email pitch
          </span>
          {lead.emailPitch && <CopyButton value={lead.emailPitch} />}
        </div>
        <div className="whitespace-pre-wrap break-words bg-[#f6f8fc] rounded-lg p-3 sm:p-4 text-[14px] leading-relaxed">
          {lead.emailPitch || "—"}
        </div>
      </div>
    </div>
  );
}
