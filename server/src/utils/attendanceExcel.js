// Monthly attendance Excel: Summary, Daily (biometric grid), System clock-in.
import XLSX from "xlsx-js-style";
import { STATUS_LABEL, SATURDAY_LABEL } from "../services/attendance.js";

const HEAD = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "0B1A3C" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true } };
const FILL = {
  P: "DCFCE7", HD: "FEF3C7", MP: "FFEDD5", A: "FEE2E2", WO: "E5E7EB", H: "E0E7FF", IN: "DBEAFE",
};
const WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const cell = (v, style) => ({ v: v ?? "", s: style || {} });

export function attendanceWorkbookBuffer(report) {
  const wb = XLSX.utils.book_new();

  /* ---- Summary ---- */
  const sumHead = ["Employee ID", "Name", "Saturday rule", "Working days", "Present", "Half day", "Missing punch-out", "Absent", "Days counted", "Worked on week off / holiday", "Biometric hours", "System clock-in days", "System hours", "Not clocked out"];
  const sumRows = report.rows.map((r) => [
    r.employeeId, r.name, SATURDAY_LABEL[r.saturdayRule], r.summary.workingDays, r.summary.present, r.summary.halfDay,
    r.summary.missingOut, r.summary.absent, r.summary.attendedDays, r.summary.offDayWork, r.summary.hours || "0h 00m",
    r.system.days, r.system.hours || "0h 00m", r.system.notClockedOut,
  ]);
  const ws1 = XLSX.utils.aoa_to_sheet([
    [cell(`${report.label} employee attendance`, { font: { bold: true, sz: 14 } })],
    [cell(`Full day = ${report.fullDayHours}+ hours between first and last punch. Day = US Central date; times in IST.`, { font: { italic: true, color: { rgb: "6B7280" } } })],
    [],
    sumHead.map((h) => cell(h, HEAD)),
    ...sumRows.map((row) => row.map((v) => cell(v))),
  ]);
  ws1["!cols"] = sumHead.map((h, i) => ({ wch: i === 1 ? 22 : Math.max(10, Math.min(18, h.length + 2)) }));
  XLSX.utils.book_append_sheet(wb, ws1, "Summary");

  /* ---- Daily grid ---- */
  const head2 = [cell("Employee", HEAD), ...report.days.map((d) => cell(`${d.day}\n${WEEK[d.weekday]}`, HEAD))];
  const grid = report.rows.map((r) => [
    cell(`${r.name} (${r.employeeId})`, { font: { bold: true } }),
    ...r.days.map((d) => {
      const text = d.code ? `${d.code}${d.offDayWork ? "*" : ""}${d.firstPunchIST ? `\n${d.firstPunchIST}${d.lastPunchIST ? `-${d.lastPunchIST}` : ""}` : ""}${d.hours ? `\n${d.hours}` : ""}` : "";
      return cell(text, { fill: d.code ? { fgColor: { rgb: FILL[d.code] || "FFFFFF" } } : undefined, alignment: { horizontal: "center", vertical: "center", wrapText: true }, font: { sz: 9 } });
    }),
  ]);
  const legend = [[], [cell("P = Present, HD = Half day, MP = Missing punch-out, A = Absent, WO = Week off, H = Holiday (Sunday), * = worked on a day off. Times are IST.", { font: { italic: true } })]];
  const ws2 = XLSX.utils.aoa_to_sheet([head2, ...grid, ...legend]);
  ws2["!cols"] = [{ wch: 26 }, ...report.days.map(() => ({ wch: 11 }))];
  ws2["!rows"] = [{ hpt: 30 }, ...grid.map(() => ({ hpt: 42 }))];
  XLSX.utils.book_append_sheet(wb, ws2, "Daily (biometric)");

  /* ---- System clock-in ---- */
  const head3 = ["Date", "Employee ID", "Name", "Clock in (IST)", "Clock out (IST)", "Hours", "Note"];
  const rows3 = [];
  for (const r of report.rows) {
    for (const d of r.days) {
      if (!d.system) continue;
      rows3.push([
        d.date, r.employeeId, r.name, d.system.clockInIST, d.system.notClockedOut ? "Not clocked out" : d.system.clockOutIST || (d.system.open ? "Still clocked in" : ""),
        d.system.notClockedOut ? "" : d.system.hours, d.system.notClockedOut ? "Not clocked out — closed automatically at 4:30 AM IST, hours not counted" : "",
      ]);
    }
  }
  const ws3 = XLSX.utils.aoa_to_sheet([
    head3.map((h) => cell(h, HEAD)),
    ...rows3.map((row) => row.map((v, i) => cell(v, row[6] && (i === 4 || i === 6) ? { font: { color: { rgb: "B42318" }, bold: i === 4 } } : {}))),
  ]);
  ws3["!cols"] = [{ wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 16 }, { wch: 10 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, ws3, "System clock-in");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx", compression: true });
}

export const statusLegend = STATUS_LABEL;
