// Links especiales: el admin fija tour, fecha, horario, pasajeros y
// (opcional) un monto personalizado. El cliente abre /link/:id y va directo
// al pago. No aplica el mínimo de 2 personas de la reserva normal.
import { z } from "zod";
import { pool } from "../db.js";
import { insertPendingBooking } from "./bookings.controller.js";

const idSchema = z.object({ id: z.string().uuid() });

const createSchema = z
  .object({
    tourId: z.number().int().positive(),
    tourDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    adults: z.number().int().min(1).max(25),
    children: z.number().int().min(0).max(24).default(0),
    babies: z.number().int().min(0).max(24).default(0),
    // Monto del tour (antes del fee de PayPal). null = precio normal por persona.
    customSubtotal: z.number().positive().max(100000).nullable().optional(),
    note: z.string().trim().max(200).nullable().optional(),
  })
  .refine((d) => d.babies <= d.adults, {
    message: "Cada bebé debe ir acompañado por un adulto",
  });

const updateSchema = z.object({ active: z.boolean() });

// Datos del link + precio calculado + si ya se pagó.
const LINK_SELECT = `
  select
    l.id, l.tour_id, t.name as tour_name,
    to_char(l.tour_date, 'YYYY-MM-DD') as tour_date,
    to_char(l.start_time, 'HH24:MI') as start_time,
    l.adults, l.children, l.babies,
    l.custom_subtotal, l.note, l.active, l.created_at,
    t.price as adult_price, coalesce(t.child_price, t.price) as child_price,
    coalesce(
      l.custom_subtotal,
      round(t.price * l.adults + coalesce(t.child_price, t.price) * l.children, 2)
    ) as subtotal,
    exists (
      select 1 from bookings b
      join payments p on p.booking_id = b.id and p.status = 'completed'
      where b.special_link_id = l.id
    ) as used
  from special_links l
  join tours t on t.id = l.tour_id
`;

function toLink(r) {
  const subtotal = Number(r.subtotal);
  const fee = Math.round(subtotal * 0.054 * 100) / 100;
  return {
    id: r.id,
    tourId: r.tour_id,
    tourName: r.tour_name,
    tourDate: r.tour_date,
    startTime: r.start_time,
    adults: r.adults,
    children: r.children,
    babies: r.babies,
    customSubtotal: r.custom_subtotal == null ? null : Number(r.custom_subtotal),
    adultPrice: Number(r.adult_price),
    childPrice: Number(r.child_price),
    subtotal,
    fee,
    total: Math.round((subtotal + fee) * 100) / 100,
    note: r.note,
    active: r.active,
    used: r.used,
    createdAt: r.created_at,
  };
}

// GET /api/special-links (admin)
export async function listSpecialLinks(_req, res) {
  try {
    const q = await pool.query(`${LINK_SELECT} order by l.created_at desc limit 200`);
    return res.json({ ok: true, links: q.rows.map(toLink) });
  } catch (err) {
    console.error("listSpecialLinks error:", err);
    return res.status(500).json({ ok: false, message: "Error listando links" });
  }
}

// POST /api/special-links (admin)
export async function createSpecialLink(req, res) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }
  const d = parsed.data;
  try {
    const ins = await pool.query(
      `insert into special_links
         (tour_id, tour_date, start_time, adults, children, babies, custom_subtotal, note)
       values ($1, $2::date, $3::time, $4, $5, $6, $7, $8)
       returning id`,
      [
        d.tourId,
        d.tourDate,
        d.startTime,
        d.adults,
        d.children,
        d.babies,
        d.customSubtotal ?? null,
        d.note || null,
      ]
    );
    const q = await pool.query(`${LINK_SELECT} where l.id = $1`, [ins.rows[0].id]);
    return res.status(201).json({ ok: true, link: toLink(q.rows[0]) });
  } catch (err) {
    console.error("createSpecialLink error:", err);
    return res.status(500).json({ ok: false, message: "Error creando link" });
  }
}

// PATCH /api/special-links/:id (admin) — activar / desactivar
export async function updateSpecialLink(req, res) {
  const p = idSchema.safeParse(req.params);
  const b = updateSchema.safeParse(req.body);
  if (!p.success || !b.success) {
    return res.status(400).json({ ok: false, message: "Datos inválidos" });
  }
  try {
    const q = await pool.query(
      `update special_links set active = $2 where id = $1 returning id`,
      [p.data.id, b.data.active]
    );
    if (q.rowCount === 0) {
      return res.status(404).json({ ok: false, message: "Link no encontrado" });
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("updateSpecialLink error:", err);
    return res.status(500).json({ ok: false, message: "Error actualizando link" });
  }
}

// GET /api/special-links/:id (público)
export async function getSpecialLink(req, res) {
  const p = idSchema.safeParse(req.params);
  if (!p.success) {
    return res.status(404).json({ ok: false, message: "Link no encontrado" });
  }
  try {
    const q = await pool.query(`${LINK_SELECT} where l.id = $1`, [p.data.id]);
    if (q.rowCount === 0 || !q.rows[0].active) {
      return res.status(404).json({ ok: false, message: "Link no encontrado" });
    }
    const link = toLink(q.rows[0]);
    // Al público no le exponemos la nota interna.
    delete link.note;
    return res.json({ ok: true, link });
  } catch (err) {
    console.error("getSpecialLink error:", err);
    return res.status(500).json({ ok: false, message: "Error obteniendo link" });
  }
}

// POST /api/special-links/:id/book (público)
// Crea el booking con los valores del link (no los del cliente).
export async function bookSpecialLink(req, res) {
  const p = idSchema.safeParse(req.params);
  if (!p.success) {
    return res.status(404).json({ ok: false, message: "Link no encontrado" });
  }
  try {
    const q = await pool.query(`${LINK_SELECT} where l.id = $1`, [p.data.id]);
    const row = q.rows[0];
    if (!row || !row.active) {
      return res.status(404).json({ ok: false, message: "This link is no longer available." });
    }
    if (row.used) {
      return res.status(409).json({ ok: false, message: "This link has already been paid." });
    }

    const { status, body } = await insertPendingBooking({
      tourId: row.tour_id,
      tourDate: row.tour_date,
      startTime: row.start_time,
      adults: row.adults,
      children: row.children,
      babies: row.babies,
      customSubtotal: row.custom_subtotal == null ? null : Number(row.custom_subtotal),
      specialLinkId: row.id,
    });
    return res.status(status).json(body);
  } catch (err) {
    console.error("bookSpecialLink error:", err);
    return res.status(500).json({ ok: false, message: "Error creando la reserva" });
  }
}
