// Lead list with expandable rows. Fixed column widths, less important columns hide on
// smaller screens, long text is cut with "…" -> never scrolls sideways.
import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, Pencil } from "lucide-react";
import { fmtDate, leadCategory } from "../lib/format";
import { Badge, StatusBadge, TH, TD, cx, Button } from "./ui";
import StatusSelector from "./StatusSelector";
import LeadDetails from "./LeadDetails";

export default function LeadTable({
  leads,
  admin = false,
  showEmployee = false,
  onEdit,
  onStatusChange,
}) {
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
          <TH className="w-12 sm:w-14 px-1 sm:px-2" />
          <TH className="w-[60px] sm:w-[72px] px-2">Date</TH>
          {showEmployee && (
            <TH className="hidden md:table-cell w-[15%]">Employee</TH>
          )}
          <TH className="hidden sm:table-cell w-[26%]">Client email</TH>
          <TH>Subject</TH>
          <TH className="hidden xl:table-cell w-[13%]">Type</TH>
          <TH
            className={
              admin
                ? "w-[136px] sm:w-[172px] px-2 sm:px-4"
                : "w-[118px] px-2 sm:px-4"
            }
          >
            Status
          </TH>
        </tr>
      </thead>
      <tbody>
        {leads.map((l) => {
          const isOpen = open.has(l.id);
          return (
            <Fragment key={l.id}>
              <tr
                className={cx(
                  "transition-colors hover:bg-pearl/60",
                  isOpen && "bg-lime/15",
                )}
              >
                <TD className="px-2">
                  <button
                    onClick={() => toggle(l.id)}
                    className={cx(
                      "size-8 rounded-full flex items-center justify-center transition",
                      isOpen
                        ? "bg-teal-deep text-lime"
                        : "border border-line bg-white text-teal-deep hover:bg-lime hover:border-lime",
                    )}
                    aria-expanded={isOpen}
                    aria-label={isOpen ? "Hide details" : "Show details"}
                  >
                    {isOpen ? (
                      <ChevronDown size={17} />
                    ) : (
                      <ChevronRight size={17} />
                    )}
                  </button>
                </TD>
                <TD className="px-2 whitespace-nowrap num font-semibold text-teal-deep">
                  {fmtDate(l.date, "MMM d")}
                </TD>
                {showEmployee && (
                  <TD className="hidden md:table-cell truncate font-medium">
                    {l.employee?.fullName || l.employeeId}
                  </TD>
                )}
                <TD
                  className="hidden sm:table-cell truncate"
                  title={l.clientEmail}
                >
                  {l.clientEmail}
                </TD>
                <TD className="truncate">
                  <button
                    onClick={() => toggle(l.id)}
                    className="text-left truncate block max-w-full hover:underline decoration-lime decoration-2 underline-offset-4 font-semibold"
                    title={l.subjectLine}
                  >
                    {l.subjectLine}
                  </button>
                  <span className="block sm:hidden text-xs text-muted truncate">
                    {l.clientEmail}
                  </span>
                </TD>
                <TD className="hidden xl:table-cell truncate">
                  <Badge>{leadCategory(l.leadType)}</Badge>
                </TD>
                <TD className="px-2 sm:px-4">
                  {admin ? (
                    <StatusSelector
                      lead={l}
                      size="sm"
                      className="w-full"
                      onChange={(s) => onStatusChange?.(l.id, s)}
                    />
                  ) : (
                    <StatusBadge status={l.status} />
                  )}
                </TD>
              </tr>
              {isOpen && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 sm:px-6 py-5 border-b border-line bg-pearl/60"
                  >
                    <LeadDetails lead={l} />
                    {onEdit && (
                      <div className="mt-4">
                        <Button
                          size="sm"
                          icon={Pencil}
                          onClick={() => onEdit(l)}
                        >
                          Edit details
                        </Button>
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
