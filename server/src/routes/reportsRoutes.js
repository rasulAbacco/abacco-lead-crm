// routes/reportsRoutes.js
import express from "express";
import { authenticate, authorizeRole } from "../middlewares/auth.js";
import { PrismaClient } from "@prisma/client";
import { format, startOfMonth, endOfMonth } from "date-fns";

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to get month name from date
const getMonthName = (date) => {
    return format(date, "MMMM");
};

const monthMap = {
  January: 0,
  February: 1,
  March: 2,
  April: 3,
  May: 4,
  June: 5,
  July: 6,
  August: 7,
  September: 8,
  October: 9,
  November: 10,
  December: 11,
};


// Helper function to get all months in a year
const getAllMonthsInYear = (year) => {
    const months = [];
    for (let month = 0; month < 12; month++) {
        const date = new Date(year, month, 1);
        months.push(format(date, "MMMM"));
    }
    return months;
};

// Get all months with leads data for admin dashboard
// Get all months with leads data for admin dashboard
router.get(
  "/admin/monthly",
  authenticate,
  authorizeRole("ADMIN"),
  async (req, res) => {
    try {
      // 1️⃣ Read query params
      const year = parseInt(req.query.year);
      const monthName = req.query.month; // optional

      if (!year) {
        return res.status(400).json({ message: "Year is required" });
      }

      // 2️⃣ Month name → index
      const monthMap = {
        January: 0,
        February: 1,
        March: 2,
        April: 3,
        May: 4,
        June: 5,
        July: 6,
        August: 7,
        September: 8,
        October: 9,
        November: 10,
        December: 11,
      };

      // 3️⃣ Prepare months container
      const monthsData = {};
      Object.keys(monthMap).forEach((m) => (monthsData[m] = []));

      // 4️⃣ Build Prisma date filter
      let whereCondition = {};

      if (monthName) {
        const monthIndex = monthMap[monthName];
        if (monthIndex === undefined) {
          return res.status(400).json({ message: "Invalid month" });
        }

        whereCondition.date = {
          gte: new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0)),
          lte: new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59)),
        };
      } else {
        whereCondition.date = {
          gte: new Date(Date.UTC(year, 0, 1, 0, 0, 0)),
          lte: new Date(Date.UTC(year, 11, 31, 23, 59, 59)),
        };
      }

      // 5️⃣ Fetch leads
      const leads = await prisma.lead.findMany({
        where: whereCondition,
        include: {
          employee: {
            select: {
              employeeId: true,
              fullName: true,
              email: true,
              target: true, // 🎯 TARGET
            },
          },
        },
        orderBy: { date: "asc" },
      });

      // 6️⃣ Group by MONTH + EMPLOYEE
      leads.forEach((lead) => {
        const month = format(lead.date, "MMMM");
        const empId = lead.employee.employeeId;

        const idx = monthsData[month].findIndex(
          (e) => e.employeeId === empId
        );

        const type = lead.leadType?.toLowerCase() || "";
        const isAssociation = type.includes("association");
        const isAttendee = type.includes("attendee");
        const isIndustry = type.includes("industry");

        if (idx === -1) {
          // 🆕 First record for employee
          monthsData[month].push({
            employeeId: empId,
            name: lead.employee.fullName,
            email: lead.employee.email,

            // 🎯 Target
            target: lead.employee.target || 0,

            // 📊 Counts
            totalLeads: 1,
            qualified: lead.qualified === true ? 1 : 0,
            disqualified: lead.qualified === false ? 1 : 0,

            associationLeads: isAssociation ? 1 : 0,
            attendeeLeads: isAttendee ? 1 : 0,
            industryLeads: isIndustry ? 1 : 0,

            deal: 0,
            active: 0,
            invoicePending: 0,
            invoiceCanceled: 0,
            leaveOut: 0,
            noResponse: 0,
          });
        } else {
          // 🔁 Existing employee
          const emp = monthsData[month][idx];

          emp.totalLeads += 1;
          if (lead.qualified === true) emp.qualified += 1;
          if (lead.qualified === false) emp.disqualified += 1;

          if (isAssociation) emp.associationLeads += 1;
          if (isAttendee) emp.attendeeLeads += 1;
          if (isIndustry) emp.industryLeads += 1;
        }
      });

      // 7️⃣ Return single month if requested
      if (monthName) {
        return res.json({ [monthName]: monthsData[monthName] });
      }

      // 8️⃣ Return full year
      res.json(monthsData);
    } catch (error) {
      console.error("Error fetching monthly reports:", error);
      res.status(500).json({ message: "Failed to fetch monthly reports" });
    }
  }
);






// Get individual employee report - FIXED VERSION

router.get("/employee/:employeeId", authenticate, async (req, res) => {
    try {
        const { employeeId } = req.params;
        const currentUser = req.user;

        console.log("=== REPORT FETCH DEBUG ===");
        console.log("Requested employeeId:", employeeId);
        console.log("Current user:", currentUser);

        // Check if user is requesting their own data or is an admin
        const isOwner = currentUser.employeeId === employeeId;
        const isAdmin = currentUser.role === "ADMIN";

        console.log("Is owner:", isOwner);
        console.log("Is admin:", isAdmin);

        if (!isOwner && !isAdmin) {
            console.log("Access denied: User is not owner or admin");
            return res.status(403).json({
                message: "Access denied",
                details: `You can only view your own reports. Your employeeId: ${currentUser.employeeId}, Requested: ${employeeId}`,
            });
        }

        console.log("Access granted, fetching employee details...");

        // Get employee details
        const employee = await prisma.employee.findUnique({
            where: { employeeId },
            select: {
                employeeId: true,
                fullName: true,
                email: true,
                joiningDate: true,
                target: true
            }
        });

        console.log("Employee details:", employee);

        if (!employee) {
            console.log("Employee not found");
            return res.status(404).json({ message: "Employee not found" });
        }

        console.log("Fetching leads for employee...");

        // Get all leads for this employee
        const leads = await prisma.lead.findMany({
            where: { employeeId },
            orderBy: { date: 'desc' }
        });

        console.log("Found leads:", leads.length);
        console.log("Sample lead:", leads[0]);

        // Group leads by month
        const monthlyData = {};

        leads.forEach(lead => {
            const month = getMonthName(lead.date);

            if (!monthlyData[month]) {
                monthlyData[month] = {
                    month,
                    totalLeads: 0,
                    qualified: 0,
                    disqualified: 0,
                    forwarded: 0,
                    leads: []
                };
            }

            monthlyData[month].totalLeads += 1;
            if (lead.qualified === true) {
                monthlyData[month].qualified += 1;
            } else if (lead.qualified === false) {
                monthlyData[month].disqualified += 1;
            }

            if (lead.forwarded) {
                monthlyData[month].forwarded += 1;
            }

            monthlyData[month].leads.push({
                id: lead.id,
                date: lead.date,
                clientEmail: lead.clientEmail,
                leadEmail: lead.leadEmail,
                subjectLine: lead.subjectLine,
                qualified: lead.qualified,
                forwarded: lead.forwarded,
                leadType: lead.leadType
            });
        });

        console.log("Monthly data keys:", Object.keys(monthlyData));

        // Calculate overall stats
        const totalLeads = leads.length;
        const totalQualified = leads.filter(lead => lead.qualified === true).length;
        const totalDisqualified = leads.filter(lead => lead.qualified === false).length;
        const totalForwarded = leads.filter(lead => lead.forwarded).length;

        const qualificationRate = totalLeads > 0 ? (totalQualified / totalLeads * 100).toFixed(1) : 0;
        const forwardingRate = totalLeads > 0 ? (totalForwarded / totalLeads * 100).toFixed(1) : 0;

        const result = {
            employee,
            stats: {
                totalLeads,
                totalQualified,
                totalDisqualified,
                totalForwarded,
                qualificationRate,
                forwardingRate
            },
            monthlyData
        };

        console.log("Final result:", result);

        res.json(result);
    } catch (error) {
        console.error("Error fetching employee report:", error);
        res.status(500).json({ message: "Failed to fetch employee report" });
    }
});

// Get current month data for quick overview
router.get("/admin/current-month", authenticate, authorizeRole("ADMIN"), async (req, res) => {
    try {
        const now = new Date();
        const startOfCurrentMonth = startOfMonth(now);
        const endOfCurrentMonth = endOfMonth(now);
        const currentMonth = getMonthName(now);

        const leads = await prisma.lead.findMany({
            where: {
                date: {
                    gte: startOfCurrentMonth,
                    lte: endOfCurrentMonth
                }
            },
            include: {
                employee: {
                    select: {
                        employeeId: true,
                        fullName: true,
                        email: true
                    }
                }
            }
        });

        // Group by employee
        const employeesData = {};

        leads.forEach(lead => {
            const employeeId = lead.employeeId;

            if (!employeesData[employeeId]) {
                employeesData[employeeId] = {
                    id: lead.id,
                    employeeId: employeeId,
                    name: lead.employee.fullName,
                    email: lead.employee.email,
                    totalLeads: 0,
                    qualified: 0,
                    disqualified: 0,
                    forwarded: 0
                };
            }

            employeesData[employeeId].totalLeads += 1;
            if (lead.qualified === true) {
                employeesData[employeeId].qualified += 1;
            } else if (lead.qualified === false) {
                employeesData[employeeId].disqualified += 1;
            }

            if (lead.forwarded) {
                employeesData[employeeId].forwarded += 1;
            }
        });

        // Convert to array and sort by total leads
        const employeesArray = Object.values(employeesData).sort(
            (a, b) => b.totalLeads - a.totalLeads
        );

        res.json({
            month: currentMonth,
            employees: employeesArray,
            totalEmployees: employeesArray.length,
            totalLeads: leads.length
        });
    } catch (error) {
        console.error("Error fetching current month data:", error);
        res.status(500).json({ message: "Failed to fetch current month data" });
    }
});

// routes/auth.js (or wherever your auth routes are)
router.post("/refresh-token", authenticate, async (req, res) => {
    try {
        const currentUser = req.user;

        console.log("Refreshing token for user:", currentUser);

        // Fetch employee details to get employeeId
        const employee = await prisma.employee.findUnique({
            where: { id: currentUser.id || currentUser.userId },
            select: {
                id: true,
                employeeId: true,
                role: true,
                email: true,
                fullName: true
            }
        });

        if (!employee) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }

        // Generate new token with all required fields
        const newToken = jwt.sign(
            {
                id: employee.id,
                userId: employee.id,
                employeeId: employee.employeeId,
                email: employee.email,
                role: employee.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "12h" }
        );

        console.log("Generated new token with employeeId:", employee.employeeId);

        res.json({
            success: true,
            token: newToken,
            employeeId: employee.employeeId,
            message: "Token refreshed successfully"
        });
    } catch (error) {
        console.error("Token refresh error:", error);
        res.status(500).json({ success: false, message: "Failed to refresh token" });
    }
});

export default router;