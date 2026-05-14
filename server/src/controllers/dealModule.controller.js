// dealModule.controller.js
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
// GET DEALS (UPDATED WITH PAGINATION & CHRONO SORT)
// ===============================
export const getDeals = async (req, res) => {
  try {
    const { month, year, page = 1, limit = 20, search = "" } = req.query;

    // PAGINATION
    const p = Math.max(1, Number(page) || 1);
    const l = Math.max(1, Number(limit) || 20);
    const skip = (p - 1) * l;

    // MAIN WHERE
    const where = {};

    // FILTERS
    if (month) {
      where.month = Number(month);
    }

    if (year) {
      where.year = Number(year);
    }

    // UNIVERSAL SEARCH
    if (search && search.trim()) {
      const cleanedSearch = search.trim().toLowerCase();

      const monthMap = {
        january: 1,
        jan: 1,

        february: 2,
        feb: 2,

        march: 3,
        mar: 3,

        april: 4,
        apr: 4,

        may: 5,

        june: 6,
        jun: 6,

        july: 7,
        jul: 7,

        august: 8,
        aug: 8,

        september: 9,
        sep: 9,
        sept: 9,

        october: 10,
        oct: 10,

        november: 11,
        nov: 11,

        december: 12,
        dec: 12,
      };

      const searchConditions = [
        {
          clientEmail: {
            contains: cleanedSearch,
            mode: "insensitive",
          },
        },

        {
          industry: {
            contains: cleanedSearch,
            mode: "insensitive",
          },
        },

        {
          leadType: {
            contains: cleanedSearch,
            mode: "insensitive",
          },
        },

        {
          dealStatus: {
            contains: cleanedSearch,
            mode: "insensitive",
          },
        },

        {
          manualAgentName: {
            contains: cleanedSearch,
            mode: "insensitive",
          },
        },

        {
          manualAgentId: {
            contains: cleanedSearch,
            mode: "insensitive",
          },
        },

        {
          eventRef: {
            name: {
              contains: cleanedSearch,
              mode: "insensitive",
            },
          },
        },

        {
          associationRef: {
            name: {
              contains: cleanedSearch,
              mode: "insensitive",
            },
          },
        },
      ];

      // YEAR SEARCH
      if (!isNaN(cleanedSearch)) {
        const numericValue = Number(cleanedSearch);

        // YEAR
        if (numericValue >= 1900 && numericValue <= 3000) {
          searchConditions.push({
            year: numericValue,
          });
        }

        // MONTH
        if (numericValue >= 1 && numericValue <= 12) {
          searchConditions.push({
            month: numericValue,
          });
        }
      }

      // MONTH NAME SEARCH
      if (monthMap[cleanedSearch]) {
        searchConditions.push({
          month: monthMap[cleanedSearch],
        });
      }

      where.OR = searchConditions;
    }

    // TOTAL COUNT
    const totalCount = await prisma.dealInfo.count({
      where,
    });

    // FETCH DATA
    const deals = await prisma.dealInfo.findMany({
      where,

      include: {
        employee: {
          select: {
            fullName: true,
            employeeId: true,
          },
        },

        industryRef: {
          select: {
            id: true,
            name: true,
          },
        },

        eventRef: {
          select: {
            id: true,
            name: true,
          },
        },

        associationRef: {
          select: {
            id: true,
            name: true,
          },
        },
      },

      orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],

      skip,
      take: l,
    });

    // FORMAT
    const formattedDeals = deals.map((deal) => ({
      ...deal,

      industry: deal.industryRef?.name || deal.industry || null,

      eventName: deal.eventRef?.name || null,

      associationName: deal.associationRef?.name || null,

      agentName: deal.employee?.fullName || deal.manualAgentName || null,

      agentEmployeeId: deal.employee?.employeeId || deal.manualAgentId || null,

      agentEmail: deal.employee
        ? null
        : deal.manualAgentEmail || deal.clientEmail,
    }));

    // RESPONSE
    res.json({
      deals: formattedDeals,

      meta: {
        total: totalCount,
        page: p,
        limit: l,
        totalPages: Math.ceil(totalCount / l),
      },
    });
  } catch (error) {
    console.error("Fetch deals error:", error);

    res.status(500).json({
      message: "Failed to fetch deals",
    });
  }
};

export const getDealYears = async (req, res) => {
  try {
    const years = await prisma.dealInfo.findMany({
      select: {
        year: true,
      },

      distinct: ["year"],

      orderBy: {
        year: "desc",
      },
    });

    const formattedYears = years.map((item) => item.year).filter(Boolean);

    res.json(formattedYears);
  } catch (error) {
    console.error("Fetch years error:", error);

    res.status(500).json({
      message: "Failed to fetch years",
    });
  }
};

// ===============================
// GROUPED DEAL ANALYTICS
// ===============================
export const getDealAnalytics = async (req, res) => {
  try {
    const { month, year, page = 1, limit = 20, search = "" } = req.query;

    // PAGINATION
    const p = Math.max(1, Number(page) || 1);
    const l = Math.max(1, Number(limit) || 20);

    // MAIN WHERE
    const where = {};

    // FILTERS
    if (month) {
      where.month = Number(month);
    }

    if (year) {
      where.year = Number(year);
    }

    // UNIVERSAL SEARCH
    if (search && search.trim()) {
      const cleanedSearch = search.trim().toLowerCase();

      const monthMap = {
        january: 1,
        jan: 1,
        february: 2,
        feb: 2,
        march: 3,
        mar: 3,
        april: 4,
        apr: 4,
        may: 5,
        june: 6,
        jun: 6,
        july: 7,
        jul: 7,
        august: 8,
        aug: 8,
        september: 9,
        sep: 9,
        sept: 9,
        october: 10,
        oct: 10,
        november: 11,
        nov: 11,
        december: 12,
        dec: 12,
      };

      const searchConditions = [
        {
          clientEmail: {
            contains: cleanedSearch,
            mode: "insensitive",
          },
        },

        {
          industry: {
            contains: cleanedSearch,
            mode: "insensitive",
          },
        },

        {
          leadType: {
            contains: cleanedSearch,
            mode: "insensitive",
          },
        },

        {
          dealStatus: {
            contains: cleanedSearch,
            mode: "insensitive",
          },
        },

        {
          manualAgentName: {
            contains: cleanedSearch,
            mode: "insensitive",
          },
        },

        {
          manualAgentId: {
            contains: cleanedSearch,
            mode: "insensitive",
          },
        },

        {
          eventRef: {
            name: {
              contains: cleanedSearch,
              mode: "insensitive",
            },
          },
        },

        {
          associationRef: {
            name: {
              contains: cleanedSearch,
              mode: "insensitive",
            },
          },
        },
      ];

      // YEAR SEARCH
      if (!isNaN(cleanedSearch)) {
        const numericValue = Number(cleanedSearch);

        if (numericValue >= 1900 && numericValue <= 3000) {
          searchConditions.push({
            year: numericValue,
          });
        }

        if (numericValue >= 1 && numericValue <= 12) {
          searchConditions.push({
            month: numericValue,
          });
        }
      }

      // MONTH NAME SEARCH
      if (monthMap[cleanedSearch]) {
        searchConditions.push({
          month: monthMap[cleanedSearch],
        });
      }

      where.OR = searchConditions;
    }

    // FETCH ALL MATCHING DEALS
    const deals = await prisma.dealInfo.findMany({
      where,

      include: {
        employee: {
          select: {
            fullName: true,
            employeeId: true,
          },
        },

        industryRef: {
          select: {
            id: true,
            name: true,
          },
        },

        eventRef: {
          select: {
            id: true,
            name: true,
          },
        },

        associationRef: {
          select: {
            id: true,
            name: true,
          },
        },
      },

      orderBy: [
        { createdAt: "desc" },
      ],
    });

    // GROUPING
    const groupedMap = {};

    deals.forEach((deal) => {
      const eventName =
        deal.eventRef?.name ||
        "General Entry";

      if (!groupedMap[eventName]) {
        groupedMap[eventName] = {
          eventName,

          totalDeals: 0,

          statuses: new Set(),

          periods: new Set(),

          children: [],
        };
      }

      groupedMap[eventName].totalDeals += 1;

      if (deal.dealStatus) {
        groupedMap[eventName].statuses.add(
          deal.dealStatus
        );
      }

      const monthName = deal.month
        ? new Date(
            2026,
            deal.month - 1
          ).toLocaleString("default", {
            month: "short",
          })
        : null;

      const period =
        monthName && deal.year
          ? `${monthName} ${deal.year}`
          : deal.year
          ? `${deal.year}`
          : "—";

      groupedMap[eventName].periods.add(period);

      groupedMap[eventName].children.push({
        id: deal.id,

        industry:
          deal.industryRef?.name ||
          deal.industry ||
          "—",

        dealStatus:
          deal.dealStatus || "—",

        period,

        month: deal.month,

        year: deal.year,

        agentName:
          deal.employee?.fullName ||
          deal.manualAgentName ||
          "—",
      });
    });

    // CONVERT MAP TO ARRAY
    let groupedDeals = Object.values(groupedMap).map(
      (item) => ({
        ...item,

        statuses: Array.from(
          item.statuses
        ),

        periods: Array.from(
          item.periods
        ),
      })
    );

    // SORT BY DEAL COUNT DESC
    groupedDeals.sort(
      (a, b) =>
        b.totalDeals - a.totalDeals
    );

    // PAGINATION
    const totalCount = groupedDeals.length;

    const paginatedDeals =
      groupedDeals.slice(
        (p - 1) * l,
        (p - 1) * l + l
      );

    // RESPONSE
    res.json({
      deals: paginatedDeals,

      meta: {
        total: totalCount,
        page: p,
        limit: l,
        totalPages: Math.ceil(
          totalCount / l
        ),
      },
    });
  } catch (error) {
    console.error(
      "Analytics fetch error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to fetch analytics",
    });
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
      customFields,
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
      customFields: customFields || {},
    };

    if (emailRecord) {
      dealData.employeeId = emailRecord.employeeId;
      dealData.agentResolved = true;
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
      dealData.agentResolved = true;
    }

    const deal = await prisma.dealInfo.create({
      data: dealData,
    });

    res.status(201).json(deal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create deal" });
  }
};

// ===============================
// BULK UPLOAD DEALS
// ===============================
export const bulkUploadDeals = async (req, res) => {
  try {
    const { deals } = req.body;

    if (!Array.isArray(deals) || deals.length === 0) {
      return res.status(400).json({
        message: "Deals array is required",
      });
    }

    const createdDeals = [];
    const unresolvedDeals = [];

    for (const row of deals) {
      const normalizedEmail = row.clientEmail?.toLowerCase().trim();
      if (!normalizedEmail) continue;

      const emailRecord = await prisma.emailDomain.findFirst({
        where: { email: normalizedEmail, isActive: true },
      });

      let industryId = null;
      if (row.industry) {
        const normalizedIndustry = row.industry.trim();
        let industry = await prisma.industryMaster.findFirst({
          where: { name: { equals: normalizedIndustry, mode: "insensitive" } },
        });
        if (!industry) {
          industry = await prisma.industryMaster.create({
            data: { name: normalizedIndustry },
          });
        }
        industryId = industry.id;
      }

      let eventId = null;
      if (row.eventName && row.eventName !== "-") {
        const normalizedEvent = row.eventName.trim();
        let event = await prisma.eventMaster.findFirst({
          where: { name: { equals: normalizedEvent, mode: "insensitive" } },
        });
        if (!event) {
          event = await prisma.eventMaster.create({
            data: { name: normalizedEvent },
          });
        }
        eventId = event.id;
      }

      let associationId = null;
      if (row.associationName && row.associationName !== "-") {
        const normalizedAssociation = row.associationName.trim();
        let association = await prisma.associationMaster.findFirst({
          where: {
            name: { equals: normalizedAssociation, mode: "insensitive" },
          },
        });
        if (!association) {
          association = await prisma.associationMaster.create({
            data: { name: normalizedAssociation },
          });
        }
        associationId = association.id;
      }

      const fixedFields = [
        "clientEmail",
        "industry",
        "industryId",
        "eventId",
        "associationId",
        "leadType",
        "dealStatus",
        "month",
        "year",
        "eventName",
        "associationName",
        "manualAgentName",
      ];

      const customFields = {};
      Object.keys(row).forEach((key) => {
        if (!fixedFields.includes(key)) {
          customFields[key] = row[key];
        }
      });

      const dealData = {
        clientEmail: normalizedEmail,
        industry: row.industry || "",
        industryId,
        eventId,
        associationId,
        leadType: row.leadType || "",
        dealStatus: row.dealStatus || "",
        month: parseNullableInt(row.month),
        year: parseNullableInt(row.year),
        customFields,
      };

      if (emailRecord) {
        dealData.employeeId = emailRecord.employeeId;
        dealData.agentResolved = true;
      } else if (row.manualAgentName) {
        dealData.manualAgentName = row.manualAgentName;
        dealData.manualAgentEmail = normalizedEmail;
        dealData.agentResolved = true;
      } else {
        dealData.agentResolved = false;
        unresolvedDeals.push(normalizedEmail);
      }

      const created = await prisma.dealInfo.create({ data: dealData });
      createdDeals.push(created);
    }

    res.status(201).json({
      success: true,
      totalUploaded: createdDeals.length,
      unresolvedCount: unresolvedDeals.length,
      unresolvedDeals,
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    res.status(500).json({ message: "Failed to upload deals" });
  }
};

// ===============================
// UPDATE DEAL
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
      customFields,
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
      ...(customFields && { customFields }),
    };

    if (emailRecord) {
      updateData.employeeId = emailRecord.employeeId;
      updateData.manualAgentName = null;
      updateData.manualAgentId = null;
      updateData.manualAgentEmail = null;
      updateData.agentResolved = true;
    } else {
      updateData.employeeId = null;
      updateData.manualAgentName = manualAgentName || null;
      updateData.manualAgentId = manualAgentId || null;
      updateData.manualAgentEmail = normalizedEmail || null;
      updateData.agentResolved = !!manualAgentName;
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
    await prisma.dealInfo.delete({ where: { id: Number(id) } });
    res.json({ message: "Deal deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete deal" });
  }
};

// ===============================
// MASTER CRUD (UNCHANGED)
// ===============================
const masterMap = {
  industries: prisma.industryMaster,
  "lead-types": prisma.leadTypeMaster,
  "deal-status": prisma.dealStatusMaster,
  events: prisma.eventMaster,
  associations: prisma.associationMaster,
};

export const getMasters = async (req, res) => {
  try {
    const { type } = req.params;
    const table = masterMap[type];
    if (!table) return res.status(400).json({ message: "Invalid type" });
    const data = await table.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
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
    if (!name || !name.trim())
      return res.status(400).json({ message: "Name is required" });

    const cleanedName = name.trim();
    const existing = await table.findFirst({
      where: { name: { equals: cleanedName, mode: "insensitive" } },
    });
    if (existing) return res.status(409).json({ message: "Already exists" });

    const data = await table.create({ data: { name: cleanedName } });
    res.status(201).json(data);
  } catch (error) {
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
// EMPLOYEE DEALS (UPDATED WITH PAGINATION & CHRONO SORT)
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
      page = 1,
      limit = 20,
    } = req.query;

    const p = Math.max(1, Number(page));
    const l = Math.max(1, Number(limit));
    const skip = (p - 1) * l;

    const where = { employeeId: req.user.employeeId };

    if (industry) where.industry = industry;
    if (leadType) where.leadType = leadType;
    if (dealStatus) where.dealStatus = dealStatus;
    if (industryId) where.industryId = Number(industryId);
    if (eventId) where.eventId = Number(eventId);
    if (associationId) where.associationId = Number(associationId);
    if (month) where.month = Number(month);
    if (year) where.year = Number(year);

    const totalCount = await prisma.dealInfo.count({ where });

    const deals = await prisma.dealInfo.findMany({
      where,
      include: {
        employee: true,
        industryRef: true,
        eventRef: true,
        associationRef: true,
      },
      orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
      skip: skip,
      take: l,
    });

    res.json({
      deals,
      meta: {
        total: totalCount,
        page: p,
        limit: l,
        totalPages: Math.ceil(totalCount / l),
      },
    });
  } catch (error) {
    console.error("Employee deals error:", error);
    res.status(500).json({ message: "Failed to fetch employee deals" });
  }
};
