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


export const assignSalesAndForwardLead = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { salesEmployeeId, statusId } = req.body;

    if (!salesEmployeeId && statusId === undefined) {
      return res.status(400).json({
        message: "Nothing to update",
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

    const updateData = {};

    // 🔹 Update sales only if provided
    if (salesEmployeeId) {
      const salesEmployee = await prisma.salesEmployee.findUnique({
        where: { id: Number(salesEmployeeId) },
      });

      if (!salesEmployee || !salesEmployee.isActive) {
        return res.status(400).json({
          message: "Invalid or inactive sales employee",
        });
      }

      updateData.salesEmployeeId = salesEmployee.id;
      updateData.salesEmployeeName = salesEmployee.fullName;
      updateData.salesEmployeeEmail = salesEmployee.email;
    }

    // 🔹 Update status only if provided
    if (statusId !== undefined) {
      if (statusId) {
        const statusExists = await prisma.leadStatus.findUnique({
          where: { id: Number(statusId) },
        });

        if (!statusExists) {
          return res.status(400).json({
            message: "Invalid status selected",
          });
        }

        updateData.statusId = Number(statusId);
      } else {
        updateData.statusId = null;
      }
    }

    const updatedLead = await prisma.lead.update({
      where: { id: Number(leadId) },
      data: updateData,
    });

    return res.json({
      message: "Lead updated successfully",
      lead: updatedLead,
    });
  } catch (error) {
    console.error("Update lead error:", error);
    return res.status(500).json({
      message: "Failed to update lead",
    });
  }
};

export const createLeadStatus = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Status name is required",
      });
    }

    // prevent duplicate
    const exists = await prisma.leadStatus.findUnique({
      where: { name: name.trim() },
    });

    if (exists) {
      return res.status(409).json({
        message: "Status already exists",
      });
    }

    const status = await prisma.leadStatus.create({
      data: {
        name: name.trim(),
      },
    });

    return res.status(201).json(status);
  } catch (error) {
    console.error("Create status error:", error);
    return res.status(500).json({
      message: "Failed to create status",
    });
  }
};

export const getLeadStatuses = async (req, res) => {
  try {
    const statuses = await prisma.leadStatus.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json(statuses);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch statuses" });
  }
};

// DELETE lead status
export const deleteLeadStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if status exists
    const status = await prisma.leadStatus.findUnique({
      where: { id: Number(id) },
    });

    if (!status) {
      return res.status(404).json({
        message: "Status not found",
      });
    }

    // Check if any leads are using this status
    const usedInLead = await prisma.lead.findFirst({
      where: { statusId: Number(id) },
    });

    if (usedInLead) {
      return res.status(400).json({
        message: "Cannot delete status. It is assigned to one or more leads.",
      });
    }

    await prisma.leadStatus.delete({
      where: { id: Number(id) },
    });

    return res.json({
      message: "Status deleted successfully",
    });
  } catch (error) {
    console.error("Delete status error:", error);
    return res.status(500).json({
      message: "Failed to delete status",
    });
  }
};