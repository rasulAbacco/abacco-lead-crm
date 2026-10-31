import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Pencil, Search } from "lucide-react";
import { useApi, useMutation } from "../../lib/api";
import { fmtDate } from "../../lib/format";
import { Avatar, Badge, Button, Empty, ErrorNote, Field, Input, Modal, PageHeader, Panel, Select, Spinner, TH, TD, useToast, cx } from "../../components/ui";

const EMPTY = { employeeId: "", fullName: "", email: "", password: "", role: "EMPLOYEE", target: "", joiningDate: "", saturdayRule: "ALTERNATE" };
const SAT = { WORKING: "Every Saturday", ALTERNATE: "Alternate (2nd & 4th off)", OFF: "Saturday off" };

function EmployeeModal({ employee, onClose }) {
  const toast = useToast();
  const { run, busy } = useMutation();
  const isNew = !employee?.id;
  const [f, setF] = useState(() =>
    isNew ? EMPTY : { ...employee, password: "", target: employee.target ?? "", joiningDate: employee.joiningDate?.slice(0, 10) || "" },
  );
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    try {
      await run(isNew ? "/employees" : `/employees/${employee.id}`, {
        method: isNew ? "POST" : "PUT",
        body: f,
        invalidates: ["/employees", "/leads/review"],
      });
      toast(isNew ? "Employee added" : "Employee saved");
      onClose();
    } catch (err) {
      toast(err.message, "error");
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? "Add employee" : `Edit ${employee.fullName}`}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" loading={busy} type="submit" form="emp-form">{isNew ? "Add employee" : "Save changes"}</Button></>}
    >
      <form id="emp-form" onSubmit={save} className="grid sm:grid-cols-2 gap-4">
        <Field label="Employee ID"><Input required disabled={!isNew} value={f.employeeId} onChange={set("employeeId")} placeholder="AT045" /></Field>
        <Field label="Full name"><Input required value={f.fullName} onChange={set("fullName")} /></Field>
        <Field label="Email" className="sm:col-span-2"><Input type="email" required value={f.email} onChange={set("email")} /></Field>
        <Field label={isNew ? "Password" : "New password"} hint={isNew ? "At least 6 characters" : "Leave empty to keep the current password"}>
          <Input type="text" autoComplete="new-password" required={isNew} minLength={6} value={f.password} onChange={set("password")} />
        </Field>
        <Field label="Role">
          <Select value={f.role} onChange={set("role")}>
            <option value="EMPLOYEE">Employee</option>
            <option value="ADMIN">Admin</option>
          </Select>
        </Field>
        <Field label="Monthly target"><Input type="number" min="0" value={f.target} onChange={set("target")} /></Field>
        <Field label="Joining date"><Input type="date" value={f.joiningDate} onChange={set("joiningDate")} /></Field>
        <Field label="Saturdays" hint="Used by the attendance report" className="sm:col-span-2">
          <Select value={f.saturdayRule || "ALTERNATE"} onChange={set("saturdayRule")}>
            {Object.entries(SAT).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </Field>
      </form>
      <p className="text-xs text-muted mt-4">Passwords are stored encrypted and cannot be viewed. Changing a password or role signs that person out.</p>
    </Modal>
  );
}

export default function Employees() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const { data, loading, error, reload } = useApi("/employees");
  const { run } = useMutation();
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState("");
  const [show, setShow] = useState("active");

  useEffect(() => {
    if (params.get("add")) {
      setEditing({});
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (data || []).filter(
      (e) =>
        (show === "all" || (show === "active" ? e.isActive : !e.isActive)) &&
        (!s || [e.fullName, e.email, e.employeeId].some((v) => v.toLowerCase().includes(s))),
    );
  }, [data, q, show]);

  async function toggle(e) {
    if (e.isActive && !window.confirm(`Deactivate ${e.fullName}? They will be signed out and cannot log in.`)) return;
    try {
      await run(`/employees/${e.id}/toggle-active`, { method: "PATCH", invalidates: ["/employees", "/leads/review", "/incentives"] });
      toast(e.isActive ? `${e.fullName} deactivated` : `${e.fullName} activated`);
    } catch (err) {
      toast(err.message, "error");
    }
  }

  return (
    <>
      <PageHeader title="Employees" subtitle="Add people, change details and control who can log in." actions={<Button variant="primary" icon={Plus} onClick={() => setEditing({})}>Add employee</Button>} />
      <ErrorNote error={error} onRetry={reload} />
      <Panel bodyClass="p-0">
        <div className="flex flex-wrap gap-3 p-4 border-b border-line">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or ID" className="pl-9" />
          </div>
          <Select value={show} onChange={(e) => setShow(e.target.value)} className="w-40" aria-label="Show">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="all">Everyone</option>
          </Select>
        </div>
        {loading ? <Spinner /> : !rows.length ? <Empty title="No employees found" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr><TH>Name</TH><TH className="hidden sm:table-cell">ID</TH><TH className="hidden lg:table-cell">Email</TH><TH className="hidden md:table-cell">Role</TH><TH className="text-right hidden md:table-cell">Target</TH><TH className="hidden xl:table-cell">Saturdays</TH><TH className="hidden lg:table-cell">Joined</TH><TH>Access</TH><TH /></tr></thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id} className={cx(!e.isActive && "text-muted")}>
                    <TD><div className="flex items-center gap-2.5 min-w-0"><Avatar name={e.fullName} size={30} /><div className="min-w-0"><div className="font-semibold truncate">{e.fullName}</div><div className="text-xs text-muted truncate lg:hidden">{e.email}</div></div></div></TD>
                    <TD className="hidden sm:table-cell">{e.employeeId}</TD>
                    <TD className="hidden lg:table-cell truncate">{e.email}</TD>
                    <TD className="hidden md:table-cell">{e.role === "ADMIN" ? <Badge>Admin</Badge> : "Employee"}</TD>
                    <TD className="num text-right hidden md:table-cell">{e.target || "—"}</TD>
                    <TD className="hidden xl:table-cell text-ink-soft">{SAT[e.saturdayRule] || "—"}</TD>
                    <TD className="whitespace-nowrap hidden lg:table-cell">{fmtDate(e.joiningDate)}</TD>
                    <TD>
                      <button onClick={() => toggle(e)} className={cx("text-[13px] font-medium hover:underline", e.isActive ? "text-active" : "text-leave")} title={e.isActive ? "Click to deactivate" : "Click to activate"}>
                        {e.isActive ? "Can log in" : "Blocked"}
                      </button>
                    </TD>
                    <TD className="text-right"><Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEditing(e)}>Edit</Button></TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      {editing && <EmployeeModal employee={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
