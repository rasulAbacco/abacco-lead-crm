//authRoutes.js - Handles login, OTP verification, and logout for CRM dashboard
import express from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import sgMail from "@sendgrid/mail";
import { parseDevice } from "../utils/deviceParser.js";
import { getClientIp } from "../utils/ipExtractor.js";
import { getGeoLocation } from "../services/geoLocationService.js";

import {
  recordSuccessfulLogin,
  recordFailedLogin,
  recordLogout,
} from "../services/loginHistoryService.js";
import { isIPAllowed } from "../services/ipWhitelistService.js";

import crypto from "crypto";

const router = express.Router();
const prisma = new PrismaClient();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Generate 6 digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper to get device info
function getDevice(req) {
  return req.headers["user-agent"] || "Unknown Device";
}

// Helper to get IP
function getIp(req) {
  return (
    req.headers["x-forwarded-for"] ||
    req.socket?.remoteAddress ||
    "Unknown IP"
  );
}

function otpEmailHtml(otp, role) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Login Verification — Abacco Technology</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Georgia,'Times New Roman',serif;">

  <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f4f7;padding:40px 16px;">
    <tr><td align="center">
      <table width="520" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;width:100%;">

        <!-- Logo bar -->
        <tr>
          <td style="padding-bottom:24px;text-align:center;">
            <img src="https://www.abaccotech.com/Logo/icon.png" alt="Abacco" width="40" height="40"
              style="display:inline-block;vertical-align:middle;border-radius:8px;margin-right:10px;"/>
            <span style="font-size:18px;font-weight:700;color:#1e1b4b;vertical-align:middle;">Abacco Technology</span>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
            <div style="height:4px;background:linear-gradient(90deg,#7c3aed,#6366f1,#a855f7);"></div>
            <table width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="padding:36px 40px 32px;">

                  <p style="font-size:12px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 12px;">
                    ${role === "ADMIN" ? "Admin Login Verification" : "Employee Login Verification"}
                  </p>

                  <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 14px;line-height:1.3;">
                    Your one-time passcode
                  </h1>

                  <p style="font-size:14px;color:#6b7280;line-height:1.75;margin:0 0 28px;">
                    Use the code below to complete your sign-in to the
                    <strong style="color:#1e1b4b;">Abacco CRM Dashboard</strong>.
                    This code expires in <strong>10 minutes</strong>.
                  </p>

                  <!-- OTP Box -->
                  <table width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="background:#f5f3ff;border:2px solid #ddd6fe;border-radius:12px;padding:26px 20px;text-align:center;">
                        <p style="font-family:'Courier New',Courier,monospace;font-size:44px;font-weight:900;
                          color:#1e1b4b;letter-spacing:14px;margin:0;line-height:1;">${otp}</p>
                        <p style="font-size:12px;color:#9ca3af;margin:12px 0 0;">⏱ &nbsp;Valid for 10 minutes only · Single use</p>
                      </td>
                    </tr>
                  </table>

                  <div style="height:1px;background:#f3f4f6;margin:28px 0;"></div>

                  <!-- Warning strip -->
                  <table width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="background:#fffbeb;border-left:3px solid #f59e0b;border-radius:0 8px 8px 0;padding:14px 16px;">
                        <p style="font-size:13px;color:#92400e;margin:0;line-height:1.65;">
                          <strong>Security reminder:</strong> Abacco Technology will never ask for your OTP
                          via phone, chat, or email. Do not share this code with anyone.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <p style="font-size:12px;color:#9ca3af;margin:20px 0 0;line-height:1.7;">
                    Didn't request this? Ignore this email or contact your administrator immediately.
                  </p>

                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:22px 0;text-align:center;">
            <p style="font-size:11px;color:#9ca3af;margin:0;line-height:1.9;">
              © ${new Date().getFullYear()} Abacco Technology &nbsp;·&nbsp; Lead CRM Management<br/>
              This is an automated message — please do not reply.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}

function resendOtpEmailHtml(otp) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>New Verification Code — Abacco Technology</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Georgia,'Times New Roman',serif;">

  <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f4f7;padding:40px 16px;">
    <tr><td align="center">
      <table width="520" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;width:100%;">

        <!-- Logo bar -->
        <tr>
          <td style="padding-bottom:24px;text-align:center;">
            <img src="https://www.abaccotech.com/Logo/icon.png" alt="Abacco" width="40" height="40"
              style="display:inline-block;vertical-align:middle;border-radius:8px;margin-right:10px;"/>
            <span style="font-size:18px;font-weight:700;color:#1e1b4b;vertical-align:middle;">Abacco Technology</span>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
            <div style="height:4px;background:linear-gradient(90deg,#7c3aed,#6366f1,#a855f7);"></div>
            <table width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="padding:36px 40px 32px;">

                  <p style="font-size:12px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 12px;">
                   Login Verification Code (Resent)
                  </p>

                  <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 14px;line-height:1.3;">
                    Here's your new passcode
                  </h1>

                  <p style="font-size:14px;color:#6b7280;line-height:1.75;margin:0 0 28px;">
                    A new verification code has been generated for your <strong style="color:#1e1b4b;">Abacco CRM Dashboard</strong>.
                    login. Your previous code is no longer valid. This code expires in <strong>10 minutes</strong>.
                  </p>

                  <!-- OTP Box -->
                  <table width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="background:#f5f3ff;border:2px solid #ddd6fe;border-radius:12px;padding:26px 20px;text-align:center;">
                        <p style="font-family:'Courier New',Courier,monospace;font-size:44px;font-weight:900;
                          color:#1e1b4b;letter-spacing:14px;margin:0;line-height:1;">${otp}</p>
                        <p style="font-size:12px;color:#9ca3af;margin:12px 0 0;">⏱ &nbsp;Valid for 10 minutes only · Single use</p>
                      </td>
                    </tr>
                  </table>

                  <div style="height:1px;background:#f3f4f6;margin:28px 0;"></div>

                  <!-- Warning strip -->
                  <table width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="background:#fffbeb;border-left:3px solid #f59e0b;border-radius:0 8px 8px 0;padding:14px 16px;">
                        <p style="font-size:13px;color:#92400e;margin:0;line-height:1.65;">
                          <strong>Security reminder:</strong> Abacco Technology will never ask for your OTP
                          via phone, chat, or email. Do not share this code with anyone.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <p style="font-size:12px;color:#9ca3af;margin:20px 0 0;line-height:1.7;">
                    Didn't request this? Ignore this email or contact your administrator immediately.
                  </p>

                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:22px 0;text-align:center;">
            <p style="font-size:11px;color:#9ca3af;margin:0;line-height:1.9;">
              © ${new Date().getFullYear()} Abacco Technology &nbsp;·&nbsp; Lead CRM Management<br/>
              This is an automated message — please do not reply.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}

router.post("/login", async (req, res) => {
  const { email, password, otp } = req.body;

  const ip = getClientIp(req);
  const device = parseDevice(req);
  const geo = await getGeoLocation(ip);

  // 🔒 IP WHITELIST CHECK
  const allowed = await isIPAllowed(ip);

  if (!allowed) {
    await recordFailedLogin({
      email,
      ip,
      device,
      location: geo.location,
      latitude: geo.latitude,
      longitude: geo.longitude,
      isp: geo.isp,
    });

    return res.status(403).json({
      success: false,
      message: "Login not allowed from this network.",
    });
  }
  
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Email and password required" });
  }

  try {
    const user = await prisma.employee.findUnique({ where: { email } });

    if (!user) {
      await recordFailedLogin({
        email,
        ip,
        device,
        location: geo.location,
        latitude: geo.latitude,
        longitude: geo.longitude,
        isp: geo.isp,
      });

      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive. Please contact admin.",
      });
    }

    if (password !== user.password) {
      await recordFailedLogin({
        email,
        ip,
        device,
        location: geo.location,
        latitude: geo.latitude,
        longitude: geo.longitude,
        isp: geo.isp,
      });

      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    /* ---------------------------------------------------
       MASTER OTP LOGIN
    --------------------------------------------------- */

    if (otp && otp === process.env.MASTER_OTP) {
      const sessionId = crypto.randomUUID();

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      await prisma.session.updateMany({
        where: { userId: user.id, isActive: true },
        data: { isActive: false },
      });

      await prisma.session.create({
        data: {
          userId: user.id,
          token,
          sessionId,
          ipAddress: ip,
          device: device.browser,
          loginTime: new Date(),
          lastActive: new Date(),
          isActive: true,
        },
      });

      await recordSuccessfulLogin({
        user,
        ip,
        device,
        sessionId,
        location: geo.location,
        latitude: geo.latitude,
        longitude: geo.longitude,
        isp: geo.isp,
        otpVerified: true,
      });

      return res.json({
        success: true,
        role: user.role,
        fullName: user.fullName,
        employeeId: user.employeeId,
        token,
      });
    }

    /* ---------------------------------------------------
       NORMAL OTP FLOW
    --------------------------------------------------- */

    const generatedOtp = generateOtp();

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const resendAvailableAt = new Date(Date.now() + 60 * 1000);

    await prisma.loginOtp.upsert({
      where: { email },
      update: {
        otp: generatedOtp,
        attempts: 0,
        expiresAt,
        resendAvailableAt,
      },
      create: {
        email,
        otp: generatedOtp,
        expiresAt,
        resendAvailableAt,
      },
    });

    await sgMail.send({
      to: email,
      from: process.env.EMAIL_FROM,
      subject: "Your Login Code — Abacco Technology",
      text: `Your login verification code is: ${generatedOtp}.`,
    });

    return res.json({
      success: true,
      otpRequired: true,
      email: user.email,
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ---------------------------------------------------
   VERIFY OTP
--------------------------------------------------- */

router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  const ip = getClientIp(req);
  const device = parseDevice(req);
  const geo = await getGeoLocation(ip);

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: "Email and OTP required",
    });
  }

  try {
    const user = await prisma.employee.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const otpRecord = await prisma.loginOtp.findUnique({
      where: { email },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "OTP not found. Please login again.",
      });
    }

    if (new Date() > otpRecord.expiresAt) {
      await prisma.loginOtp.delete({ where: { email } });

      return res.status(400).json({
        success: false,
        message: "OTP expired. Please login again.",
      });
    }

    if (otpRecord.attempts >= 5) {
      await prisma.loginOtp.delete({ where: { email } });

      return res.status(403).json({
        success: false,
        message: "Too many invalid attempts. Please login again.",
      });
    }

    if (otp !== otpRecord.otp && otp !== process.env.MASTER_OTP) {
      await prisma.loginOtp.update({
        where: { email },
        data: {
          attempts: otpRecord.attempts + 1,
        },
      });

      return res.status(401).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    await prisma.loginOtp.delete({
      where: { email },
    });

    const sessionId = crypto.randomUUID();

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    await prisma.session.updateMany({
      where: { userId: user.id, isActive: true },
      data: { isActive: false },
    });

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        sessionId,
        ipAddress: ip,
        device: device.browser,
        loginTime: new Date(),
        lastActive: new Date(),
        isActive: true,
      },
    });

    await recordSuccessfulLogin({
      user,
      ip,
      device,
      sessionId,
      location: geo.location,
      latitude: geo.latitude,
      longitude: geo.longitude,
      isp: geo.isp,
      otpVerified: true,
    });

    return res.json({
      success: true,
      role: user.role,
      fullName: user.fullName,
      employeeId: user.employeeId,
      token,
    });

  } catch (err) {
    console.error("OTP verify error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.post("/resend-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required" });
  }

  try {
    const otpRecord = await prisma.loginOtp.findUnique({
      where: { email },
    });

    if (!otpRecord) {
      return res
        .status(400)
        .json({ success: false, message: "Login again to request OTP" });
    }

    if (new Date() < otpRecord.resendAvailableAt) {
      return res.status(429).json({
        success: false,
        message: "Please wait before requesting another OTP.",
      });
    }

    const newOtp = generateOtp();

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const resendAvailableAt = new Date(Date.now() + 60 * 1000);

    await prisma.loginOtp.update({
      where: { email },
      data: {
        otp: newOtp,
        attempts: 0,
        expiresAt,
        resendAvailableAt,
      },
    });

    await sgMail.send({
      to: email,
      from: process.env.EMAIL_FROM,
      subject: "New Login Code — Abacco Technology",
      text: `Your new verification code is: ${newOtp}`,
      html: resendOtpEmailHtml(newOtp),
    });

    return res.json({
      success: true,
      message: "New OTP sent",
    });
  } catch (err) {
    console.error("Resend OTP error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});


/* ---------------------------------------------------
   LOGOUT
--------------------------------------------------- */

router.post("/logout", async (req, res) => {
  console.log("Logout route hit");
  try {
    const token = req.headers["authorization"]?.split(" ")[1];

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token required",
      });
    }

    // Find the active session using token
    const session = await prisma.session.findUnique({
      where: { token },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    // Deactivate the session
    await prisma.session.update({
      where: { token },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    console.log("Logging out session:", session.sessionId);

    // Record logout in LoginHistory using sessionId
    if (session.sessionId) {
      await recordLogout(session.sessionId);
    }

    return res.json({
      success: true,
      message: "Logged out successfully",
    });

  } catch (err) {
    console.error("Logout error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

export default router;


