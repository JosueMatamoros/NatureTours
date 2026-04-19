// src/controllers/bookings.controller.js
import { pool } from "../db.js";
import { createBookingSchema, bookingIdSchema} from "../schemas/bookings.schema.js";
import {
  nowPlusMsInBusinessZone,
  parseBookingDateTimeMs,
} from "../utils/businessTime.js";

const TOUR1_SLOTS = ["18:00", "20:00"];
const TOUR2_SLOTS = ["08:00", "12:00", "15:00"];
const TOUR2_CAPACITY = 16;
const MIN_BOOKING_LEAD_TIME_MS = 2 * 60 * 60 * 1000;

function slotsForTour(tourId) {
  if (tourId === 1) return TOUR1_SLOTS;
  if (tourId === 2) return TOUR2_SLOTS;
  return TOUR1_SLOTS;
}

const BOOKING_HOLD_MINUTES = 20;

export async function createBooking(req, res) {
  const parsed = createBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const { tourId, tourDate, startTime, guests } = parsed.data;
  const allowedSlots = slotsForTour(tourId);

  if (!allowedSlots.includes(startTime)) {
    return res.status(400).json({
      ok: false,
      message: "Ese horario no es valido para este tour.",
    });
  }

  const bookingStartMs = parseBookingDateTimeMs(tourDate, startTime);
  const minLeadTimeMs = nowPlusMsInBusinessZone(MIN_BOOKING_LEAD_TIME_MS).toMillis();

  if (!Number.isFinite(bookingStartMs) || bookingStartMs <= minLeadTimeMs) {
    return res.status(400).json({
      ok: false,
      message: "Las reservas deben hacerse con al menos 2 horas de anticipación.",
    });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Limpiar pendientes vencidos para calcular disponibilidad real.
    await client.query(
      `
      update bookings
      set status = 'expired',
          updated_at = now()
      where tour_id = $1
        and tour_date = $2::date
        and status = 'pending'
        and expires_at <= now();
      `,
      [tourId, tourDate]
    );

    if (tourId === 2) {
      // Tour 2 bloquea por capacidad por slot (fecha + horario).
      const slotLoadQ = await client.query(
        `
        select coalesce(sum(b.guests), 0)::int as guests_taken
        from bookings b
        where b.tour_id = $1
          and b.tour_date = $2::date
          and b.start_time = $3::time
          and b.status in ('paid','pending')
          and (b.status <> 'pending' or b.expires_at > now());
        `,
        [tourId, tourDate, startTime]
      );

      const guestsTaken = Number(slotLoadQ.rows[0]?.guests_taken ?? 0);

      // Check phantom guests override — acts as a phantom reservation reducing available slots
      let phantom = 0;
      try {
        const overrideQ = await client.query(
          `SELECT capacity_override FROM tour_slot_overrides
           WHERE tour_id = $1 AND tour_date = $2::date AND start_time = $3::time`,
          [tourId, tourDate, startTime]
        );
        if (overrideQ.rowCount > 0) {
          phantom = Number(overrideQ.rows[0].capacity_override);
        }
      } catch (_) {
        // table may not exist yet — no phantom guests
      }

      const effectiveCapacity = TOUR2_CAPACITY - phantom;
      const remaining = Math.max(0, effectiveCapacity - guestsTaken);

      if (guests > remaining) {
        await client.query("ROLLBACK");
        return res.status(409).json({
          ok: false,
          message:
            remaining === 0
              ? "Ese horario ya no tiene espacios disponibles."
              : `Solo quedan ${remaining} espacios disponibles para ese horario.`,
          remaining,
          capacity: effectiveCapacity,
        });
      }
    } else {
      // Tour 1 mantiene bloqueo por horario exacto.
      const existingBooking = await client.query(
        `
        select 1
        from bookings b
        where b.tour_id = $1
          and b.tour_date = $2::date
          and b.start_time = $3::time
          and b.status in ('paid','pending')
          and (b.status <> 'pending' or b.expires_at > now())
        limit 1;
        `,
        [tourId, tourDate, startTime]
      );

      if (existingBooking.rowCount > 0) {
        await client.query("ROLLBACK");
        return res.status(409).json({
          ok: false,
          message: "Ese horario ya está ocupado. Elegí otro.",
        });
      }
    }

    const created = await client.query(
      `
      insert into bookings (tour_id, tour_date, start_time, guests, status, expires_at)
      values ($1, $2::date, $3::time, $4, 'pending', now() + ($5 || ' minutes')::interval)
      returning
        id, tour_id, tour_date, start_time, guests,
        subtotal, paypal_fee, total,
        status, expires_at, created_at, updated_at, deposit_amount;
      `,
      [tourId, tourDate, startTime, guests, BOOKING_HOLD_MINUTES]
    );

    await client.query("COMMIT");

    return res.status(201).json({ ok: true, id: created.rows[0].id });
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}
    console.error(err);
    return res.status(500).json({ ok: false, message: "Error creando booking" });
  } finally {
    client.release();
  }
}

export async function getBookingById(req, res) {
  const parsed = bookingIdSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const { id } = parsed.data;

  try {
    const result = await pool.query(
      `
      select
        b.id, b.tour_id, t.name as tour_name, t.price as tour_price,
        b.tour_date, b.start_time, b.guests,
        b.subtotal, b.paypal_fee, b.total,
        b.status, b.expires_at, b.created_at, b.updated_at, b.deposit_amount
      from bookings b
      join tours t on t.id = b.tour_id
      where b.id = $1;
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, message: "Booking no encontrado" });
    }

    return res.json({ ok: true, booking: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Error consultando booking" });
  }
}


export async function expireBooking(req, res) {
  const { id } = req.params;

  await pool.query(
    `
    update bookings
    set status = 'expired', updated_at = now()
    where id = $1 and status = 'pending'
    `,
    [id]
  );

  res.json({ ok: true });
}


export async function validateBooking(req, res) {
  const { id } = req.params;

  const r = await pool.query(
    `
    select id, status, expires_at
    from bookings
    where id = $1
    `,
    [id]
  );

  const booking = r.rows[0];
  if (!booking) return res.status(404).json({ ok: false, valid: false, reason: "not_found" });

  if (booking.status !== "pending") {
    return res.json({ ok: true, valid: false, reason: "not_pending" });
  }

  const expiresAt = new Date(booking.expires_at).getTime();
  const now = Date.now();

  const expired = !Number.isFinite(expiresAt) || now >= expiresAt;

  if (expired) {
    await pool.query(
      `
      update bookings
      set status = 'expired', updated_at = now()
      where id = $1 and status = 'pending'
      `,
      [id]
    );

    return res.json({ ok: true, valid: false, reason: "expired" });
  }

  const msLeft = Math.max(0, expiresAt - now);
  return res.json({ ok: true, valid: true, msLeft });
}
