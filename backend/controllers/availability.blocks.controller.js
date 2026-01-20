import { pool } from "../db.js";

/**
 * POST /api/availability/blocks
 * body: { tourId: number, day: "YYYY-MM-DD", reason?: string }
 * Crea o actualiza (upsert) el bloqueo del día para el tour.
 */
export async function upsertDayBlock(req, res) {
  const tourId = Number(req.body?.tourId);
  const day = req.body?.day;
  const reason = req.body?.reason ?? null;

  if (!tourId || Number.isNaN(tourId)) {
    return res.status(400).json({ ok: false, message: "tourId inválido" });
  }
  if (!day || typeof day !== "string") {
    return res.status(400).json({ ok: false, message: "day requerido (YYYY-MM-DD)" });
  }
  // validación básica YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return res.status(400).json({ ok: false, message: "Formato day inválido (YYYY-MM-DD)" });
  }

  const client = await pool.connect();
  try {
    const q = await client.query(
      `
      INSERT INTO tour_day_blocks (tour_id, day, reason)
      VALUES ($1, $2::date, $3)
      ON CONFLICT (tour_id, day)
      DO UPDATE SET reason = EXCLUDED.reason
      RETURNING id, tour_id, to_char(day,'YYYY-MM-DD') AS day, reason, created_at;
      `,
      [tourId, day, reason]
    );

    return res.status(201).json({
      ok: true,
      block: {
        id: q.rows[0].id,
        tourId: q.rows[0].tour_id,
        day: q.rows[0].day,
        reason: q.rows[0].reason,
        createdAt: q.rows[0].created_at,
      },
    });
  } catch (err) {
    console.error("upsertDayBlock error:", err);
    return res.status(500).json({ ok: false, message: "Error bloqueando día" });
  } finally {
    client.release();
  }
}

/**
 * DELETE /api/availability/blocks?tourId=1&day=YYYY-MM-DD
 * Elimina el bloqueo del día para el tour.
 */
export async function deleteDayBlock(req, res) {
  const tourId = Number(req.query?.tourId);
  const day = req.query?.day;

  if (!tourId || Number.isNaN(tourId)) {
    return res.status(400).json({ ok: false, message: "tourId inválido" });
  }
  if (!day || typeof day !== "string") {
    return res.status(400).json({ ok: false, message: "day requerido (YYYY-MM-DD)" });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return res.status(400).json({ ok: false, message: "Formato day inválido (YYYY-MM-DD)" });
  }

  const client = await pool.connect();
  try {
    const q = await client.query(
      `
      DELETE FROM tour_day_blocks
      WHERE tour_id = $1 AND day = $2::date
      RETURNING id;
      `,
      [tourId, day]
    );

    if (q.rowCount === 0) {
      return res.status(404).json({ ok: false, message: "Bloqueo no encontrado" });
    }

    return res.json({ ok: true, deleted: true });
  } catch (err) {
    console.error("deleteDayBlock error:", err);
    return res.status(500).json({ ok: false, message: "Error desbloqueando día" });
  } finally {
    client.release();
  }
}

/**
 * GET /api/availability/blocks?tourId=1&from=YYYY-MM-DD&to=YYYY-MM-DD
 * Lista bloqueos por rango (para pintar el calendario en admin, opcional pero útil).
 */
export async function getDayBlocksByRange(req, res) {
  const tourId = Number(req.query?.tourId);
  const from = req.query?.from;
  const to = req.query?.to;

  if (!tourId || Number.isNaN(tourId)) {
    return res.status(400).json({ ok: false, message: "tourId inválido" });
  }
  if (!from || typeof from !== "string" || !to || typeof to !== "string") {
    return res.status(400).json({ ok: false, message: "from y to requeridos (YYYY-MM-DD)" });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return res.status(400).json({ ok: false, message: "Formato from/to inválido (YYYY-MM-DD)" });
  }

  const client = await pool.connect();
  try {
    const q = await client.query(
      `
      SELECT
        id,
        tour_id,
        to_char(day,'YYYY-MM-DD') AS day,
        reason,
        created_at
      FROM tour_day_blocks
      WHERE tour_id = $1
        AND day BETWEEN $2::date AND $3::date
      ORDER BY day;
      `,
      [tourId, from, to]
    );

    return res.json({
      ok: true,
      tourId,
      from,
      to,
      blocks: q.rows.map((r) => ({
        id: r.id,
        tourId: r.tour_id,
        day: r.day,
        reason: r.reason,
        createdAt: r.created_at,
      })),
    });
  } catch (err) {
    console.error("getDayBlocksByRange error:", err);
    return res.status(500).json({ ok: false, message: "Error consultando bloqueos" });
  } finally {
    client.release();
  }
}
