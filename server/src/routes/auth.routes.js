// Login flow: allowed-IP check -> email + password -> emailed OTP -> session.
import express from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import prisma from "../prismaClient.js";
import { config } from "../config.js";
import { authenticate, ah } from "../middlewares/auth.js";
import { sendMail } from "../utils/mailer.js";
import { otpEmailHtml } from "../utils/emailTemplates.js";
import { parseDevice } from "../utils/deviceParser.js";
import { getClientIp } from "../utils/ipExtractor.js";
import { getGeoLocation } from "../services/geoLocationService.js";
import { isIPAllowed } from "../services/ipWhitelistService.js";
import {
  recordSuccessfulLogin,
  recordFailedLogin,
  recordLogout,
} from "../services/loginHistoryService.js";

const router = express.Router();
const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const generateOtp = () => crypto.randomInt(100000, 1000000).toString();
const normEmail = (e) =>
  String(e || "")
    .trim()
    .toLowerCase();

/** Compare password; transparently upgrades any remaining plain-text password to bcrypt. */
async function checkPassword(user, password) {
  if (!user.password) return false;
  if (user.password.startsWith("$2"))
    return bcrypt.compare(password, user.password);
  if (user.password !== password) return false;
  await prisma.employee.update({
    where: { id: user.id },
    data: { password: await bcrypt.hash(password, 10) },
  });
  return true;
}

async function findUserByEmail(email) {
  return prisma.employee.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
}

async function createSession(req, user) {
  const sessionId = crypto.randomUUID();
  const token = jwt.sign(
    {
      userId: user.id,
      employeeId: user.employeeId,
      role: user.role,
      sid: sessionId,
    },
    config.jwtSecret,
    { expiresIn: "24h" },
  );
  const device = parseDevice(req);
  await prisma.$transaction([
    prisma.session.updateMany({
      where: { userId: user.id, isActive: true },
      data: { isActive: false },
    }),
    prisma.session.create({
      data: {
        userId: user.id,
        token,
        sessionId,
        ipAddress: getClientIp(req),
        device: device.browser,
      },
    }),
  ]);
  return { token, sessionId };
}

function loginResponse(user, token) {
  return {
    success: true,
    token,
    role: user.role,
    fullName: user.fullName,
    employeeId: user.employeeId,
  };
}

/* ---------- STEP 1: email + password ---------- */
router.post(
  "/login",
  ah(async (req, res) => {
    const email = normEmail(req.body.email);
    const { password } = req.body;
    const ip = getClientIp(req);
    const device = parseDevice(req);

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password required" });
    }

    if (!(await isIPAllowed(ip))) {
      recordFailedLogin({ email, ip, device, geo: await getGeoLocation(ip) });
      return res
        .status(403)
        .json({
          success: false,
          message: "Login not allowed from this network.",
        });
    }

    const user = await findUserByEmail(email);
    if (user?.role === "DEVELOPER") {
      return res
        .status(403)
        .json({
          success: false,
          message: "This account is for attendance only and cannot log in.",
        });
    }
    if (!user || !(await checkPassword(user, password))) {
      recordFailedLogin({ email, ip, device, geo: await getGeoLocation(ip) });
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }
    if (!user.isActive) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Account is inactive. Please contact admin.",
        });
    }

    const otp = generateOtp();
    await prisma.loginOtp.upsert({
      where: { email: user.email },
      update: {
        otp,
        attempts: 0,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
        resendAvailableAt: new Date(Date.now() + RESEND_COOLDOWN_MS),
      },
      create: {
        email: user.email,
        otp,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
        resendAvailableAt: new Date(Date.now() + RESEND_COOLDOWN_MS),
      },
    });

    try {
      await sendMail({
        to: user.email,
        subject: "Your login code — Abacco Lead CRM",
        text: `Your login verification code is ${otp}. It expires in 10 minutes.`,
        html: otpEmailHtml(otp, { role: user.role }),
      });
    } catch (err) {
      console.error("OTP email error:", err.message);
      // MASTER_OTP still works if email is down; otherwise tell the user.
      if (!config.masterOtp) {
        await prisma.loginOtp
          .delete({ where: { email: user.email } })
          .catch(() => {});
        return res
          .status(502)
          .json({
            success: false,
            message: "Could not send the login code. Please try again.",
          });
      }
    }

    res.json({ success: true, otpRequired: true, email: user.email });
  }),
);

/* ---------- STEP 2: verify OTP ---------- */
router.post(
  "/verify-otp",
  ah(async (req, res) => {
    const email = normEmail(req.body.email);
    const otp = String(req.body.otp || "").trim();
    if (!email || !otp)
      return res
        .status(400)
        .json({ success: false, message: "Email and code required" });

    const user = await findUserByEmail(email);
    if (user?.role === "DEVELOPER") {
      return res
        .status(403)
        .json({
          success: false,
          message: "This account is for attendance only and cannot log in.",
        });
    }
    const record =
      user &&
      (await prisma.loginOtp.findUnique({ where: { email: user.email } }));
    if (!user || !record) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Code not found. Please log in again.",
        });
    }
    if (new Date() > record.expiresAt) {
      await prisma.loginOtp.delete({ where: { email: user.email } });
      return res
        .status(400)
        .json({
          success: false,
          message: "Code expired. Please log in again.",
        });
    }
    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      await prisma.loginOtp.delete({ where: { email: user.email } });
      return res
        .status(403)
        .json({
          success: false,
          message: "Too many wrong codes. Please log in again.",
        });
    }

    const isMaster = config.masterOtp && otp === config.masterOtp;
    if (otp !== record.otp && !isMaster) {
      await prisma.loginOtp.update({
        where: { email: user.email },
        data: { attempts: { increment: 1 } },
      });
      return res.status(401).json({ success: false, message: "Invalid code" });
    }

    await prisma.loginOtp.delete({ where: { email: user.email } });
    const { token, sessionId } = await createSession(req, user);
    const ip = getClientIp(req);
    recordSuccessfulLogin({
      user,
      ip,
      device: parseDevice(req),
      sessionId,
      geo: await getGeoLocation(ip),
      otpVerified: true,
    });

    res.json(loginResponse(user, token));
  }),
);

/* ---------- resend OTP ---------- */
router.post(
  "/resend-otp",
  ah(async (req, res) => {
    const email = normEmail(req.body.email);
    const user = email && (await findUserByEmail(email));
    const record =
      user &&
      (await prisma.loginOtp.findUnique({ where: { email: user.email } }));
    if (!record)
      return res
        .status(400)
        .json({ success: false, message: "Please log in again to get a code" });

    if (new Date() < record.resendAvailableAt) {
      const wait = Math.ceil((record.resendAvailableAt - Date.now()) / 1000);
      return res
        .status(429)
        .json({
          success: false,
          message: `Please wait ${wait}s before requesting another code.`,
        });
    }

    const otp = generateOtp();
    await prisma.loginOtp.update({
      where: { email: user.email },
      data: {
        otp,
        attempts: 0,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
        resendAvailableAt: new Date(Date.now() + RESEND_COOLDOWN_MS),
      },
    });
    try {
      await sendMail({
        to: user.email,
        subject: "New login code — Abacco Lead CRM",
        text: `Your new verification code is ${otp}. It expires in 10 minutes.`,
        html: otpEmailHtml(otp, { resent: true, role: user.role }),
      });
    } catch (err) {
      console.error("Resend OTP error:", err.message);
      return res
        .status(502)
        .json({
          success: false,
          message: "Could not send the code. Please try again.",
        });
    }
    res.json({ success: true, message: "New code sent" });
  }),
);

/* ---------- current user ---------- */
router.get("/me", authenticate, (req, res) => {
  const { id, employeeId, email, role, fullName } = req.user;
  res.json({ id, employeeId, email, role, fullName });
});

/* ---------- logout ---------- */
router.post(
  "/logout",
  ah(async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.json({ success: true });
    const session = await prisma.session.findUnique({ where: { token } });
    if (session) {
      await prisma.session.update({
        where: { token },
        data: { isActive: false },
      });
      await recordLogout(session.sessionId);
    }
    res.json({ success: true });
  }),
);

export default router;
