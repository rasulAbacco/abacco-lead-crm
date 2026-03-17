import {UAParser} from "ua-parser-js";
import crypto from "crypto";

export function parseDevice(req) {
    const ua = req.headers["user-agent"] || "";

    const parser = new UAParser(ua);
    const result = parser.getResult();

    const browser = result.browser.name || "Unknown";
    const browserVersion = result.browser.version || "Unknown";

    const os = result.os.name || "Unknown";

    const deviceType = result.device.type || "desktop";

    // Create simple fingerprint (deviceId)
    const fingerprintSource = `${ua}-${req.ip}`;
    const deviceId = crypto
        .createHash("sha256")
        .update(fingerprintSource)
        .digest("hex");

    return {
        browser,
        browserVersion,
        os,
        deviceType,
        deviceId,
    };
}