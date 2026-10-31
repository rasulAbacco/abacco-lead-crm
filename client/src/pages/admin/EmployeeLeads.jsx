import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useApi } from "../../lib/api";
import { recentMonths, num, STATUS_LABEL } from "../../lib/format";
import { Empty, ErrorNote, PageHeader, Panel, RefreshButton, Select, Spinner, Stat } from "../../components/ui";
import LeadTable from "../../components/LeadTable";
import LeadEditModal from "../../components/LeadEditModal";

export default function EmployeeLeads() {
  const { employeeId } = useParams();
  const months = recentMonths(4);
  const [month, setMonth] = useState(months[0].key);
  const [editing, setEditing] = useState(null);
  const { data, loading, error, reload, refreshing } = useApi(`/leads/employee/${employeeId}?month=${month}`);
  const leads = data?.leads || [];
  const count = (s) => leads.filter((l) => l.status === s).length;

  return (
    <>
      <Link to="/admin-dashboard" className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-ink mb-3"><ArrowLeft size={14} /> Dashboard</Link>
      <PageHeader
        title={data?.employee?.fullName || employeeId}
        subtitle={`${employeeId}${data?.employee?.target ? `, monthly target ${data.employee.target}` : ""}`}
        actions={<>
          <Select value={month} onChange={(e) => setMonth(e.target.value)} className="w-44" aria-label="Month">
            {months.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </Select>
          <RefreshButton onClick={reload} spinning={refreshing} />
        </>}
      />
      <ErrorNote error={error} onRetry={reload} />
      {loading ? <Spinner /> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Stat label="Leads" value={num(leads.length)} />
            {["ACTIVE", "NO_RESPONSE", "LEAVE_OUT", "PENDING"].map((s) => (
              <Stat key={s} label={STATUS_LABEL[s]} value={num(count(s))} tone={{ ACTIVE: "text-active", NO_RESPONSE: "text-noresp", LEAVE_OUT: "text-leave", PENDING: "text-pending" }[s]} />
            ))}
          </div>
          <Panel bodyClass="p-0">
            {!leads.length ? <Empty title="No leads in this month" /> : <LeadTable leads={leads} admin onEdit={setEditing} />}
          </Panel>
        </>
      )}
      {editing && <LeadEditModal lead={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
