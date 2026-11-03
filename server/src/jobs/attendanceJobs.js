// Attendance jobs (run from the maintenance scheduler).
//  - autoClockOut: every few minutes, closes clock-in sessions still open at 4:30 AM IST
//    and flags them "Not clocked out" (hours not counted). Also notifies missing biometric punches.
//  - monthly email: on the 1st (US Central) the previous month's attendance Excel
//    goes to ATTENDANCE_REPORT_EMAIL. Retries every hour until it succeeds.
//  - 2-month retention: punches + sessions older than the previous month are deleted,
//    but only after that month's report was emailed.
import prisma from "../prismaClient.js";
import { config } from "../config.js";
import {
  lastIstCutoff,
  centralParts,
  addMonths,
  monthRange,
  monthLabel,
  formatCentral,
  dateKey,
  dayRangeKey,
} from "../utils/time.js";
import { monthlyAttendance, collapsePunches } from "../services/attendance.js";
import { attendanceWorkbookBuffer } from "../utils/attendanceExcel.js";
import { attendanceReportEmailHtml } from "../utils/emailTemplates.js";
import { sendMail } from "../utils/mailer.js";
import { notify, notifyAdmins } from "../services/notify.js";

const metaKey = (y, m) => `attendance-email:${y}-${String(m).padStart(2, "0")}`;

export async function autoClockOut(now = new Date()) {
  const cutoff = lastIstCutoff(now, config.autoClockOutIst);

  // 1. System clock-in auto close
  const open = await prisma.workSession.findMany({
    where: { clockOut: null, clockIn: { lt: cutoff } },
  });
  for (const s of open) {
    await prisma.workSession.update({
      where: { id: s.id },
      data: { clockOut: cutoff, autoClosed: true },
    });
    await notify(s.employeeId, {
      type: "clock",
      title: "You did not clock out",
      body: `Your clock-in from ${formatCentral(s.clockIn, "MMM d")} was closed automatically at 4:30 AM IST. It shows as "Not clocked out" in the attendance report.`,
      link: "/employee-dashboard",
    });
  }

  // 2. Biometric machine missing punch check
  // The cutoff (4:30 AM IST) falls precisely on the US day of the shift that just ended.
  const shiftDayKey = dateKey(cutoff);
  const { start, end } = dayRangeKey(shiftDayKey);

  const punches = await prisma.biometricPunch.findMany({
    where: { punchTime: { gte: start, lt: end }, employeeId: { not: null } },
    orderBy: { punchTime: "asc" },
  });

  const empPunches = {};
  for (const p of punches) {
    if (!empPunches[p.employeeId]) empPunches[p.employeeId] = [];
    empPunches[p.employeeId].push(p);
  }

  let missedBiometricCount = 0;
  for (const [empId, rawList] of Object.entries(empPunches)) {
    // re-sent / double punches count as one; one real punch = forgot to punch out
    const pList = collapsePunches(rawList.map((p) => p.punchTime)).map((t) => ({
      punchTime: t,
    }));
    if (pList.length === 1) {
      missedBiometricCount++;
      await notify(empId, {
        type: "attendance",
        title: "Missing machine punch-out",
        body: `You only punched the biometric machine once on ${formatCentral(pList[0].punchTime, "MMM d")}. The system closed your day automatically, and your hours are 0.`,
        link: "/employee-dashboard",
      });
    }
  }

  const totalActions = open.length + missedBiometricCount;
  if (totalActions > 0) {
    console.log(
      `⏰ Auto clock-out: ${open.length} session(s) closed, ${missedBiometricCount} missing biometric punches notified at ${cutoff.toISOString()}`,
    );
  }

  return totalActions;
}

/** Build + email one month's attendance report. Returns true when sent. */
export async function emailAttendanceReport(
  year,
  month,
  { force = false } = {},
) {
  const key = metaKey(year, month);
  if (!force && (await prisma.appMeta.findUnique({ where: { key } })))
    return true;
  const report = await monthlyAttendance(year, month);
  const hasData = report.rows.some((r) => r.hasBiometric || r.system.days > 0);
  if (!hasData && !force) {
    // nothing recorded that month (e.g. before attendance was set up): don't email an all-absent report
    await prisma.appMeta.upsert({
      where: { key },
      update: { value: "skipped:no-data" },
      create: { key, value: "skipped:no-data" },
    });
    return true;
  }
  const total = report.rows.reduce(
    (a, r) => ({
      present: a.present + r.summary.present,
      halfDay: a.halfDay + r.summary.halfDay,
      absent: a.absent + r.summary.absent,
      missingOut: a.missingOut + r.summary.missingOut,
      notClockedOut: a.notClockedOut + r.system.notClockedOut,
    }),
    { present: 0, halfDay: 0, absent: 0, missingOut: 0, notClockedOut: 0 },
  );
  try {
    await sendMail({
      to: config.attendanceReportEmail,
      subject: `${report.label} employee attendance report`,
      text: `Attached: ${report.label} attendance report for ${report.rows.length} employees.`,
      html: attendanceReportEmailHtml({
        monthLabel: report.label,
        employees: report.rows.length,
        summary: total,
      }),
      attachments: [
        {
          filename: `attendance-${year}-${String(month).padStart(2, "0")}.xlsx`,
          content: attendanceWorkbookBuffer(report),
        },
      ],
    });
    await prisma.appMeta.upsert({
      where: { key },
      update: { value: new Date().toISOString() },
      create: { key, value: new Date().toISOString() },
    });
    await notifyAdmins({
      type: "attendance",
      title: `${report.label} attendance report emailed`,
      body: `Sent to ${config.attendanceReportEmail}.`,
      link: "/attendance",
      refKey: key,
    });
    console.log(
      `📧 Attendance report ${report.label} emailed to ${config.attendanceReportEmail}`,
    );
    return true;
  } catch (err) {
    console.error(
      `❌ Attendance report ${report.label} email failed:`,
      err.message,
    );
    await notifyAdmins({
      type: "attendance",
      title: `${report.label} attendance email failed`,
      body: `${err.message}. The CRM retries every hour; old punch data is kept until it is sent.`,
      link: "/attendance",
      refKey: `${key}:failed`,
    });
    return false;
  }
}

export async function monthlyAttendanceJobs(now = new Date()) {
  const p = centralParts(now);
  const prev = addMonths(p, -1);
  await emailAttendanceReport(prev.year, prev.month);

  // retention: delete months older than the previous month, once their report was emailed
  const keepFrom = addMonths(p, -(config.attendanceMonths - 1));
  const keepStart = monthRange(keepFrom.year, keepFrom.month).start;
  const oldest = await prisma.biometricPunch.findFirst({
    where: { punchTime: { lt: keepStart } },
    orderBy: { punchTime: "asc" },
    select: { punchTime: true },
  });
  const oldestSession = await prisma.workSession.findFirst({
    where: { clockIn: { lt: keepStart } },
    orderBy: { clockIn: "asc" },
    select: { clockIn: true },
  });
  const first = [oldest?.punchTime, oldestSession?.clockIn]
    .filter(Boolean)
    .sort((a, b) => a - b)[0];
  if (!first) return;
  let m = centralParts(first);
  while (m.year * 12 + m.month < keepFrom.year * 12 + keepFrom.month) {
    const sent = await emailAttendanceReport(m.year, m.month);
    if (sent) {
      const r = monthRange(m.year, m.month);
      const prefix = `${m.year}-${String(m.month).padStart(2, "0")}`;
      const [a, b] = await prisma.$transaction([
        prisma.biometricPunch.deleteMany({
          where: { punchTime: { gte: r.start, lt: r.end } },
        }),
        prisma.workSession.deleteMany({
          where: { workDate: { startsWith: prefix } },
        }),
      ]);
      if (a.count || b.count)
        console.log(
          `🗑️  Attendance: removed ${monthLabel(m.year, m.month)} (${a.count} punches, ${b.count} clock-ins)`,
        );
    }
    m = addMonths(m, 1);
  }
}

export async function cleanupNotifications(now = new Date()) {
  await prisma.notification.deleteMany({
    where: { createdAt: { lt: new Date(now.getTime() - 30 * 86400000) } },
  });
}
