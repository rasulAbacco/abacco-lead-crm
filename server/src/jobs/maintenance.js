// Scheduled maintenance (runs on start-up and every hour; every step is idempotent).
//
// 4-MONTH LEAD RETENTION (by UPLOAD date, whole calendar months, US Central time)
//   Kept: current month + the 3 before it.  Example in May: Feb, Mar, Apr, May.
//   1st of the month 00:00 CT  -> the oldest month (e.g. January) expires:
//        1. Excel report of ALL its leads is emailed to RETENTION_REPORT_EMAIL
//        2. a 48h notice appears for everyone (banner + popup) with download buttons
//   48h after the email          -> all leads of that month are deleted in one go.
//   If the email fails, NOTHING is deleted; it retries every hour.
//
// LOGIN HISTORY older than 7 days, expired OTPs and old sessions are removed.
import prisma from "../prismaClient.js";
import { config } from "../config.js";
import { centralParts, addMonths, monthRange, monthLabel, formatCentral } from "../utils/time.js";
import { leadsWorkbookBuffer } from "../utils/excel.js";
import { sendMail } from "../utils/mailer.js";
import { retentionReportEmailHtml } from "../utils/emailTemplates.js";
import { invalidate, CK } from "../utils/cache.js";
import { notifyEveryone, notifyAdmins } from "../services/notify.js";
import { autoClockOut, monthlyAttendanceJobs, cleanupNotifications } from "./attendanceJobs.js";

let running = false;

/** First month (inclusive) that is still kept */
export function retentionCutoff(now = new Date()) {
  const p = centralParts(now);
  const first = addMonths(p, -(config.retentionMonths - 1));
  return { ...first, start: monthRange(first.year, first.month).start };
}

/** Distinct Central-time months (by upload date) that contain leads older than the cutoff */
async function expiredMonths(cutoffStart) {
  const rows = await prisma.$queryRaw`
    SELECT DISTINCT
      EXTRACT(YEAR  FROM ("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${config.timeZone})::int AS year,
      EXTRACT(MONTH FROM ("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${config.timeZone})::int AS month
    FROM "Lead"
    WHERE "createdAt" < ${cutoffStart}
    ORDER BY 1, 2`;
  return rows.map((r) => ({ year: Number(r.year), month: Number(r.month) }));
}

async function registerExpiredMonths(now) {
  const cutoff = retentionCutoff(now);
  for (const m of await expiredMonths(cutoff.start)) {
    const range = monthRange(m.year, m.month);
    const existing = await prisma.retentionRun.findUnique({ where: { year_month: { year: m.year, month: m.month } } });
    if (existing && existing.status !== "DELETED") continue;
    // A DELETED month that has leads again (should not happen) is processed again.
    const leadCount = await prisma.lead.count({ where: { createdAt: { gte: range.start, lt: range.end } } });
    if (!leadCount) continue;
    await prisma.retentionRun.upsert({
      where: { year_month: { year: m.year, month: m.month } },
      update: { status: "PENDING", leadCount, emailedAt: null, emailError: null, deleteAfter: null, deletedAt: null, deletedCount: null },
      create: { year: m.year, month: m.month, rangeStart: range.start, rangeEnd: range.end, leadCount },
    });
    console.log(`🗓️  Retention: ${monthLabel(m.year, m.month)} expired (${leadCount} leads)`);
  }
}

export async function monthLeadsForExport(run, employeeId = null) {
  return prisma.lead.findMany({
    where: { createdAt: { gte: run.rangeStart, lt: run.rangeEnd }, ...(employeeId && { employeeId }) },
    orderBy: [{ employeeId: "asc" }, { createdAt: "asc" }],
    include: { employee: { select: { fullName: true } } },
  });
}

async function emailPendingReports(now) {
  const pending = await prisma.retentionRun.findMany({ where: { status: "PENDING" }, orderBy: [{ year: "asc" }, { month: "asc" }] });
  for (const run of pending) {
    const label = monthLabel(run.year, run.month);
    const deleteAfter = new Date(now.getTime() + config.retentionNoticeHours * 3600 * 1000);
    try {
      const leads = await monthLeadsForExport(run);
      const buffer = leadsWorkbookBuffer(leads, label);
      await sendMail({
        to: config.retentionReportEmail,
        subject: `Lead report ${label} — will be deleted on ${formatCentral(deleteAfter, "MMM d, yyyy h:mm a")} CT`,
        text: `Attached: all ${leads.length} leads uploaded in ${label}. They will be permanently deleted from the CRM on ${formatCentral(deleteAfter)} (US Central).`,
        html: retentionReportEmailHtml({ monthLabel: label, leadCount: leads.length, deleteAt: formatCentral(deleteAfter) }),
        attachments: [{ filename: `leads-${run.year}-${String(run.month).padStart(2, "0")}.xlsx`, content: buffer }],
      });
      await prisma.retentionRun.update({
        where: { id: run.id },
        data: { status: "NOTIFIED", emailedAt: now, emailError: null, deleteAfter, leadCount: leads.length },
      });
      invalidate(CK.system);
      await notifyEveryone({
        type: "retention",
        title: `${label} leads will be deleted on ${formatCentral(deleteAfter, "MMM d, h:mm a")} CT`,
        body: "The CRM keeps the last 4 months. Download the report before then.",
        link: "/myleads",
        refKey: `retention:${run.year}-${run.month}`,
      });
      console.log(`📧 Retention: ${label} report emailed to ${config.retentionReportEmail}; delete after ${deleteAfter.toISOString()}`);
    } catch (err) {
      await prisma.retentionRun.update({ where: { id: run.id }, data: { emailError: String(err.message || err).slice(0, 500) } });
      console.error(`❌ Retention: email for ${label} failed — will retry, nothing deleted.`, err.message);
      await notifyAdmins({ type: "retention", title: `${label} lead report could not be emailed`, body: `${err.message}. Nothing is deleted; the CRM retries every hour.`, link: "/data-retention", refKey: `retention-failed:${run.year}-${run.month}` });
    }
  }
}

async function deleteDueMonths(now) {
  const due = await prisma.retentionRun.findMany({ where: { status: "NOTIFIED", deleteAfter: { lte: now } } });
  for (const run of due) {
    const { count } = await prisma.lead.deleteMany({ where: { createdAt: { gte: run.rangeStart, lt: run.rangeEnd } } });
    await prisma.retentionRun.update({ where: { id: run.id }, data: { status: "DELETED", deletedAt: now, deletedCount: count } });
    console.log(`🗑️  Retention: deleted ${count} leads of ${monthLabel(run.year, run.month)}`);
  }
  if (due.length) invalidate(CK.leads, CK.system);
}

async function cleanup(now) {
  const historyCutoff = new Date(now.getTime() - config.loginHistoryDays * 86400000);
  const [h, o, s] = await Promise.all([
    prisma.loginHistory.deleteMany({ where: { loginTime: { lt: historyCutoff } } }),
    prisma.loginOtp.deleteMany({ where: { expiresAt: { lt: now } } }),
    // JWTs live 24h, so sessions older than 2 days are useless
    prisma.session.deleteMany({ where: { OR: [{ loginTime: { lt: new Date(now.getTime() - 2 * 86400000) } }, { isActive: false, updatedAt: { lt: historyCutoff } }] } }),
  ]);
  if (h.count || o.count || s.count) {
    console.log(`🧹 Cleanup: ${h.count} login-history rows, ${o.count} OTPs, ${s.count} sessions removed`);
  }
}

export async function runMaintenance(now = new Date()) {
  if (running) return { skipped: true };
  running = true;
  try {
    await cleanup(now);
    await registerExpiredMonths(now);
    await emailPendingReports(now);
    await deleteDueMonths(now);
    await autoClockOut(now);
    await monthlyAttendanceJobs(now);
    await cleanupNotifications(now);
    return { ok: true };
  } catch (err) {
    console.error("Maintenance error:", err);
    return { ok: false, error: err.message };
  } finally {
    running = false;
  }
}

export function startMaintenanceScheduler() {
  setTimeout(() => runMaintenance(), 15_000);
  setInterval(() => runMaintenance(), 60 * 60 * 1000);
  // auto clock-out at 4:30 AM IST is checked every 5 minutes (cheap query)
  setInterval(() => autoClockOut().catch((e) => console.error("Auto clock-out error:", e.message)), 5 * 60 * 1000);
  console.log("⏱️  Maintenance scheduler started (hourly)");
}
