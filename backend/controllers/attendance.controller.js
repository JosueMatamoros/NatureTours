// src/controllers/attendance.controller.js
//
// Control de asistencia del día. A diferencia de /api/payments (que solo lista
// pagos), esto se arma desde bookings para incluir también las reservas
// MANUALES (sin pago en línea) y para poder marcar quién va llegando.
//
// Fuentes que entran a la lista de un día:
//   - source='web' que tengan al menos un pago completado (reserva confirmada).
//   - source<>'web' (manual / channel): siempre entran.
// Los holds web abandonados (sin pago) NO aparecen.
import { pool } from "../db.js";
import {
  attendanceDateSchema,
  setArrivedSchema,
  manualBookingSchema,
} from "../schemas/attendance.schema.js";

const round2 = (n) => Math.round(Number(n) * 100) / 100;

// Deuda a cobrar el DÍA del tour (efectivo), según el tipo de reserva:
//   - manual:  subtotal − lo ya cobrado (manual_paid)
//   - deposit: subtotal − el adelanto (deposit_amount) → resto en efectivo
//   - full:    0 (ya pagó todo en línea)
function computeBalanceDue(row) {
  const subtotal = Number(row.subtotal || 0);
  if (row.source === "manual") {
    return Math.max(round2(subtotal - Number(row.manual_paid || 0)), 0);
  }
  if (row.pay_mode === "deposit") {
    const deposit = Number(row.deposit_amount ?? row.pay_amount ?? 0);
    return Math.max(round2(subtotal - deposit), 0);
  }
  return 0; // full o cualquier otro caso pagado
}

function mapRow(row) {
  const isManual = row.source === "manual";
  const paid = isManual ? Number(row.manual_paid || 0) : Number(row.pay_amount || 0);
  const balanceDue = computeBalanceDue(row);

  return {
    id: row.id,
    tourId: row.tour_id,
    tourName: row.tour_name,
    tourDate: row.tour_date,
    startTime: row.start_time,
    source: row.source,
    paymentType: isManual ? "manual" : row.pay_mode || "full",
    adults: Number(row.adults),
    children: Number(row.children),
    babies: Number(row.babies),
    guests: Number(row.guests),
    subtotal: round2(row.subtotal),
    paid: round2(paid),
    balanceDue,
    owes: balanceDue > 0,
    arrived: Boolean(row.arrived),
    arrivedAt: row.arrived_at,
    customer: {
      // Web usa customers; manual y OTAs (gyg/viator) usan manual_*.
      name: row.source === "web" ? row.customer_name : row.manual_name,
      phone: row.source === "web" ? row.customer_phone : row.manual_phone,
    },
    reseller: row.reseller_id
      ? { id: row.reseller_id, name: row.reseller_name }
      : null,
  };
}

// GET /api/attendance?date=YYYY-MM-DD
export async function getAttendance(req, res) {
  const parsed = attendanceDateSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  try {
    const q = await pool.query(
      `
      SELECT
        b.id,
        b.tour_id,
        t.name                          AS tour_name,
        to_char(b.tour_date,'YYYY-MM-DD') AS tour_date,
        to_char(b.start_time,'HH24:MI')   AS start_time,
        b.adults, b.children, b.babies, b.guests,
        b.subtotal, b.deposit_amount,
        b.status                        AS booking_status,
        b.source,
        b.arrived, b.arrived_at,
        b.manual_name, b.manual_phone, b.manual_paid,
        b.reseller_id,
        r.name                          AS reseller_name,
        pay.mode                        AS pay_mode,
        pay.amount                      AS pay_amount,
        c.name                          AS customer_name,
        c.phone                         AS customer_phone
      FROM bookings b
      JOIN tours t ON t.id = b.tour_id
      LEFT JOIN resellers r ON r.id = b.reseller_id
      LEFT JOIN LATERAL (
        SELECT p.mode, p.amount, p.customer_id
        FROM payments p
        WHERE p.booking_id = b.id AND p.status = 'completed'
        ORDER BY p.created_at DESC
        LIMIT 1
      ) pay ON true
      LEFT JOIN customers c ON c.id = pay.customer_id
      WHERE b.tour_date = $1::date
        AND b.status <> 'cancelled'
        AND (b.source <> 'web' OR pay.mode IS NOT NULL)
      ORDER BY b.start_time, b.created_at
      `,
      [parsed.data.date],
    );

    return res.json({
      ok: true,
      date: parsed.data.date,
      reservations: q.rows.map(mapRow),
    });
  } catch (err) {
    console.error("getAttendance error:", err);
    return res.status(500).json({ ok: false, message: "Error obteniendo asistencia" });
  }
}

// PATCH /api/attendance/:bookingId  { arrived: boolean }
export async function setArrived(req, res) {
  const { bookingId } = req.params;
  const parsed = setArrivedSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  try {
    const q = await pool.query(
      `
      UPDATE bookings
      SET arrived = $2,
          arrived_at = CASE WHEN $2 THEN now() ELSE NULL END,
          updated_at = now()
      WHERE id = $1
      RETURNING id, arrived, arrived_at
      `,
      [bookingId, parsed.data.arrived],
    );

    if (q.rowCount === 0) {
      return res.status(404).json({ ok: false, message: "Reserva no encontrada" });
    }

    const r = q.rows[0];
    return res.json({ ok: true, id: r.id, arrived: r.arrived, arrivedAt: r.arrived_at });
  } catch (err) {
    console.error("setArrived error:", err);
    return res.status(500).json({ ok: false, message: "Error marcando asistencia" });
  }
}

// POST /api/attendance/manual — alta manual de una reserva.
// El trigger de la BD calcula guests/subtotal/total/deposit. status='paid'
// para que ocupe cupo siempre (no expira). La deuda vive en manual_paid.
export async function createManualBooking(req, res) {
  const parsed = manualBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const { tourId, tourDate, startTime, name, phone, adults, children, babies, paid } =
    parsed.data;

  try {
    const q = await pool.query(
      `
      INSERT INTO bookings
        (tour_id, tour_date, start_time, adults, children, babies,
         status, source, manual_name, manual_phone, manual_paid, expires_at)
      VALUES
        ($1, $2::date, $3::time, $4, $5, $6,
         'paid', 'manual', $7, $8, $9, NULL)
      RETURNING id, subtotal, total, deposit_amount
      `,
      [tourId, tourDate, startTime, adults, children, babies, name, phone || null, round2(paid)],
    );

    const r = q.rows[0];
    const balanceDue = Math.max(round2(Number(r.subtotal) - round2(paid)), 0);

    return res.status(201).json({
      ok: true,
      id: r.id,
      subtotal: round2(r.subtotal),
      paid: round2(paid),
      balanceDue,
    });
  } catch (err) {
    console.error("createManualBooking error:", err);
    return res.status(500).json({ ok: false, message: "Error creando reserva manual" });
  }
}
