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
    mode,              // "deposit" | "full"
    amount,
    paypalOrderId,
    paypalCaptureId,   // opcional
    status,            // "completed"
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
      [bookingId]
    );

    if (bookingQ.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ ok: false, message: "Booking no encontrado" });
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
      mode === "full"
        ? toNum(booking.total)
        : toNum(booking.deposit_amount);

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
      ]
    );

    const nextBookingStatus = mode === "full" ? "paid" : "pending";

    await client.query(
      `
      UPDATE bookings
      SET status = $2,
          updated_at = now()
      WHERE id = $1
      `,
      [bookingId, nextBookingStatus]
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
