import prisma from "../prismaClient.js";

/**
 * Check if IP is allowed
 */
export const isIPAllowed = async (ip) => {
    if (!ip) return false;

    const allowed = await prisma.allowedIP.findFirst({
        where: {
            ipAddress: ip,
            status: true,
        },
        select: {
            id: true,
        },
    });

    return !!allowed;
};

/**
 * Create new allowed IP
 */
export const createAllowedIP = async ({ ipAddress, label }) => {
    return await prisma.allowedIP.create({
        data: {
            ipAddress,
            label,
        },
    });
};

/**
 * Get all allowed IPs
 */
export const getAllAllowedIPs = async () => {
    return await prisma.allowedIP.findMany({
        orderBy: {
            createdAt: "desc",
        },
    });
};

/**
 * Update IP status (enable/disable)
 */
export const updateIPStatus = async (id, status) => {
    return await prisma.allowedIP.update({
        where: { id },
        data: { status },
    });
};

/**
 * Delete allowed IP
 */
export const deleteAllowedIP = async (id) => {
    return await prisma.allowedIP.delete({
        where: { id },
    });
};