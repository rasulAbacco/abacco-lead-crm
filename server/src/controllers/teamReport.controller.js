// server/src/controllers/teamReport.controller.js

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* =========================================================
   CREATE TEAM
========================================================= */

/* =========================================================
   CREATE TEAM
========================================================= */

export const createTeam = async (req, res) => {
  try {
    const { teamName, teamLeader, members, targetValue } = req.body;

    // =========================================
    // VALIDATION
    // =========================================

    if (!teamName || !teamLeader) {
      return res.status(400).json({
        success: false,
        message: "Team name and leader required",
      });
    }

    // =========================================
    // MEMBER IDS
    // =========================================

    const memberIds = (members || []).map((m) => m.employeeId).filter(Boolean);

    // =========================================
    // CHECK LEADER ALREADY ASSIGNED
    // =========================================

    const existingLeader = await prisma.team.findFirst({
      where: {
        leaderId: teamLeader,
      },
    });

    if (existingLeader) {
      return res.status(400).json({
        success: false,
        message: "Selected leader already assigned to another team",
      });
    }

    // =========================================
    // CHECK MEMBERS ALREADY ASSIGNED
    // =========================================

    const existingMembers = await prisma.teamMember.findMany({
      where: {
        employeeId: {
          in: memberIds,
        },
      },
    });

    if (existingMembers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some employees are already assigned to another team",
      });
    }

    // =========================================
    // CREATE TEAM
    // =========================================

    const team = await prisma.team.create({
      data: {
        name: teamName,

        leaderId: teamLeader,

        targetValue: Number(targetValue) || 0,
      },
    });

    // =========================================
    // CREATE MEMBERS
    // =========================================

    if (memberIds.length > 0) {
      await prisma.teamMember.createMany({
        data: memberIds.map((employeeId) => ({
          teamId: team.id,
          employeeId,
        })),

        skipDuplicates: true,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Team created successfully",
      team,
    });
  } catch (error) {
    console.error("CREATE TEAM ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================================================
   GET TEAMS
========================================================= */
export const getTeams = async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      where: {
        isActive: true,
      },

      include: {
        leader: {
          select: {
            employeeId: true,
            fullName: true,
            email: true,
          },
        },

        members: {
          include: {
            employee: {
              select: {
                employeeId: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      teams,
    });
  } catch (error) {
    console.error("GET TEAMS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
/* =========================================================
   ACTIVE EMPLOYEES
========================================================= */

export const getActiveEmployees = async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      where: {
        isActive: true,
        role: "EMPLOYEE",
      },

      select: {
        employeeId: true,
        fullName: true,
        email: true,
      },

      orderBy: {
        fullName: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      employees,
    });
  } catch (error) {
    console.error("GET EMPLOYEES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================================================
   DELETE TEAM
========================================================= */

export const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.team.delete({
      where: {
        id: Number(id),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Team deleted successfully",
    });
  } catch (error) {
    console.error("DELETE TEAM ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================================================
   CREATE MONTHLY REPORT
========================================================= */

export const createMonthlyReport = async (req, res) => {
  try {
    const { teamId, month, year, reports } = req.body;

    // =========================================
    // VALIDATION
    // =========================================

    if (!teamId || !month || !year) {
      return res.status(400).json({
        success: false,
        message: "Team, month and year required",
      });
    }

    if (!reports || reports.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No report data provided",
      });
    }

    // =========================================
    // UPSERT REPORTS
    // =========================================

    for (const report of reports) {
      await prisma.teamMonthlyReport.upsert({
        where: {
          teamId_employeeId_month_year: {
            teamId: Number(teamId),

            employeeId: report.employeeId,

            month: Number(month),

            year: Number(year),
          },
        },

        // =========================================
        // UPDATE EXISTING
        // =========================================

        update: {
          deal: Number(report.deal || 0),

          invoicePending: Number(report.invoicePending || 0),

          invoiceCancel: Number(report.invoiceCancel || 0),

          activeClients: Number(report.activeClients || 0),

          leaveOutClients: Number(report.leaveOutClients || 0),

          noResponse: Number(report.noResponse || 0),

          totalLeads: Number(report.totalLeads || 0),

          dealValue: Number(report.dealValue || 0),
        },

        // =========================================
        // CREATE NEW
        // =========================================

        create: {
          teamId: Number(teamId),

          employeeId: report.employeeId,

          month: Number(month),

          year: Number(year),

          deal: Number(report.deal || 0),

          invoicePending: Number(report.invoicePending || 0),

          invoiceCancel: Number(report.invoiceCancel || 0),

          activeClients: Number(report.activeClients || 0),

          leaveOutClients: Number(report.leaveOutClients || 0),

          noResponse: Number(report.noResponse || 0),

          totalLeads: Number(report.totalLeads || 0),

          dealValue: Number(report.dealValue || 0),
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Monthly reports saved successfully",
    });
  } catch (error) {
    console.error("CREATE REPORT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================================================
   GET TEAM REPORTS
========================================================= */

/* =========================================================
   GET TEAM REPORTS
========================================================= */

export const getTeamReports = async (req, res) => {
  try {
    const { teamId, month, year } = req.query;

    const reports = await prisma.teamMonthlyReport.findMany({
      where: {
        ...(teamId && {
          teamId: Number(teamId),
        }),

        ...(month && {
          month: Number(month),
        }),

        ...(year && {
          year: Number(year),
        }),
      },

      include: {
        employee: {
          select: {
            employeeId: true,
            fullName: true,
            email: true,
          },
        },

        team: {
          select: {
            id: true,
            name: true,

            // =====================================
            // TEAM TARGET
            // =====================================

            targetValue: true,
          },
        },
      },

      orderBy: [
        {
          year: "desc",
        },
        {
          month: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    return res.status(200).json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error("GET REPORTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================================================
   UPDATE REPORT
========================================================= */

export const updateMonthlyReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await prisma.teamMonthlyReport.update({
      where: {
        id: Number(id),
      },

      data: req.body,
    });

    return res.status(200).json({
      success: true,
      message: "Report updated successfully",
      report,
    });
  } catch (error) {
    console.error("UPDATE REPORT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================================================
   DELETE REPORT
========================================================= */

export const deleteMonthlyReport = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.teamMonthlyReport.delete({
      where: {
        id: Number(id),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Report deleted successfully",
    });
  } catch (error) {
    console.error("DELETE REPORT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================================================
// UPDATE TEAM
// =========================================================

// =========================================================
// UPDATE TEAM
// =========================================================

export const updateTeam = async (req, res) => {
  try {
    const teamId = Number(req.params.id);

    const { teamName, teamLeader, members, targetValue } = req.body;

    // ============================================
    // VALIDATION
    // ============================================

    if (!teamName || !teamLeader) {
      return res.status(400).json({
        success: false,
        message: "Team name and leader are required",
      });
    }

    // ============================================
    // CHECK TEAM EXISTS
    // ============================================

    const existingTeam = await prisma.team.findUnique({
      where: {
        id: teamId,
      },

      include: {
        members: true,
      },
    });

    if (!existingTeam) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // ============================================
    // CHECK DUPLICATE TEAM NAME
    // ============================================

    const duplicateTeam = await prisma.team.findFirst({
      where: {
        name: teamName,

        NOT: {
          id: teamId,
        },
      },
    });

    if (duplicateTeam) {
      return res.status(400).json({
        success: false,
        message: "Team name already exists",
      });
    }

    // ============================================
    // GET ALL MEMBER IDS
    // ============================================

    const memberIds = members?.map((member) => member.employeeId) || [];

    // ============================================
    // CHECK IF EMPLOYEE ALREADY ASSIGNED
    // IN OTHER TEAMS
    // ============================================

    const assignedMembers = await prisma.teamMember.findMany({
      where: {
        employeeId: {
          in: memberIds,
        },

        teamId: {
          not: teamId,
        },
      },
    });

    if (assignedMembers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some employees are already assigned to another team",
      });
    }

    // ============================================
    // CHECK TEAM LEADER
    // ============================================

    const leaderAssigned = await prisma.team.findFirst({
      where: {
        leaderId: teamLeader,

        id: {
          not: teamId,
        },
      },
    });

    if (leaderAssigned) {
      return res.status(400).json({
        success: false,
        message: "Team leader already assigned to another team",
      });
    }

    // ============================================
    // UPDATE TEAM
    // ============================================

    await prisma.team.update({
      where: {
        id: teamId,
      },

      data: {
        name: teamName,

        leaderId: teamLeader,

        targetValue: Number(targetValue) || 0,
      },
    });

    // ============================================
    // DELETE OLD MEMBERS
    // ============================================

    await prisma.teamMember.deleteMany({
      where: {
        teamId,
      },
    });

    // ============================================
    // CREATE NEW MEMBERS
    // ============================================

    if (memberIds.length > 0) {
      await prisma.teamMember.createMany({
        data: memberIds.map((employeeId) => ({
          teamId,
          employeeId,
        })),
      });
    }

    return res.status(200).json({
      success: true,
      message: "Team updated successfully",
    });
  } catch (error) {
    console.error("UPDATE TEAM ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================================================
   SAVE DEAL ANNOUNCEMENTS
========================================================= */

export const saveDealAnnouncements = async (req, res) => {
  try {
    const { month, year, announcements } = req.body;

    if (!month || !year || !Array.isArray(announcements)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payload",
      });
    }

    // ============================================
    // UPSERT ALL ANNOUNCEMENTS
    // ============================================

    for (const item of announcements) {
      await prisma.teamDealAnnouncement.upsert({
        where: {
          employeeId_month_year: {
            employeeId: item.employeeId,

            month: Number(month),

            year: Number(year),
          },
        },

        update: {
          amount: Number(item.amount) || 0,
        },

        create: {
          employeeId: item.employeeId,

          month: Number(month),

          year: Number(year),

          amount: Number(item.amount) || 0,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Deal announcements saved successfully",
    });
  } catch (error) {
    console.error("SAVE DEAL ANNOUNCEMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================================================
   GET DEAL ANNOUNCEMENTS
========================================================= */

export const getDealAnnouncements = async (req, res) => {
  try {
    const { month, year } = req.query;

    const announcements = await prisma.teamDealAnnouncement.findMany({
      where: {
        ...(month && {
          month: Number(month),
        }),

        ...(year && {
          year: Number(year),
        }),
      },

      include: {
        employee: {
          select: {
            employeeId: true,
            fullName: true,
            email: true,
          },
        },
      },

      orderBy: {
        amount: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      announcements,
    });
  } catch (error) {
    console.error("GET DEAL ANNOUNCEMENTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
