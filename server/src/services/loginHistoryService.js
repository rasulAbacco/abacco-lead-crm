import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* ---------------------------------------------------
   RECORD SUCCESSFUL LOGIN
--------------------------------------------------- */

export async function recordSuccessfulLogin({
    user,
    ip,
    device,
    sessionId,
    location = null,
    latitude = null,
    longitude = null,
    isp = null,
    otpVerified = false,
}) {
    try {
        await prisma.loginHistory.create({
            data: {
                userId: user.id,
                employeeId: user.employeeId,
                employeeName: user.fullName,
                email: user.email,

                ipAddress: ip,
                location,
                latitude,
                longitude,
                isp,

                browser: device.browser,
                browserVersion: device.browserVersion,
                os: device.os,
                deviceType: device.deviceType,
                deviceId: device.deviceId,

                sessionId,

                loginTime: new Date(),

                status: "SUCCESS",
                otpVerified,

                loginMethod: otpVerified ? "Password + OTP" : "Password",

                attemptCount: 1,
            },
        });
    } catch (error) {
        console.error("Login history success log error:", error);
    }
}

/* ---------------------------------------------------
   RECORD FAILED LOGIN
--------------------------------------------------- */

export async function recordFailedLogin({
    email,
    ip,
    device,
    location = null,
    latitude = null,
    longitude = null,
    isp = null,
}) {
    try {
        await prisma.loginHistory.create({
            data: {
                email,
                employeeName: "Unknown",
                employeeId: "Unknown",
                userId: null,

                ipAddress: ip,
                location,
                latitude,
                longitude,
                isp,

                browser: device.browser,
                browserVersion: device.browserVersion,
                os: device.os,
                deviceType: device.deviceType,
                deviceId: device.deviceId,

                status: "FAILED",

                attemptCount: 1,
            },
        });
    } catch (error) {
        console.error("Login history failed log error:", error);
    }
}

/* ---------------------------------------------------
   UPDATE LOGOUT
--------------------------------------------------- */

export async function recordLogout(sessionId) {
    try {
        if (!sessionId) return;

        const logoutTime = new Date();

        const record = await prisma.loginHistory.findFirst({
            where: { sessionId },
            select: { loginTime: true },
        });

        if (!record) {
            console.log("No login history found for session:", sessionId);
            return;
        }

        const duration = Math.floor(
            (logoutTime.getTime() - record.loginTime.getTime()) / 1000
        );

        await prisma.loginHistory.updateMany({
            where: { sessionId },
            data: {
                logoutTime,
                sessionDuration: duration,
            },
        });

        console.log("Logout recorded for session:", sessionId);

    } catch (error) {
        console.error("Logout history update error:", error);
    }
}