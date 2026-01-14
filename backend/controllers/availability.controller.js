import { pool } from "../db.js";

const DURATION_HOURS = 2;

// Tour 1: slots fijos
const TOUR1_SLOTS = ["18:00", "20:00"];

// Tour 2: slots por hora 06:00..16:00
function tour2Slots() {
  const out = [];
  for (let h = 6; h <= 16; h++) out.push(`${String(h).padStart(2, "0")}:00`);
  return out;
}

function slotsForTour(tourId) {
  if (tourId === 1) return TOUR1_SLOTS;
  if (tourId === 2) return tour2Slots();
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
    return res.status(400).json({ ok: false, message: "from y to requeridos (YYYY-MM-DD)" });
  }

  const candidateSlots = slotsForTour(tourId);
  const totalSlots = candidateSlots.length;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

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
      [tourId, from, to]
    );

    const q = await client.query(
      `
      WITH days AS (
        SELECT generate_series($2::date, $3::date, interval '1 day')::date AS day
      ),
      slots AS (
        SELECT d.day, unnest($4::text[])::time AS slot_time
        FROM days d
      ),
      active_bookings AS (
        SELECT
          b.tour_date::date AS day,
          b.start_time
        FROM bookings b
        WHERE b.tour_id = $1
          AND b.tour_date BETWEEN $2::date AND $3::date
          AND b.status IN ('paid','pending')
          AND (b.status <> 'pending' OR b.expires_at > now())
      ),
      blocked AS (
        SELECT DISTINCT
          s.day,
          s.slot_time
        FROM slots s
        JOIN active_bookings b
          ON b.day = s.day
         AND (s.slot_time, (s.slot_time + interval '${DURATION_HOURS} hours')) overlaps
             (b.start_time, (b.start_time + interval '${DURATION_HOURS} hours'))
      )
      SELECT
        to_char(day, 'YYYY-MM-DD') AS date,
        json_agg(to_char(slot_time, 'HH24:MI') ORDER BY slot_time) AS blocked
      FROM blocked
      GROUP BY day
      HAVING COUNT(*) > 0
      ORDER BY day;
      `,
      [tourId, from, to, candidateSlots]
    );

    await client.query("COMMIT");

    const days = q.rows.map((r) => {
      const blocked = Array.isArray(r.blocked) ? r.blocked : JSON.parse(r.blocked);
      return {
        date: r.date,
        blocked,
        isFull: blocked.length >= totalSlots,
      };
    });

    return res.json({
      ok: true,
      tourId,
      from,
      to,
      days,
    });
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch (_) {}
    console.error("getBlockedByRange error:", err);
    return res.status(500).json({ ok: false, message: "Error consultando disponibilidad" });
  } finally {
    client.release();
  }
}

