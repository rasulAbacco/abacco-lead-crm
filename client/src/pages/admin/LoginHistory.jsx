import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useApi } from "../../lib/api";
import { fmtDateTime } from "../../lib/format";
import { Empty, ErrorNote, Input, PageHeader, Pagination, Panel, RefreshButton, Select, Spinner, TH, TD, cx } from "../../components/ui";

const duration = (s) => (s == null ? "—" : s < 3600 ? `${Math.round(s / 60)} min` : `${Math.floor(s / 3600)}h ${Math.round((s % 3600) / 60)}m`);

export default function LoginHistory() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => { setSearch(input); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [input]);
  const qs = new URLSearchParams({ page, limit: 50, ...(status !== "all" && { status }), ...(search && { search }) });
  const { data, loading, error, reload, refreshing } = useApi(`/admin/login-history?${qs}`, { ttl: 30 * 1000 });

  return (
    <>
      <PageHeader title="Login history" subtitle="Sign-ins from the last 7 days. Older entries are removed automatically." actions={<RefreshButton onClick={reload} spinning={refreshing} />} />
      <ErrorNote error={error} onRetry={reload} />
      <Panel bodyClass="p-0">
        <div className="flex flex-wrap gap-3 p-4 border-b border-line">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search name, ID, email or IP" className="pl-9" />
          </div>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-40" aria-label="Result">
            <option value="all">All attempts</option>
            <option value="SUCCESS">Successful</option>
            <option value="FAILED">Failed</option>
          </Select>
        </div>
        {loading ? <Spinner /> : !data?.data?.length ? <Empty title="No sign-ins found" /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr><TH>When (CT)</TH><TH>Person</TH><TH>Result</TH><TH>IP address</TH><TH>Location</TH><TH>Device</TH><TH>Session</TH></tr></thead>
                <tbody>
                  {data.data.map((h) => (
                    <tr key={h.id}>
                      <TD className="whitespace-nowrap">{fmtDateTime(h.loginTime)}</TD>
                      <TD>
                        <div className="font-medium">{h.employeeName !== "Unknown" ? h.employeeName : h.email}</div>
                        <div className="text-xs text-muted">{h.employeeId !== "Unknown" ? h.employeeId : "Unknown account"}</div>
                      </TD>
                      <TD className={cx("font-medium", h.status === "SUCCESS" ? "text-active" : "text-leave")}>{h.status === "SUCCESS" ? "Signed in" : "Failed"}</TD>
                      <TD className="num">{h.ipAddress || "—"}</TD>
                      <TD className="text-ink-soft">{h.location || "—"}</TD>
                      <TD className="text-ink-soft whitespace-nowrap">{[h.browser, h.os].filter((x) => x && x !== "Unknown").join(" on ") || "—"}</TD>
                      <TD className="text-ink-soft whitespace-nowrap">{h.logoutTime ? duration(h.sessionDuration) : h.status === "SUCCESS" ? "Open" : "—"}</TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPage={setPage} />
          </>
        )}
      </Panel>
    </>
  );
}
