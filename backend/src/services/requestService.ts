import prisma from "../lib/prisma";
import { createAuditLog } from "./auditService";
import { AppError } from "../middleware/errorHandler";

const STATUSES = ["new", "assigned", "in_progress", "done", "canceled"] as const;
const PRIORITIES = ["low", "normal", "high", "urgent"] as const;

interface CreateRequestData {
  clientName: string;
  phone: string;
  address: string;
  problemText: string;
  priority?: string;
}

interface ListRequestsFilter {
  status?: string;
  assignedTo?: number;
  search?: string;
}

export async function createRequest(data: CreateRequestData) {
  if (!data.clientName?.trim()) throw new AppError(400, "Имя клиента обязательно");
  if (!data.phone?.trim()) throw new AppError(400, "Телефон обязателен");
  if (!data.address?.trim()) throw new AppError(400, "Адрес обязателен");
  if (!data.problemText?.trim()) throw new AppError(400, "Описание проблемы обязательно");

  const priority = data.priority && PRIORITIES.includes(data.priority as any) ? data.priority : "normal";

  return prisma.request.create({
    data: {
      clientName: data.clientName.trim(),
      phone: data.phone.trim(),
      address: data.address.trim(),
      problemText: data.problemText.trim(),
      priority,
      status: "new",
    },
  });
}

export async function listRequests(filter: ListRequestsFilter) {
  const where: any = {};

  if (filter.status) {
    where.status = filter.status;
  }
  if (filter.assignedTo !== undefined) {
    where.assignedTo = filter.assignedTo;
  }
  if (filter.search) {
    where.OR = [
      { clientName: { contains: filter.search } },
      { address: { contains: filter.search } },
      { phone: { contains: filter.search } },
      { problemText: { contains: filter.search } },
    ];
  }

  return prisma.request.findMany({
    where,
    include: {
      assignedMaster: { select: { id: true, name: true } },
    },
    orderBy: [
      { createdAt: "desc" },
      { id: "desc" },
    ],
  });
}

export async function getRequestById(id: number) {
  const request = await prisma.request.findUnique({
    where: { id },
    include: {
      assignedMaster: { select: { id: true, name: true } },
      auditLogs: {
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "desc" },
      },
      comments: {
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!request) throw new AppError(404, "Заявка не найдена");
  return request;
}

export async function assignMaster(requestId: number, masterId: number, dispatcherId: number) {
  const master = await prisma.user.findUnique({ where: { id: masterId } });
  if (!master || master.role !== "master") {
    throw new AppError(400, "Указанный пользователь не является мастером");
  }

  const request = await prisma.request.findUnique({ where: { id: requestId } });
  if (!request) throw new AppError(404, "Заявка не найдена");
  if (request.status !== "new" && request.status !== "assigned") {
    throw new AppError(400, "Назначить мастера можно только для новых или назначенных заявок");
  }

  const oldStatus = request.status;
  const updated = await prisma.request.update({
    where: { id: requestId },
    data: {
      assignedTo: masterId,
      status: "assigned",
    },
    include: { assignedMaster: { select: { id: true, name: true } } },
  });

  await createAuditLog({
    requestId,
    userId: dispatcherId,
    action: "Заявка назначена мастеру",
    oldStatus,
    newStatus: "assigned",
    details: `Назначена мастеру: ${master.name}`,
  });

  return updated;
}

export async function cancelRequest(requestId: number, dispatcherId: number) {
  const request = await prisma.request.findUnique({ where: { id: requestId } });
  if (!request) throw new AppError(404, "Заявка не найдена");
  if (request.status === "done" || request.status === "canceled") {
    throw new AppError(400, "Невозможно отменить завершённую или уже отменённую заявку");
  }

  const oldStatus = request.status;
  const updated = await prisma.request.update({
    where: { id: requestId },
    data: { status: "canceled" },
  });

  await createAuditLog({
    requestId,
    userId: dispatcherId,
    action: "Заявка отменена",
    oldStatus,
    newStatus: "canceled",
  });

  return updated;
}

/**
 * "Взять в работу" — optimistic concurrency control via version field.
 * Uses updateMany with version check to prevent race conditions.
 * If two requests arrive simultaneously, only one succeeds.
 */
export async function takeInWork(requestId: number, masterId: number) {
  const request = await prisma.request.findUnique({ where: { id: requestId } });
  if (!request) throw new AppError(404, "Заявка не найдена");
  if (request.status !== "assigned") {
    throw new AppError(400, "Взять в работу можно только назначенную заявку");
  }
  if (request.assignedTo !== masterId) {
    throw new AppError(403, "Эта заявка назначена другому мастеру");
  }

  // Optimistic concurrency control: update only if version matches
  const result = await prisma.request.updateMany({
    where: {
      id: requestId,
      status: "assigned",
      version: request.version,
    },
    data: {
      status: "in_progress",
      version: { increment: 1 },
    },
  });

  if (result.count === 0) {
    throw new AppError(409, "Заявка уже взята в работу другим запросом (конфликт версий)");
  }

  await createAuditLog({
    requestId,
    userId: masterId,
    action: "Заявка взята в работу",
    oldStatus: "assigned",
    newStatus: "in_progress",
  });

  return prisma.request.findUnique({
    where: { id: requestId },
    include: { assignedMaster: { select: { id: true, name: true } } },
  });
}

export async function completeRequest(requestId: number, masterId: number) {
  const request = await prisma.request.findUnique({ where: { id: requestId } });
  if (!request) throw new AppError(404, "Заявка не найдена");
  if (request.status !== "in_progress") {
    throw new AppError(400, "Завершить можно только заявку в работе");
  }
  if (request.assignedTo !== masterId) {
    throw new AppError(403, "Эта заявка назначена другому мастеру");
  }

  const updated = await prisma.request.update({
    where: { id: requestId },
    data: { status: "done" },
    include: { assignedMaster: { select: { id: true, name: true } } },
  });

  await createAuditLog({
    requestId,
    userId: masterId,
    action: "Заявка завершена",
    oldStatus: "in_progress",
    newStatus: "done",
  });

  return updated;
}

export async function getStats() {
  const [total, byStatus, byPriority] = await Promise.all([
    prisma.request.count(),
    prisma.request.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.request.groupBy({
      by: ["priority"],
      _count: { id: true },
    }),
  ]);

  return {
    total,
    byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count.id])),
    byPriority: Object.fromEntries(byPriority.map((p) => [p.priority, p._count.id])),
  };
}
