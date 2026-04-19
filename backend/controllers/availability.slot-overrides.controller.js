import { pool } from "../db.js";

// GET /api/availability/slot-overrides?tourId=2&from=YYYY-MM-DD&to=YYYY-MM-DD
export async function getSlotOverrides(req, res) {
  const tourId = Number(req.query.tourId);
  const from = req.query.from;
  const to = req.query.to;

  if (!tourId || Number.isNaN(tourId)) {
    return res.status(400).json({ ok: false, message: "tourId inválido" });
  }
  if (!from || !to) {
    return res.status(400).json({ ok: false, message: "from y to requeridos" });
  }

  try {
    const q = await pool.query(
      `SELECT id, tour_id,
              to_char(tour_date, 'YYYY-MM-DD') AS tour_date,
              to_char(start_time, 'HH24:MI') AS start_time,
              capacity_override, created_at
       FROM tour_slot_overrides
       WHERE tour_id = $1 AND tour_date BETWEEN $2::date AND $3::date
       ORDER BY tour_date, start_time`,
      [tourId, from.trim(), to.trim()]
    );
    return res.json({ ok: true, overrides: q.rows });
  } catch (err) {
    console.error("getSlotOverrides error:", err);
    return res.status(500).json({ ok: false, message: "Error consultando overrides" });
  }
}

// PUT /api/availability/slot-overrides
// body: { tourId, tourDate, startTime, capacityOverride }
export async function upsertSlotOverride(req, res) {
  const tourId = Number(req.body?.tourId);
  const tourDate = req.body?.tourDate;
  const startTime = req.body?.startTime;
  const capacityOverride = Number(req.body?.capacityOverride);

  if (!tourId || Number.isNaN(tourId)) {
    return res.status(400).json({ ok: false, message: "tourId inválido" });
  }
  if (!tourDate || !/^\d{4}-\d{2}-\d{2}$/.test(tourDate)) {
    return res.status(400).json({ ok: false, message: "tourDate inválido (YYYY-MM-DD)" });
  }
  if (!startTime) {
    return res.status(400).json({ ok: false, message: "startTime requerido" });
  }
  if (Number.isNaN(capacityOverride) || capacityOverride < 0) {
    return res.status(400).json({ ok: false, message: "capacityOverride debe ser >= 0" });
  }

  try {
    const q = await pool.query(
      `INSERT INTO tour_slot_overrides (tour_id, tour_date, start_time, capacity_override)
       VALUES ($1, $2::date, $3::time, $4)
       ON CONFLICT (tour_id, tour_date, start_time)
       DO UPDATE SET capacity_override = EXCLUDED.capacity_override, updated_at = NOW()
       RETURNING id, tour_id,
                 to_char(tour_date, 'YYYY-MM-DD') AS tour_date,
                 to_char(start_time, 'HH24:MI') AS start_time,
                 capacity_override`,
      [tourId, tourDate, startTime, capacityOverride]
    );
    return res.json({ ok: true, override: q.rows[0] });
  } catch (err) {
    console.error("upsertSlotOverride error:", err);
    return res.status(500).json({ ok: false, message: "Error guardando override" });
  }
}

// DELETE /api/availability/slot-overrides?tourId=2&tourDate=YYYY-MM-DD&startTime=HH:MM
export async function deleteSlotOverride(req, res) {
  const tourId = Number(req.query.tourId);
  const tourDate = req.query.tourDate;
  const startTime = req.query.startTime;

  if (!tourId || Number.isNaN(tourId)) {
    return res.status(400).json({ ok: false, message: "tourId inválido" });
  }
  if (!tourDate || !startTime) {
    return res.status(400).json({ ok: false, message: "tourDate y startTime requeridos" });
  }

  try {
    const q = await pool.query(
      `DELETE FROM tour_slot_overrides
       WHERE tour_id = $1 AND tour_date = $2::date AND start_time = $3::time
       RETURNING id`,
      [tourId, tourDate, startTime]
    );
    if (q.rowCount === 0) {
      return res.status(404).json({ ok: false, message: "Override no encontrado" });
    }
    return res.json({ ok: true, deleted: true });
  } catch (err) {
    console.error("deleteSlotOverride error:", err);
    return res.status(500).json({ ok: false, message: "Error eliminando override" });
  }
}
