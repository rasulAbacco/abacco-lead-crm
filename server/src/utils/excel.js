// Excel export of leads (used for monthly retention reports and downloads).
import XLSX from "xlsx-js-style";
import { formatCentral } from "./time.js";

const STATUS_LABEL = { PENDING: "Pending", ACTIVE: "Active", NO_RESPONSE: "No Response", LEAVE_OUT: "Leave Out" };

const COLUMNS = [
  ["Lead ID", (l) => l.id, 9],
  ["Uploaded (CT)", (l) => formatCentral(l.createdAt, "yyyy-MM-dd HH:mm"), 17],
  ["Contact Date", (l) => formatCentral(l.date, "yyyy-MM-dd"), 13],
  ["Employee ID", (l) => l.employeeId, 12],
  ["Employee", (l) => l.employee?.fullName || "", 20],
  ["Status", (l) => STATUS_LABEL[l.status] || l.status, 12],
  ["Lead Type", (l) => l.leadType, 18],
  ["Agent Name", (l) => l.agentName || "", 18],
  ["Client Email", (l) => l.clientEmail, 28],
  ["Lead Email", (l) => l.leadEmail, 28],
  ["CC Emails", (l) => l.ccEmail || "", 28],
  ["Phone", (l) => l.phone || "", 18],
  ["Country", (l) => l.country || "", 12],
  ["Website", (l) => l.website || "", 24],
  ["Link", (l) => l.link || "", 30],
  ["Attendees", (l) => l.attendeesCount ?? "", 10],
  ["Subject", (l) => l.subjectLine, 34],
  ["Email Pitch", (l) => l.emailPitch, 50],
  ["Email Response", (l) => l.emailResponce || "", 50],
  ["Edited", (l) => (l.isEdited ? "Yes" : "No"), 8],
];

/** Build an .xlsx Buffer for the given leads (each with optional `employee`). */
export function leadsWorkbookBuffer(leads, sheetTitle = "Leads") {
  const header = COLUMNS.map(([h]) => ({
    v: h,
    s: {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1E3A5F" } },
      alignment: { vertical: "center" },
    },
  }));
  const rows = leads.map((l) =>
    COLUMNS.map(([, get]) => {
      const v = get(l);
      return { v: v === null || v === undefined ? "" : v, s: { alignment: { vertical: "top", wrapText: false } } };
    }),
  );
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  ws["!cols"] = COLUMNS.map(([, , w]) => ({ wch: w }));
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };
  ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: COLUMNS.length - 1 } }) };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetTitle.slice(0, 31));
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx", compression: true });
}

export function sendXlsx(res, buffer, filename) {
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "no-store");
  res.send(buffer);
}
