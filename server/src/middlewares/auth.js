// Authentication: JWT + active Session row (one active session per user).
import jwt from "jsonwebtoken";
import prisma from "../prismaClient.js";
import { config } from "../config.js";

// Avoid a DB write on every request: refresh lastActive at most once a minute per token.
const lastTouched = new Map();

export async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Please log in" });

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }

    const session = await prisma.session.findUnique({
      where: { token },
      select: { isActive: true, user: { select: { id: true, employeeId: true, email: true, role: true, fullName: true, isActive: true } } },
    });
    if (!session?.isActive || !session.user?.isActive) {
      return res.status(401).json({ message: "Session expired or you logged in on another device" });
    }

    const now = Date.now();
    if (now - (lastTouched.get(token) || 0) > 60_000) {
      lastTouched.set(token, now);
      prisma.session.update({ where: { token }, data: { lastActive: new Date() } }).catch(() => {});
      if (lastTouched.size > 5000) lastTouched.clear();
    }

    const u = session.user;
    req.user = { id: u.id, employeeId: u.employeeId, email: u.email, role: u.role, fullName: u.fullName, token };
    req.isAdmin = u.role === "ADMIN";
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "ADMIN") return res.status(403).json({ message: "Admin access only" });
  next();
}

export function requireEmployee(req, res, next) {
  if (req.user?.role !== "EMPLOYEE") return res.status(403).json({ message: "Employee access only" });
  next();
}

/** Wrap async handlers so thrown errors reach the error handler (Express 5 also does this). */
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
