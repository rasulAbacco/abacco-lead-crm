import { useEffect, useState } from "react";
import { History, MapPin, Monitor, Globe } from "lucide-react";
import { useApi } from "../../lib/api";
import { fmtDateTime, num } from "../../lib/format";
import {
  Avatar,
  Empty,
  ErrorNote,
  PageHeader,
  Pagination,
  Pill,
  RefreshButton,
  SearchInput,
  Segmented,
  Spinner,
  TH,
  TD,
  Toolbar,
} from "../../components/ui";

const duration = (s) =>
  s == null
    ? "—"
    : s < 3600
      ? `${Math.round(s / 60)} min`
      : `${Math.floor(s / 3600)}h ${Math.round((s % 3600) / 60)}m`;
const who = (h) => (h.employeeName !== "Unknown" ? h.employeeName : h.email);
const whoId = (h) =>
  h.employeeId !== "Unknown" ? h.employeeId : "Unknown account";
const device = (h) =>
  [h.browser, h.os].filter((x) => x && x !== "Unknown").join(" on ") || "—";
const session = (h) =>
  h.logoutTime
    ? duration(h.sessionDuration)
    : h.status === "SUCCESS"
      ? "Still signed in"
      : "—";
const Result = ({ h }) => (
  <Pill tone={h.status === "SUCCESS" ? "lime" : "teal"}>
    {h.status === "SUCCESS" ? "Signed in" : "Failed"}
  </Pill>
);

export default function LoginHistory() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(input);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [input]);
  const qs = new URLSearchParams({
    page,
    limit: 50,
    ...(status !== "all" && { status }),
    ...(search && { search }),
  });
  const { data, loading, error, reload, refreshing } = useApi(
    `/admin/login-history?${qs}`,
    { ttl: 30 * 1000 },
  );
  const rows = data?.data || [];

  return (
    <>
      <PageHeader
        title="Login history"
        icon={History}
        subtitle="Sign-ins from the last 7 days. Older entries are removed automatically."
        actions={<RefreshButton onClick={reload} spinning={refreshing} />}
      />
      <ErrorNote error={error} onRetry={reload} />
      <Toolbar>
        <SearchInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search name, ID, email or IP"
        />
        <Segmented
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={[
            ["all", "All"],
            ["SUCCESS", "Successful"],
            ["FAILED", "Failed"],
          ]}
        />
        {data && (
          <span className="text-[13px] text-muted ml-auto">
            {num(data.total)} entr{data.total === 1 ? "y" : "ies"}
          </span>
        )}
      </Toolbar>

      {loading ? (
        <Spinner />
      ) : !rows.length ? (
        <div className="card">
          <Empty title="No sign-ins found">Try another search or filter.</Empty>
        </div>
      ) : (
        <section className="card overflow-hidden">
          {/* desktop table */}
          <table className="hidden lg:table w-full text-sm table-fixed">
            <thead>
              <tr>
                <TH className="w-[170px]">When (CT)</TH>
                <TH className="w-[22%]">Person</TH>
                <TH className="w-[120px]">Result</TH>
                <TH className="w-[140px]">IP address</TH>
                <TH>Location</TH>
                <TH>Device</TH>
                <TH className="w-[130px]">Session</TH>
              </tr>
            </thead>
            <tbody>
              {rows.map((h) => (
                <tr key={h.id} className="hover:bg-pearl/60">
                  <TD className="whitespace-nowrap text-ink-soft">
                    {fmtDateTime(h.loginTime)}
                  </TD>
                  <TD>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={who(h)} size={32} />
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{who(h)}</div>
                        <div className="text-xs text-muted truncate">
                          {whoId(h)}
                        </div>
                      </div>
                    </div>
                  </TD>
                  <TD>
                    <Result h={h} />
                  </TD>
                  <TD className="num">{h.ipAddress || "—"}</TD>
                  <TD className="text-ink-soft truncate">
                    {h.location || "—"}
                  </TD>
                  <TD className="text-ink-soft truncate" title={device(h)}>
                    {device(h)}
                  </TD>
                  <TD className="text-ink-soft whitespace-nowrap">
                    {session(h)}
                  </TD>
                </tr>
              ))}
            </tbody>
          </table>
          {/* phones / tablets */}
          <ul className="lg:hidden divide-y divide-line">
            {rows.map((h) => (
              <li key={h.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={who(h)} size={36} />
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{who(h)}</div>
                      <div className="text-xs text-muted">
                        {fmtDateTime(h.loginTime)} CT
                      </div>
                    </div>
                  </div>
                  <Result h={h} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12.5px] text-ink-soft">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <Globe size={13} className="text-teal-deep shrink-0" />
                    <span className="num truncate">{h.ipAddress || "—"}</span>
                  </span>
                  <span className="flex items-center gap-1.5 min-w-0">
                    <MapPin size={13} className="text-teal-deep shrink-0" />
                    <span className="truncate">{h.location || "—"}</span>
                  </span>
                  <span className="flex items-center gap-1.5 min-w-0 col-span-2">
                    <Monitor size={13} className="text-teal-deep shrink-0" />
                    <span className="truncate">
                      {device(h)}, {session(h).toLowerCase()}
                    </span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            onPage={setPage}
          />
        </section>
      )}
    </>
  );
}
