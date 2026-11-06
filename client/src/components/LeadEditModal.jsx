// Edit a lead's details (status is changed only by the admin, on the review screens).
import { useEffect, useState } from "react";
import { api, invalidate, LEAD_KEYS } from "../lib/api";
import { LEAD_TYPES } from "../lib/format";
import { formatInTimeZone } from "date-fns-tz";
import {
  User,
  Mail,
  Phone,
  Globe,
  Link2,
  CalendarDays,
  Users,
  Type,
  FileText,
  Tag,
} from "lucide-react";
import {
  Button,
  Field,
  IconInput,
  Modal,
  Select,
  Textarea,
  useToast,
} from "./ui";

function Part({ n, title, children }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-4 sm:p-5">
      <h3 className="flex items-center gap-2.5 mb-4 font-bold text-[14.5px]">
        <span className="num size-6 rounded-full bg-lime text-ink text-[12px] font-extrabold flex items-center justify-center">
          {n}
        </span>
        {title}
      </h3>
      <div className="grid sm:grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

const toInputDate = (d) =>
  d ? formatInTimeZone(new Date(d), "America/Chicago", "yyyy-MM-dd") : "";

export default function LeadEditModal({ lead, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!lead) return;
    setF({
      agentName: lead.agentName || "",
      clientEmail: lead.clientEmail || "",
      leadEmail: lead.leadEmail || "",
      ccEmail: lead.ccEmail || "",
      phone: lead.phone || "",
      country: lead.country || "",
      website: lead.website || "",
      link: lead.link || "",
      leadType: lead.leadType || "",
      attendeesCount: lead.attendeesCount ?? "",
      subjectLine: lead.subjectLine || "",
      emailPitch: lead.emailPitch || "",
      date: toInputDate(lead.date),
    });
  }, [lead]);

  if (!lead || !f) return null;
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function save() {
    setBusy(true);
    try {
      const res = await api(`/leads/${lead.id}`, { method: "PUT", body: f });
      invalidate(...LEAD_KEYS);
      toast("Lead saved");
      onSaved?.(res.lead);
      onClose();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setBusy(false);
    }
  }

  const types = LEAD_TYPES.includes(f.leadType)
    ? LEAD_TYPES
    : [f.leadType, ...LEAD_TYPES];
  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit lead #${lead.id}${lead.subjectLine ? `: ${lead.subjectLine}` : ""}`}
      width="max-w-3xl"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={busy} onClick={save}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Part n={1} title="Lead">
          <Field label="Client name">
            <IconInput
              icon={User}
              value={f.agentName}
              onChange={set("agentName")}
            />
          </Field>
          <Field label="Lead type">
            <span className="relative block">
              <Tag
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted z-[1]"
              />
              <Select
                value={f.leadType}
                onChange={set("leadType")}
                className="pl-10"
              >
                {types.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            </span>
          </Field>
          <Field label="Contact date">
            <IconInput
              icon={CalendarDays}
              type="date"
              value={f.date}
              max={toInputDate(new Date())}
              onChange={set("date")}
            />
          </Field>
          {/attend/i.test(f.leadType) && (
            <Field label="Attendees count">
              <IconInput
                icon={Users}
                type="number"
                min="0"
                value={f.attendeesCount}
                onChange={set("attendeesCount")}
              />
            </Field>
          )}
        </Part>
        <Part n={2} title="Contact">
          <Field label="Client email">
            <IconInput
              icon={Mail}
              type="email"
              value={f.clientEmail}
              onChange={set("clientEmail")}
            />
          </Field>
          <Field label="Lead email">
            <IconInput
              icon={Mail}
              type="email"
              value={f.leadEmail}
              onChange={set("leadEmail")}
            />
          </Field>
          <Field label="CC emails" hint="Separate with commas">
            <IconInput
              icon={Mail}
              value={f.ccEmail}
              onChange={set("ccEmail")}
            />
          </Field>
          <Field label="Phone numbers" hint="Separate with commas">
            <IconInput icon={Phone} value={f.phone} onChange={set("phone")} />
          </Field>
        </Part>
        <Part n={3} title="Event">
          <Field label="Website">
            <IconInput
              icon={Globe}
              value={f.website}
              onChange={set("website")}
            />
          </Field>
          <Field label="Association / expo link">
            <IconInput icon={Link2} value={f.link} onChange={set("link")} />
          </Field>
          <Field label="Country">
            <IconInput
              icon={Globe}
              value={f.country}
              onChange={set("country")}
            />
          </Field>
        </Part>
        <Part n={4} title="Email">
          <Field label="Subject line" className="sm:col-span-2">
            <IconInput
              icon={Type}
              value={f.subjectLine}
              onChange={set("subjectLine")}
            />
          </Field>
          <Field label="Email pitch" className="sm:col-span-2">
            <span className="relative block">
              <FileText
                size={17}
                className="pointer-events-none absolute left-3 top-3 text-muted"
              />
              <Textarea
                rows={7}
                value={f.emailPitch}
                onChange={set("emailPitch")}
                className="pl-10"
              />
            </span>
          </Field>
        </Part>
      </div>
    </Modal>
  );
}
