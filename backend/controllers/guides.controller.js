// src/controllers/guides.controller.js
//
// Módulo de guías: CRUD de guías + asignación de UN guía por horario
// (tour + fecha + hora). El login de guías y su vista limitada son una fase
// posterior; por ahora el email queda guardado como identificador y
// can_create_manual define si a futuro podrán crear reservas manuales.
import { pool } from "../db.js";
import { z } from "zod";

const guideIdSchema = z.object({ id: z.string().uuid() });

const guideBodySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(30).nullable().optional().or(z.literal("")),
  canCreateManual: z.boolean().optional(),
});

const updateGuideSchema = guideBodySchema.partial().extend({
  active: z.boolean().optional(),
});

const assignmentDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date debe ser YYYY-MM-DD"),
});

const assignSchema = z.object({
  tourId: z.number().int().positive(),
  tourDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  guideId: z.string().uuid(),
  assigned: z.boolean().default(true), // true = agregar guía, false = quitarlo
});

function mapGuide(r) {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    active: r.active,
    canCreateManual: r.can_create_manual,
    createdAt: r.created_at,
  };
}

// GET /api/guides
export async function getAllGuides(_req, res) {
  try {
    const q = await pool.query(
      `SELECT id, name, email, phone, active, can_create_manual, created_at
       FROM guides
       ORDER BY active DESC, name ASC`,
    );
    return res.json({ ok: true, guides: q.rows.map(mapGuide) });
  } catch (err) {
    console.error("getAllGuides error:", err);
    return res.status(500).json({ ok: false, message: "Error listando guías" });
  }
}

// POST /api/guides
export async function createGuide(req, res) {
  const parsed = guideBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }
  const { name, email, phone, canCreateManual } = parsed.data;
  try {
    const q = await pool.query(
      `INSERT INTO guides (name, email, phone, can_create_manual)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, phone, active, can_create_manual, created_at`,
      [name, email.toLowerCase(), phone || null, Boolean(canCreateManual)],
    );
    return res.status(201).json({ ok: true, guide: mapGuide(q.rows[0]) });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ ok: false, message: "Ya existe un guía con ese email" });
    }
    console.error("createGuide error:", err);
    return res.status(500).json({ ok: false, message: "Error creando guía" });
  }
}

// PATCH /api/guides/:id
export async function updateGuide(req, res) {
  const idParsed = guideIdSchema.safeParse(req.params);
  if (!idParsed.success) {
    return res.status(400).json({ ok: false, message: "Id inválido" });
  }
  const parsed = updateGuideSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }
  const { name, email, phone, active, canCreateManual } = parsed.data;
  try {
    const q = await pool.query(
      `UPDATE guides
       SET name = COALESCE($2, name),
           email = COALESCE($3, email),
           phone = COALESCE($4, phone),
           active = COALESCE($5, active),
           can_create_manual = COALESCE($6, can_create_manual)
       WHERE id = $1
       RETURNING id, name, email, phone, active, can_create_manual, created_at`,
      [
        idParsed.data.id,
        name ?? null,
        email ? email.toLowerCase() : null,
        phone === "" ? null : phone ?? null,
        active ?? null,
        canCreateManual ?? null,
      ],
    );
    if (q.rowCount === 0) {
      return res.status(404).json({ ok: false, message: "Guía no encontrado" });
    }
    return res.json({ ok: true, guide: mapGuide(q.rows[0]) });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ ok: false, message: "Ya existe un guía con ese email" });
    }
    console.error("updateGuide error:", err);
    return res.status(500).json({ ok: false, message: "Error actualizando guía" });
  }
}

// DELETE /api/guides/:id — borra el guía y sus asignaciones (cascade).
export async function deleteGuide(req, res) {
  const idParsed = guideIdSchema.safeParse(req.params);
  if (!idParsed.success) {
    return res.status(400).json({ ok: false, message: "Id inválido" });
  }
  try {
    const q = await pool.query(`DELETE FROM guides WHERE id = $1 RETURNING id`, [idParsed.data.id]);
    if (q.rowCount === 0) {
      return res.status(404).json({ ok: false, message: "Guía no encontrado" });
    }
    return res.json({ ok: true, deleted: true });
  } catch (err) {
    console.error("deleteGuide error:", err);
    return res.status(500).json({ ok: false, message: "Error eliminando guía" });
  }
}

// GET /api/guides/assignments?date=YYYY-MM-DD
// Asignaciones de guía por horario para un día (para pintarlas en Asistencia).
export async function getAssignments(req, res) {
  const parsed = assignmentDateSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }
  try {
    const q = await pool.query(
      `SELECT sg.tour_id,
              to_char(sg.tour_date,'YYYY-MM-DD') AS tour_date,
              to_char(sg.start_time,'HH24:MI')   AS start_time,
              sg.guide_id,
              g.name  AS guide_name,
              g.active AS guide_active
       FROM slot_guides sg
       JOIN guides g ON g.id = sg.guide_id
       WHERE sg.tour_date = $1::date`,
      [parsed.data.date],
    );
    return res.json({
      ok: true,
      date: parsed.data.date,
      assignments: q.rows.map((r) => ({
        tourId: r.tour_id,
        tourDate: r.tour_date,
        startTime: r.start_time,
        guideId: r.guide_id,
        guideName: r.guide_name,
        guideActive: r.guide_active,
      })),
    });
  } catch (err) {
    console.error("getAssignments error:", err);
    return res.status(500).json({ ok: false, message: "Error obteniendo asignaciones" });
  }
}

// PUT /api/guides/assignments — agrega o quita UN guía de un horario.
// Varios guías pueden compartir el mismo horario (índice único de 4 columnas).
export async function assignGuide(req, res) {
  const parsed = assignSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }
  const { tourId, tourDate, startTime, guideId, assigned } = parsed.data;
  try {
    if (!assigned) {
      await pool.query(
        `DELETE FROM slot_guides
         WHERE tour_id = $1 AND tour_date = $2::date AND start_time = $3::time AND guide_id = $4`,
        [tourId, tourDate, startTime, guideId],
      );
      return res.json({ ok: true, guideId, assigned: false });
    }

    await pool.query(
      `INSERT INTO slot_guides (tour_id, tour_date, start_time, guide_id)
       VALUES ($1, $2::date, $3::time, $4)
       ON CONFLICT (tour_id, tour_date, start_time, guide_id) DO NOTHING`,
      [tourId, tourDate, startTime, guideId],
    );
    return res.json({ ok: true, guideId, assigned: true });
  } catch (err) {
    if (err.code === "23503") {
      return res.status(400).json({ ok: false, message: "Guía o tour inválido" });
    }
    console.error("assignGuide error:", err);
    return res.status(500).json({ ok: false, message: "Error asignando guía" });
  }
}
