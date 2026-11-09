// Monthly attendance Excel: Summary, Daily (biometric grid), System clock-in.
import XLSX from "xlsx-js-style";
import { STATUS_LABEL, SATURDAY_LABEL } from "../services/attendance.js";

const HEAD = {
  font: { bold: true, color: { rgb: "FFFFFF" } },
  fill: { fgColor: { rgb: "0B1A3C" } },
  alignment: { horizontal: "center", vertical: "center", wrapText: true },
};
const FILL = {
  P: "DCFCE7",
  HD: "FEF3C7",
  MP: "FFEDD5",
  A: "FEE2E2",
  WO: "E5E7EB",
  H: "E0E7FF",
  IN: "DBEAFE",
};
const WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const cell = (v, style) => ({ v: v ?? "", s: style || {} });

/* ---- Punch In / Out: one row per employee, In + Out under every date ---- */
function addPunchSheet(wb, report, sheetName = "Punch In-Out") {
  const FIX = 3; // Employee ID, Name, Team
  const TAIL = ["Present", "Half day", "Absent", "Missing out", "Total hours"];
  const HR = 3; // first header row index (0-based)
  const center = { horizontal: "center", vertical: "center", wrapText: true };

  const h1 = [
    ...["Employee ID", "Name", "Team"].map((t) => cell(t, HEAD)),
    ...report.days.flatMap((d) => [
      cell(`${d.day} ${WEEK[d.weekday]}`, HEAD),
      cell("", HEAD),
    ]),
    ...TAIL.map((t) => cell(t, HEAD)),
  ];
  const h2 = [
    ...Array(FIX)
      .fill(0)
      .map(() => cell("", HEAD)),
    ...report.days.flatMap(() => [cell("In", HEAD), cell("Out", HEAD)]),
    ...TAIL.map(() => cell("", HEAD)),
  ];

  const merges = [];
  const lastCol = FIX + report.days.length * 2 + TAIL.length - 1;
  for (let c = 0; c < FIX; c++)
    merges.push({ s: { r: HR, c }, e: { r: HR + 1, c } });
  for (let c = lastCol - TAIL.length + 1; c <= lastCol; c++)
    merges.push({ s: { r: HR, c }, e: { r: HR + 1, c } });
  report.days.forEach((_, i) => {
    const c = FIX + i * 2;
    merges.push({ s: { r: HR, c }, e: { r: HR, c: c + 1 } });
  });

  const body = report.rows.map((r, ri) => {
    const rowIdx = HR + 2 + ri;
    const out = [
      cell(r.employeeId, { font: { bold: true } }),
      cell(r.name, { font: { bold: true } }),
      cell(r.team),
    ];
    r.days.forEach((d, i) => {
      const c = FIX + i * 2;
      const fill = d.code
        ? { fgColor: { rgb: FILL[d.code] || "FFFFFF" } }
        : undefined;
      const st = { fill, alignment: center, font: { sz: 10 } };
      if (d.firstPunchIST) {
        const inTxt = `${d.firstPunchIST}${d.offDayWork ? " *" : ""}`;
        const outTxt = d.lastPunchIST
          ? d.lastPunchIST
          : d.code === "IN"
            ? "Working"
            : "No punch-out";
        out.push(cell(inTxt, st), cell(outTxt, st));
      } else if (d.code) {
        // A / WO / H: one merged cell across In + Out
        out.push(
          cell(d.code, { ...st, font: { sz: 10, bold: true } }),
          cell("", st),
        );
        merges.push({ s: { r: rowIdx, c }, e: { r: rowIdx, c: c + 1 } });
      } else {
        out.push(cell(""), cell(""));
      }
    });
    out.push(
      cell(r.summary.present, { alignment: center }),
      cell(r.summary.halfDay, { alignment: center }),
      cell(r.summary.absent, { alignment: center }),
      cell(r.summary.missingOut, { alignment: center }),
      cell(r.summary.hours || "0h 00m", { alignment: center }),
    );
    return out;
  });

  const ws = XLSX.utils.aoa_to_sheet([
    [
      cell(`${report.label} punch in / punch out`, {
        font: { bold: true, sz: 14 },
      }),
    ],
    [
      cell(
        "Times are IST. Day = US Central date. P/HD cells show first punch (In) and last punch (Out). A = Absent, WO = Week off, H = Holiday, * = worked on a day off, No punch-out = forgot to punch out.",
        { font: { italic: true, color: { rgb: "6B7280" } } },
      ),
    ],
    [],
    h1,
    h2,
    ...body,
  ]);
  ws["!merges"] = merges;
  ws["!cols"] = [
    { wch: 12 },
    { wch: 22 },
    { wch: 11 },
    ...report.days.flatMap(() => [{ wch: 10 }, { wch: 12 }]),
    ...TAIL.map(() => ({ wch: 11 })),
  ];
  ws["!rows"] = [{}, {}, {}, { hpt: 24 }, { hpt: 20 }];
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
}

/** Standalone export: only the date-wise punch in / out sheet */
export function punchGridWorkbookBuffer(report) {
  const wb = XLSX.utils.book_new();
  addPunchSheet(wb, report);
  return XLSX.write(wb, {
    type: "buffer",
    bookType: "xlsx",
    compression: true,
  });
}

export function attendanceWorkbookBuffer(report) {
  const wb = XLSX.utils.book_new();

  /* ---- Summary ---- */
  const sumHead = [
    "Employee ID",
    "Name",
    "Team",
    "Saturday rule",
    "Working days",
    "Present",
    "Half day",
    "Missing punch-out",
    "Absent",
    "Days counted",
    "Worked on week off / holiday",
    "Extra working days (calendar)",
    "Biometric hours",
    "System clock-in days",
    "System hours",
    "Not clocked out",
  ];
  const sumRows = report.rows.map((r) => [
    r.employeeId,
    r.name,
    r.team,
    SATURDAY_LABEL[r.saturdayRule],
    r.summary.workingDays,
    r.summary.present,
    r.summary.halfDay,
    r.summary.missingOut,
    r.summary.absent,
    r.summary.attendedDays,
    r.summary.offDayWork,
    r.summary.extraDays || 0,
    r.summary.hours || "0h 00m",
    r.system.days,
    r.system.hours || "0h 00m",
    r.system.notClockedOut,
  ]);
  const ws1 = XLSX.utils.aoa_to_sheet([
    [
      cell(`${report.label} employee attendance`, {
        font: { bold: true, sz: 14 },
      }),
    ],
    [
      cell(
        `Full day = ${report.fullDayHours}+ hours between first and last punch. Day = US Central date; times in IST.`,
        { font: { italic: true, color: { rgb: "6B7280" } } },
      ),
    ],
    [],
    sumHead.map((h) => cell(h, HEAD)),
    ...sumRows.map((row) => row.map((v) => cell(v))),
  ]);
  ws1["!cols"] = sumHead.map((h, i) => ({
    wch: i === 1 ? 22 : Math.max(10, Math.min(18, h.length + 2)),
  }));
  XLSX.utils.book_append_sheet(wb, ws1, "Summary");

  addPunchSheet(wb, report);

  /* ---- Daily grid ---- */
  const head2 = [
    cell("Employee", HEAD),
    ...report.days.map((d) => cell(`${d.day}\n${WEEK[d.weekday]}`, HEAD)),
  ];
  const grid = report.rows.map((r) => [
    cell(`${r.name} (${r.employeeId})`, { font: { bold: true } }),
    ...r.days.map((d) => {
      const text = d.code
        ? `${d.code}${d.offDayWork ? "*" : ""}${d.firstPunchIST ? `\n${d.firstPunchIST}${d.lastPunchIST ? `-${d.lastPunchIST}` : ""}` : ""}${d.hours ? `\n${d.hours}` : ""}`
        : "";
      return cell(text, {
        fill: d.code
          ? { fgColor: { rgb: FILL[d.code] || "FFFFFF" } }
          : undefined,
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        font: { sz: 9 },
      });
    }),
  ]);
  const legend = [
    [],
    [
      cell(
        "P = Present, HD = Half day, MP = Missing punch-out, A = Absent, WO = Week off, H = Holiday (Sunday), * = worked on a day off. Times are IST.",
        { font: { italic: true } },
      ),
    ],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet([head2, ...grid, ...legend]);
  ws2["!cols"] = [{ wch: 26 }, ...report.days.map(() => ({ wch: 11 }))];
  ws2["!rows"] = [{ hpt: 30 }, ...grid.map(() => ({ hpt: 42 }))];
  XLSX.utils.book_append_sheet(wb, ws2, "Daily (biometric)");

  /* ---- System clock-in ---- */
  const head3 = [
    "Date",
    "Employee ID",
    "Name",
    "Clock in (IST)",
    "Clock out (IST)",
    "Hours",
    "Note",
  ];
  const rows3 = [];
  for (const r of report.rows) {
    for (const d of r.days) {
      if (!d.system) continue;
      rows3.push([
        d.date,
        r.employeeId,
        r.name,
        d.system.clockInIST,
        d.system.notClockedOut
          ? "Not clocked out"
          : d.system.clockOutIST || (d.system.open ? "Still clocked in" : ""),
        d.system.notClockedOut ? "" : d.system.hours,
        d.system.notClockedOut
          ? "Not clocked out — closed automatically at 4:30 AM IST, hours not counted"
          : "",
      ]);
    }
  }
  const ws3 = XLSX.utils.aoa_to_sheet([
    head3.map((h) => cell(h, HEAD)),
    ...rows3.map((row) =>
      row.map((v, i) =>
        cell(
          v,
          row[6] && (i === 4 || i === 6)
            ? { font: { color: { rgb: "B42318" }, bold: i === 4 } }
            : {},
        ),
      ),
    ),
  ]);
  ws3["!cols"] = [
    { wch: 12 },
    { wch: 12 },
    { wch: 22 },
    { wch: 14 },
    { wch: 16 },
    { wch: 10 },
    { wch: 60 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, "System clock-in");

  return XLSX.write(wb, {
    type: "buffer",
    bookType: "xlsx",
    compression: true,
  });
}

export const statusLegend = STATUS_LABEL;
