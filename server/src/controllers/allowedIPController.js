import {
    createAllowedIP,
    getAllAllowedIPs,
    updateIPStatus,
    deleteAllowedIP,
} from "../services/ipWhitelistService.js";

/**
 * Add new allowed IP
 */
export const addAllowedIP = async (req, res) => {
    try {
        const { ipAddress, label } = req.body;

        if (!ipAddress) {
            return res.status(400).json({
                success: false,
                message: "IP address is required",
            });
        }

        const ip = await createAllowedIP({ ipAddress, label });

        return res.status(201).json({
            success: true,
            message: "IP added successfully",
            data: ip,
        });
    } catch (error) {
        console.error("Add IP error:", error);

        // Handle duplicate IP
        if (error.code === "P2002") {
            return res.status(400).json({
                success: false,
                message: "IP already exists",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to add IP",
        });
    }
};

/**
 * Get all allowed IPs
 */
export const getAllowedIPs = async (req, res) => {
    try {
        const ips = await getAllAllowedIPs();

        return res.json({
            success: true,
            data: ips,
        });
    } catch (error) {
        console.error("Fetch IPs error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch IPs",
        });
    }
};

/**
 * Enable / Disable IP
 */
export const toggleAllowedIP = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (typeof status !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "Status must be true or false",
            });
        }

        const updated = await updateIPStatus(id, status);

        return res.json({
            success: true,
            message: `IP ${status ? "enabled" : "disabled"} successfully`,
            data: updated,
        });
    } catch (error) {
        console.error("Update IP status error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update IP status",
        });
    }
};

/**
 * Delete IP
 */
export const removeAllowedIP = async (req, res) => {
    try {
        const { id } = req.params;

        await deleteAllowedIP(id);

        return res.json({
            success: true,
            message: "IP deleted successfully",
        });
    } catch (error) {
        console.error("Delete IP error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete IP",
        });
    }
};