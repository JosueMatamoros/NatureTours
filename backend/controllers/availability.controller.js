import { pool } from "../db.js";

// Tour 1: slots fijos
const TOUR1_SLOTS = ["18:00", "20:00"];

// Tour 2: slots fijos
const TOUR2_SLOTS = ["08:00", "12:00", "15:00"];

function slotsForTour(tourId) {
  if (tourId === 1) return TOUR1_SLOTS;
  if (tourId === 2) return TOUR2_SLOTS;
  return TOUR1_SLOTS;
}

export async function getBlockedByRange(req, res) {
  const tourId = Number(req.query.tourId);
  const from = req.query.from;
  const to = req.query.to;

  if (!tourId || Number.isNaN(tourId)) {
    return res.status(400).json({ ok: false, message: "tourId inválido" });
  }
  if (!from || typeof from !== "string" || !to || typeof to !== "string") {
    return res
      .status(400)
      .json({ ok: false, message: "from y to requeridos (YYYY-MM-DD)" });
  }

  const candidateSlots = slotsForTour(tourId).map((s) => String(s).trim());
  const totalSlots = candidateSlots.length;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Expirar pendientes vencidas (igual que ya tenías)
    await client.query(
      `
      UPDATE bookings
      SET status = 'expired',
          updated_at = now()
      WHERE tour_id = $1
        AND tour_date BETWEEN $2::date AND $3::date
        AND status = 'pending'
        AND expires_at <= now();
      `,
      [tourId, from.trim(), to.trim()]
    );

    // 1) Bloqueos por bookings exactos dentro de los slots permitidos
    const bookingsBlockedQ = await client.query(
      `
      SELECT
        to_char(b.tour_date, 'YYYY-MM-DD') AS date,
        json_agg(to_char(b.start_time, 'HH24:MI') ORDER BY b.start_time) AS blocked
      FROM bookings b
      WHERE b.tour_id = $1
        AND b.tour_date BETWEEN $2::date AND $3::date
        AND b.status IN ('paid','pending')
        AND (b.status <> 'pending' OR b.expires_at > now())
        AND to_char(b.start_time, 'HH24:MI') = ANY($4::text[])
      GROUP BY b.tour_date
      HAVING COUNT(*) > 0
      ORDER BY b.tour_date;
      `,
      [tourId, from.trim(), to.trim(), candidateSlots]
    );

    // 2) Bloqueos admin
    const dayBlocksQ = await client.query(
      `
      SELECT to_char(day, 'YYYY-MM-DD') AS date
      FROM tour_day_blocks
      WHERE tour_id = $1
        AND day BETWEEN $2::date AND $3::date
      ORDER BY day;
      `,
      [tourId, from.trim(), to.trim()]
    );

    await client.query("COMMIT");

    const map = new Map();

    // bookings bloqueados
    for (const r of bookingsBlockedQ.rows) {
      const date = String(r.date).trim();
      const arr = Array.isArray(r.blocked) ? r.blocked : JSON.parse(r.blocked);
      map.set(date, new Set(arr.map((s) => String(s).trim())));
    }

    const adminBlockedDays = dayBlocksQ.rows.map((r) => String(r.date).trim());
    for (const date of adminBlockedDays) {
      map.set(date, new Set(candidateSlots)); // full day
    }

    const days = Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, set]) => {
        const blocked = Array.from(set).sort();
        return {
          date,
          blocked,
          isFull: blocked.length >= totalSlots,
        };
      });

    return res.json({
      ok: true,
      tourId,
      from: from.trim(),
      to: to.trim(),
      days,
    });
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}
    console.error("getBlockedByRange error:", err);
    return res
      .status(500)
      .json({ ok: false, message: "Error consultando disponibilidad" });
  } finally {
    client.release();
  }
}
