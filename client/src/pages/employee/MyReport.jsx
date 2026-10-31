import { useState } from "react";
import { BarChart, Bar as RBar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useApi } from "../../lib/api";
import { getSession } from "../../lib/session";
import { money, num, recentMonths } from "../../lib/format";
import { Bar, Empty, ErrorNote, PageHeader, Panel, Select, Spinner, Stat, Tabs, TH, TD } from "../../components/ui";

function MyPerformance() {
  const id = getSession()?.employeeId;
  const { data, loading, error, reload } = useApi(`/reports/employee/${id}`);
  if (loading) return <Spinner />;
  if (error) return <ErrorNote error={error} onRetry={reload} />;
  const months = [...data.months].reverse();
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Leads (last 4 months)" value={num(data.stats.totalLeads)} />
        <Stat label="Marked active" value={num(data.stats.active)} hint={`${data.stats.activeRate}% of your leads`} tone="text-active" />
        <Stat label="Monthly target" value={data.employee.target ? num(data.employee.target) : "—"} />
        <Stat label="This month" value={num(data.months[0]?.totalLeads)} />
      </div>
      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6">
        <Panel title="Leads per month">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={months} margin={{ left: -18, right: 8 }}>
                <CartesianGrid vertical={false} stroke="#e2e5ea" />
                <XAxis dataKey="label" tickFormatter={(v) => v.split(" ")[0].slice(0, 3)} tick={{ fontSize: 12, fill: "#6b7484" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#6b7484" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: "#f6f7f9" }} />
                <RBar dataKey="active" stackId="s" name="Active" fill="#15803d" />
                <RBar dataKey="noResponse" stackId="s" name="No response" fill="#b45309" />
                <RBar dataKey="leaveOut" stackId="s" name="Leave out" fill="#b42318" />
                <RBar dataKey="pending" stackId="s" name="Pending" fill="#9aa3b2" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Breakdown" bodyClass="p-0">
          <table className="w-full text-sm">
            <thead><tr><TH>Month</TH><TH className="text-right">Leads</TH><TH className="text-right">Active</TH><TH className="text-right">No resp.</TH><TH className="text-right">Leave out</TH></tr></thead>
            <tbody>
              {data.months.map((m) => (
                <tr key={m.key}>
                  <TD>{m.label}</TD>
                  <TD className="num text-right font-medium">{num(m.totalLeads)}</TD>
                  <TD className="num text-right text-active">{num(m.active)}</TD>
                  <TD className="num text-right text-noresp">{num(m.noResponse)}</TD>
                  <TD className="num text-right text-leave">{num(m.leaveOut)}</TD>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </>
  );
}

function MonthPicker({ value, onChange }) {
  const months = recentMonths(12);
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-auto text-[13px]" aria-label="Month">
      {months.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
    </Select>
  );
}

function TeamReport() {
  const [month, setMonth] = useState(recentMonths(1)[0].key);
  const [y, m] = month.split("-").map(Number);
  const { data, loading, error, reload } = useApi(`/teams/my-team/reports?month=${m}&year=${y}`);
  const ann = useApi(`/teams/my-team/announcements?month=${m}&year=${y}`);
  if (loading) return <Spinner />;
  if (error) return <ErrorNote error={error} onRetry={reload} />;
  if (!data.team) return <Empty title="You are not in a team yet">Your admin adds you to a team from Reports.</Empty>;

  const amounts = Object.fromEntries((ann.data?.announcements || []).map((a) => [a.employeeId, a.amount]));
  const rows = data.reports.map((r) => ({ ...r, dealValue: amounts[r.employeeId] ?? r.dealValue ?? 0 }));
  const total = rows.reduce((s, r) => s + Number(r.dealValue || 0), 0);
  const target = data.team.targetValue || 0;
  return (
    <Panel title={data.team.name} actions={<MonthPicker value={month} onChange={setMonth} />} bodyClass="p-0">
      <div className="grid sm:grid-cols-3 gap-4 p-5 border-b border-line">
        <div><div className="text-muted text-[13px]">Team target</div><div className="num text-xl font-semibold">{money(target)}</div></div>
        <div><div className="text-muted text-[13px]">Deal value so far</div><div className="num text-xl font-semibold text-active">{money(total)}</div></div>
        <div>
          <div className="text-muted text-[13px] mb-2">Achieved {target ? Math.round((total / target) * 100) : 0}%</div>
          <Bar value={total} max={target} tone="bg-active" />
        </div>
      </div>
      {!rows.length ? <Empty title="No report saved for this month yet" /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr><TH>Member</TH><TH className="text-right">Leads</TH><TH className="text-right">Deals</TH><TH className="text-right">Invoice pending</TH><TH className="text-right">Invoice cancelled</TH><TH className="text-right">Active clients</TH><TH className="text-right">Leave out</TH><TH className="text-right">No response</TH><TH className="text-right">Deal value</TH></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <TD className="font-medium">{r.employee?.fullName}</TD>
                  <TD className="num text-right">{num(r.totalLeads)}</TD>
                  <TD className="num text-right">{num(r.deal)}</TD>
                  <TD className="num text-right">{num(r.invoicePending)}</TD>
                  <TD className="num text-right">{num(r.invoiceCancel)}</TD>
                  <TD className="num text-right">{num(r.activeClients)}</TD>
                  <TD className="num text-right">{num(r.leaveOutClients)}</TD>
                  <TD className="num text-right">{num(r.noResponse)}</TD>
                  <TD className="num text-right font-medium">{money(r.dealValue)}</TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function Announcements() {
  const [month, setMonth] = useState(recentMonths(1)[0].key);
  const [y, m] = month.split("-").map(Number);
  const { data, loading, error, reload } = useApi(`/teams/my-team/announcements?month=${m}&year=${y}`);
  const list = data?.announcements || [];
  const total = list.reduce((s, a) => s + Number(a.amount || 0), 0);
  return (
    <Panel title="Deal amounts announced" actions={<MonthPicker value={month} onChange={setMonth} />} bodyClass="p-0">
      <ErrorNote error={error} onRetry={reload} />
      {loading ? <Spinner /> : !list.length ? <Empty title="No deal amounts announced for this month" /> : (
        <table className="w-full text-sm">
          <thead><tr><TH className="w-12">#</TH><TH>Employee</TH><TH className="text-right">Amount</TH></tr></thead>
          <tbody>
            {list.map((a, i) => (
              <tr key={a.id}>
                <TD className="num text-muted">{i + 1}</TD>
                <TD className="font-medium">{a.employee?.fullName}</TD>
                <TD className="num text-right font-semibold">{money(a.amount)}</TD>
              </tr>
            ))}
            <tr><TD /><TD className="font-medium">Team total</TD><TD className="num text-right font-semibold text-active">{money(total)}</TD></tr>
          </tbody>
        </table>
      )}
    </Panel>
  );
}

export default function MyReport() {
  const [tab, setTab] = useState("performance");
  return (
    <>
      <PageHeader title="My report" subtitle="Your results and your team's monthly report." />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: "performance", label: "My performance" }, { value: "team", label: "Team report" }, { value: "deals", label: "Deal amounts" }]} />
      {tab === "performance" && <MyPerformance />}
      {tab === "team" && <TeamReport />}
      {tab === "deals" && <Announcements />}
    </>
  );
}
