import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { download, useApi } from "../../lib/api";
import { recentMonths, LEAD_TYPES, STATUS_LABEL, num, TZ } from "../../lib/format";
import { formatInTimeZone } from "date-fns-tz";
import { Button, ErrorNote, Input, PageHeader, Pagination, Panel, RefreshButton, Select, Spinner, Empty, Tabs, useToast } from "../../components/ui";
import LeadTable from "../../components/LeadTable";
import LeadEditModal from "../../components/LeadEditModal";

const PAGE = 50;

export default function MyLeads() {
  const toast = useToast();
  const months = recentMonths(4);
  const { data, loading, error, reload, refreshing } = useApi("/leads/mine");
  const [month, setMonth] = useState(months[0].key);
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const inMonth = useMemo(
    () => (data || []).filter((l) => month === "all" || formatInTimeZone(new Date(l.date), TZ, "yyyy-MM") === month),
    [data, month],
  );
  const counts = useMemo(() => {
    const c = { all: inMonth.length, PENDING: 0, ACTIVE: 0, NO_RESPONSE: 0, LEAVE_OUT: 0 };
    inMonth.forEach((l) => c[l.status]++);
    return c;
  }, [inMonth]);
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return inMonth.filter(
      (l) =>
        (type === "all" || l.leadType === type) &&
        (status === "all" || l.status === status) &&
        (!s || [l.clientEmail, l.leadEmail, l.subjectLine, l.agentName, l.country, l.phone].some((v) => (v || "").toLowerCase().includes(s))),
    );
  }, [inMonth, type, status, search]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const pageRows = filtered.slice((page - 1) * PAGE, page * PAGE);
  const reset = (fn) => (e) => { fn(e.target.value); setPage(1); };

  async function exportExcel() {
    setBusy(true);
    try {
      await download(`/leads/export?month=${month}`, `my-leads-${month}.xlsx`);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="My leads"
        subtitle="Leads from the last 4 months. Older months are removed automatically."
        actions={<>
          <RefreshButton onClick={reload} spinning={refreshing} />
          <Button icon={Download} loading={busy} onClick={exportExcel}>Download Excel</Button>
        </>}
      />
      <ErrorNote error={error} onRetry={reload} />
      <Tabs
        value={status}
        onChange={(v) => { setStatus(v); setPage(1); }}
        tabs={[
          { value: "all", label: "All", count: counts.all },
          ...["PENDING", "ACTIVE", "NO_RESPONSE", "LEAVE_OUT"].map((s) => ({ value: s, label: STATUS_LABEL[s], count: counts[s] })),
        ]}
      />
      <Panel bodyClass="p-0">
        <div className="flex flex-wrap gap-3 p-4 border-b border-line">
          <Select value={month} onChange={reset(setMonth)} className="w-44" aria-label="Month">
            {months.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
            <option value="all">All 4 months</option>
          </Select>
          <Select value={type} onChange={reset(setType)} className="w-48" aria-label="Lead type">
            <option value="all">All lead types</option>
            {LEAD_TYPES.map((t) => <option key={t}>{t}</option>)}
          </Select>
          <div className="relative flex-1 min-w-[220px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input value={search} onChange={reset(setSearch)} placeholder="Search email, subject, country, phone" className="pl-9" />
          </div>
        </div>
        {loading ? <Spinner /> : !filtered.length ? (
          <Empty title={inMonth.length ? "No leads match these filters" : "No leads in this month"}>
            {inMonth.length ? "Clear the search or pick another status." : "Leads you upload will appear here."}
          </Empty>
        ) : (
          <>
            <LeadTable leads={pageRows} onEdit={setEditing} />
            <Pagination page={page} totalPages={totalPages} total={filtered.length} onPage={setPage} />
          </>
        )}
      </Panel>
      <p className="text-muted text-xs mt-3 num">{num(data?.length || 0)} leads stored in total.</p>
      {editing && <LeadEditModal lead={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
