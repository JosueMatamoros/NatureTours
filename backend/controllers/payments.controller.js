// src/controllers/payments.controller.js
import { pool } from "../db.js";
import { createPaymentSchema } from "../schemas/payments.schema.js";
import { sendReceiptForPayment } from "./email.controller.js";

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
      SELECT id, status, total, deposit_amount, reseller_id
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

    // Snapshot de la comisión del reseller: % sobre el precio original
    // (sin descuento). Queda congelada aunque la comisión cambie después.
    let commissionAmount = null;
    if (booking.reseller_id) {
      const commissionQ = await client.query(
        `
        SELECT round(
          round(t.price * b.adults + COALESCE(t.child_price, t.price) * b.children, 2)
          * r.commission / 100, 2
        ) AS commission_amount
        FROM bookings b
        JOIN tours t ON t.id = b.tour_id
        JOIN resellers r ON r.id = b.reseller_id
        WHERE b.id = $1
        `,
        [bookingId],
      );
      commissionAmount = commissionQ.rows[0]?.commission_amount ?? null;
    }

    const paymentQ = await client.query(
      `
      INSERT INTO payments
        (booking_id, customer_id, mode, amount, paypal_order_id, paypal_capture_id, status,
         reseller_id, commission_amount, commission_status)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
        // Se copia del booking: NULL = venta propia.
        booking.reseller_id || null,
        commissionAmount,
        booking.reseller_id ? "pending" : null,
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

    const paymentId = paymentQ.rows[0].id;

    // Correos de confirmación desde el backend: se disparan aquí para no
    // depender de que el cliente llegue a la página de éxito (si cierra la
    // pestaña tras pagar, antes el correo nunca salía). La página de éxito
    // queda como reintento; email_sent evita duplicados.
    sendReceiptForPayment(paymentId).catch((e) => {
      console.error(`sendReceiptForPayment(${paymentId}) error:`, e);
    });

    return res.status(201).json({
      ok: true,
      id: paymentId,
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
        (b.adults + b.children + b.babies) AS personas,
        b.adults            AS adults,
        b.children          AS children,
        b.babies            AS babies,
        b.subtotal          AS subtotal,
        t.name              AS tour,
        round(t.price * (100 - COALESCE(GREATEST(30 - r.commission, 0), 0)) / 100, 2) AS price_per_person,
        round(COALESCE(t.child_price, t.price) * (100 - COALESCE(GREATEST(30 - r.commission, 0), 0)) / 100, 2) AS child_price,
        c.email             AS customer_email,
        c.name              AS customer_name,
        c.phone             AS customer_phone
      FROM payments p
      JOIN bookings b ON b.id = p.booking_id
      JOIN tours t ON t.id = b.tour_id
      LEFT JOIN customers c ON c.id = p.customer_id
      LEFT JOIN resellers r ON r.id = p.reseller_id
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
        adults: r.adults,
        children: r.children,
        babies: r.babies,
        subtotal: parseFloat(r.subtotal),
        fecha: r.fecha,
        hora: r.hora,
        pricePerPerson: parseFloat(r.price_per_person),
        childPrice: parseFloat(r.child_price),
        customerEmail: r.customer_email ?? null,
        customerName: r.customer_name ?? null,
        customerPhone: r.customer_phone ?? null,
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
      b.adults             AS adults,
      b.children           AS children,
      b.babies             AS babies,

      c.id                 AS customer_id,
      c.name               AS customer_name,
      c.phone              AS customer_phone,

      r.id                 AS reseller_id,
      r.name               AS reseller_name,
      r.commission         AS reseller_commission
    FROM payments p
    JOIN bookings b ON b.id = p.booking_id
    LEFT JOIN customers c ON c.id = p.customer_id
    LEFT JOIN resellers r ON r.id = p.reseller_id
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
          // personas = total de personas; seats = espacios que ocupan (sin bebés)
          personas: Number(r.adults) + Number(r.children) + Number(r.babies),
          seats: r.guests,
          adults: r.adults,
          children: r.children,
          babies: r.babies,
        },

        customer: r.customer_id
          ? { id: r.customer_id, name: r.customer_name, phone: r.customer_phone }
          : null,

        // null = venta propia
        reseller: r.reseller_id
          ? {
              id: r.reseller_id,
              name: r.reseller_name,
              commission: Number(r.reseller_commission),
            }
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
