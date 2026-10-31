// In-app notifications (bell icon). Never throws: a failed notification must not break the action.
import prisma from "../prismaClient.js";

/**
 * notify("AT101", { type, title, body, link, refKey })
 * notify(["AT101","AT102"], {...})
 * With refKey, an existing notification with the same key is refreshed instead of duplicated.
 */
export async function notify(employeeIds, { type = "system", title, body = null, link = null, refKey = null }) {
  try {
    const ids = [...new Set([].concat(employeeIds).filter(Boolean))];
    if (!ids.length) return;
    if (refKey) {
      for (const employeeId of ids) {
        const existing = await prisma.notification.findFirst({ where: { employeeId, refKey } });
        if (existing) {
          await prisma.notification.update({ where: { id: existing.id }, data: { type, title, body, link, readAt: null, createdAt: new Date() } });
        } else {
          await prisma.notification.create({ data: { employeeId, type, title, body, link, refKey } });
        }
      }
      return;
    }
    await prisma.notification.createMany({ data: ids.map((employeeId) => ({ employeeId, type, title, body, link })) });
  } catch (e) {
    console.error("notify error:", e.message);
  }
}

export async function notifyAdmins(payload) {
  const admins = await prisma.employee.findMany({ where: { role: "ADMIN", isActive: true }, select: { employeeId: true } });
  return notify(admins.map((a) => a.employeeId), payload);
}

export async function notifyEveryone(payload) {
  const all = await prisma.employee.findMany({ where: { isActive: true }, select: { employeeId: true } });
  return notify(all.map((a) => a.employeeId), payload);
}
