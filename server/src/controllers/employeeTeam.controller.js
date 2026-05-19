import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* =====================================================
   GET MY TEAM
===================================================== */

export const getMyTeam = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;

    // =========================================
    // CHECK TEAM LEADER
    // =========================================

    let team = await prisma.team.findFirst({
      where: {
        leaderId: employeeId,

        isActive: true,
      },

      select: {
        id: true,

        name: true,

        targetValue: true,

        leaderId: true,

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
    });

    // =========================================
    // CHECK TEAM MEMBER
    // =========================================

    if (!team) {
      const memberTeam = await prisma.teamMember.findFirst({
        where: {
          employeeId,
        },

        include: {
          team: {
            select: {
              id: true,

              name: true,

              targetValue: true,

              leaderId: true,

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
          },
        },
      });

      team = memberTeam?.team || null;
    }

    // =========================================
    // NO TEAM
    // =========================================

    if (!team) {
      return res.status(404).json({
        success: false,

        message: "No team assigned",
      });
    }

    return res.status(200).json({
      success: true,

      team,
    });
  } catch (error) {
    console.error("GET MY TEAM ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Server error",
    });
  }
};

/* =====================================================
   GET EMPLOYEE TEAM REPORTS
===================================================== */

export const getEmployeeTeamReports = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;

    const { month, year } = req.query;

    // =========================================
    // FIND TEAM
    // =========================================

    let team = await prisma.team.findFirst({
      where: {
        leaderId: employeeId,

        isActive: true,
      },
    });

    // =========================================
    // CHECK MEMBER TEAM
    // =========================================

    if (!team) {
      const memberTeam = await prisma.teamMember.findFirst({
        where: {
          employeeId,
        },

        include: {
          team: true,
        },
      });

      team = memberTeam?.team || null;
    }

    // =========================================
    // NO TEAM
    // =========================================

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "No team found",
      });
    }

    // =========================================
    // GET REPORTS
    // =========================================

    const reports = await prisma.teamMonthlyReport.findMany({
      where: {
        teamId: team.id,

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
        createdAt: "asc",
      },
    });

    // =========================================
    // GET ANNOUNCEMENTS
    // =========================================

    const announcements = await prisma.teamDealAnnouncement.findMany({
      where: {
        ...(month && {
          month: Number(month),
        }),

        ...(year && {
          year: Number(year),
        }),
      },
    });

    // =========================================
    // MERGE DEAL VALUE
    // =========================================

    const updatedReports = reports.map((report) => {
      const announcement = announcements.find(
        (item) => item.employeeId === report.employeeId,
      );

      return {
        ...report,

        dealValue: announcement?.amount || 0,
      };
    });

    return res.status(200).json({
      success: true,

      reports: updatedReports,
    });
  } catch (error) {
    console.error("GET EMPLOYEE TEAM REPORTS ERROR:", error);

    return res.status(500).json({
      success: false,

      message: "Server error",
    });
  }
};
