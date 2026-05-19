import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "../lib/db";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

router.use(requireAuth, requireAdmin);

// GET /api/admin/users
router.get("/users", async (_req: Request, res: Response): Promise<void> => {
  const users = await db.user.findMany({
    select: {
      id: true, name: true, email: true, role: true, createdAt: true,
      _count: { select: { calculations: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  res.json({ users });
});

const createSchema = z.object({
  name:     z.string().min(2),
  email:    z.string().email(),
  password: z.string().min(6),
  role:     z.enum(["USER", "ADMIN", "SUPER_ADMIN"]).default("USER"),
});

// POST /api/admin/users
router.post("/users", async (req: Request, res: Response): Promise<void> => {
  const data = createSchema.parse(req.body);

  const exists = await db.user.findUnique({ where: { email: data.email } });
  if (exists) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const hashed = await bcrypt.hash(data.password, 10);
  const user = await db.user.create({
    data: { name: data.name, email: data.email, password: hashed, role: data.role },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  res.status(201).json({ user });
});

const updateSchema = z.object({
  name:     z.string().min(2).optional(),
  email:    z.string().email().optional(),
  password: z.string().min(6).optional(),
  role:     z.enum(["USER", "ADMIN", "SUPER_ADMIN"]).optional(),
});

// PATCH /api/admin/users/:id
router.patch("/users/:id", async (req: Request, res: Response): Promise<void> => {
  const data = updateSchema.parse(req.body);
  const update: Record<string, unknown> = {};
  if (data.name)     update.name  = data.name;
  if (data.email)    update.email = data.email;
  if (data.role)     update.role  = data.role;
  if (data.password) update.password = await bcrypt.hash(data.password, 10);

  if (Object.keys(update).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  try {
    const user = await db.user.update({
      where: { id: req.params.id },
      data: update,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    res.json({ user });
  } catch {
    res.status(404).json({ error: "User not found" });
  }
});

// DELETE /api/admin/users/:id
router.delete("/users/:id", async (req: Request, res: Response): Promise<void> => {
  if (req.params.id === req.user?.userId) {
    res.status(400).json({ error: "Cannot delete your own account" });
    return;
  }
  try {
    await db.user.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "User not found" });
  }
});

export default router;
