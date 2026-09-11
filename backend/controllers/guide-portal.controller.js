// Portal de guías: login propio (cédula + contraseña) y vista limitada a los
// horarios que el guía tiene asignados (slot_guides). Un guía NUNCA ve reservas
// de horarios que no son suyos.
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { verifyPassword } from "../utils/password.js";
import { z } from "zod";

const round2 = (n) => Math.round(Number(n) * 100) / 100;

const loginSchema = z.object({
  cedula: z.string().trim().min(3).max(30),
  password: z.string().min(1).max(200),
});

const daySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date debe ser YYYY-MM-DD"),
});

const arrivedSchema = z.object({ arrived: z.boolean() });

function sessionCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 12 * 60 * 60 * 1000, // 12 h
    path: "/",
  };
}

function computeBalanceDue(row) {
  const subtotal = Number(row.subtotal || 0);
  if (row.source === "manual") {
    return Math.max(round2(subtotal - Number(row.manual_paid || 0)), 0);
  }
  if (row.pay_mode === "deposit") {
    const deposit = Number(row.deposit_amount ?? row.pay_amount ?? 0);
    return Math.max(round2(subtotal - deposit), 0);
  }
  return 0;
}

function mapReservation(row) {
  const isManual = row.source === "manual";
  const balanceDue = computeBalanceDue(row);
  return {
    id: row.id,
    adults: Number(row.adults),
    children: Number(row.children),
    babies: Number(row.babies),
    guests: Number(row.guests),
    source: row.source,
    arrived: Boolean(row.arrived),
    balanceDue,
    owes: balanceDue > 0,
    customer: {
      name: isManual ? row.manual_name : row.customer_name,
      phone: isManual ? row.manual_phone : row.customer_phone,
    },
  };
}

// POST /api/guide/login  { cedula, password }
export async function guideLogin(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "Cédula y contraseña requeridas" });
  }
  const { cedula, password } = parsed.data;
  try {
    const q = await pool.query(
      `SELECT id, name, cedula, password_hash, active, is_admin
       FROM guides WHERE cedula = $1`,
      [cedula],
    );
    const guide = q.rows[0];
    if (!guide || !guide.active || !verifyPassword(password, guide.password_hash)) {
      return res.status(401).json({ ok: false, message: "Cédula o contraseña incorrecta" });
    }

    const isAdmin = Boolean(guide.is_admin);
    const token = jwt.sign(
      { guideId: guide.id, role: "guide", name: guide.name, isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "12h" },
    );
    res.cookie("guide_token", token, sessionCookieOptions());

    // Si el guía es admin, el mismo login le abre el panel: emitimos también el
    // token de admin que consume el AdminGuard (cookie + body para localStorage).
    let adminToken;
    if (isAdmin) {
      adminToken = jwt.sign(
        { username: guide.name, role: "admin", guideId: guide.id },
        process.env.JWT_SECRET,
        { expiresIn: "12h" },
      );
      res.cookie("admin_token", adminToken, sessionCookieOptions());
    }

    // token/adminToken también en el body: en iPhone la cookie cross-site se
    // bloquea, así que el front los guarda en localStorage y los manda por header.
    return res.json({
      ok: true,
      token,
      adminToken: adminToken ?? null,
      guide: { id: guide.id, name: guide.name, isAdmin },
    });
  } catch (err) {
    console.error("guideLogin error:", err);
    return res.status(500).json({ ok: false, message: "Error al iniciar sesión" });
  }
}

// POST /api/guide/logout — cierra la sesión de guía y, si tenía, la de admin.
export async function guideLogout(req, res) {
  const isProd = process.env.NODE_ENV === "production";
  const clear = { path: "/", sameSite: isProd ? "none" : "lax", secure: isProd };
  res.clearCookie("guide_token", clear);
  res.clearCookie("admin_token", clear);
  return res.json({ ok: true });
}

// GET /api/guide/me
export async function guideMe(req, res) {
  return res.json({
    ok: true,
    guide: { id: req.guide.guideId, name: req.guide.name, isAdmin: Boolean(req.guide.isAdmin) },
  });
}

// GET /api/guide/my-day?date=YYYY-MM-DD
// Horarios asignados a este guía ese día + sus reservas. Slots sin reservas
// también aparecen (el guía sabe que le toca aunque no haya nadie aún).
export async function guideMyDay(req, res) {
  const parsed = daySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }
  const guideId = req.guide.guideId;
  const date = parsed.data.date;

  try {
    const slotsQ = await pool.query(
      `SELECT sg.tour_id,
              t.name AS tour_name,
              to_char(sg.start_time,'HH24:MI') AS start_time
       FROM slot_guides sg
       JOIN tours t ON t.id = sg.tour_id
       WHERE sg.guide_id = $1 AND sg.tour_date = $2::date
       ORDER BY sg.start_time`,
      [guideId, date],
    );

    const bookingsQ = await pool.query(
      `SELECT
         b.id, b.tour_id,
         to_char(b.start_time,'HH24:MI') AS start_time,
         b.adults, b.children, b.babies, b.guests,
         b.subtotal, b.deposit_amount, b.source,
         b.arrived, b.manual_name, b.manual_phone, b.manual_paid,
         pay.mode AS pay_mode, pay.amount AS pay_amount,
         c.name AS customer_name, c.phone AS customer_phone
       FROM bookings b
       JOIN slot_guides sg
         ON sg.tour_id = b.tour_id
        AND sg.tour_date = b.tour_date
        AND sg.start_time = b.start_time
        AND sg.guide_id = $1
       LEFT JOIN LATERAL (
         SELECT p.mode, p.amount, p.customer_id
         FROM payments p
         WHERE p.booking_id = b.id AND p.status = 'completed'
         ORDER BY p.created_at DESC LIMIT 1
       ) pay ON true
       LEFT JOIN customers c ON c.id = pay.customer_id
       WHERE b.tour_date = $2::date
         AND (b.source <> 'web' OR pay.mode IS NOT NULL)
       ORDER BY b.start_time, b.created_at`,
      [guideId, date],
    );

    const bySlot = new Map();
    for (const s of slotsQ.rows) {
      const key = `${s.tour_id}|${s.start_time}`;
      bySlot.set(key, {
        tourId: s.tour_id,
        tourName: s.tour_name,
        startTime: s.start_time,
        reservations: [],
      });
    }
    for (const row of bookingsQ.rows) {
      const key = `${row.tour_id}|${row.start_time}`;
      const slot = bySlot.get(key);
      if (slot) slot.reservations.push(mapReservation(row));
    }

    const slots = [...bySlot.values()].map((s) => ({
      ...s,
      totalGuests: s.reservations.reduce((sum, r) => sum + r.guests, 0),
    }));

    return res.json({ ok: true, date, slots });
  } catch (err) {
    console.error("guideMyDay error:", err);
    return res.status(500).json({ ok: false, message: "Error obteniendo el día" });
  }
}

// PATCH /api/guide/attendance/:bookingId  { arrived }
// El guía "pasa lista". Solo puede marcar reservas de un horario que tiene
// asignado; escribe el mismo bookings.arrived que ve el admin en Asistencia.
export async function guideSetArrived(req, res) {
  const parsed = arrivedSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }
  const { bookingId } = req.params;
  const guideId = req.guide.guideId;

  try {
    const q = await pool.query(
      `UPDATE bookings b
       SET arrived = $2,
           arrived_at = CASE WHEN $2 THEN now() ELSE NULL END,
           updated_at = now()
       WHERE b.id = $1
         AND EXISTS (
           SELECT 1 FROM slot_guides sg
           WHERE sg.guide_id = $3
             AND sg.tour_id = b.tour_id
             AND sg.tour_date = b.tour_date
             AND sg.start_time = b.start_time
         )
       RETURNING b.id, b.arrived`,
      [bookingId, parsed.data.arrived, guideId],
    );
    if (q.rowCount === 0) {
      return res.status(403).json({ ok: false, message: "Reserva no asignada a este guía" });
    }
    return res.json({ ok: true, id: q.rows[0].id, arrived: q.rows[0].arrived });
  } catch (err) {
    console.error("guideSetArrived error:", err);
    return res.status(500).json({ ok: false, message: "Error marcando asistencia" });
  }
}

// GET /api/guide/my-days — próximos días (desde hoy) con al menos un horario
// asignado a este guía. Sirve para navegar y marcar los días con trabajo.
export async function guideMyDays(req, res) {
  const guideId = req.guide.guideId;
  try {
    const q = await pool.query(
      `SELECT to_char(tour_date,'YYYY-MM-DD') AS date, COUNT(*)::int AS slots
       FROM slot_guides
       WHERE guide_id = $1 AND tour_date >= current_date
       GROUP BY tour_date
       ORDER BY tour_date`,
      [guideId],
    );
    return res.json({ ok: true, days: q.rows });
  } catch (err) {
    console.error("guideMyDays error:", err);
    return res.status(500).json({ ok: false, message: "Error obteniendo días" });
  }
}
