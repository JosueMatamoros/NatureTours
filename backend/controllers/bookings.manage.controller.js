// Gestión de reservas para el admin: listar (todas: web + manuales, activas,
// canceladas y movidas), crear manual, editar pax/teléfono, cancelar (soft) y
// mover de día/horario. Separado del flujo de ventas (bookings.controller) para
// no tocar la compra del cliente.
import { pool } from "../db.js";
import { z } from "zod";
import { computeBalanceDue, computePaid } from "../utils/balance.js";

const round2 = (n) => Math.round(Number(n) * 100) / 100;

const dateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date debe ser YYYY-MM-DD"),
});

const createSchema = z.object({
  tourId: z.number().int().positive(),
  tourDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(30).nullable().optional().or(z.literal("")),
  adults: z.number().int().min(1).max(25),
  children: z.number().int().min(0).max(24),
  babies: z.number().int().min(0).max(24),
  paid: z.number().min(0).max(100000).default(0),
});

const editSchema = z.object({
  adults: z.number().int().min(1).max(25),
  children: z.number().int().min(0).max(24),
  babies: z.number().int().min(0).max(24),
  phone: z.string().trim().max(30).nullable().optional().or(z.literal("")),
  name: z.string().trim().max(120).optional(),
  // Monto ya pagado (USD, sin fee). Si viene, manda.
  paid: z.number().min(0).max(100000).optional(),
  // Si se agregaron personas: ¿ya pagaron? true = todo pagado; false/ausente =
  // se mantiene lo pagado antes y los nuevos quedan debiendo.
  addedPaid: z.boolean().optional(),
  // Pagaron una parte: este monto se suma a lo que ya estaba pagado.
  addedPaidAmount: z.number().min(0).max(100000).optional(),
});

const moveSchema = z.object({
  tourDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
});

const SELECT_COLS = `
  b.id, b.tour_id, t.name AS tour_name,
  to_char(b.tour_date,'YYYY-MM-DD') AS tour_date,
  to_char(b.start_time,'HH24:MI')   AS start_time,
  b.adults, b.children, b.babies, b.guests,
  b.subtotal, b.deposit_amount, b.status, b.source,
  b.arrived, b.cancelled_at,
  to_char(b.moved_from_date,'YYYY-MM-DD') AS moved_from_date,
  to_char(b.moved_from_time,'HH24:MI')    AS moved_from_time,
  b.moved_at,
  b.manual_name, b.manual_phone, b.manual_paid, b.paid_override,
  pay.mode AS pay_mode, pay.amount AS pay_amount,
  c.name AS customer_name, c.phone AS customer_phone`;

const FROM_JOINS = `
  FROM bookings b
  JOIN tours t ON t.id = b.tour_id
  LEFT JOIN LATERAL (
    SELECT p.mode, p.amount, p.customer_id
    FROM payments p
    WHERE p.booking_id = b.id AND p.status = 'completed'
    ORDER BY p.created_at DESC LIMIT 1
  ) pay ON true
  LEFT JOIN customers c ON c.id = pay.customer_id`;

function mapEntry(row, { ghost = false } = {}) {
  // Web usa customers (vía pago); manual y OTAs (gyg/viator) usan manual_*.
  const isWeb = row.source === "web";
  const due = computeBalanceDue(row);
  return {
    id: row.id,
    tourId: row.tour_id,
    tourName: row.tour_name,
    tourDate: row.tour_date,
    startTime: row.start_time,
    adults: Number(row.adults),
    children: Number(row.children),
    babies: Number(row.babies),
    guests: Number(row.guests),
    source: row.source,
    arrived: Boolean(row.arrived),
    cancelled: row.status === "cancelled" || row.cancelled_at != null,
    subtotal: round2(row.subtotal),
    paid: computePaid(row),
    balanceDue: due,
    owes: due > 0,
    customer: {
      name: isWeb ? row.customer_name : row.manual_name,
      phone: isWeb ? row.customer_phone : row.manual_phone,
    },
    source: row.source,
    movedFrom: row.moved_from_date ? { date: row.moved_from_date, time: row.moved_from_time } : null,
    // ghost = marca "se movió a" que se muestra en el horario ORIGINAL
    ghost,
    displaySlot: ghost ? row.moved_from_time : row.start_time,
    movedTo: ghost ? { date: row.tour_date, time: row.start_time } : null,
  };
}

// GET /api/reservations?date=YYYY-MM-DD
export async function listDay(req, res) {
  const parsed = dateSchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  const date = parsed.data.date;

  try {
    // Reservas ubicadas ese día (activas, canceladas y las que se movieron a él).
    const atDay = await pool.query(
      `SELECT ${SELECT_COLS} ${FROM_JOINS}
       WHERE b.tour_date = $1::date
         AND (b.source <> 'web' OR pay.mode IS NOT NULL)
       ORDER BY b.start_time, b.created_at`,
      [date],
    );
    // Reservas que se MOVIERON DESDE ese día hacia otro (fantasma en su slot original).
    const movedAway = await pool.query(
      `SELECT ${SELECT_COLS} ${FROM_JOINS}
       WHERE b.moved_from_date = $1::date
         AND (b.source <> 'web' OR pay.mode IS NOT NULL)
       ORDER BY b.moved_from_time`,
      [date],
    );

    const entries = [
      ...atDay.rows.map((r) => mapEntry(r)),
      ...movedAway.rows.map((r) => mapEntry(r, { ghost: true })),
    ];
    return res.json({ ok: true, date, entries });
  } catch (err) {
    console.error("listDay error:", err);
    return res.status(500).json({ ok: false, message: "Error listando reservas" });
  }
}

// POST /api/reservations  → crea reserva manual (walk-in / teléfono)
export async function createReservation(req, res) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  const { tourId, tourDate, startTime, name, phone, adults, children, babies, paid } = parsed.data;

  try {
    const q = await pool.query(
      `INSERT INTO bookings
         (tour_id, tour_date, start_time, adults, children, babies,
          status, source, manual_name, manual_phone, manual_paid, expires_at)
       VALUES ($1,$2::date,$3::time,$4,$5,$6,'paid','manual',$7,$8,$9,NULL)
       RETURNING id`,
      [tourId, tourDate, startTime, adults, children, babies, name, phone || null, round2(paid)],
    );
    return res.status(201).json({ ok: true, id: q.rows[0].id });
  } catch (err) {
    console.error("createReservation error:", err);
    return res.status(500).json({ ok: false, message: "Error creando la reserva" });
  }
}

// PATCH /api/reservations/:id  → edita pax, teléfono y lo pagado
export async function editReservation(req, res) {
  const parsed = editSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  const { id } = req.params;
  const { adults, children, babies, phone, name, paid, addedPaid, addedPaidAmount } = parsed.data;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const before = await client.query(`SELECT ${SELECT_COLS} ${FROM_JOINS} WHERE b.id = $1 FOR UPDATE OF b`, [id]);
    if (before.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ ok: false, message: "Reserva no encontrada" });
    }
    const prev = before.rows[0];
    const prevPaid = computePaid(prev);
    const paxChanged =
      Number(prev.adults) !== adults || Number(prev.children) !== children || Number(prev.babies) !== babies;

    // Incluimos `guests` en el SET para disparar el trigger que recalcula
    // guests/subtotal (solo corre en UPDATE OF tour_id, guests).
    const q = await client.query(
      `UPDATE bookings
       SET adults = $2::int, children = $3::int, babies = $4::int,
           guests = ($2::int + $3::int),
           manual_phone = CASE WHEN source <> 'web' THEN COALESCE($5::text, manual_phone) ELSE manual_phone END,
           manual_name  = CASE WHEN source <> 'web' AND $6::text <> '' THEN $6::text ELSE manual_name END
       WHERE id = $1
       RETURNING id, source, subtotal`,
      [id, adults, children, babies, phone === "" ? null : phone ?? null, name ?? ""],
    );
    const { source, subtotal } = q.rows[0];

    // Lo pagado NO se recalcula solo: al cambiar personas se conserva lo que
    // ya se había pagado, salvo que el admin diga que los nuevos ya pagaron
    // o escriba el monto.
    let newPaid = null;
    if (paid != null) newPaid = round2(paid);
    else if (addedPaidAmount != null) newPaid = round2(prevPaid + addedPaidAmount);
    else if (paxChanged) newPaid = addedPaid ? round2(subtotal) : prevPaid;
    if (newPaid != null) {
      await client.query(
        source === "manual"
          ? `UPDATE bookings SET manual_paid = $2 WHERE id = $1`
          : `UPDATE bookings SET paid_override = $2 WHERE id = $1`,
        [id, newPaid],
      );
    }

    // Para reservas web, el teléfono/nombre viven en customers (vía el pago).
    if (source === "web" && (phone != null || name)) {
      await client.query(
        `UPDATE customers c
         SET phone = COALESCE($2, c.phone),
             name  = COALESCE(NULLIF($3,''), c.name)
         FROM payments p
         WHERE p.booking_id = $1 AND p.status = 'completed' AND c.id = p.customer_id`,
        [id, phone === "" ? null : phone ?? null, name ?? ""],
      );
    }
    await client.query("COMMIT");
    return res.json({ ok: true, id });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("editReservation error:", err);
    return res.status(500).json({ ok: false, message: "Error editando la reserva" });
  } finally {
    client.release();
  }
}

// POST /api/reservations/:id/cancel  → cancelación soft (libera el cupo)
export async function cancelReservation(req, res) {
  const { id } = req.params;
  try {
    const q = await pool.query(
      `UPDATE bookings
       SET status = 'cancelled', cancelled_at = now(), updated_at = now()
       WHERE id = $1
       RETURNING id`,
      [id],
    );
    if (q.rowCount === 0) return res.status(404).json({ ok: false, message: "Reserva no encontrada" });
    return res.json({ ok: true, id });
  } catch (err) {
    console.error("cancelReservation error:", err);
    return res.status(500).json({ ok: false, message: "Error cancelando la reserva" });
  }
}

// POST /api/reservations/:id/move  → mueve de día/horario (guarda de dónde vino)
export async function moveReservation(req, res) {
  const parsed = moveSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  const { id } = req.params;
  const { tourDate, startTime } = parsed.data;

  try {
    const q = await pool.query(
      `UPDATE bookings
       SET moved_from_date = tour_date,
           moved_from_time = start_time,
           moved_at = now(),
           tour_date = $2::date,
           start_time = $3::time,
           updated_at = now()
       WHERE id = $1
         AND (tour_date <> $2::date OR start_time <> $3::time)
       RETURNING id`,
      [id, tourDate, startTime],
    );
    if (q.rowCount === 0) {
      return res.status(400).json({ ok: false, message: "Reserva no encontrada o mismo destino" });
    }
    return res.json({ ok: true, id });
  } catch (err) {
    console.error("moveReservation error:", err);
    return res.status(500).json({ ok: false, message: "Error moviendo la reserva" });
  }
}
