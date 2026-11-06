import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Pencil,
  Users,
  Megaphone,
  Code2,
  UserX,
  CalendarDays,
  Target as TargetIcon,
} from "lucide-react";
import { useApi, useMutation } from "../../lib/api";
import { fmtDate } from "../../lib/format";
import {
  Avatar,
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
  SearchInput,
  Segmented,
  Select,
  Spinner,
  StatRow,
  TH,
  TD,
  Toolbar,
  useToast,
  cx,
} from "../../components/ui";

const EMPTY = {
  employeeId: "",
  fullName: "",
  email: "",
  password: "",
  role: "EMPLOYEE",
  target: "",
  joiningDate: "",
  saturdayRule: "ALTERNATE",
};
const SAT = {
  WORKING: "Every Saturday",
  ALTERNATE: "Alternate (2nd & 4th off)",
  OFF: "Saturday off",
};
const ROLE_LABEL = {
  EMPLOYEE: "Marketing employee",
  DEVELOPER: "Developer (attendance only)",
  ADMIN: "Admin",
};
const isPlaceholder = (email) => (email || "").endsWith("@developer.local");

function RoleBadge({ role }) {
  if (role === "ADMIN")
    return (
      <Pill tone="teal" dot={false}>
        Admin
      </Pill>
    );
  if (role === "DEVELOPER")
    return (
      <Pill tone="pearl" dot={false}>
        Developer
      </Pill>
    );
  return (
    <Pill tone="white" dot={false} className="!text-teal-deep">
      Marketing
    </Pill>
  );
}
const accessText = (e) =>
  e.role === "DEVELOPER"
    ? e.isActive
      ? "Attendance only"
      : "Inactive"
    : e.isActive
      ? "Can log in"
      : "Blocked";
const accessTone = (e) =>
  !e.isActive ? "teal" : e.role === "DEVELOPER" ? "pearl" : "lime";
const Section = ({ children }) => (
  <div className="sm:col-span-2 pt-1 text-[12px] font-bold uppercase tracking-[0.06em] text-teal-deep border-b border-line pb-1.5">
    {children}
  </div>
);

function EmployeeModal({ employee, onClose }) {
  const toast = useToast();
  const { run, busy } = useMutation();
  const isNew = !employee?.id;
  const [f, setF] = useState(() =>
    isNew
      ? EMPTY
      : {
          ...employee,
          email: isPlaceholder(employee.email) ? "" : employee.email,
          password: "",
          target: employee.target ?? "",
          joiningDate: employee.joiningDate?.slice(0, 10) || "",
        },
  );
  const dev = f.role === "DEVELOPER";
  const wasDev = !isNew && employee.role === "DEVELOPER";
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
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            loading={busy}
            type="submit"
            form="emp-form"
          >
            {isNew ? "Add employee" : "Save changes"}
          </Button>
        </>
      }
    >
      <form id="emp-form" onSubmit={save} className="grid sm:grid-cols-2 gap-4">
        <Section>Person</Section>
        <Field label="Employee ID">
          <Input
            required
            disabled={!isNew}
            value={f.employeeId}
            onChange={set("employeeId")}
            placeholder="AT045"
          />
        </Field>
        <Field label="Full name">
          <Input required value={f.fullName} onChange={set("fullName")} />
        </Field>
        <Field label="Role" className="sm:col-span-2">
          <Select value={f.role} onChange={set("role")}>
            {Object.entries(ROLE_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        {dev ? (
          <div className="sm:col-span-2 rounded-xl border border-line border-l-4 border-l-lime bg-pearl px-4 py-3 text-[13px] text-ink-soft">
            Developers only appear in <b>Attendance</b>. They cannot log in to
            the CRM and are not counted in leads, targets or leaderboards. After
            saving, link their biometric card under Attendance → Machines &amp;
            cards.
          </div>
        ) : (
          <>
            <Section>Login</Section>
            <Field label="Email" className="sm:col-span-2">
              <Input
                type="email"
                required
                value={f.email}
                onChange={set("email")}
              />
            </Field>
            <Field
              label={isNew || wasDev ? "Password" : "New password"}
              hint={
                isNew || wasDev
                  ? "At least 6 characters"
                  : "Leave empty to keep the current password"
              }
            >
              <Input
                type="text"
                autoComplete="new-password"
                required={isNew || wasDev}
                minLength={6}
                value={f.password}
                onChange={set("password")}
              />
            </Field>
            <Field label="Monthly target">
              <Input
                type="number"
                min="0"
                value={f.target}
                onChange={set("target")}
              />
            </Field>
          </>
        )}
        <Section>Work</Section>
        <Field label="Joining date">
          <Input
            type="date"
            value={f.joiningDate}
            onChange={set("joiningDate")}
          />
        </Field>
        <Field
          label="Saturdays"
          hint="Used by the attendance report"
          className="sm:col-span-2"
        >
          <Select
            value={f.saturdayRule || "ALTERNATE"}
            onChange={set("saturdayRule")}
          >
            {Object.entries(SAT).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
      </form>
      {!dev && (
        <p className="text-xs text-muted mt-4">
          Passwords are stored encrypted and cannot be viewed. Changing a
          password or role signs that person out.
        </p>
      )}
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
  const [roleFilter, setRoleFilter] = useState("");

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
        (!roleFilter || e.role === roleFilter) &&
        (!s ||
          [e.fullName, e.email, e.employeeId].some((v) =>
            v.toLowerCase().includes(s),
          )),
    );
  }, [data, q, show, roleFilter]);

  async function toggle(e) {
    const msg =
      e.role === "DEVELOPER"
        ? `Deactivate ${e.fullName}? They will no longer appear in attendance.`
        : `Deactivate ${e.fullName}? They will be signed out and cannot log in.`;
    if (e.isActive && !window.confirm(msg)) return;
    try {
      await run(`/employees/${e.id}/toggle-active`, {
        method: "PATCH",
        invalidates: ["/employees", "/leads/review", "/incentives"],
      });
      toast(
        e.isActive ? `${e.fullName} deactivated` : `${e.fullName} activated`,
      );
    } catch (err) {
      toast(err.message, "error");
    }
  }

  const all = data || [];
  const active = all.filter((e) => e.isActive);

  return (
    <>
      <PageHeader
        title="Employees"
        icon={Users}
        subtitle="Add people, change details and control who can log in."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setEditing({})}>
            Add employee
          </Button>
        }
      />
      <ErrorNote error={error} onRetry={reload} />
      {!loading && (
        <StatRow>
          <MiniStat
            label="Active people"
            value={active.length}
            icon={Users}
            tone="teal"
          />
          <MiniStat
            label="Marketing"
            value={active.filter((e) => e.role === "EMPLOYEE").length}
            icon={Megaphone}
            tone="lime"
          />
          <MiniStat
            label="Developers"
            value={active.filter((e) => e.role === "DEVELOPER").length}
            icon={Code2}
          />
          <MiniStat
            label="Inactive"
            value={all.length - active.length}
            icon={UserX}
          />
        </StatRow>
      )}
      <Toolbar>
        <SearchInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email or ID"
        />
        <Segmented
          value={roleFilter}
          onChange={setRoleFilter}
          options={[
            ["", "All roles"],
            ["EMPLOYEE", "Marketing"],
            ["DEVELOPER", "Developers"],
            ["ADMIN", "Admins"],
          ]}
        />
        <Segmented
          value={show}
          onChange={setShow}
          options={[
            ["active", "Active"],
            ["inactive", "Inactive"],
            ["all", "Everyone"],
          ]}
        />
      </Toolbar>

      {loading ? (
        <Spinner />
      ) : !rows.length ? (
        <div className="card">
          <Empty title="No employees found">
            Try another search or filter.
          </Empty>
        </div>
      ) : (
        <section className="card overflow-hidden">
          <table className="hidden lg:table w-full text-sm table-fixed">
            <thead>
              <tr>
                <TH className="w-[28%]">Person</TH>
                <TH className="w-[90px]">ID</TH>
                <TH className="w-[120px]">Role</TH>
                <TH className="w-[80px] text-right">Target</TH>
                <TH>Saturdays</TH>
                <TH className="w-[120px]">Joined</TH>
                <TH className="w-[150px]">Access</TH>
                <TH className="w-[64px]" />
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr
                  key={e.id}
                  className={cx(
                    "hover:bg-pearl/60",
                    !e.isActive && "opacity-70",
                  )}
                >
                  <TD>
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={e.fullName} size={36} />
                      <div className="min-w-0">
                        <div className="font-semibold truncate">
                          {e.fullName}
                        </div>
                        <div className="text-xs text-muted truncate">
                          {isPlaceholder(e.email) ? "No login" : e.email}
                        </div>
                      </div>
                    </div>
                  </TD>
                  <TD className="num text-ink-soft">{e.employeeId}</TD>
                  <TD>
                    <RoleBadge role={e.role} />
                  </TD>
                  <TD className="num text-right font-semibold">
                    {e.role === "DEVELOPER" || !e.target ? (
                      <span className="text-muted font-normal">—</span>
                    ) : (
                      e.target
                    )}
                  </TD>
                  <TD className="text-ink-soft truncate">
                    {SAT[e.saturdayRule] || "—"}
                  </TD>
                  <TD className="whitespace-nowrap text-ink-soft">
                    {fmtDate(e.joiningDate)}
                  </TD>
                  <TD>
                    <button
                      onClick={() => toggle(e)}
                      title={
                        e.isActive ? "Click to deactivate" : "Click to activate"
                      }
                      className="rounded-full hover:ring-2 hover:ring-lime"
                    >
                      <Pill tone={accessTone(e)}>{accessText(e)}</Pill>
                    </button>
                  </TD>
                  <TD className="text-right">
                    <IconButton
                      icon={Pencil}
                      label={`Edit ${e.fullName}`}
                      onClick={() => setEditing(e)}
                    />
                  </TD>
                </tr>
              ))}
            </tbody>
          </table>

          {/* phones / tablets */}
          <ul className="lg:hidden divide-y divide-line">
            {rows.map((e) => (
              <li key={e.id} className={cx("p-4", !e.isActive && "opacity-70")}>
                <div className="flex items-start gap-3">
                  <Avatar name={e.fullName} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{e.fullName}</span>
                      <span className="num text-xs text-muted">
                        {e.employeeId}
                      </span>
                    </div>
                    <div className="text-xs text-muted truncate">
                      {isPlaceholder(e.email) ? "No login" : e.email}
                    </div>
                  </div>
                  <IconButton
                    icon={Pencil}
                    label={`Edit ${e.fullName}`}
                    onClick={() => setEditing(e)}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[12.5px] text-ink-soft">
                  <RoleBadge role={e.role} />
                  <button onClick={() => toggle(e)} className="rounded-full">
                    <Pill tone={accessTone(e)}>{accessText(e)}</Pill>
                  </button>
                  {e.role !== "DEVELOPER" && e.target ? (
                    <span className="inline-flex items-center gap-1">
                      <TargetIcon size={13} className="text-teal-deep" />{" "}
                      {e.target}/month
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays size={13} className="text-teal-deep" />{" "}
                    {SAT[e.saturdayRule] || "—"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      {editing && (
        <EmployeeModal employee={editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
