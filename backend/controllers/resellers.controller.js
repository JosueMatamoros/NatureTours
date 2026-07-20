// src/controllers/resellers.controller.js
import { pool } from "../db.js";
import { z } from "zod";

const resellerIdSchema = z.object({ id: z.string().uuid() });

const resellerBodySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().nullable().optional().or(z.literal("")),
  phone: z.string().trim().max(30).nullable().optional().or(z.literal("")),
  commission: z.number().int().min(0).max(30),
});

const updateResellerSchema = resellerBodySchema.partial().extend({
  active: z.boolean().optional(),
});

const commissionStatusSchema = z.object({
  status: z.enum(["pending", "paid", "no_show"]),
});

// ?month=YYYY-MM — filtra ventas por mes (hora de Costa Rica). Sin month = todo.
const monthQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
});

function parseMonth(req) {
  const parsed = monthQuerySchema.safeParse(req.query);
  return parsed.success ? parsed.data.month ?? null : null;
}

const MONTH_MATCH = `to_char(p.created_at AT TIME ZONE 'America/Costa_Rica', 'YYYY-MM')`;

// GET /api/resellers/:id
// Endpoint publico para la pagina /reseller/:id.
// Solo expone lo necesario para renderizar precios: nombre y descuento.
export async function getResellerById(req, res) {
  const parsed = resellerIdSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(404).json({ ok: false, message: "Reseller no encontrado" });
  }

  try {
    const q = await pool.query(
      `
      SELECT id, name, phone, GREATEST(30 - commission, 0) AS discount
      FROM resellers
      WHERE id = $1 AND active = true
      `,
      [parsed.data.id],
    );

    if (q.rowCount === 0) {
      return res.status(404).json({ ok: false, message: "Reseller no encontrado" });
    }

    const r = q.rows[0];

    return res.json({
      ok: true,
      reseller: {
        id: r.id,
        name: r.name,
        phone: r.phone, // WhatsApp del reseller para el botón de tour custom
        discount: Number(r.discount), // % de descuento al cliente (30 - commission)
      },
    });
  } catch (err) {
    console.error("getResellerById error:", err);
    return res.status(500).json({ ok: false, message: "Error obteniendo reseller" });
  }
}

// GET /api/resellers?month=YYYY-MM (admin)
// Lista de resellers con sus saldos del mes indicado (o históricos sin month),
// ordenados por pendiente desc, más estadísticas globales del mes:
// ganado neto y total pagado a resellers.
export async function getAllResellers(req, res) {
  const month = parseMonth(req);

  try {
    const q = await pool.query(
      `
      SELECT
        r.id, r.name, r.email, r.phone, r.commission, r.active, r.created_at,
        COALESCE(SUM(p.commission_amount) FILTER (
          WHERE p.commission_status = 'pending' AND p.status = 'completed'
            AND ($1::text IS NULL OR ${MONTH_MATCH} = $1)
        ), 0) AS pending_total,
        COALESCE(SUM(p.commission_amount) FILTER (
          WHERE p.commission_status = 'paid' AND p.status = 'completed'
            AND ($1::text IS NULL OR ${MONTH_MATCH} = $1)
        ), 0) AS paid_total,
        COUNT(p.id) FILTER (
          WHERE p.commission_status = 'pending' AND p.status = 'completed'
            AND ($1::text IS NULL OR ${MONTH_MATCH} = $1)
        )::int AS pending_count,
        COUNT(p.id) FILTER (
          WHERE p.status = 'completed'
            AND ($1::text IS NULL OR ${MONTH_MATCH} = $1)
        )::int AS sales_count
      FROM resellers r
      LEFT JOIN payments p ON p.reseller_id = r.id
      GROUP BY r.id
      ORDER BY pending_total DESC, r.created_at DESC
      `,
      [month],
    );

    // Estadísticas del mes sobre ventas de resellers:
    //   net_total: lo que queda para el negocio después de comisiones.
    //     full     → monto pagado en línea - comisión
    //     apartado → total de la reserva (adelanto + efectivo) - comisión
    //     no_show  → se conserva el adelanto y no se paga comisión
    //   paid_total: comisiones ya pagadas a resellers.
    const statsQ = await pool.query(
      `
      SELECT
        COALESCE(SUM(CASE
          WHEN p.commission_status = 'no_show' THEN p.amount
          WHEN p.mode = 'full' THEN p.amount - COALESCE(p.commission_amount, 0)
          ELSE b.total - COALESCE(p.commission_amount, 0)
        END), 0) AS net_total,
        COALESCE(SUM(p.commission_amount) FILTER (
          WHERE p.commission_status = 'paid'
        ), 0) AS paid_total
      FROM payments p
      JOIN bookings b ON b.id = p.booking_id
      WHERE p.reseller_id IS NOT NULL AND p.status = 'completed'
        AND ($1::text IS NULL OR ${MONTH_MATCH} = $1)
      `,
      [month],
    );

    const stats = statsQ.rows[0] ?? {};

    return res.json({
      ok: true,
      month,
      stats: {
        netTotal: Number(stats.net_total ?? 0),
        paidTotal: Number(stats.paid_total ?? 0),
      },
      resellers: q.rows.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        commission: Number(r.commission),
        discount: Math.max(30 - Number(r.commission), 0),
        active: r.active,
        createdAt: r.created_at,
        pendingTotal: Number(r.pending_total),
        paidTotal: Number(r.paid_total),
        pendingCount: r.pending_count,
        salesCount: r.sales_count,
      })),
    });
  } catch (err) {
    console.error("getAllResellers error:", err);
    return res.status(500).json({ ok: false, message: "Error listando resellers" });
  }
}

// POST /api/resellers (admin)
export async function createReseller(req, res) {
  const parsed = resellerBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const { name, email, phone, commission } = parsed.data;

  try {
    const q = await pool.query(
      `
      INSERT INTO resellers (name, email, phone, commission)
      VALUES ($1, $2, $3, $4)
      RETURNING id
      `,
      [name, email || null, phone || null, commission],
    );

    return res.status(201).json({ ok: true, id: q.rows[0].id });
  } catch (err) {
    console.error("createReseller error:", err);
    return res.status(500).json({ ok: false, message: "Error creando reseller" });
  }
}

// PATCH /api/resellers/:id (admin)
export async function updateReseller(req, res) {
  const idParsed = resellerIdSchema.safeParse(req.params);
  if (!idParsed.success) {
    return res.status(400).json({ ok: false, message: "Id inválido" });
  }

  const parsed = updateResellerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const { name, email, phone, commission, active } = parsed.data;

  try {
    const q = await pool.query(
      `
      UPDATE resellers
      SET name       = COALESCE($2, name),
          email      = COALESCE($3, email),
          phone      = COALESCE($4, phone),
          commission = COALESCE($5, commission),
          active     = COALESCE($6, active)
      WHERE id = $1
      RETURNING id
      `,
      [
        idParsed.data.id,
        name ?? null,
        email || null,
        phone || null,
        commission ?? null,
        active ?? null,
      ],
    );

    if (q.rowCount === 0) {
      return res.status(404).json({ ok: false, message: "Reseller no encontrado" });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("updateReseller error:", err);
    return res.status(500).json({ ok: false, message: "Error actualizando reseller" });
  }
}

// GET /api/resellers/:id/commissions?month=YYYY-MM (admin)
// Desglose de comisiones del reseller: una fila por venta, con los datos
// de la reserva y del cliente para poder verificarla. Las pendientes de
// pagar salen primero. Con month solo se listan las ventas de ese mes.
export async function getResellerCommissions(req, res) {
  const parsed = resellerIdSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "Id inválido" });
  }

  const month = parseMonth(req);

  try {
    const q = await pool.query(
      `
      SELECT
        p.id                 AS payment_id,
        p.created_at         AS sold_at,
        p.mode               AS mode,
        p.amount             AS amount_paid,
        p.commission_amount  AS commission_amount,
        p.commission_status  AS commission_status,
        p.commission_paid_at AS commission_paid_at,

        b.id                 AS booking_id,
        b.tour_date          AS tour_date,
        b.start_time         AS start_time,
        b.adults, b.children, b.babies,
        b.subtotal           AS subtotal,
        b.status             AS booking_status,

        t.name               AS tour_name,

        c.name               AS customer_name,
        c.phone              AS customer_phone,
        c.email              AS customer_email
      FROM payments p
      JOIN bookings b ON b.id = p.booking_id
      JOIN tours t ON t.id = b.tour_id
      LEFT JOIN customers c ON c.id = p.customer_id
      WHERE p.reseller_id = $1 AND p.status = 'completed'
        AND ($2::text IS NULL OR ${MONTH_MATCH} = $2)
      ORDER BY (p.commission_status = 'pending') DESC, p.created_at DESC
      `,
      [parsed.data.id, month],
    );

    const commissions = q.rows.map((r) => ({
      paymentId: r.payment_id,
      soldAt: r.sold_at,
      mode: r.mode,
      amountPaid: Number(r.amount_paid),
      commissionAmount: r.commission_amount != null ? Number(r.commission_amount) : null,
      commissionStatus: r.commission_status,
      commissionPaidAt: r.commission_paid_at,
      booking: {
        id: r.booking_id,
        tourName: r.tour_name,
        tourDate: r.tour_date,
        startTime: r.start_time,
        adults: r.adults,
        children: r.children,
        babies: r.babies,
        subtotal: Number(r.subtotal),
        status: r.booking_status,
      },
      customer: r.customer_name
        ? { name: r.customer_name, phone: r.customer_phone, email: r.customer_email }
        : null,
    }));

    const pendingTotal = commissions
      .filter((c) => c.commissionStatus === "pending")
      .reduce((acc, c) => acc + (c.commissionAmount ?? 0), 0);
    const paidTotal = commissions
      .filter((c) => c.commissionStatus === "paid")
      .reduce((acc, c) => acc + (c.commissionAmount ?? 0), 0);

    return res.json({
      ok: true,
      commissions,
      totals: {
        pending: Math.round(pendingTotal * 100) / 100,
        paid: Math.round(paidTotal * 100) / 100,
      },
    });
  } catch (err) {
    console.error("getResellerCommissions error:", err);
    return res.status(500).json({ ok: false, message: "Error obteniendo comisiones" });
  }
}

// PATCH /api/resellers/commissions/:paymentId (admin)
// Marca una comisión como pagada, pendiente o no_show (clientes no llegaron).
export async function updateCommissionStatus(req, res) {
  const idParsed = z.object({ paymentId: z.string().uuid() }).safeParse(req.params);
  if (!idParsed.success) {
    return res.status(400).json({ ok: false, message: "Id inválido" });
  }

  const parsed = commissionStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const { status } = parsed.data;

  try {
    const q = await pool.query(
      `
      UPDATE payments
      SET commission_status = $2,
          commission_paid_at = CASE WHEN $2 = 'paid' THEN now() ELSE NULL END,
          updated_at = now()
      WHERE id = $1 AND reseller_id IS NOT NULL
      RETURNING id
      `,
      [idParsed.data.paymentId, status],
    );

    if (q.rowCount === 0) {
      return res.status(404).json({ ok: false, message: "Comisión no encontrada" });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("updateCommissionStatus error:", err);
    return res.status(500).json({ ok: false, message: "Error actualizando comisión" });
  }
}
