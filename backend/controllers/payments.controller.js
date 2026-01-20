// src/controllers/payments.controller.js
import { pool } from "../db.js";
import { createPaymentSchema } from "../schemas/payments.schema.js";

export async function createPayment(req, res) {
  const parsed = createPaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const {
    bookingId,
    customerId,
    mode, // "deposit" | "full"
    amount,
    paypalOrderId,
    paypalCaptureId, // opcional
    status, // "completed"
  } = parsed.data;

  if (String(status).toLowerCase() !== "completed") {
    return res.status(400).json({
      ok: false,
      message: "El payment solo se registra si está completado",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const bookingQ = await client.query(
      `
      SELECT id, status, total, deposit_amount
      FROM bookings
      WHERE id = $1
      FOR UPDATE
      `,
      [bookingId],
    );

    if (bookingQ.rowCount === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ ok: false, message: "Booking no encontrado" });
    }

    const booking = bookingQ.rows[0];

    if (booking.status === "paid") {
      await client.query("ROLLBACK");
      return res.status(409).json({
        ok: false,
        message: "Este booking ya fue pagado",
      });
    }

    const toNum = (v) => Number(v);
    const expectedAmount =
      mode === "full" ? toNum(booking.total) : toNum(booking.deposit_amount);

    const round2 = (n) => Math.round(n * 100) / 100;

    if (round2(amount) !== round2(expectedAmount)) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        ok: false,
        message: "Monto incorrecto para el tipo de pago",
      });
    }

    const paymentQ = await client.query(
      `
      INSERT INTO payments
        (booking_id, customer_id, mode, amount, paypal_order_id, paypal_capture_id, status)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
      `,
      [
        bookingId,
        customerId || null,
        mode,
        amount,
        paypalOrderId,
        paypalCaptureId || null,
        status,
      ],
    );

    const nextBookingStatus = mode === "full" ? "paid" : "pending";

    await client.query(
      `
      UPDATE bookings
      SET status = $2,
          updated_at = now()
      WHERE id = $1
      `,
      [bookingId, nextBookingStatus],
    );

    await client.query("COMMIT");

    return res.status(201).json({
      ok: true,
      id: paymentQ.rows[0].id,
    });
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}

    return res.status(500).json({
      ok: false,
      message: "Error creando payment",
    });
  } finally {
    client.release();
  }
}

export async function getPaymentById(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ ok: false, message: "Falta id del payment" });
  }

  const client = await pool.connect();

  try {
    const q = await client.query(
      `
      SELECT
        p.id                AS reserva_id,
        p.paypal_capture_id AS paypal_capture_id,
        p.amount            AS amount,
        p.mode              AS mode,
        b.tour_date         AS fecha,
        b.start_time        AS hora,
        b.guests            AS personas,
        t.name              AS tour,
        t.price             AS price_per_person
      FROM payments p
      JOIN bookings b ON b.id = p.booking_id
      JOIN tours t ON t.id = b.tour_id
      WHERE p.id = $1
      `,
      [id],
    );

    if (q.rowCount === 0) {
      return res
        .status(404)
        .json({ ok: false, message: "Payment no encontrado" });
    }

    const r = q.rows[0];

    return res.json({
      ok: true,
      receipt: {
        reservaId: r.reserva_id,
        paypalCaptureId: r.paypal_capture_id,
        amount: parseFloat(r.amount),
        mode: r.mode,
        tour: r.tour,
        personas: r.personas,
        fecha: r.fecha,
        hora: r.hora,
        pricePerPerson: parseFloat(r.price_per_person),
      },
    });
  } catch (err) {
    console.error("getPaymentById error:", err);
    return res
      .status(500)
      .json({ ok: false, message: "Error obteniendo payment" });
  } finally {
    client.release();
  }
}

export async function getAllPayments(req, res) {
  const client = await pool.connect();

  try {
    const q = await client.query(
      `
      SELECT
      p.id                 AS payment_id,
      p.amount             AS amount,
      p.mode               AS mode,
      p.paypal_order_id    AS paypal_order_id,
      p.paypal_capture_id  AS paypal_capture_id,
      p.status             AS status,
      p.created_at         AS created_at,

      b.id                 AS booking_id,
      b.tour_date          AS tour_date,
      b.start_time         AS start_time,
      b.guests             AS guests,

      c.id                 AS customer_id,
      c.name               AS customer_name
    FROM payments p
    JOIN bookings b ON b.id = p.booking_id
    LEFT JOIN customers c ON c.id = p.customer_id
    ORDER BY b.tour_date DESC, b.start_time DESC, p.created_at DESC;

      `,
    );

    return res.json({
      ok: true,
      payments: q.rows.map((r) => ({
        id: r.payment_id,
        amount: Number(r.amount),
        mode: r.mode,
        paypal: {
          orderId: r.paypal_order_id,
          captureId: r.paypal_capture_id,
        },
        status: r.status,

        booking: {
          id: r.booking_id,
          fecha: r.tour_date,
          hora: r.start_time,
          personas: r.guests,
        },

        customer: r.customer_id
          ? { id: r.customer_id, name: r.customer_name }
          : null,
      })),
    });
  } catch (err) {
    console.error("getAllPayments error:", err);
    return res
      .status(500)
      .json({ ok: false, message: "Error obteniendo payments" });
  } finally {
    client.release();
  }
}
