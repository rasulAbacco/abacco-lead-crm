import { getClientIp } from "../utils/ipExtractor.js";
import { isIPAllowed } from "../services/ipWhitelistService.js";

export const checkAllowedIP = async (req, res, next) => {
    try {
        const ip = getClientIp(req);

        // 1️⃣ If IP cannot be determined → block
        if (!ip) {
            return res.status(403).json({
                success: false,
                message: "Unable to determine client IP",
            });
        }

        // 2️⃣ Check if IP is allowed
        const allowed = await isIPAllowed(ip);

        if (!allowed) {
            return res.status(403).json({
                success: false,
                message: "Login not allowed from this network.",
            });
        }

        // 3️⃣ Attach IP for later use (login history, session, etc.)
        req.clientIP = ip;

        next();
    } catch (error) {
        console.error("IP whitelist middleware error:", error);

        return res.status(500).json({
            success: false,
            message: "IP validation failed",
        });
    }
};