export function getClientIp(req) {
    let ip =
        req.headers["x-forwarded-for"] ||
        req.headers["x-real-ip"] ||
        req.socket?.remoteAddress ||
        req.ip ||
        null;

    // If multiple IPs (proxy chain) take first
    if (ip && ip.includes(",")) {
        ip = ip.split(",")[0].trim();
    }

    // Normalize IPv6 localhost
    if (ip === "::1") {
        ip = "127.0.0.1";
    }

    return ip || "unknown";
}