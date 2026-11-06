import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
  Wifi,
  ShieldOff,
  Network,
  Locate,
} from "lucide-react";
import { api, useApi, useMutation } from "../../lib/api";
import { fmtDate } from "../../lib/format";
import {
  Button,
  Empty,
  ErrorNote,
  Field,
  IconButton,
  Input,
  MiniStat,
  Modal,
  PageHeader,
  Pill,
  Spinner,
  StatRow,
  useToast,
  cx,
} from "../../components/ui";

function IpModal({ ip, onClose }) {
  const toast = useToast();
  const { run, busy } = useMutation();
  const [f, setF] = useState({
    ipAddress: ip?.ipAddress || "",
    label: ip?.label || "",
  });
  async function save() {
    try {
      await run(ip?.id ? `/admin/allowed-ips/${ip.id}` : "/admin/allowed-ips", {
        method: ip?.id ? "PUT" : "POST",
        body: f,
        invalidates: ["/admin/allowed-ips"],
      });
      toast(ip?.id ? "IP saved" : "IP added");
      onClose();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  return (
    <Modal
      open
      onClose={onClose}
      title={ip?.id ? "Edit allowed IP" : "Add allowed IP"}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={busy} onClick={save}>
            {ip?.id ? "Save" : "Add IP"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="IP address">
          <Input
            value={f.ipAddress}
            onChange={(e) => setF({ ...f, ipAddress: e.target.value })}
            placeholder="103.21.58.10"
          />
        </Field>
        <Field label="Label" hint="For example: Office Bengaluru">
          <Input
            value={f.label}
            onChange={(e) => setF({ ...f, label: e.target.value })}
          />
        </Field>
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
      await run(`/admin/allowed-ips/${ip.id}/status`, {
        method: "PATCH",
        body: { status: !ip.status },
        invalidates: ["/admin/allowed-ips"],
      });
    } catch (e) {
      toast(e.message, "error");
    }
  }
  async function remove(ip) {
    if (
      !window.confirm(
        `Remove ${ip.ipAddress}? People on that network will not be able to log in.`,
      )
    )
      return;
    try {
      await run(`/admin/allowed-ips/${ip.id}`, {
        method: "DELETE",
        invalidates: ["/admin/allowed-ips"],
      });
      toast("IP removed");
    } catch (e) {
      toast(e.message, "error");
    }
  }

  const list = data || [];
  const allowed = list.filter((i) => i.status).length;

  return (
    <>
      <PageHeader
        title="Allowed IPs"
        icon={ShieldCheck}
        subtitle="People can only log in from these networks."
        actions={
          <>
            <Button icon={Locate} onClick={addMine}>
              Add my current IP
            </Button>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setEditing({})}
            >
              Add IP
            </Button>
          </>
        }
      />
      <ErrorNote error={error} onRetry={reload} />
      {loading ? (
        <Spinner />
      ) : (
        <>
          <StatRow cols={3}>
            <MiniStat
              label="Networks"
              value={list.length}
              icon={Network}
              tone="teal"
            />
            <MiniStat label="Allowed" value={allowed} icon={Wifi} tone="lime" />
            <MiniStat
              label="Blocked"
              value={list.length - allowed}
              icon={ShieldOff}
            />
          </StatRow>
          {!list.length ? (
            <div className="card">
              <Empty title="No IPs yet">
                Add your office network so people can log in.
              </Empty>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {list.map((ip) => (
                <article
                  key={ip.id}
                  className={cx(
                    "card p-5 flex flex-col gap-4",
                    !ip.status && "opacity-75",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={cx(
                          "size-11 rounded-2xl flex items-center justify-center shrink-0",
                          ip.status
                            ? "bg-lime text-teal-deep"
                            : "bg-teal-deep text-lime",
                        )}
                      >
                        <Network size={20} />
                      </span>
                      <div className="min-w-0">
                        <div className="num font-[family-name:var(--font-display)] text-[18px] font-extrabold text-ink [overflow-wrap:anywhere]">
                          {ip.ipAddress}
                        </div>
                        <div className="text-[13px] text-muted truncate">
                          {ip.label || "No label"}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <IconButton
                        icon={Pencil}
                        label={`Edit ${ip.ipAddress}`}
                        onClick={() => setEditing(ip)}
                      />
                      <IconButton
                        icon={Trash2}
                        label={`Remove ${ip.ipAddress}`}
                        tone="danger"
                        onClick={() => remove(ip)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-line">
                    <span className="text-[12.5px] text-muted">
                      Added {fmtDate(ip.createdAt)}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={ip.status}
                      onClick={() => toggle(ip)}
                      className="inline-flex items-center gap-2.5 text-[13px] font-semibold text-teal-deep"
                      title={
                        ip.status
                          ? "Click to block this network"
                          : "Click to allow this network"
                      }
                    >
                      <Pill tone={ip.status ? "lime" : "teal"}>
                        {ip.status ? "Allowed" : "Blocked"}
                      </Pill>
                      <span
                        className={cx(
                          "relative h-6 w-11 rounded-full transition",
                          ip.status ? "bg-lime" : "bg-teal-deep/25",
                        )}
                      >
                        <span
                          className={cx(
                            "absolute top-0.5 size-5 rounded-full bg-white shadow transition-all",
                            ip.status ? "left-[22px]" : "left-0.5",
                          )}
                        />
                      </span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
      {editing && <IpModal ip={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
