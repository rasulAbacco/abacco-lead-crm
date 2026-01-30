import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* ============================
   SALES EMPLOYEE MANAGEMENT
   ============================ */

// CREATE sales employee
export const createSalesEmployee = async (req, res) => {
  try {
    const { fullName, email, phone } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({
        message: "Full name and email are required",
      });
    }

    const exists = await prisma.salesEmployee.findUnique({
      where: { email },
    });

    if (exists) {
      return res.status(409).json({
        message: "Sales employee already exists",
      });
    }

    const salesEmployee = await prisma.salesEmployee.create({
      data: { fullName, email, phone },
    });

    res.status(201).json(salesEmployee);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to create sales employee",
    });
  }
};

// LIST sales employees
export const getSalesEmployees = async (req, res) => {
  try {
    const salesEmployees = await prisma.salesEmployee.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json(salesEmployees);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch sales employees",
    });
  }
};

// UPDATE sales employee
// UPDATE sales employee
export const updateSalesEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, phone, email } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({
        message: "Full name and email are required",
      });
    }

    // 🔒 prevent duplicate email
    const emailExists = await prisma.salesEmployee.findFirst({
      where: {
        email,
        NOT: { id: Number(id) },
      },
    });

    if (emailExists) {
      return res.status(409).json({
        message: "Email already in use",
      });
    }

    const updated = await prisma.salesEmployee.update({
      where: { id: Number(id) },
      data: {
        fullName,
        phone,
        email,
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error("UPDATE SALES EMPLOYEE ERROR:", err);
    return res.status(500).json({
      message: "Failed to update sales employee",
    });
  }
};

// ENABLE / DISABLE sales employee
export const toggleSalesEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const updated = await prisma.salesEmployee.update({
      where: { id: Number(id) },
      data: { isActive },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({
      message: "Failed to update status",
    });
  }
};

/* ============================
   LEAD → SALES ASSIGNMENT
   ============================ */

export const assignSalesAndForwardLead = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { salesEmployeeId } = req.body;

    if (!salesEmployeeId) {
      return res.status(400).json({
        message: "salesEmployeeId is required",
      });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: Number(leadId) },
    });

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    const salesEmployee = await prisma.salesEmployee.findUnique({
      where: { id: Number(salesEmployeeId) },
    });

    if (!salesEmployee || !salesEmployee.isActive) {
      return res.status(400).json({
        message: "Invalid or inactive sales employee",
      });
    }

    // ✅ ONLY ASSIGN SALES (NO FORWARDING HERE)
    const updatedLead = await prisma.lead.update({
      where: { id: Number(leadId) },
      data: {
        salesEmployeeId: salesEmployee.id,
        salesEmployeeName: salesEmployee.fullName,
        salesEmployeeEmail: salesEmployee.email,
      },
    });

    return res.json({
      message: "Sales employee assigned successfully",
      lead: updatedLead,
    });
  } catch (error) {
    console.error("Assign sales error:", error);
    return res.status(500).json({
      message: "Failed to assign sales employee",
    });
  }
};
