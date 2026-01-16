// server/src/routes/incentiveRoutes.js

import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate, authorizeRole } from "../middlewares/auth.js";
import { toZonedTime, format } from "date-fns-tz";

import {
  toDateKey,
  findPlanForDate,
  findPlansForDate,
  doesRuleMatchLead,
  normalizeLeadTypeString,
} from "../utils/incentiveUtils.js";

const USA_TZ = "America/Chicago";
const router = express.Router();
const prisma = new PrismaClient();

/* ================================
   ROUTES
   ================================ */

/**
 * GET /api/incentives
 * - Employees: returns only active plans (isActive = true)
 * - Admin: returns all plans (active + inactive)
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const isAdmin = req.user && req.user.role === "ADMIN";

    const where = isAdmin ? {} : { isActive: true };

    const plans = await prisma.incentivePlan.findMany({
      where,
      include: {
        rules: { orderBy: { id: "asc" } },
      },
      orderBy: { validFrom: "desc" },
    });

    return res.json(plans);
  } catch (error) {
    console.error("Error fetching incentives:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/incentives/:id
 * Return single plan (admin + employees, but employees cannot see inactive plans)
 */
router.get("/:id", authenticate, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });

    const plan = await prisma.incentivePlan.findUnique({
      where: { id },
      include: { rules: { orderBy: { id: "asc" } } },
    });

    if (!plan) return res.status(404).json({ message: "Not found" });

    // if user is not admin and plan is inactive, hide it
    const isAdmin = req.user && req.user.role === "ADMIN";
    if (!isAdmin && !plan.isActive) {
      return res.status(404).json({ message: "Not found" });
    }

    return res.json(plan);
  } catch (error) {
    console.error("Error fetching incentive:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/incentives
 * Create new incentive plan with rules.
 * Admin only.
 * Behaviour: do NOT auto-close existing plans; admin must deactivate manually.
 */
router.post("/", authenticate, authorizeRole("ADMIN"), async (req, res) => {
  try {
    const {
      title,
      description,
      icon,
      accentColor,
      bgAccent,
      validFrom, // optional ISO string - if provided will be used
      rules = [],
    } = req.body;

    const now = new Date();

    // Create the new plan (do NOT deactivate existing plans automatically)
    const plan = await prisma.incentivePlan.create({
      data: {
        title,
        description,
        icon,
        accentColor,
        bgAccent,
        isActive: true,
        validFrom: validFrom ? new Date(validFrom) : now,
        validTo: null,
        rules: {
          create: rules.map((r) => ({
            leadType: r.leadType,
            country: r.country || null,
            attendeesMinCount: r.attendeesMinCount || null,
            industryDomain: r.industryDomain || null,
            leadsRequired: Number(r.leadsRequired || 0),
            amount: Number(r.amount || 0),
            isActive: r.isActive !== undefined ? Boolean(r.isActive) : true,
          })),
        },
      },
      include: { rules: true },
    });

    // Notify active employees
    const employees = await prisma.employee.findMany({
      where: { role: "EMPLOYEE", isActive: true },
      select: { id: true },
    });

    if (employees.length > 0) {
      await prisma.notification.createMany({
        data: employees.map((emp) => ({
          userId: emp.id,
          title: "New Incentive Plan Added",
          message: `Admin added a new incentive plan: ${title}`,
          link: "/employee-dashboard",
          type: "info",
        })),
      });
    }

    return res.status(201).json(plan);
  } catch (err) {
    console.error("Error creating incentive plan:", err);
    return res.status(500).json({ message: "Failed to create incentive plan" });
  }
});

/**
 * PUT /api/incentives/:id
 * Update plan meta and replace rules atomically.
 * Admin only.
 *
 * Note: We do not auto-deactivate other plans here; admin should manage activation/deactivation manually.
 */
router.put("/:id", authenticate, authorizeRole("ADMIN"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });

    const {
      title,
      description,
      icon,
      accentColor,
      bgAccent,
      validFrom,
      validTo,
      isActive,
      rules = [],
    } = req.body;

    const existing = await prisma.incentivePlan.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Not found" });

    // Update plan meta
    await prisma.incentivePlan.update({
      where: { id },
      data: {
        title,
        description,
        icon,
        accentColor,
        bgAccent,
        isActive: typeof isActive === "boolean" ? isActive : existing.isActive,
        validFrom: validFrom ? new Date(validFrom) : existing.validFrom,
        validTo: validTo ? new Date(validTo) : existing.validTo,
      },
    });

    // Replace rules: delete existing rules and create new set
    await prisma.incentiveRule.deleteMany({ where: { incentivePlanId: id } });

    if (rules.length > 0) {
      await prisma.incentiveRule.createMany({
        data: rules.map((r) => ({
          leadType: r.leadType,
          country: r.country || null,
          attendeesMinCount: r.attendeesMinCount || null,
          industryDomain: r.industryDomain || null,
          leadsRequired: Number(r.leadsRequired || 0),
          amount: Number(r.amount || 0),
          isActive: r.isActive !== undefined ? Boolean(r.isActive) : true,
          incentivePlanId: id,
        })),
      });
    }

    const updated = await prisma.incentivePlan.findUnique({
      where: { id },
      include: { rules: { orderBy: { id: "asc" } } },
    });

    return res.json(updated);
  } catch (err) {
    console.error("Error updating incentive plan:", err);
    return res.status(500).json({ message: "Failed to update incentive plan" });
  }
});

/**
 * POST /api/incentives/:id/activate
 * Activate a plan (admin only) - currently activates this plan but does NOT deactivate others.
 */
router.post(
  "/:id/activate",
  authenticate,
  authorizeRole("ADMIN"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      const updated = await prisma.incentivePlan.update({
        where: { id },
        data: {
          isActive: true,
          validTo: null,
        },
      });

      return res.json({
        message: "Plan activated successfully",
        plan: updated,
      });
    } catch (err) {
      console.error("Error activating plan:", err);
      return res.status(500).json({ message: "Failed to activate plan" });
    }
  }
);

/**
 * POST /api/incentives/:id/deactivate
 * Deactivate the plan (admin only) - set isActive false and validTo now
 */
router.post(
  "/:id/deactivate",
  authenticate,
  authorizeRole("ADMIN"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      const updated = await prisma.incentivePlan.update({
        where: { id },
        data: {
          isActive: false,
          validTo: new Date(),
        },
      });

      return res.json({
        message: "Plan deactivated successfully",
        plan: updated,
      });
    } catch (err) {
      console.error("Error deactivating plan:", err);
      return res.status(500).json({ message: "Failed to deactivate plan" });
    }
  }
);

/**
 * DELETE /api/incentives/:id
 * Soft-delete behaviour: mark inactive + set validTo = now.
 * (Administrators asked to avoid permanent deletes.)
 */
router.delete(
  "/:id",
  authenticate,
  authorizeRole("ADMIN"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });

      const plan = await prisma.incentivePlan.findUnique({ where: { id } });
      if (!plan) return res.status(404).json({ message: "Not found" });

      const now = new Date();
      await prisma.incentivePlan.update({
        where: { id },
        data: { isActive: false, validTo: now },
      });

      return res.json({ message: "Plan marked inactive" });
    } catch (err) {
      console.error("Error deleting (deactivating) plan:", err);
      return res.status(500).json({ message: "Failed to deactivate plan" });
    }
  }
);

/**
 * POST /api/incentives/:id/rules
 * Create one or many rules under a plan. (Admin)
 */
router.post(
  "/:id/rules",
  authenticate,
  authorizeRole("ADMIN"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });

      const plan = await prisma.incentivePlan.findUnique({ where: { id } });
      if (!plan) return res.status(404).json({ message: "Plan not found" });

      const { rules = [] } = req.body;
      if (!Array.isArray(rules) || rules.length === 0) {
        return res.status(400).json({ message: "No rules provided" });
      }

      const created = await prisma.incentiveRule.createMany({
        data: rules.map((r) => ({
          leadType: r.leadType,
          country: r.country || null,
          attendeesMinCount: r.attendeesMinCount || null,
          industryDomain: r.industryDomain || null,
          leadsRequired: Number(r.leadsRequired || 0),
          amount: Number(r.amount || 0),
          isActive: r.isActive !== undefined ? Boolean(r.isActive) : true,
          incentivePlanId: id,
        })),
      });

      return res.status(201).json({ createdCount: created.count });
    } catch (err) {
      console.error("Error creating rules:", err);
      return res.status(500).json({ message: "Failed to create rules" });
    }
  }
);

/**
 * PUT /api/incentives/rules/:ruleId
 * Update a single rule (Admin)
 */
router.put(
  "/rules/:ruleId",
  authenticate,
  authorizeRole("ADMIN"),
  async (req, res) => {
    try {
      const ruleId = Number(req.params.ruleId);
      if (isNaN(ruleId))
        return res.status(400).json({ message: "Invalid rule id" });

      const {
        leadType,
        country,
        attendeesMinCount,
        industryDomain,
        leadsRequired,
        amount,
        isActive,
      } = req.body;

      const rule = await prisma.incentiveRule.findUnique({
        where: { id: ruleId },
      });
      if (!rule) return res.status(404).json({ message: "Rule not found" });

      const updated = await prisma.incentiveRule.update({
        where: { id: ruleId },
        data: {
          leadType: leadType ?? rule.leadType,
          country: country ?? rule.country,
          attendeesMinCount: attendeesMinCount ?? rule.attendeesMinCount,
          industryDomain: industryDomain ?? rule.industryDomain,
          leadsRequired:
            leadsRequired !== undefined
              ? Number(leadsRequired)
              : rule.leadsRequired,
          amount: amount !== undefined ? Number(amount) : rule.amount,
          isActive: isActive !== undefined ? Boolean(isActive) : rule.isActive,
        },
      });

      return res.json(updated);
    } catch (err) {
      console.error("Error updating rule:", err);
      return res.status(500).json({ message: "Failed to update rule" });
    }
  }
);

/**
 * DELETE /api/incentives/rules/:ruleId
 * Soft-delete (deactivate) a rule
 */
router.delete(
  "/rules/:ruleId",
  authenticate,
  authorizeRole("ADMIN"),
  async (req, res) => {
    try {
      const ruleId = Number(req.params.ruleId);
      if (isNaN(ruleId))
        return res.status(400).json({ message: "Invalid rule id" });

      const rule = await prisma.incentiveRule.findUnique({
        where: { id: ruleId },
      });
      if (!rule) return res.status(404).json({ message: "Rule not found" });

      await prisma.incentiveRule.update({
        where: { id: ruleId },
        data: { isActive: false },
      });

      return res.json({ message: "Rule deactivated" });
    } catch (err) {
      console.error("Error deactivating rule:", err);
      return res.status(500).json({ message: "Failed to deactivate rule" });
    }
  }
);

/* ================================
   PROGRESS API
   ================================ */

/**
 * GET /api/incentives/progress/:employeeId
 *
 * - Computes today's achieved incentive for the employee.
 * - Steps:
 *    1. Fetch all incentive plans and their rules (active + inactive) because leads may map to older plans
 *    2. Fetch employee qualified leads for today
 *    3. Group leads by all plans valid at their lead.date (using findPlansForDate)
 *    4. For each plan group, compute matching rules and highest achieved tier
 *
 * Response: { achieved: { planId, planTitle, ruleId, leadsRequired, amount } | null }
 */
router.get("/progress/:employeeId", authenticate, async (req, res) => {
  try {
    const { employeeId } = req.params;
    if (!employeeId)
      return res.status(400).json({ message: "Missing employeeId" });

    // 1. Load all plans and their rules (both active and inactive) - we need historical plans
    const plans = await prisma.incentivePlan.findMany({
      include: { rules: { orderBy: { id: "asc" } } },
    });

    // 2. Fetch today's qualified leads for that employee
    const todayStr = format(toZonedTime(new Date(), USA_TZ), "yyyy-MM-dd");

    const leads = await prisma.lead.findMany({
      where: {
        employeeId,
        qualified: true,
      },
    });

    const todayLeads = leads.filter((l) => {
      const ds = toDateKey(l.date);
      return ds === todayStr;
    });

    if (todayLeads.length === 0) {
      return res.json({ achieved: null, details: { todayLeadsCount: 0 } });
    }

    // 3. Group leads by planId (determined by their date) - attach lead to all matching plans
    const groups = {}; // planId -> array of leads
    const unknownPlanKey = "__NO_PLAN__";

    for (const lead of todayLeads) {
      const planList = findPlansForDate(plans, lead.date);
      if (!planList || planList.length === 0) {
        if (!groups[unknownPlanKey])
          groups[unknownPlanKey] = { plan: null, leads: [] };
        groups[unknownPlanKey].leads.push(lead);
      } else {
        for (const p of planList) {
          const key = String(p.id);
          if (!groups[key]) groups[key] = { plan: p, leads: [] };
          groups[key].leads.push(lead);
        }
      }
    }

    // 4. For each group compute which rule (if any) is achieved
    let achieved = null;

    for (const [key, group] of Object.entries(groups)) {
      const { plan, leads: groupLeads } = group;

      if (!plan) {
        // no historical plan for these leads - skip
        continue;
      }

      const activeRules = (plan.rules || []).filter((r) => r.isActive);

      if (!activeRules || activeRules.length === 0) continue;

      const ruleMatches = [];

      for (const rule of activeRules) {
        const count = groupLeads.reduce((acc, lead) => {
          if (doesRuleMatchLead(rule, lead)) return acc + 1;
          return acc;
        }, 0);

        if (count >= (rule.leadsRequired || 0) && rule.leadsRequired > 0) {
          ruleMatches.push({
            ruleId: rule.id,
            planId: plan.id,
            planTitle: plan.title,
            leadsRequired: rule.leadsRequired,
            amount: rule.amount,
            matchedCount: count,
          });
        }
      }

      if (ruleMatches.length > 0) {
        ruleMatches.sort((a, b) => {
          if (b.amount !== a.amount) return b.amount - a.amount;
          return b.leadsRequired - a.leadsRequired;
        });

        // keep the best match found so far (may be overwritten by later plan groups with higher payout)
        if (!achieved || ruleMatches[0].amount > achieved.amount) {
          achieved = ruleMatches[0];
        }
      }
    }

    return res.json({ achieved });
  } catch (err) {
    console.error("Failed to compute incentive progress:", err);
    return res
      .status(500)
      .json({ error: "Failed to compute incentive progress" });
  }
});

export default router;
