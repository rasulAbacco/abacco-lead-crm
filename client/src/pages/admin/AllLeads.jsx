import { useEffect, useState } from "react";
import { Download, Search } from "lucide-react";
import { download, useApi } from "../../lib/api";
import { recentMonths, LEAD_TYPES, STATUS_LABEL, num } from "../../lib/format";
import {
  Button,
  Empty,
  ErrorNote,
  Input,
  PageHeader,
  Pagination,
  Panel,
  RefreshButton,
  Select,
  Spinner,
  Tabs,
  useToast,
} from "../../components/ui";
import LeadTable from "../../components/LeadTable";
import LeadEditModal from "../../components/LeadEditModal";

export default function AllLeads() {
  const toast = useToast();
  const months = recentMonths(4);
  const [f, setF] = useState({
    month: "all",
    employeeId: "all",
    status: "all",
    leadType: "all",
    search: "",
    sort: "newest",
    page: 1,
  });
  const [searchInput, setSearchInput] = useState("");
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const employees = useApi("/employees/stats");

  useEffect(() => {
    const t = setTimeout(
      () =>
        setF((x) =>
          x.search === searchInput ? x : { ...x, search: searchInput, page: 1 },
        ),
      350,
    );
    return () => clearTimeout(t);
  }, [searchInput]);

  const qs = new URLSearchParams({ ...f, limit: 50 }).toString();
  const { data, loading, error, reload, refreshing } = useApi(`/leads?${qs}`, {
    keepPrevious: true,
  });
  const set = (k) => (e) =>
    setF((x) => ({ ...x, [k]: e.target.value, page: 1 }));
  const sc = data?.statusCounts || {};
  const allCount = Object.values(sc).reduce((a, b) => a + b, 0);

  async function exportExcel() {
    setBusy(true);
    try {
      const { page: _p, ...rest } = f;
      await download(
        `/leads/export?${new URLSearchParams(rest)}`,
        "leads.xlsx",
      );
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="All leads"
        emoji="📂"
        subtitle="Every lead from the last 4 months. Filter, set a status or download as Excel."
        actions={
          <>
            <RefreshButton onClick={reload} spinning={refreshing} />
            <Button
              variant="blue"
              icon={Download}
              loading={busy}
              onClick={exportExcel}
            >
              Download Excel
            </Button>
          </>
        }
      />
      <Tabs
        value={f.status}
        onChange={(v) => setF((x) => ({ ...x, status: v, page: 1 }))}
        tabs={[
          { value: "all", label: "All" },
          ...["PENDING", "ACTIVE", "NO_RESPONSE", "LEAVE_OUT"].map((s) => ({
            value: s,
            label: STATUS_LABEL[s],
            count: f.status === "all" ? sc[s] || 0 : undefined,
          })),
        ]}
      />
      <ErrorNote error={error} onRetry={reload} />
      <Panel bodyClass="p-0" className="overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4 2xl:grid-cols-[repeat(4,minmax(0,1fr))_minmax(0,1.6fr)] gap-3 p-4 border-b border-line">
          <Select value={f.month} onChange={set("month")} aria-label="Month">
            {months.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
            <option value="all">All months</option>
          </Select>
          <Select
            value={f.employeeId}
            onChange={set("employeeId")}
            aria-label="Employee"
          >
            <option value="all">All employees</option>
            {(employees.data || []).map((e) => (
              <option key={e.employeeId} value={e.employeeId}>
                {e.name}
              </option>
            ))}
          </Select>
          <Select
            value={f.leadType}
            onChange={set("leadType")}
            aria-label="Lead type"
          >
            <option value="all">All lead types</option>
            {LEAD_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
          <Select value={f.sort} onChange={set("sort")} aria-label="Sort">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </Select>
          <div className="relative col-span-2 lg:col-span-4 2xl:col-span-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search email, subject, agent, country, ID"
              className="pl-9"
            />
          </div>
        </div>
        {loading ? (
          <Spinner />
        ) : !data?.leads?.length ? (
          <Empty title="No leads match these filters">
            Try another month or clear the search.
          </Empty>
        ) : (
          <>
            <LeadTable
              leads={data.leads}
              admin
              showEmployee
              onEdit={setEditing}
            />
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              onPage={(p) => setF((x) => ({ ...x, page: p }))}
            />
          </>
        )}
      </Panel>
      {f.status === "all" && data && (
        <p className="text-muted text-xs mt-3 num">
          {num(allCount)} leads match the month, employee, type and search
          filters.
        </p>
      )}
      {editing && (
        <LeadEditModal lead={editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
