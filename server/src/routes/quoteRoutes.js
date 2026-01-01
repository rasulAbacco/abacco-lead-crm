import express from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * 🔐 Middleware: verify JWT
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ success: false, message: "Token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

/**
 * ✅ GET: Fetch active quote (VISIBLE TO ALL)
 */
router.get("/", async (req, res) => {
  try {
    const quote = await prisma.quote.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      quote: quote ? { text: quote.text, author: quote.author } : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * ✅ POST: Add new quote (ADMIN ONLY)
 */
router.post("/", authenticate, async (req, res) => {
  const { text, author } = req.body;

  if (!text) {
    return res.status(400).json({
      success: false,
      message: "Quote text is required",
    });
  }

  // Role check
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  }

  try {
    await prisma.$transaction([
      prisma.quote.updateMany({
        data: { isActive: false },
      }),
      prisma.quote.create({
        data: {
          text,
          author,
          isActive: true,
        },
      }),
    ]);

    res.json({
      success: true,
      message: "Quote updated successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
