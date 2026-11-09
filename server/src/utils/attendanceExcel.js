// Monthly attendance Excel: Summary, Daily (biometric grid), System clock-in.
import XLSX from "xlsx-js-style";
import { STATUS_LABEL, SATURDAY_LABEL } from "../services/attendance.js";

const HEAD = {
  font: { bold: true, color: { rgb: "FFFFFF" } },
  fill: { fgColor: { rgb: "0B3048" } },
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
const cell = (v, style) => ({
  v: v ?? "",
  t: typeof v === "number" ? "n" : "s",
  s: style || {},
});

/* ---- helpers for the punch report ---- */
const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const niceDate = (key) => {
  const [, m, d] = key.split("-").map(Number);
  return `${d} ${MONTH_SHORT[m - 1]}`;
};
const OFF_TEXT = { WO: "Week off", H: "Holiday", A: "Absent" };

/** Totals of one employee for the days in the report (works for a date range too) */
export function rangeTotals(days) {
  const t = {
    present: 0,
    halfDay: 0,
    absent: 0,
    missingOut: 0,
    offDayWork: 0,
    minutes: 0,
    punched: 0,
  };
  for (const d of days) {
    if (d.status === "PRESENT") t.present++;
    if (d.status === "HALF_DAY") t.halfDay++;
    if (d.status === "ABSENT") t.absent++;
    if (d.status === "MISSING_OUT") t.missingOut++;
    if (d.offDayWork) t.offDayWork++;
    if (d.firstPunchIST) t.punched++;
    t.minutes += d.minutes || 0;
  }
  t.hours = t.minutes
    ? `${Math.floor(t.minutes / 60)}h ${String(t.minutes % 60).padStart(2, "0")}m`
    : "0h 00m";
  return t;
}

/** Keep only some days / people: { from, to } = yyyy-MM-dd, team = Marketing | Developer, q = name / ID */
export function sliceReport(report, { from, to, team, q } = {}) {
  const inRange = (d) => (!from || d.date >= from) && (!to || d.date <= to);
  const text = String(q || "")
    .trim()
    .toLowerCase();
  const days = report.days.filter(inRange);
  const rows = report.rows
    .filter(
      (r) =>
        (!team || r.team === team) &&
        (!text ||
          r.name.toLowerCase().includes(text) ||
          r.employeeId.toLowerCase().includes(text)),
    )
    .map((r) => ({ ...r, days: r.days.filter(inRange) }));
  const range = days.length
    ? { from: days[0].date, to: days[days.length - 1].date }
    : null;
  const full = days.length === report.days.length;
  return {
    ...report,
    days,
    rows,
    range,
    rangeLabel:
      full || !range
        ? report.label
        : range.from === range.to
          ? niceDate(range.from)
          : `${niceDate(range.from)} to ${niceDate(range.to)}`,
  };
}

/** Freeze panes (xlsx-js-style can't write them, so patch the sheet XML). freeze = { 1: "D6" } -> sheet1 */
function withFrozenPanes(buf, XLSXlib, freeze) {
  try {
    const C = XLSXlib.CFB;
    const zip = C.read(buf, { type: "buffer" });
    for (const [n, cellRef] of Object.entries(freeze)) {
      const i = zip.FullPaths.findIndex((p) =>
        p.endsWith(`xl/worksheets/sheet${n}.xml`),
      );
      if (i < 0) continue;
      const e = zip.FileIndex[i];
      const m = cellRef.match(/^([A-Z]+)(\d+)$/);
      const col =
        m[1].split("").reduce((a, ch) => a * 26 + ch.charCodeAt(0) - 64, 0) - 1;
      const row = Number(m[2]) - 1;
      const pane = `<pane xSplit="${col}" ySplit="${row}" topLeftCell="${cellRef}" activePane="bottomRight" state="frozen"/><selection pane="bottomRight" activeCell="${cellRef}" sqref="${cellRef}"/>`;
      const xml = Buffer.from(e.content)
        .toString("utf8")
        .replace(
          /<sheetView workbookViewId="0"\/>/,
          `<sheetView workbookViewId="0">${pane}</sheetView>`,
        );
      e.content = Buffer.from(xml, "utf8");
      e.size = e.content.length;
    }
    return C.write(zip, { fileType: "zip", type: "buffer", compression: true });
  } catch (err) {
    console.error("freeze panes skipped:", err.message);
    return buf;
  }
}

const BORDER = { style: "thin", color: { rgb: "D8DAD5" } };
const BOX = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };
const HEAD_OFF = { ...HEAD, fill: { fgColor: { rgb: "65727A" } } }; // Saturday / Sunday header

/* ---- Punch In / Out: one row per employee, In + Out under every date ---- */
function addPunchSheet(wb, report, sheetName = "Punch In-Out") {
  const FIX = 3; // Employee ID, Name, Team
  const TAIL = ["Present", "Half day", "Absent", "No punch-out", "Total hours"];
  const HR = 3; // first header row index (0-based)
  const center = { horizontal: "center", vertical: "center", wrapText: true };

  const dayHead = (d) => (d.weekday === 0 || d.weekday === 6 ? HEAD_OFF : HEAD);
  const h1 = [
    ...["Employee ID", "Name", "Team"].map((t) => cell(t, HEAD)),
    ...report.days.flatMap((d) => [
      cell(`${WEEK[d.weekday]} ${niceDate(d.date)}`, dayHead(d)),
      cell("", dayHead(d)),
    ]),
    ...TAIL.map((t) => cell(t, HEAD)),
  ];
  const h2 = [
    ...Array(FIX)
      .fill(0)
      .map(() => cell("", HEAD)),
    ...report.days.flatMap((d) => [
      cell("Punch in", dayHead(d)),
      cell("Punch out", dayHead(d)),
    ]),
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
    const zebra = ri % 2 ? { fgColor: { rgb: "F7F6F1" } } : undefined;
    const out = [
      cell(r.employeeId, { font: { bold: true }, fill: zebra, border: BOX }),
      cell(r.name, { font: { bold: true }, fill: zebra, border: BOX }),
      cell(r.team, { fill: zebra, border: BOX }),
    ];
    r.days.forEach((d, i) => {
      const c = FIX + i * 2;
      const fill = d.code
        ? { fgColor: { rgb: FILL[d.code] || "FFFFFF" } }
        : zebra;
      const st = { fill, alignment: center, font: { sz: 10 }, border: BOX };
      if (d.firstPunchIST) {
        const inTxt = `${d.firstPunchIST}${d.offDayWork ? " *" : ""}`;
        const outTxt = d.lastPunchIST
          ? d.lastPunchIST
          : d.code === "IN"
            ? "Working"
            : "No punch-out";
        out.push(
          cell(inTxt, st),
          cell(
            outTxt,
            d.lastPunchIST
              ? st
              : {
                  ...st,
                  font: { sz: 10, bold: true, color: { rgb: "B42318" } },
                },
          ),
        );
      } else if (d.code) {
        // Absent / Week off / Holiday: one merged cell across In + Out
        out.push(
          cell(OFF_TEXT[d.code] || d.code, {
            ...st,
            font: {
              sz: 10,
              bold: d.code === "A",
              color: d.code === "A" ? { rgb: "B42318" } : { rgb: "65727A" },
            },
          }),
          cell("", st),
        );
        merges.push({ s: { r: rowIdx, c }, e: { r: rowIdx, c: c + 1 } });
      } else {
        out.push(
          cell("", { fill: zebra, border: BOX }),
          cell("", { fill: zebra, border: BOX }),
        );
      }
    });
    const t = rangeTotals(r.days);
    const tail = {
      alignment: center,
      fill: zebra,
      border: BOX,
      font: { bold: true },
    };
    out.push(
      cell(t.present, tail),
      cell(t.halfDay, tail),
      cell(t.absent, tail),
      cell(t.missingOut, tail),
      cell(t.hours, tail),
    );
    return out;
  });

  const ws = XLSX.utils.aoa_to_sheet([
    [
      cell(`Punch in / punch out: ${report.rangeLabel || report.label}`, {
        font: { bold: true, sz: 14, color: { rgb: "0B3048" } },
      }),
    ],
    [
      cell(
        "Times are IST. Day = US Central workday. Punch in = first punch, Punch out = last punch of the day. No punch-out = forgot to punch out. * = worked on a day off. Grey dates are Saturday / Sunday.",
        { font: { italic: true, color: { rgb: "65727A" } } },
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
  ws["!rows"] = [
    { hpt: 22 },
    {},
    {},
    { hpt: 24 },
    { hpt: 20 },
    ...body.map(() => ({ hpt: 20 })),
  ];
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
}

/* ---- Punch list: one row per employee per day, with a filter on every column ---- */
function addPunchListSheet(wb, report, sheetName = "Punch list") {
  const head = [
    "Date",
    "Day",
    "Employee ID",
    "Name",
    "Team",
    "Punch in (IST)",
    "Punch out (IST)",
    "Hours",
    "Status",
  ];
  const rows = [];
  for (const d of report.days) {
    for (const r of report.rows) {
      const x = r.days.find((y) => y.date === d.date);
      if (!x || (!x.code && !x.firstPunchIST)) continue; // future day / before joining
      rows.push([
        x.date,
        WEEK[x.weekday],
        r.employeeId,
        r.name,
        r.team,
        x.firstPunchIST || "",
        x.lastPunchIST ||
          (x.firstPunchIST
            ? x.code === "IN"
              ? "Working"
              : "No punch-out"
            : ""),
        x.hours || "",
        `${STATUS_LABEL[x.status] || ""}${x.offDayWork ? " (day off)" : ""}`,
      ]);
    }
  }
  const ws = XLSX.utils.aoa_to_sheet([
    head.map((h) => cell(h, HEAD)),
    ...rows.map((row) =>
      row.map((v, i) =>
        cell(v, {
          border: BOX,
          font:
            (i === 6 && v === "No punch-out") || (i === 8 && v === "Absent")
              ? { bold: true, color: { rgb: "B42318" } }
              : undefined,
          alignment: i >= 5 && i <= 7 ? { horizontal: "center" } : undefined,
        }),
      ),
    ),
  ]);
  ws["!cols"] = [
    { wch: 12 },
    { wch: 6 },
    { wch: 12 },
    { wch: 22 },
    { wch: 11 },
    { wch: 15 },
    { wch: 16 },
    { wch: 9 },
    { wch: 22 },
  ];
  ws["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: Math.max(rows.length, 1), c: head.length - 1 },
    }),
  };
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
}

/** Punch report export: grid (date -> punch in / out per employee) + filterable list */
export function punchGridWorkbookBuffer(report) {
  const wb = XLSX.utils.book_new();
  addPunchSheet(wb, report);
  addPunchListSheet(wb, report);
  const buf = XLSX.write(wb, {
    type: "buffer",
    bookType: "xlsx",
    compression: true,
  });
  return withFrozenPanes(buf, XLSX, { 1: "D6", 2: "A2" });
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

  const buf = XLSX.write(wb, {
    type: "buffer",
    bookType: "xlsx",
    compression: true,
  });
  return withFrozenPanes(buf, XLSX, { 2: "D6" });
}

export const statusLegend = STATUS_LABEL;
