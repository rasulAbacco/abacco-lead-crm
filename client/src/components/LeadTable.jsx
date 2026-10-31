// Lead list with expandable rows. Fixed column widths, less important columns hide on
// smaller screens, long text is cut with "…" -> never scrolls sideways.
import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, Pencil } from "lucide-react";
import { fmtDate, leadCategory } from "../lib/format";
import { StatusBadge, TH, TD, cx, Button } from "./ui";
import StatusSelector from "./StatusSelector";
import LeadDetails from "./LeadDetails";

export default function LeadTable({ leads, admin = false, showEmployee = false, onEdit, onStatusChange }) {
  const [open, setOpen] = useState(() => new Set());
  const toggle = (id) =>
    setOpen((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  return (
    <table className="w-full text-sm table-fixed">
      <thead>
        <tr>
          <TH className="w-9 sm:w-10 px-1 sm:px-2" />
          <TH className="w-[60px] sm:w-[72px] px-2">Date</TH>
          {showEmployee && <TH className="hidden md:table-cell w-[15%]">Employee</TH>}
          <TH className="hidden sm:table-cell w-[26%]">Client email</TH>
          <TH>Subject</TH>
          <TH className="hidden xl:table-cell w-[13%]">Type</TH>
          <TH className={admin ? "w-[132px] sm:w-[172px] px-2 sm:px-4" : "w-[118px] px-2 sm:px-4"}>Status</TH>
        </tr>
      </thead>
      <tbody>
        {leads.map((l) => {
          const isOpen = open.has(l.id);
          return (
            <Fragment key={l.id}>
              <tr className={cx("hover:bg-[#f9fbfe]", isOpen && "bg-[#f9fbfe]")}>
                <TD className="px-2">
                  <button onClick={() => toggle(l.id)} className="p-1 rounded-md hover:bg-line text-muted" aria-expanded={isOpen} aria-label={isOpen ? "Hide details" : "Show details"}>
                    {isOpen ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
                  </button>
                </TD>
                <TD className="px-2 whitespace-nowrap num text-ink-soft">{fmtDate(l.date, "MMM d")}</TD>
                {showEmployee && <TD className="hidden md:table-cell truncate font-medium">{l.employee?.fullName || l.employeeId}</TD>}
                <TD className="hidden sm:table-cell truncate" title={l.clientEmail}>{l.clientEmail}</TD>
                <TD className="truncate">
                  <button onClick={() => toggle(l.id)} className="text-left truncate block max-w-full hover:text-blue font-medium" title={l.subjectLine}>{l.subjectLine}</button>
                  <span className="block sm:hidden text-xs text-muted truncate">{l.clientEmail}</span>
                </TD>
                <TD className="hidden xl:table-cell text-ink-soft truncate">{leadCategory(l.leadType)}</TD>
                <TD className="px-2 sm:px-4">
                  {admin ? <StatusSelector lead={l} size="sm" className="w-full" onChange={(s) => onStatusChange?.(l.id, s)} /> : <StatusBadge status={l.status} />}
                </TD>
              </tr>
              {isOpen && (
                <tr>
                  <td colSpan={7} className="px-3 sm:px-6 py-5 border-b border-line bg-white">
                    <LeadDetails lead={l} />
                    {onEdit && (
                      <div className="mt-4">
                        <Button size="sm" icon={Pencil} onClick={() => onEdit(l)}>Edit details</Button>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
