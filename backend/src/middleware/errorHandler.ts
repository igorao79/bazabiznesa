import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error("Error:", err.message);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Prisma known request error (e.g. record not found)
  if (err.name === "PrismaClientKnownRequestError") {
    res.status(400).json({ error: "Ошибка при работе с базой данных" });
    return;
  }

  res.status(500).json({ error: "Внутренняя ошибка сервера" });
}
