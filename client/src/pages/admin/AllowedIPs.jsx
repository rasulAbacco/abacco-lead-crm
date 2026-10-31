import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api, useApi, useMutation } from "../../lib/api";
import { fmtDate } from "../../lib/format";
import { Button, Empty, ErrorNote, Field, Input, Modal, PageHeader, Panel, Spinner, TH, TD, useToast, cx } from "../../components/ui";

function IpModal({ ip, onClose }) {
  const toast = useToast();
  const { run, busy } = useMutation();
  const [f, setF] = useState({ ipAddress: ip?.ipAddress || "", label: ip?.label || "" });
  async function save() {
    try {
      await run(ip?.id ? `/admin/allowed-ips/${ip.id}` : "/admin/allowed-ips", { method: ip?.id ? "PUT" : "POST", body: f, invalidates: ["/admin/allowed-ips"] });
      toast(ip?.id ? "IP saved" : "IP added");
      onClose();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  return (
    <Modal open onClose={onClose} title={ip?.id ? "Edit allowed IP" : "Add allowed IP"} footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" loading={busy} onClick={save}>{ip?.id ? "Save" : "Add IP"}</Button></>}>
      <div className="space-y-4">
        <Field label="IP address"><Input value={f.ipAddress} onChange={(e) => setF({ ...f, ipAddress: e.target.value })} placeholder="103.21.58.10" /></Field>
        <Field label="Label" hint="For example: Office Bengaluru"><Input value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}

export default function AllowedIPs() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi("/admin/allowed-ips");
  const { run } = useMutation();
  const [editing, setEditing] = useState(null);

  async function addMine() {
    try {
      const { ip } = await api("/admin/my-ip");
      setEditing({ ipAddress: ip, label: "Current network" });
    } catch (e) {
      toast(e.message, "error");
    }
  }
  async function toggle(ip) {
    try {
      await run(`/admin/allowed-ips/${ip.id}/status`, { method: "PATCH", body: { status: !ip.status }, invalidates: ["/admin/allowed-ips"] });
    } catch (e) {
      toast(e.message, "error");
    }
  }
  async function remove(ip) {
    if (!window.confirm(`Remove ${ip.ipAddress}? People on that network will not be able to log in.`)) return;
    try {
      await run(`/admin/allowed-ips/${ip.id}`, { method: "DELETE", invalidates: ["/admin/allowed-ips"] });
      toast("IP removed");
    } catch (e) {
      toast(e.message, "error");
    }
  }

  return (
    <>
      <PageHeader
        title="Allowed IPs"
        subtitle="People can only log in from these networks."
        actions={<><Button onClick={addMine}>Add my current IP</Button><Button variant="primary" icon={Plus} onClick={() => setEditing({})}>Add IP</Button></>}
      />
      <ErrorNote error={error} onRetry={reload} />
      <Panel bodyClass="p-0">
        {loading ? <Spinner /> : !data?.length ? <Empty title="No IPs yet" /> : (
          <table className="w-full text-sm">
            <thead><tr><TH>IP address</TH><TH>Label</TH><TH>Added</TH><TH>Login</TH><TH /></tr></thead>
            <tbody>
              {data.map((ip) => (
                <tr key={ip.id} className={cx(!ip.status && "text-muted")}>
                  <TD className="num font-medium">{ip.ipAddress}</TD>
                  <TD>{ip.label || "—"}</TD>
                  <TD>{fmtDate(ip.createdAt)}</TD>
                  <TD>
                    <button onClick={() => toggle(ip)} className={cx("text-[13px] font-medium hover:underline", ip.status ? "text-active" : "text-leave")}>
                      {ip.status ? "Allowed" : "Blocked"}
                    </button>
                  </TD>
                  <TD className="text-right whitespace-nowrap">
                    <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEditing(ip)}>Edit</Button>
                    <Button size="sm" variant="ghost" icon={Trash2} onClick={() => remove(ip)} aria-label={`Remove ${ip.ipAddress}`} />
                  </TD>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
      {editing && <IpModal ip={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
