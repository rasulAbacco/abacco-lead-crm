// middleware/auth.js
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function authenticate(req, res, next) {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(403).json({ message: "Invalid token" });
    }

    // 🔹 Check if session exists and is active
    const session = await prisma.session.findUnique({
      where: { token },
    });

    if (!session || !session.isActive) {
      return res.status(401).json({
        message: "Session expired or logged in from another device",
      });
    }

    // 🔹 Update lastActive timestamp
    await prisma.session.update({
      where: { token },
      data: { lastActive: new Date() },
    });

    // If employeeId not in token, fetch from DB
    if (!decoded.employeeId) {
      const userId = decoded.id || decoded.userId;

      if (!userId) {
        return res
          .status(403)
          .json({ message: "Invalid token: missing user id" });
      }

      const employee = await prisma.employee.findUnique({
        where: { id: userId },
        select: {
          employeeId: true,
          role: true,
          email: true,
        },
      });

      if (!employee) {
        return res.status(403).json({ message: "Employee not found" });
      }

      req.user = {
        id: userId,
        userId: userId,
        employeeId: employee.employeeId,
        email: employee.email,
        role: employee.role,
      };
    } else {
      req.user = {
        id: decoded.id || decoded.userId,
        userId: decoded.userId,
        employeeId: decoded.employeeId,
        email: decoded.email,
        role: decoded.role,
      };
    }

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export function authorizeRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
}