// Login history (kept 7 days — see jobs/maintenance.js)
import prisma from "../prismaClient.js";

export async function recordSuccessfulLogin({ user, ip, device, sessionId, geo = {}, otpVerified = false }) {
  try {
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        employeeId: user.employeeId,
        employeeName: user.fullName,
        email: user.email,
        ipAddress: ip,
        location: geo.location ?? null,
        latitude: geo.latitude ?? null,
        longitude: geo.longitude ?? null,
        isp: geo.isp ?? null,
        browser: device.browser,
        browserVersion: device.browserVersion,
        os: device.os,
        deviceType: device.deviceType,
        deviceId: device.deviceId,
        sessionId,
        status: "SUCCESS",
        otpVerified,
        loginMethod: otpVerified ? "Password + OTP" : "Password",
      },
    });
  } catch (error) {
    console.error("Login history (success) error:", error.message);
  }
}

export async function recordFailedLogin({ email, ip, device, geo = {} }) {
  try {
    await prisma.loginHistory.create({
      data: {
        email: email || "unknown",
        employeeName: "Unknown",
        employeeId: "Unknown",
        ipAddress: ip,
        location: geo.location ?? null,
        latitude: geo.latitude ?? null,
        longitude: geo.longitude ?? null,
        isp: geo.isp ?? null,
        browser: device.browser,
        browserVersion: device.browserVersion,
        os: device.os,
        deviceType: device.deviceType,
        deviceId: device.deviceId,
        status: "FAILED",
      },
    });
  } catch (error) {
    console.error("Login history (failed) error:", error.message);
  }
}

export async function recordLogout(sessionId) {
  if (!sessionId) return;
  try {
    const record = await prisma.loginHistory.findFirst({ where: { sessionId }, select: { loginTime: true } });
    if (!record) return;
    const logoutTime = new Date();
    await prisma.loginHistory.updateMany({
      where: { sessionId },
      data: { logoutTime, sessionDuration: Math.floor((logoutTime - record.loginTime) / 1000) },
    });
  } catch (error) {
    console.error("Logout history error:", error.message);
  }
}
