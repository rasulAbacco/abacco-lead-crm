// This month's performance for every employee. Columns collapse on small screens (no sideways scrolling).
import { Link } from "react-router-dom";
import { getSession } from "../lib/session";
import { num } from "../lib/format";
import { Avatar, Bar, Chip, TH, TD, cx } from "./ui";

export default function TeamTable({ rows, linkToLeads = false, showStatuses = false }) {
  const me = getSession()?.employeeId;
  const sorted = [...rows].sort((a, b) => b.monthlyLeads - a.monthlyLeads);
  return (
    <table className="w-full text-sm table-fixed">
      <thead>
        <tr>
          <TH className="w-[38%] sm:w-[28%] xl:w-[24%]">Employee</TH>
          <TH className="text-right hidden sm:table-cell w-[9%]">Today</TH>
          <TH className="text-right w-[18%] sm:w-[11%]"><span className="sm:hidden">Month</span><span className="hidden sm:inline">This month</span></TH>
          <TH className="text-right hidden md:table-cell w-[9%]">Target</TH>
          <TH className="w-[44%] sm:w-auto">Achievement</TH>
          {showStatuses && (
            <>
              <TH className="text-center hidden xl:table-cell w-[68px] px-1 text-[12px]">Active</TH>
              <TH className="text-center hidden xl:table-cell w-[68px] px-1 text-[12px]">No resp.</TH>
              <TH className="text-center hidden xl:table-cell w-[68px] px-1 text-[12px]">Leave out</TH>
              <TH className="text-center hidden xl:table-cell w-[68px] px-1 text-[12px]">Pending</TH>
            </>
          )}
        </tr>
      </thead>
      <tbody>
        {sorted.map((r) => {
          const rate = r.achievementRate || 0;
          return (
            <tr key={r.employeeId} className={cx("hover:bg-[#f9fbfe]", r.employeeId === me && "bg-blue-soft/50")}>
              <TD>
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={r.name} size={28} />
                  <div className="min-w-0">
                    {linkToLeads ? (
                      <Link to={`/employee/${r.employeeId}`} className="block font-semibold truncate hover:text-blue">{r.name}</Link>
                    ) : (
                      <span className="block font-semibold truncate">{r.name}</span>
                    )}
                    <span className="block text-xs text-muted">{r.employeeId}{r.doubleTargetAchieved && <span className="ml-1.5 text-active font-semibold">2× target</span>}</span>
                  </div>
                </div>
              </TD>
              <TD className="num text-right hidden sm:table-cell">{num(r.dailyLeads)}</TD>
              <TD className="num text-right font-semibold">{num(r.monthlyLeads)}</TD>
              <TD className="num text-right text-ink-soft hidden md:table-cell">{r.target ? num(r.target) : "—"}</TD>
              <TD>
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0"><Bar value={rate} max={100} tone={rate >= 100 ? "bg-active" : "bg-gradient-to-r from-blue to-[#60a5fa]"} /></div>
                  <span className="num text-[13px] w-10 text-right font-medium">{r.target ? `${rate}%` : "—"}</span>
                </div>
              </TD>
              {showStatuses && (
                <>
                  <TD className="text-center hidden xl:table-cell px-1"><Chip tone="active">{num(r.statuses?.ACTIVE)}</Chip></TD>
                  <TD className="text-center hidden xl:table-cell px-1"><Chip tone="noresp">{num(r.statuses?.NO_RESPONSE)}</Chip></TD>
                  <TD className="text-center hidden xl:table-cell px-1"><Chip tone="leave">{num(r.statuses?.LEAVE_OUT)}</Chip></TD>
                  <TD className="text-center hidden xl:table-cell px-1"><Chip tone="blue">{num(r.statuses?.PENDING)}</Chip></TD>
                </>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
