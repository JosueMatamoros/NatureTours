import { pool } from "../db.js";
import {
  nowPlusMsInBusinessZone,
  parseBookingDateTimeMs,
  todayYmdInBusinessZone,
} from "../utils/businessTime.js";

// Tour 1: slots fijos
const TOUR1_SLOTS = ["18:00", "20:00"];

// Tour 2: slots fijos
const TOUR2_SLOTS = ["08:00", "12:00", "15:00"];
const TOUR2_CAPACITY = 16;
const MIN_BOOKING_LEAD_TIME_MS = 2 * 60 * 60 * 1000;

function slotsForTour(tourId) {
  if (tourId === 1) return TOUR1_SLOTS;
  if (tourId === 2) return TOUR2_SLOTS;
  return TOUR1_SLOTS;
}

function getBlockedLeadTimeSlots(date, candidateSlots) {
  const slotCutoffMs = nowPlusMsInBusinessZone(MIN_BOOKING_LEAD_TIME_MS).toMillis();
  return candidateSlots.filter((slot) => {
    const slotMs = parseBookingDateTimeMs(date, slot);
    return Number.isFinite(slotMs) && slotMs <= slotCutoffMs;
  });
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
  const dayCapacity = tourId === 2 ? TOUR2_CAPACITY : totalSlots;

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

    const bookingsBlockedQ =
      tourId === 2
        ? await client.query(
            `
            SELECT
              to_char(b.tour_date, 'YYYY-MM-DD') AS date,
              to_char(b.start_time, 'HH24:MI') AS start_time,
              coalesce(sum(b.guests), 0)::int AS guests_taken
            FROM bookings b
            WHERE b.tour_id = $1
              AND b.tour_date BETWEEN $2::date AND $3::date
              AND b.status IN ('paid','pending')
              AND (b.status <> 'pending' OR b.expires_at > now())
            GROUP BY b.tour_date, b.start_time
            ORDER BY b.tour_date, b.start_time;
            `,
            [tourId, from.trim(), to.trim()]
          )
        : await client.query(
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

    const remainingMap = new Map();
    const slotRemainingMap = new Map();

    // bookings bloqueados
    if (tourId === 2) {
      for (const r of bookingsBlockedQ.rows) {
        const date = String(r.date).trim();
        const startTime = String(r.start_time).trim();
        const guestsTaken = Number(r.guests_taken ?? 0);
        const remaining = Math.max(0, TOUR2_CAPACITY - guestsTaken);

        if (!slotRemainingMap.has(date)) {
          const bySlot = new Map();
          for (const slot of candidateSlots) bySlot.set(slot, TOUR2_CAPACITY);
          slotRemainingMap.set(date, bySlot);
        }

        slotRemainingMap.get(date).set(startTime, remaining);

        if (remaining <= 0) {
          if (!map.has(date)) map.set(date, new Set());
          map.get(date).add(startTime);
        }
      }

      for (const [date, bySlot] of slotRemainingMap.entries()) {
        let dayRemaining = 0;
        for (const slot of candidateSlots) {
          dayRemaining += Number(bySlot.get(slot) ?? TOUR2_CAPACITY);
        }
        remainingMap.set(date, dayRemaining);
      }
    } else {
      for (const r of bookingsBlockedQ.rows) {
        const date = String(r.date).trim();
        const arr = Array.isArray(r.blocked) ? r.blocked : JSON.parse(r.blocked);
        map.set(date, new Set(arr.map((s) => String(s).trim())));
      }
    }

    const todayYMD = todayYmdInBusinessZone();
    if (todayYMD >= from.trim() && todayYMD <= to.trim()) {
      const leadTimeBlocked = getBlockedLeadTimeSlots(todayYMD, candidateSlots);

      if (leadTimeBlocked.length > 0) {
        if (!map.has(todayYMD)) {
          map.set(todayYMD, new Set());
        }

        for (const slot of leadTimeBlocked) {
          map.get(todayYMD).add(slot);
        }

        if (tourId === 2) {
          if (!slotRemainingMap.has(todayYMD)) {
            const bySlot = new Map();
            for (const slot of candidateSlots) bySlot.set(slot, TOUR2_CAPACITY);
            slotRemainingMap.set(todayYMD, bySlot);
          }

          const bySlot = slotRemainingMap.get(todayYMD);
          for (const slot of leadTimeBlocked) {
            bySlot.set(slot, 0);
          }
        }
      }
    }

    const adminBlockedDays = dayBlocksQ.rows.map((r) => String(r.date).trim());
    for (const date of adminBlockedDays) {
      map.set(date, new Set(candidateSlots)); // full day
    }

    const days = Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, set]) => {
        const blocked = Array.from(set).sort();
        const isAdminOrFullyBlockedWithoutRows =
          tourId === 2 && blocked.length >= totalSlots && !slotRemainingMap.has(date);
        const slotRemaining =
          tourId === 2
            ? Object.fromEntries(
                candidateSlots.map((slot) => [
                  slot,
                  isAdminOrFullyBlockedWithoutRows
                    ? 0
                    : Number(slotRemainingMap.get(date)?.get(slot) ?? TOUR2_CAPACITY),
                ])
              )
            : undefined;
        return {
          date,
          blocked,
          isFull: blocked.length >= totalSlots,
          remaining: remainingMap.get(date) ?? dayCapacity,
          slotRemaining,
        };
      });

    if (tourId === 2) {
      for (const [date, bySlot] of slotRemainingMap.entries()) {
        if (map.has(date)) continue;

        let dayRemaining = 0;
        const slotRemaining = {};
        for (const slot of candidateSlots) {
          const value = Number(bySlot.get(slot) ?? TOUR2_CAPACITY);
          slotRemaining[slot] = value;
          dayRemaining += value;
        }

        days.push({
          date,
          blocked: [],
          isFull: false,
          remaining: dayRemaining,
          slotRemaining,
        });
      }
      days.sort((a, b) => a.date.localeCompare(b.date));
    }

    return res.json({
      ok: true,
      tourId,
      from: from.trim(),
      to: to.trim(),
      capacity: dayCapacity,
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
