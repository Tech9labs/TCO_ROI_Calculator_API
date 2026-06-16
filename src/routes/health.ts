import { Router, Request, Response } from "express";
import { db } from "../lib/db";

const router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

router.get("/db", async (_req: Request, res: Response) => {
  try {
    await db.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message, code: err.code });
  }
});

export default router;
