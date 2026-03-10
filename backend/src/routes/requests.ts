import { Router, Request, Response, NextFunction } from "express";
import { Status } from "@prisma/client";
import { authMiddleware, requireRole } from "../middleware/auth";
import * as requestService from "../services/requestService";
import prisma from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";

const router = Router();

// Create request — public (no auth needed, any visitor can submit)
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await requestService.createRequest(req.body);
    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
});

// List requests — auth required
router.get("/", authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, assignedTo, search } = req.query;
    const requests = await requestService.listRequests({
      status: status as Status | undefined,
      assignedTo: assignedTo ? Number(assignedTo) : undefined,
      search: search as string | undefined,
    });
    res.json(requests);
  } catch (err) {
    next(err);
  }
});

// Get stats — dispatcher only
router.get("/stats", authMiddleware, requireRole("dispatcher"), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await requestService.getStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

// Get single request
router.get("/:id", authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await requestService.getRequestById(Number(req.params.id));
    res.json(request);
  } catch (err) {
    next(err);
  }
});

// Assign master — dispatcher only
router.patch("/:id/assign", authMiddleware, requireRole("dispatcher"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { masterId } = req.body;
    if (!masterId) throw new AppError(400, "Необходимо указать мастера");
    const result = await requestService.assignMaster(Number(req.params.id), masterId, req.user!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Cancel request — dispatcher only
router.patch("/:id/cancel", authMiddleware, requireRole("dispatcher"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await requestService.cancelRequest(Number(req.params.id), req.user!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Take in work — master only (with race condition protection)
router.patch("/:id/take", authMiddleware, requireRole("master"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await requestService.takeInWork(Number(req.params.id), req.user!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Complete request — master only
router.patch("/:id/done", authMiddleware, requireRole("master"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await requestService.completeRequest(Number(req.params.id), req.user!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Add comment
router.post("/:id/comments", authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) throw new AppError(400, "Текст комментария обязателен");

    const requestExists = await prisma.request.findUnique({ where: { id: Number(req.params.id) } });
    if (!requestExists) throw new AppError(404, "Заявка не найдена");

    const comment = await prisma.comment.create({
      data: {
        requestId: Number(req.params.id),
        userId: req.user!.id,
        text: text.trim(),
      },
      include: { user: { select: { id: true, name: true, role: true } } },
    });
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
});

// List masters — for dispatcher to assign
router.get("/users/masters", authMiddleware, requireRole("dispatcher"), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const masters = await prisma.user.findMany({
      where: { role: "master" },
      select: { id: true, name: true, username: true },
    });
    res.json(masters);
  } catch (err) {
    next(err);
  }
});

export default router;
