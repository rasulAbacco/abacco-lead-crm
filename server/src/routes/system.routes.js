// System info for every logged-in user: "What's new" popup + data-deletion notices,
// plus retention admin tools and month-report downloads.
import express from "express";
import prisma from "../prismaClient.js";
import { config } from "../config.js";
import { authenticate, requireAdmin, ah } from "../middlewares/auth.js";
import { remember, CK } from "../utils/cache.js";
import { monthLabel, addMonths, centralParts, monthRange } from "../utils/time.js";
import { leadsWorkbookBuffer, sendXlsx } from "../utils/excel.js";
import { runMaintenance, monthLeadsForExport, retentionCutoff } from "../jobs/maintenance.js";
import { RELEASE } from "../releaseNotes.js";

const router = express.Router();
router.use(authenticate);

/** Release date is stored the first time this version starts, so the popup runs 48h from go-live. */
export async function ensureReleaseDate() {
  const key = `release:${RELEASE.version}`;
  const existing = await prisma.appMeta.findUnique({ where: { key } });
  if (existing) return new Date(existing.value);
  const now = new Date();
  await prisma.appMeta.create({ data: { key, value: now.toISOString() } });
  console.log(`🚀 Release ${RELEASE.version} recorded at ${now.toISOString()}`);
  return now;
}

router.get(
  "/status",
  ah(async (req, res) => {
    const data = await remember(`${CK.system}status`, async () => {
      const releasedAt = await ensureReleaseDate();
      const showUntil = new Date(releasedAt.getTime() + config.releasePopupHours * 3600 * 1000);
      const notices = await prisma.retentionRun.findMany({
        where: { status: "NOTIFIED", deleteAfter: { gt: new Date() } },
        orderBy: [{ year: "asc" }, { month: "asc" }],
      });
      return {
        release: { ...RELEASE, releasedAt, showUntil },
        notices: notices.map((n) => ({ id: n.id, year: n.year, month: n.month, label: monthLabel(n.year, n.month), deleteAfter: n.deleteAfter, leadCount: n.leadCount })),
      };
    }, 60);
    const now = Date.now();
    res.json({
      ...data,
      release: { ...data.release, active: now < new Date(data.release.showUntil).getTime() },
      notices: data.notices.filter((n) => new Date(n.deleteAfter).getTime() > now),
      serverTime: new Date(),
    });
  }),
);

/* Download the Excel of a month that is about to be deleted.
   Admin: every lead of the month. Employee: only their own leads. */
router.get(
  "/retention/:id/download",
  ah(async (req, res) => {
    const run = await prisma.retentionRun.findUnique({ where: { id: Number(req.params.id) } });
    if (!run || run.status === "DELETED") return res.status(404).json({ message: "This month's data is no longer available" });
    const leads = await monthLeadsForExport(run, req.isAdmin ? null : req.user.employeeId);
    const label = monthLabel(run.year, run.month);
    const suffix = req.isAdmin ? "all" : req.user.employeeId;
    sendXlsx(res, leadsWorkbookBuffer(leads, label), `leads-${run.year}-${String(run.month).padStart(2, "0")}-${suffix}.xlsx`);
  }),
);

/* Admin overview of the retention schedule */
router.get(
  "/retention",
  requireAdmin,
  ah(async (req, res) => {
    const now = centralParts();
    const cutoff = retentionCutoff();
    const kept = Array.from({ length: config.retentionMonths }, (_, i) => addMonths(now, -i)).reverse();
    const counts = await Promise.all(
      kept.map(async (m) => {
        const r = monthRange(m.year, m.month);
        return { ...m, label: monthLabel(m.year, m.month), leads: await prisma.lead.count({ where: { createdAt: { gte: r.start, lt: r.end } } }) };
      }),
    );
    const next = addMonths(now, 1);
    const runs = await prisma.retentionRun.findMany({ orderBy: [{ year: "desc" }, { month: "desc" }], take: 24 });
    res.json({
      settings: {
        months: config.retentionMonths,
        noticeHours: config.retentionNoticeHours,
        reportEmail: config.retentionReportEmail,
        loginHistoryDays: config.loginHistoryDays,
      },
      keptMonths: counts,
      oldestKept: monthLabel(cutoff.year, cutoff.month),
      nextExpiry: {
        month: monthLabel(kept[0].year, kept[0].month),
        reportOn: `1 ${monthLabel(next.year, next.month)}`,
      },
      runs: runs.map((r) => ({ ...r, label: monthLabel(r.year, r.month) })),
    });
  }),
);

/* Admin: run maintenance now (e.g. retry a failed email) */
router.post(
  "/retention/run",
  requireAdmin,
  ah(async (req, res) => {
    res.json(await runMaintenance());
  }),
);

export default router;
