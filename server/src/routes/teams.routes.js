// Teams: admin management + monthly team reports + deal announcements,
// and the employee view of their own team.
import express from "express";
import prisma from "../prismaClient.js";
import { authenticate, requireAdmin, ah } from "../middlewares/auth.js";
import { remember, invalidate, CK } from "../utils/cache.js";

const router = express.Router();
router.use(authenticate);

const EMP = { select: { employeeId: true, fullName: true, email: true } };
const REPORT_FIELDS = ["deal", "invoicePending", "invoiceCancel", "activeClients", "leaveOutClients", "noResponse", "totalLeads"];

function reportData(r) {
  const d = {};
  for (const f of REPORT_FIELDS) d[f] = Math.max(0, Math.round(Number(r[f] || 0)));
  d.dealValue = Math.max(0, Number(r.dealValue || 0));
  return d;
}

const monthYear = (q) => ({
  ...(q.month && { month: Number(q.month) }),
  ...(q.year && { year: Number(q.year) }),
});

/* ======================= ADMIN ======================= */

router.get(
  "/admin/teams",
  requireAdmin,
  ah(async (req, res) => {
    const teams = await remember(`${CK.teams}all`, () =>
      prisma.team.findMany({
        where: { isActive: true },
        include: { leader: EMP, members: { include: { employee: EMP } } },
        orderBy: { createdAt: "desc" },
      }),
    );
    res.json({ teams });
  }),
);

async function validateTeam({ teamName, teamLeader, members = [] }, teamId = null) {
  if (!teamName?.trim() || !teamLeader) return "Team name and leader are required";
  const memberIds = members.map((m) => m.employeeId || m).filter(Boolean);
  const notMe = teamId ? { NOT: { id: teamId } } : {};
  if (await prisma.team.findFirst({ where: { name: teamName.trim(), isActive: true, ...notMe } })) return "Team name already exists";
  if (await prisma.team.findFirst({ where: { leaderId: teamLeader, isActive: true, ...notMe } })) return "Selected leader already leads another team";
  const taken = await prisma.teamMember.findMany({
    where: { employeeId: { in: memberIds }, team: { isActive: true }, ...(teamId ? { teamId: { not: teamId } } : {}) },
  });
  if (taken.length) return "Some employees are already in another team";
  return null;
}

router.post(
  "/admin/teams",
  requireAdmin,
  ah(async (req, res) => {
    const err = await validateTeam(req.body);
    if (err) return res.status(400).json({ success: false, message: err });
    const memberIds = (req.body.members || []).map((m) => m.employeeId || m).filter(Boolean);
    const team = await prisma.team.create({
      data: {
        name: req.body.teamName.trim(),
        leaderId: req.body.teamLeader,
        targetValue: Number(req.body.targetValue) || 0,
        members: { create: memberIds.map((employeeId) => ({ employeeId })) },
      },
    });
    invalidate(CK.teams);
    res.status(201).json({ success: true, team });
  }),
);

router.put(
  "/admin/teams/:id",
  requireAdmin,
  ah(async (req, res) => {
    const teamId = Number(req.params.id);
    const err = await validateTeam(req.body, teamId);
    if (err) return res.status(400).json({ success: false, message: err });
    const memberIds = (req.body.members || []).map((m) => m.employeeId || m).filter(Boolean);
    await prisma.$transaction([
      prisma.team.update({
        where: { id: teamId },
        data: { name: req.body.teamName.trim(), leaderId: req.body.teamLeader, targetValue: Number(req.body.targetValue) || 0 },
      }),
      prisma.teamMember.deleteMany({ where: { teamId } }),
      prisma.teamMember.createMany({ data: memberIds.map((employeeId) => ({ teamId, employeeId })) }),
    ]);
    invalidate(CK.teams);
    res.json({ success: true });
  }),
);

router.delete(
  "/admin/teams/:id",
  requireAdmin,
  ah(async (req, res) => {
    await prisma.team.delete({ where: { id: Number(req.params.id) } });
    invalidate(CK.teams);
    res.json({ success: true });
  }),
);

router.get(
  "/admin/reports",
  requireAdmin,
  ah(async (req, res) => {
    const where = { ...monthYear(req.query), ...(req.query.teamId && { teamId: Number(req.query.teamId) }) };
    const reports = await remember(`${CK.teams}reports:${JSON.stringify(where)}`, () =>
      prisma.teamMonthlyReport.findMany({
        where,
        include: { employee: EMP, team: { select: { id: true, name: true, targetValue: true } } },
        orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "asc" }],
      }),
    );
    res.json({ reports });
  }),
);

/* Save the whole month for a team at once (upsert per member) */
router.post(
  "/admin/reports",
  requireAdmin,
  ah(async (req, res) => {
    const { teamId, month, year, reports = [] } = req.body;
    if (!teamId || !month || !year || !reports.length) return res.status(400).json({ message: "Team, month, year and report rows are required" });
    await prisma.$transaction(
      reports.map((r) => {
        const key = { teamId: Number(teamId), employeeId: r.employeeId, month: Number(month), year: Number(year) };
        return prisma.teamMonthlyReport.upsert({
          where: { teamId_employeeId_month_year: key },
          update: reportData(r),
          create: { ...key, ...reportData(r) },
        });
      }),
    );
    invalidate(CK.teams);
    res.json({ success: true });
  }),
);

router.delete(
  "/admin/reports/:id",
  requireAdmin,
  ah(async (req, res) => {
    await prisma.teamMonthlyReport.delete({ where: { id: Number(req.params.id) } });
    invalidate(CK.teams);
    res.json({ success: true });
  }),
);

router.get(
  "/admin/announcements",
  requireAdmin,
  ah(async (req, res) => {
    const announcements = await prisma.teamDealAnnouncement.findMany({
      where: monthYear(req.query),
      include: { employee: EMP },
      orderBy: { amount: "desc" },
    });
    res.json({ announcements });
  }),
);

router.post(
  "/admin/announcements",
  requireAdmin,
  ah(async (req, res) => {
    const { month, year, announcements } = req.body;
    if (!month || !year || !Array.isArray(announcements)) return res.status(400).json({ message: "Invalid payload" });
    await prisma.$transaction(
      announcements.map((a) =>
        prisma.teamDealAnnouncement.upsert({
          where: { employeeId_month_year: { employeeId: a.employeeId, month: Number(month), year: Number(year) } },
          update: { amount: Number(a.amount) || 0 },
          create: { employeeId: a.employeeId, month: Number(month), year: Number(year), amount: Number(a.amount) || 0 },
        }),
      ),
    );
    invalidate(CK.teams);
    res.json({ success: true });
  }),
);

/* ======================= EMPLOYEE ======================= */

async function findMyTeam(employeeId) {
  const include = { leader: EMP, members: { include: { employee: EMP } } };
  const led = await prisma.team.findFirst({ where: { leaderId: employeeId, isActive: true }, include });
  if (led) return led;
  const m = await prisma.teamMember.findFirst({ where: { employeeId, team: { isActive: true } }, include: { team: { include } } });
  return m?.team || null;
}

router.get(
  "/my-team",
  ah(async (req, res) => {
    const team = await findMyTeam(req.user.employeeId);
    if (!team) return res.json({ team: null });
    res.json({ team });
  }),
);

router.get(
  "/my-team/reports",
  ah(async (req, res) => {
    const team = await findMyTeam(req.user.employeeId);
    if (!team) return res.json({ reports: [], team: null });
    const reports = await prisma.teamMonthlyReport.findMany({
      where: { teamId: team.id, ...monthYear(req.query) },
      include: { employee: EMP },
      orderBy: { createdAt: "asc" },
    });
    res.json({ team: { id: team.id, name: team.name, targetValue: team.targetValue }, reports });
  }),
);

/* Deal announcements for the employee's team members (fixes v1 missing endpoint) */
router.get(
  "/my-team/announcements",
  ah(async (req, res) => {
    const team = await findMyTeam(req.user.employeeId);
    if (!team) return res.json({ announcements: [] });
    const ids = [team.leaderId, ...team.members.map((m) => m.employeeId)];
    const announcements = await prisma.teamDealAnnouncement.findMany({
      where: { employeeId: { in: ids }, ...monthYear(req.query) },
      include: { employee: EMP },
      orderBy: { amount: "desc" },
    });
    res.json({ announcements });
  }),
);

export default router;
