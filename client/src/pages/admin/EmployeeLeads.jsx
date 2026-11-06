import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  Clock3,
  XCircle,
  Hourglass,
} from "lucide-react";
import { useApi } from "../../lib/api";
import { recentMonths, num, STATUS_LABEL } from "../../lib/format";
import {
  Avatar,
  Empty,
  ErrorNote,
  MiniStat,
  RefreshButton,
  Select,
  Spinner,
  StatRow,
} from "../../components/ui";
import LeadTable from "../../components/LeadTable";
import LeadEditModal from "../../components/LeadEditModal";

const STATUS_ICON = {
  ACTIVE: CheckCircle2,
  NO_RESPONSE: Clock3,
  LEAVE_OUT: XCircle,
  PENDING: Hourglass,
};

export default function EmployeeLeads() {
  const { employeeId } = useParams();
  const months = recentMonths(4);
  const [month, setMonth] = useState(months[0].key);
  const [editing, setEditing] = useState(null);
  const { data, loading, error, reload, refreshing } = useApi(
    `/leads/employee/${employeeId}?month=${month}`,
  );
  const leads = data?.leads || [];
  const count = (s) => leads.filter((l) => l.status === s).length;
  const name = data?.employee?.fullName || employeeId;
  const target = data?.employee?.target || 0;
  const pct = target
    ? Math.round((Math.min(leads.length, target) / target) * 100)
    : 0;

  return (
    <>
      <Link
        to="/admin-dashboard"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-teal-deep rounded-lg px-2 py-1 -ml-2 hover:bg-lime/40 mb-3"
      >
        <ArrowLeft size={15} /> Dashboard
      </Link>

      {/* profile card */}
      <section className="rounded-[24px] bg-teal-deep text-white p-5 sm:p-6 mb-6 shadow-[0_24px_50px_-26px_rgba(11,48,72,0.8)]">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={name} size={64} />
          <div className="min-w-0 flex-1">
            <h1 className="font-[family-name:var(--font-display)] text-[24px] sm:text-[28px] font-extrabold leading-tight truncate">
              {name}
            </h1>
            <p className="text-pearl/70 text-[14px]">
              {employeeId}
              {target ? `, monthly target ${num(target)}` : ", no target set"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-44"
              aria-label="Month"
            >
              {months.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </Select>
            <RefreshButton onClick={reload} spinning={refreshing} />
          </div>
        </div>
        {target > 0 && !loading && (
          <div className="mt-5">
            <div className="flex items-center justify-between text-[13px] mb-1.5">
              <span className="text-pearl/80">Target progress</span>
              <span className="num font-bold text-lime">
                {num(leads.length)} / {num(target)} ({pct}%)
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-white/12 overflow-hidden">
              <div
                className="h-full rounded-full bg-lime transition-[width] duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </section>

      <ErrorNote error={error} onRetry={reload} />
      {loading ? (
        <Spinner />
      ) : (
        <>
          <StatRow cols={5}>
            <MiniStat
              label="Leads"
              value={num(leads.length)}
              icon={FileText}
              tone="teal"
            />
            {["ACTIVE", "NO_RESPONSE", "LEAVE_OUT", "PENDING"].map((s) => (
              <MiniStat
                key={s}
                label={STATUS_LABEL[s]}
                value={num(count(s))}
                icon={STATUS_ICON[s]}
                tone={s === "ACTIVE" ? "lime" : "plain"}
              />
            ))}
          </StatRow>
          <section className="card overflow-hidden">
            {!leads.length ? (
              <Empty title="No leads in this month">
                Pick another month above.
              </Empty>
            ) : (
              <LeadTable leads={leads} admin onEdit={setEditing} />
            )}
          </section>
        </>
      )}
      {editing && (
        <LeadEditModal lead={editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
