import { useState } from "react";
import {
  Download,
  BarChart3,
  FileText,
  Target as TargetIcon,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { download, useApi } from "../../lib/api";
import { num, recentMonths } from "../../lib/format";
import {
  Avatar,
  Button,
  Empty,
  ErrorNote,
  MiniStat,
  PageHeader,
  Pill,
  Select,
  Spinner,
  StatRow,
  Tabs,
  TH,
  TD,
  Toolbar,
  useToast,
  cx,
} from "../../components/ui";
import TeamsAdmin from "./TeamsAdmin";

const TYPES = [
  ["association", "Assoc."],
  ["attendees", "Attend."],
  ["industry", "Industry"],
  ["memberAttendees", "Member"],
];
const STATUSES = [
  ["active", "Active", "bg-lime text-ink"],
  [
    "noResponse",
    "No resp.",
    "bg-pearl text-teal-deep border border-teal-deep/30",
  ],
  ["leaveOut", "Leave out", "bg-teal-deep text-white"],
  ["pending", "Pending", "bg-white text-muted border border-line"],
];

function Progress({ r }) {
  const pct = r.achievement ?? 0;
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="num font-bold text-[15px]">
          {num(r.totalLeads)}
          <span className="text-muted font-normal text-[12.5px]">
            {" "}
            / {r.target || "—"}
          </span>
        </span>
        <span
          className={cx(
            "num text-[12.5px] font-semibold",
            pct >= 100 ? "text-teal-deep" : "text-muted",
          )}
        >
          {r.achievement === null ? "No target" : `${pct}%`}
        </span>
      </div>
      <div className="track h-2 rounded-full overflow-hidden mt-1.5">
        <div
          className={cx(
            "h-full rounded-full",
            pct >= 100 ? "bg-lime" : "bg-teal-deep",
          )}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}
const TypeCounts = ({ r }) => (
  <div className="grid grid-cols-4 gap-1.5">
    {TYPES.map(([k, l]) => (
      <div key={k} className="rounded-lg bg-pearl px-1.5 py-1 text-center">
        <div className="num text-[13px] font-bold">{r[k]}</div>
        <div className="text-[10px] text-muted truncate">{l}</div>
      </div>
    ))}
  </div>
);
const StatusCounts = ({ r }) => (
  <div className="grid grid-cols-4 gap-1.5">
    {STATUSES.map(([k, l, c]) => (
      <div
        key={k}
        className={cx("rounded-lg px-1.5 py-1 text-center", c)}
        title={l}
      >
        <div className="num text-[13px] font-bold">{r[k]}</div>
        <div className="text-[10px] opacity-80 truncate">{l}</div>
      </div>
    ))}
  </div>
);

function MonthlyReport() {
  const toast = useToast();
  const months = recentMonths(4);
  const [key, setKey] = useState(months[0].key);
  const [y, m] = key.split("-").map(Number);
  const { data, loading, error, reload } = useApi(
    `/reports/monthly?year=${y}&month=${m}`,
  );
  const [busy, setBusy] = useState(false);
  const rows = data?.rows || [];
  const sum = (k) => rows.reduce((s, r) => s + (r[k] || 0), 0);
  const withTarget = rows.filter((r) => r.achievement !== null);
  const avg = withTarget.length
    ? Math.round(
        withTarget.reduce((s, r) => s + r.achievement, 0) / withTarget.length,
      )
    : 0;
  const top = rows.reduce(
    (a, r) => (!a || r.totalLeads > a.totalLeads ? r : a),
    null,
  );

  return (
    <>
      <Toolbar>
        <Select
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="w-48"
          aria-label="Month"
        >
          {months.map((mm) => (
            <option key={mm.key} value={mm.key}>
              {mm.label}
            </option>
          ))}
        </Select>
        <span className="text-[13px] text-muted">
          Employee results for {data?.label || "the month"}.
        </span>
        <Button
          className="ml-auto"
          variant="blue"
          icon={Download}
          loading={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await download(
                `/reports/monthly/export?year=${y}&month=${m}`,
                `report-${key}.xlsx`,
              );
            } catch (e) {
              toast(e.message, "error");
            } finally {
              setBusy(false);
            }
          }}
        >
          Download Excel
        </Button>
      </Toolbar>
      <ErrorNote error={error} onRetry={reload} />
      {loading ? (
        <Spinner />
      ) : !rows.length ? (
        <div className="card">
          <Empty title="No leads in this month">
            Pick another month above.
          </Empty>
        </div>
      ) : (
        <>
          <StatRow>
            <MiniStat
              label="Leads"
              value={num(sum("totalLeads"))}
              icon={FileText}
              tone="teal"
            />
            <MiniStat
              label="Team target"
              value={num(sum("target"))}
              icon={TargetIcon}
            />
            <MiniStat
              label="Average achieved"
              value={`${avg}%`}
              icon={TrendingUp}
            />
            <MiniStat
              label="Most leads"
              value={top?.name || "—"}
              hint={top ? `${num(top.totalLeads)} leads` : ""}
              icon={Trophy}
              tone="lime"
            />
          </StatRow>
          <section className="card overflow-hidden">
            <table className="hidden lg:table w-full text-sm table-fixed">
              <thead>
                <tr>
                  <TH className="w-[24%]">Employee</TH>
                  <TH className="w-[24%]">Leads vs target</TH>
                  <TH className="w-[26%]">Lead types</TH>
                  <TH>Status</TH>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.employeeId} className="hover:bg-pearl/60">
                    <TD>
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={r.name} size={36} />
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{r.name}</div>
                          <div className="flex items-center gap-1.5 text-xs text-muted">
                            {r.employeeId}
                            {r.achievement !== null && r.achievement < 50 && (
                              <Pill
                                tone="teal"
                                dot={false}
                                className="!h-5 !px-2 !text-[10.5px]"
                              >
                                Below 50%
                              </Pill>
                            )}
                          </div>
                        </div>
                      </div>
                    </TD>
                    <TD>
                      <Progress r={r} />
                    </TD>
                    <TD>
                      <TypeCounts r={r} />
                    </TD>
                    <TD>
                      <StatusCounts r={r} />
                    </TD>
                  </tr>
                ))}
                <tr className="bg-pearl font-semibold">
                  <TD>Total</TD>
                  <TD className="num">
                    {num(sum("totalLeads"))}{" "}
                    <span className="text-muted font-normal">
                      / {num(sum("target"))}
                    </span>
                  </TD>
                  <TD>
                    <TypeCounts
                      r={Object.fromEntries(
                        TYPES.map(([k]) => [k, num(sum(k))]),
                      )}
                    />
                  </TD>
                  <TD>
                    <StatusCounts
                      r={Object.fromEntries(
                        STATUSES.map(([k]) => [k, num(sum(k))]),
                      )}
                    />
                  </TD>
                </tr>
              </tbody>
            </table>
            <ul className="lg:hidden divide-y divide-line">
              {rows.map((r) => (
                <li key={r.employeeId} className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.name} size={36} />
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{r.name}</div>
                      <div className="text-xs text-muted">{r.employeeId}</div>
                    </div>
                  </div>
                  <Progress r={r} />
                  <TypeCounts r={r} />
                  <StatusCounts r={r} />
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </>
  );
}

export default function Reports() {
  const [tab, setTab] = useState("monthly");
  return (
    <>
      <PageHeader
        title="Reports"
        icon={BarChart3}
        subtitle="Monthly employee results and team reports."
      />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "monthly", label: "Monthly report" },
          { value: "teams", label: "Teams" },
        ]}
      />
      {tab === "monthly" ? <MonthlyReport /> : <TeamsAdmin />}
    </>
  );
}
