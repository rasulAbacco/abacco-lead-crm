import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ===============================
// DEAL CRUD (WITH FILTER SUPPORT)
// ===============================

export const getDeals = async (req, res) => {
  try {
    const { industry, leadType, dealStatus, month, year } = req.query;

    const where = {};

    if (industry) where.industry = industry;
    if (leadType) where.leadType = leadType;
    if (dealStatus) where.dealStatus = dealStatus;

    // ✅ Filter by stored integer month/year fields directly
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
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(deals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch deals" });
  }
};

export const createDeal = async (req, res) => {
  try {
    // ✅ month and year extracted from body
    const { clientEmail, industry, leadType, dealStatus, month, year } =
      req.body;

    if (!clientEmail) {
      return res.status(400).json({ message: "Client email required" });
    }

    const normalizedEmail = clientEmail.toLowerCase().trim();

    const emailRecord = await prisma.emailDomain.findFirst({
      where: {
        email: normalizedEmail,
        isActive: true,
      },
    });

    if (!emailRecord) {
      return res.status(400).json({
        message: "Email not registered in EmailDomain",
      });
    }

    const deal = await prisma.dealInfo.create({
      data: {
        clientEmail: normalizedEmail,
        industry,
        leadType,
        dealStatus,
        // ✅ Store as integers, null if not provided
        month: month ? Number(month) : null,
        year: year ? Number(year) : null,
        employeeId: emailRecord.employeeId,
      },
    });

    res.status(201).json(deal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create deal" });
  }
};

export const updateDeal = async (req, res) => {
  try {
    const { id } = req.params;
    // ✅ month and year extracted from body
    const { clientEmail, industry, leadType, dealStatus, month, year } =
      req.body;

    const deal = await prisma.dealInfo.update({
      where: { id: Number(id) },
      data: {
        clientEmail,
        industry,
        leadType,
        dealStatus,
        // ✅ Store as integers, null if not provided
        month: month ? Number(month) : null,
        year: year ? Number(year) : null,
      },
    });

    res.json(deal);
  } catch (error) {
    res.status(500).json({ message: "Failed to update deal" });
  }
};

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
// MASTER TABLES CRUD
// ===============================

const masterMap = {
  industries: prisma.industryMaster,
  "lead-types": prisma.leadTypeMaster,
  "deal-status": prisma.dealStatusMaster,
};

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

    if (!table) {
      return res.status(400).json({ message: "Invalid master type" });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    const cleanedName = name.trim();

    const existing = await table.findFirst({
      where: {
        name: {
          equals: cleanedName,
          mode: "insensitive",
        },
      },
    });

    if (existing) {
      return res.status(409).json({ message: "This entry already exists" });
    }

    const data = await table.create({
      data: { name: cleanedName },
    });

    return res.status(201).json(data);
  } catch (error) {
    console.error("Create master error:", error);
    return res.status(500).json({ message: "Failed to create master data" });
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

export const getEmployeeDeals = async (req, res) => {
  try {
    console.log("REQ.USER ===>", req.user);
    const { industry, leadType, dealStatus, month, year } = req.query;

    const where = {};

    // 🔐 Restrict to logged-in employee
    where.employeeId = req.user.employeeId;

    if (industry) where.industry = industry;
    if (leadType) where.leadType = leadType;
    if (dealStatus) where.dealStatus = dealStatus;

    // ✅ Filter by stored integer month/year fields directly
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
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(deals);
  } catch (error) {
    console.error("Employee deals error:", error);
    res.status(500).json({ message: "Failed to fetch employee deals" });
  }
};
