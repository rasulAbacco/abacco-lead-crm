import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ===============================
// HELPER
// ===============================
const parseNullableInt = (val) => {
  if (val === undefined || val === null || val === "") return null;
  return Number(val);
};

// ===============================
// GET DEALS
// ===============================
export const getDeals = async (req, res) => {
  try {
    const {
      industry,
      leadType,
      dealStatus,
      month,
      year,
      industryId,
      eventId,
      associationId,
    } = req.query;

    const where = {};

    if (industry) where.industry = industry;
    if (leadType) where.leadType = leadType;
    if (dealStatus) where.dealStatus = dealStatus;

    if (industryId) where.industryId = Number(industryId);
    if (eventId) where.eventId = Number(eventId);
    if (associationId) where.associationId = Number(associationId);

    if (month) where.month = Number(month);
    if (year) where.year = Number(year);

    const deals = await prisma.dealInfo.findMany({
      where,
      include: {
        employee: {
          select: {
            fullName: true,
            employeeId: true,
          },
        },
        industryRef: true,
        eventRef: true,
        associationRef: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedDeals = deals.map((deal) => ({
      ...deal,
      industry: deal.industryRef?.name || deal.industry,
      eventName: deal.eventRef?.name || null,
      associationName: deal.associationRef?.name || null,
      agentName: deal.employee?.fullName || deal.manualAgentName || null,
      agentEmployeeId:
        deal.employee?.employeeId || deal.manualAgentId || null,
      agentEmail: deal.employee
        ? null
        : deal.manualAgentEmail || deal.clientEmail,
    }));

    res.json(formattedDeals);
  } catch (error) {
    console.error("Fetch deals error:", error);
    res.status(500).json({ message: "Failed to fetch deals" });
  }
};

// ===============================
// CREATE DEAL
// ===============================
export const createDeal = async (req, res) => {
  try {
    const {
      clientEmail,
      industry,
      industryId,
      eventId,
      associationId,
      leadType,
      dealStatus,
      month,
      year,
      manualAgentName,
      manualAgentId,
    } = req.body;

    if (!clientEmail) {
      return res.status(400).json({ message: "Client email required" });
    }

    const normalizedEmail = clientEmail.toLowerCase().trim();

    const emailRecord = await prisma.emailDomain.findFirst({
      where: { email: normalizedEmail, isActive: true },
    });

    let dealData = {
      clientEmail: normalizedEmail,
      industry,
      industryId: parseNullableInt(industryId),
      eventId: parseNullableInt(eventId),
      associationId: parseNullableInt(associationId),
      leadType,
      dealStatus,
      month: parseNullableInt(month),
      year: parseNullableInt(year),
    };

    if (emailRecord) {
      dealData.employeeId = emailRecord.employeeId;
    } else {
      if (!manualAgentName) {
        return res.status(400).json({
          message:
            "Email not found in EmailDomain. Please provide manual agent details.",
        });
      }

      dealData.manualAgentName = manualAgentName;
      dealData.manualAgentId = manualAgentId || null;
      dealData.manualAgentEmail = normalizedEmail;
    }

    const deal = await prisma.dealInfo.create({ data: dealData });

    res.status(201).json(deal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create deal" });
  }
};

// ===============================
// UPDATE DEAL (FIXED)
// ===============================
export const updateDeal = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      clientEmail,
      industry,
      industryId,
      eventId,
      associationId,
      leadType,
      dealStatus,
      month,
      year,
      manualAgentName,
      manualAgentId,
    } = req.body;

    const normalizedEmail = clientEmail?.toLowerCase().trim();

    const emailRecord = normalizedEmail
      ? await prisma.emailDomain.findFirst({
        where: { email: normalizedEmail, isActive: true },
      })
      : null;

    let updateData = {
      ...(normalizedEmail && { clientEmail: normalizedEmail }),
      ...(industry && { industry }),
      ...(leadType && { leadType }),
      ...(dealStatus && { dealStatus }),

      industryId: parseNullableInt(industryId),
      eventId: parseNullableInt(eventId),
      associationId: parseNullableInt(associationId),
      month: parseNullableInt(month),
      year: parseNullableInt(year),
    };

    if (emailRecord) {
      updateData.employeeId = emailRecord.employeeId;
      updateData.manualAgentName = null;
      updateData.manualAgentId = null;
      updateData.manualAgentEmail = null;
    } else {
      updateData.employeeId = null;
      updateData.manualAgentName = manualAgentName || null;
      updateData.manualAgentId = manualAgentId || null;
      updateData.manualAgentEmail = normalizedEmail || null;
    }

    const deal = await prisma.dealInfo.update({
      where: { id: Number(id) },
      data: updateData,
    });

    res.json(deal);
  } catch (error) {
    console.error("UPDATE ERROR:", error);
    res.status(500).json({ message: "Failed to update deal" });
  }
};

// ===============================
// DELETE DEAL
// ===============================
export const deleteDeal = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.dealInfo.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "Deal deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete deal" });
  }
};

// ===============================
// MASTER MAP
// ===============================
const masterMap = {
  industries: prisma.industryMaster,
  "lead-types": prisma.leadTypeMaster,
  "deal-status": prisma.dealStatusMaster,
  events: prisma.eventMaster,
  associations: prisma.associationMaster,
};

// ===============================
// MASTER CRUD
// ===============================
export const getMasters = async (req, res) => {
  try {
    const { type } = req.params;

    const table = masterMap[type];
    if (!table) return res.status(400).json({ message: "Invalid type" });

    const data = await table.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch master data" });
  }
};

export const createMaster = async (req, res) => {
  try {
    const { type } = req.params;
    const { name } = req.body;

    const table = masterMap[type];
    if (!table) return res.status(400).json({ message: "Invalid type" });

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    const cleanedName = name.trim();

    const existing = await table.findFirst({
      where: {
        name: { equals: cleanedName, mode: "insensitive" },
      },
    });

    if (existing) {
      return res.status(409).json({ message: "Already exists" });
    }

    const data = await table.create({
      data: { name: cleanedName },
    });

    res.status(201).json(data);
  } catch (error) {
    console.error("Create master error:", error);
    res.status(500).json({ message: "Failed to create master data" });
  }
};

export const deleteMaster = async (req, res) => {
  try {
    const { type, id } = req.params;

    const table = masterMap[type];
    if (!table) return res.status(400).json({ message: "Invalid type" });

    await table.update({
      where: { id: Number(id) },
      data: { isActive: false },
    });

    res.json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete master data" });
  }
};

// ===============================
// EMPLOYEE DEALS
// ===============================
export const getEmployeeDeals = async (req, res) => {
  try {
    const {
      industry,
      leadType,
      dealStatus,
      month,
      year,
      industryId,
      eventId,
      associationId,
    } = req.query;

    const where = {
      employeeId: req.user.employeeId,
    };

    if (industry) where.industry = industry;
    if (leadType) where.leadType = leadType;
    if (dealStatus) where.dealStatus = dealStatus;

    if (industryId) where.industryId = Number(industryId);
    if (eventId) where.eventId = Number(eventId);
    if (associationId) where.associationId = Number(associationId);

    if (month) where.month = Number(month);
    if (year) where.year = Number(year);

    const deals = await prisma.dealInfo.findMany({
      where,
      include: {
        employee: true,
        industryRef: true,
        eventRef: true,
        associationRef: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(deals);
  } catch (error) {
    console.error("Employee deals error:", error);
    res.status(500).json({ message: "Failed to fetch employee deals" });
  }
};