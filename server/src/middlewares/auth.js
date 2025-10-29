// middleware/auth.js
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export function authenticate(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    
    console.log("Decoded token:", decoded);
    
    // If employeeId is not in the token, fetch it from database
    if (!decoded.employeeId) {
      try {
        const userId = decoded.id || decoded.userId;
        if (!userId) {
          return res.status(403).json({ message: "Invalid token: missing user id" });
        }
        
        const employee = await prisma.employee.findUnique({
          where: { id: userId },
          select: { employeeId: true, role: true, email: true }
        });
        
        if (!employee) {
          return res.status(403).json({ message: "Employee not found" });
        }
        
        req.user = {
          id: userId,
          userId: userId,
          employeeId: employee.employeeId,
          email: employee.email,
          role: employee.role
        };
        
        console.log("Fetched employeeId from DB:", employee.employeeId);
      } catch (error) {
        console.error("Error fetching employee:", error);
        return res.status(500).json({ message: "Server error" });
      }
    } else {
      req.user = {
        id: decoded.id || decoded.userId,
        userId: decoded.userId,
        employeeId: decoded.employeeId,
        email: decoded.email,
        role: decoded.role
      };
    }
    
    console.log("Final authenticated user:", req.user);
    next();
  });
}

export function authorizeRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
}