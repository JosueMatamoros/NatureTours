// src/controllers/bookings.controller.js
import { pool } from "../db.js";
import { createBookingSchema, bookingIdSchema} from "../schemas/bookings.schema.js";

const DURATION_HOURS = 2;

export async function createBooking(req, res) {
  const parsed = createBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const { tourId, tourDate, startTime, guests } = parsed.data;

  const client = await pool.connect();
  try {
    // 1) Chequear traslape (bloquea 9,10,11 si existe 10, etc.)
    const overlap = await client.query(
      `
      select 1
      from bookings b
      where b.tour_id = $1
        and b.tour_date = $2::date
        and b.status in ('paid','pending')
        and (b.status <> 'pending' or b.expires_at > now())
        and (
          ($3::time, ($3::time + interval '${DURATION_HOURS} hours')) overlaps
          (b.start_time, (b.start_time + interval '${DURATION_HOURS} hours'))
        )
      limit 1;
      `,
      [tourId, tourDate, startTime]
    );

    if (overlap.rowCount > 0) {
      return res.status(409).json({
        ok: false,
        message: "Ese horario ya está ocupado. Elegí otro.",
      });
    }

    const created = await client.query(
      `
      insert into bookings (tour_id, tour_date, start_time, guests, status)
      values ($1, $2::date, $3::time, $4, 'pending')
      returning
        id, tour_id, tour_date, start_time, guests,
        subtotal, paypal_fee, total,
        status, expires_at, created_at, updated_at, deposit_amount;
      `,
      [tourId, tourDate, startTime, guests]
    );

    return res.status(201).json({ ok: true, id: created.rows[0].id });
  } catch (err) {
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
    select id, status, created_at
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

  const created = new Date(booking.created_at).getTime();
  const now = Date.now();
  const tenMinutes = 10 * 60 * 1000;

  const expired = now - created > tenMinutes;

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

  const msLeft = tenMinutes - (now - created);
  return res.json({ ok: true, valid: true, msLeft });
}
