import express from "express";
import prisma from "../prismaClient.js";
import { authenticate, authorizeRole } from "../middlewares/auth.js";

const router = express.Router();

// Admin → Get all employees
router.get("/all", authenticate, authorizeRole("ADMIN"), async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

// Employee → Get only his details
router.get("/me", authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  });
  res.json(user);
});

export default router;
