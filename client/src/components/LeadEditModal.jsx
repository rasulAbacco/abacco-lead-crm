// Edit a lead's details (status is changed only by the admin, on the review screens).
import { useEffect, useState } from "react";
import { api, invalidate, LEAD_KEYS } from "../lib/api";
import { LEAD_TYPES } from "../lib/format";
import { formatInTimeZone } from "date-fns-tz";
import { Button, Field, Input, Modal, Select, Textarea, useToast } from "./ui";

const toInputDate = (d) => (d ? formatInTimeZone(new Date(d), "America/Chicago", "yyyy-MM-dd") : "");

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
      emailResponce: lead.emailResponce || "",
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

  const types = LEAD_TYPES.includes(f.leadType) ? LEAD_TYPES : [f.leadType, ...LEAD_TYPES];
  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit lead #${lead.id}`}
      width="max-w-3xl"
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" loading={busy} onClick={save}>Save changes</Button></>}
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Client name"><Input value={f.agentName} onChange={set("agentName")} /></Field>
        <Field label="Lead type">
          <Select value={f.leadType} onChange={set("leadType")}>{types.map((t) => <option key={t}>{t}</option>)}</Select>
        </Field>
        <Field label="Client email"><Input type="email" value={f.clientEmail} onChange={set("clientEmail")} /></Field>
        <Field label="Lead email"><Input type="email" value={f.leadEmail} onChange={set("leadEmail")} /></Field>
        <Field label="CC emails" hint="Separate with commas"><Input value={f.ccEmail} onChange={set("ccEmail")} /></Field>
        <Field label="Phone numbers" hint="Separate with commas"><Input value={f.phone} onChange={set("phone")} /></Field>
        <Field label="Country"><Input value={f.country} onChange={set("country")} /></Field>
        <Field label="Contact date"><Input type="date" value={f.date} max={toInputDate(new Date())} onChange={set("date")} /></Field>
        <Field label="Website"><Input value={f.website} onChange={set("website")} /></Field>
        <Field label="Association / expo link"><Input value={f.link} onChange={set("link")} /></Field>
        {/attend/i.test(f.leadType) && <Field label="Attendees count"><Input type="number" min="0" value={f.attendeesCount} onChange={set("attendeesCount")} /></Field>}
        <Field label="Subject line" className="sm:col-span-2"><Input value={f.subjectLine} onChange={set("subjectLine")} /></Field>
        <Field label="Email pitch" className="sm:col-span-2"><Textarea rows={5} value={f.emailPitch} onChange={set("emailPitch")} /></Field>
        <Field label="Email response" className="sm:col-span-2"><Textarea rows={4} value={f.emailResponce} onChange={set("emailResponce")} /></Field>
      </div>
    </Modal>
  );
}
