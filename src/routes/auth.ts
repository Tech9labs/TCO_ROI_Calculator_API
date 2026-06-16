import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { db } from "../lib/db";
import { requireAuth, AuthPayload } from "../middleware/auth";

const router = Router();

const signupSchema = z.object({
  name:     z.string().min(2),
  email:    z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

function makeToken(payload: AuthPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: "7d" });
}

// POST /api/auth/signup
router.post("/signup", async (req: Request, res: Response): Promise<void> => {
  try {
    const data = signupSchema.parse(req.body);

    const exists = await db.user.findUnique({ where: { email: data.email } });
    if (exists) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const role = adminEmail && data.email === adminEmail ? "SUPER_ADMIN" : "USER";

    const hashed = await bcrypt.hash(data.password, 10);
    const user = await db.user.create({
      data: { name: data.name, email: data.email, password: hashed, role },
    });

    const token = makeToken({ userId: user.id, email: user.email, name: user.name, role: user.role });
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err: any) {
    console.error("Signup error:", err.message, err.code);
    res.status(500).json({ error: "Sign up failed", detail: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await db.user.findUnique({ where: { email: data.email } });
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = makeToken({ userId: user.id, email: user.email, name: user.name, role: user.role });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err: any) {
    console.error("Login error:", err.message, err.code);
    res.status(500).json({ error: "Login failed", detail: err.message });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, (req: Request, res: Response): void => {
  res.json({ user: req.user });
});

export default router;
