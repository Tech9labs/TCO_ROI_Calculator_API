import { Router, Request, Response } from "express";
import { z } from "zod";
import { db } from "../lib/db";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const saveSchema = z.object({
  title:   z.string().min(1),
  payload: z.record(z.unknown()),
  result:  z.record(z.unknown()).optional(),
});

// GET /api/saved — list calculations (SUPER_ADMIN sees all, others see own)
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const isAdmin = req.user!.role === "SUPER_ADMIN";
    const where = isAdmin ? {} : { userId: req.user!.userId };

    const rows = await db.calculation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    });

    res.json(rows.map(r => ({
      id:        r.id,
      title:     r.title,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      user:      r.user,
    })));
  } catch (err: any) {
    console.error("GET /saved error:", err.message);
    res.status(500).json({ error: "Failed to fetch calculations" });
  }
});

// POST /api/saved — save a new calculation
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const data = saveSchema.parse(req.body);

    const row = await db.calculation.create({
      data: {
        title:   data.title,
        userId:  req.user!.userId,
        payload: JSON.stringify(data.payload),
        result:  data.result ? JSON.stringify(data.result) : null,
      },
    });

    res.status(201).json({ id: row.id, title: row.title, createdAt: row.createdAt });
  } catch (err: any) {
    console.error("POST /saved error:", err.message);
    res.status(500).json({ error: "Failed to save calculation" });
  }
});

// GET /api/saved/:id — get full calculation payload
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const row = await db.calculation.findUnique({ where: { id: req.params.id } });
    if (!row) { res.status(404).json({ error: "Not found" }); return; }

    const isOwner = row.userId === req.user!.userId;
    const isAdmin = req.user!.role === "SUPER_ADMIN";
    if (!isOwner && !isAdmin) { res.status(403).json({ error: "Forbidden" }); return; }

    res.json({
      id:        row.id,
      title:     row.title,
      payload:   JSON.parse(row.payload),
      result:    row.result ? JSON.parse(row.result) : null,
      createdAt: row.createdAt,
    });
  } catch (err: any) {
    console.error("GET /saved/:id error:", err.message);
    res.status(500).json({ error: "Failed to fetch calculation" });
  }
});

// PUT /api/saved/:id — update an existing calculation
router.put("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const data = saveSchema.parse(req.body);

    const row = await db.calculation.findUnique({ where: { id: req.params.id } });
    if (!row) { res.status(404).json({ error: "Not found" }); return; }

    const isOwner      = row.userId === req.user!.userId;
    const isSuperAdmin = req.user!.role === "SUPER_ADMIN";
    if (!isOwner && !isSuperAdmin) { res.status(403).json({ error: "Forbidden" }); return; }

    const updated = await db.calculation.update({
      where: { id: req.params.id },
      data: {
        title:   data.title,
        payload: JSON.stringify(data.payload),
        result:  data.result ? JSON.stringify(data.result) : null,
      },
    });

    res.json({ id: updated.id, title: updated.title, updatedAt: updated.updatedAt });
  } catch (err: any) {
    console.error("PUT /saved/:id error:", err.message);
    res.status(500).json({ error: "Failed to update calculation" });
  }
});

// DELETE /api/saved/:id
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const role = req.user!.role;

    if (role === "USER") {
      res.status(403).json({ error: "Users cannot delete calculations." });
      return;
    }

    const row = await db.calculation.findUnique({ where: { id: req.params.id } });
    if (!row) { res.status(404).json({ error: "Not found" }); return; }

    const isOwner = row.userId === req.user!.userId;
    const isSuperAdmin = role === "SUPER_ADMIN";
    if (!isOwner && !isSuperAdmin) { res.status(403).json({ error: "Forbidden" }); return; }

    await db.calculation.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err: any) {
    console.error("DELETE /saved/:id error:", err.message);
    res.status(500).json({ error: "Failed to delete calculation" });
  }
});

// POST /api/saved/:id/clone — duplicate a calculation
router.post("/:id/clone", async (req: Request, res: Response): Promise<void> => {
  try {
    const row = await db.calculation.findUnique({ where: { id: req.params.id } });
    if (!row) { res.status(404).json({ error: "Not found" }); return; }

    const isOwner = row.userId === req.user!.userId;
    const isAdmin = req.user!.role === "SUPER_ADMIN";
    if (!isOwner && !isAdmin) { res.status(403).json({ error: "Forbidden" }); return; }

    const cloned = await db.calculation.create({
      data: {
        title:   `${row.title} (Copy)`,
        userId:  req.user!.userId,
        payload: row.payload,
        result:  null,
      },
    });

    res.status(201).json({ id: cloned.id, title: cloned.title, createdAt: cloned.createdAt });
  } catch (err: any) {
    console.error("POST /saved/:id/clone error:", err.message);
    res.status(500).json({ error: "Failed to clone calculation" });
  }
});

export default router;
