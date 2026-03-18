export function getClientIp(req) {
    let ip = null;

    // 1️⃣ Check x-forwarded-for (most important when behind proxy)
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded) {
        // Can be: "clientIP, proxy1, proxy2"
        ip = forwarded.split(",")[0].trim();
    }

    // 2️⃣ Fallback: x-real-ip (used by some proxies like Nginx)
    if (!ip && req.headers["x-real-ip"]) {
        ip = req.headers["x-real-ip"].trim();
    }

    // 3️⃣ Fallback: direct connection
    if (!ip && req.socket?.remoteAddress) {
        ip = req.socket.remoteAddress;
    }

    // 4️⃣ Fallback: Express provided IP
    if (!ip && req.ip) {
        ip = req.ip;
    }

    // 5️⃣ Normalize IPv6 localhost
    if (ip === "::1") {
        ip = "127.0.0.1";
    }

    // 6️⃣ Convert IPv6 mapped IPv4 → IPv4
    // Example: ::ffff:192.168.1.1 → 192.168.1.1
    if (ip && ip.startsWith("::ffff:")) {
        ip = ip.replace("::ffff:", "");
    }

    // 7️⃣ Final cleanup
    if (ip) {
        ip = ip.trim();
    }

    return ip; // return null if not found (better than "unknown")
}