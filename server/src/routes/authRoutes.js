import express from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken"; 

const router = express.Router();
const prisma = new PrismaClient();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password required" });
  }

  try {
    const user = await prisma.employee.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (password !== user.password) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "1h" }
    );

    res.json({ 
      success: true, 
      role: user.role || "employee", 
      fullName: user.fullName,
      employeeId: user.employeeId,   // ✅ Added employeeId
      token: token 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;

// import express from "express";
// import { PrismaClient } from "@prisma/client";
// import jwt from "jsonwebtoken"; // Added JWT

// const router = express.Router();
// const prisma = new PrismaClient();

// router.post("/login", async (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res.status(400).json({ success: false, message: "Email and password required" });
//   }

//   try {
//     // Find employee in database
//     const user = await prisma.employee.findUnique({
//       where: { email },
//     });

//     if (!user) {
//       return res.status(401).json({ success: false, message: "Invalid credentials" });
//     }

//     // Compare plain text passwords (not recommended for production)
//     if (password !== user.password) {
//       return res.status(401).json({ success: false, message: "Invalid credentials" });
//     }

//     // Generate JWT token
//     const token = jwt.sign(
//       { userId: user.id, email: user.email, role: user.role },
//       process.env.JWT_SECRET || 'your-secret-key',
//       { expiresIn: '1h' }
//     );

//     // Login successful
//     res.json({ 
//       success: true, 
//       role: user.role || "employee", 
//       fullName: user.fullName,
//       token: token 
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// export default router;