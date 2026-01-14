// src/controllers/bookings.controller.js
import { pool } from "../db.js";
import { createBookingSchema, bookingIdSchema, changeBookingSchema   } from "../schemas/bookings.schema.js";

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

export async function changePendingBooking(req, res) {
  const { id } = req.params;

  const parsed = changeBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const { tourId, tourDate, startTime, guests } = parsed.data;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1) Bloquear el booking actual
    const curQ = await client.query(
      `
      select id, status, expires_at
      from bookings
      where id = $1
      for update
      `,
      [id]
    );

    if (curQ.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ ok: false, message: "Booking no encontrado" });
    }

    const cur = curQ.rows[0];

    if (cur.status !== "pending") {
      await client.query("ROLLBACK");
      return res.status(409).json({
        ok: false,
        message: "Solo se puede cambiar un booking pendiente",
      });
    }

    if (cur.expires_at && new Date(cur.expires_at) <= new Date()) {
      await client.query(
        `update bookings set status='expired' where id=$1`,
        [id]
      );
      await client.query("COMMIT");
      return res.status(409).json({
        ok: false,
        message: "Este booking ya expiró",
      });
    }

    // 2) Chequear traslape EXCLUYENDO el booking actual
    const overlap = await client.query(
      `
      select 1
      from bookings b
      where b.tour_id = $1
        and b.tour_date = $2::date
        and b.id <> $4
        and b.status in ('paid','pending')
        and (b.status <> 'pending' or b.expires_at > now())
        and (
          ($3::time, ($3::time + interval '${DURATION_HOURS} hours')) overlaps
          (b.start_time, (b.start_time + interval '${DURATION_HOURS} hours'))
        )
      limit 1;
      `,
      [tourId, tourDate, startTime, id]
    );

    if (overlap.rowCount > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        ok: false,
        message: "Ese horario ya está ocupado. Elegí otro.",
      });
    }

    // 3) Crear nuevo booking pending
    const created = await client.query(
      `
      insert into bookings (tour_id, tour_date, start_time, guests, status)
      values ($1, $2::date, $3::time, $4, 'pending')
      returning id;
      `,
      [tourId, tourDate, startTime, guests]
    );

    const newId = created.rows[0].id;

    // 4) Expirar el anterior
    await client.query(
      `
      update bookings
      set status='expired', updated_at=now()
      where id=$1
      `,
      [id]
    );

    await client.query("COMMIT");

    return res.json({
      ok: true,
      id: newId,
      previousExpired: id,
    });
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("changePendingBooking error:", err);
    return res.status(500).json({
      ok: false,
      message: "Error cambiando booking",
    });
  } finally {
    client.release();
  }
}
