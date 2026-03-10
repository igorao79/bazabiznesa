import { Router, Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { signToken, authMiddleware } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

const router = Router();

router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new AppError(400, "Логин и пароль обязательны");
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || user.password !== password) {
      throw new AppError(401, "Неверный логин или пароль");
    }

    const token = signToken({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/me", authMiddleware, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

export default router;
