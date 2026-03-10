import prisma from "../lib/prisma";

interface AuditLogEntry {
  requestId: number;
  userId: number;
  action: string;
  oldStatus?: string;
  newStatus?: string;
  details?: string;
}

export async function createAuditLog(entry: AuditLogEntry) {
  return prisma.auditLog.create({
    data: {
      requestId: entry.requestId,
      userId: entry.userId,
      action: entry.action,
      oldStatus: entry.oldStatus,
      newStatus: entry.newStatus,
      details: entry.details,
    },
  });
}

export async function getAuditLogs(requestId: number) {
  return prisma.auditLog.findMany({
    where: { requestId },
    include: { user: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "desc" },
  });
}
