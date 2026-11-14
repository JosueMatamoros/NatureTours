// Finanzas: cierre mensual del panel admin.
// Por mes: lo generado según la app (calculado), saldos de BAC San José y
// PayPal (se anotan a mano) y los pagos recibidos de Viator / GetYourGuide
// (varios por mes, cada uno con su fecha; Viator paga semanal, GYG mensual).
import { pool } from "../db.js";
import { revenueBetween } from "../utils/revenue.js";

const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;
const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

function monthRange(month) {
  const m = MONTH_RE.exec(month || "");
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const pad = (n) => String(n).padStart(2, "0");
  const from = `${y}-${pad(mo)}-01`;
  const to = mo === 12 ? `${y + 1}-01-01` : `${y}-${pad(mo + 1)}-01`;
  return { from, to };
}

// null/"" → null; si no, número ≥ 0 con 2 decimales (o NaN si es inválido).
function toAmount(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : NaN;
}

const num = (v) => (v == null ? null : Number(v));

// GET /api/finance?month=YYYY-MM
export async function getFinanceMonth(req, res) {
  const range = monthRange(req.query.month);
  if (!range) return res.status(400).json({ ok: false, message: "Mes inválido (YYYY-MM)" });
  try {
    const [generated, monthQ, payQ] = await Promise.all([
      revenueBetween(range.from, range.to),
      pool.query(`SELECT * FROM finance_months WHERE month = $1::date`, [range.from]),
      pool.query(
        `SELECT id, provider, amount, to_char(paid_at,'YYYY-MM-DD') AS paid_at, note
         FROM finance_payments
         WHERE paid_at >= $1::date AND paid_at < $2::date
         ORDER BY paid_at, created_at`,
        [range.from, range.to],
      ),
    ]);
    const m = monthQ.rows[0];
    const payments = payQ.rows.map((p) => ({
      id: p.id, provider: p.provider, amount: Number(p.amount), paidAt: p.paid_at, note: p.note,
    }));
    const received = { viator: 0, gyg: 0 };
    for (const p of payments) received[p.provider] = Math.round((received[p.provider] + p.amount) * 100) / 100;

    return res.json({
      ok: true,
      month: req.query.month,
      generated,
      balances: {
        bac: num(m?.bac_balance),
        paypal: num(m?.paypal_balance),
        notes: m?.notes || "",
        updatedAt: m?.updated_at || null,
      },
      payments,
      received,
    });
  } catch (err) {
    console.error("getFinanceMonth error:", err);
    return res.status(500).json({ ok: false, message: "Error cargando finanzas" });
  }
}

// PUT /api/finance/:month   { bac, bacCurrency, paypal, notes }
export async function saveFinanceMonth(req, res) {
  const range = monthRange(req.params.month);
  if (!range) return res.status(400).json({ ok: false, message: "Mes inválido (YYYY-MM)" });
  const bac = toAmount(req.body?.bac);
  const paypal = toAmount(req.body?.paypal);
  const bacCurrency = "USD"; // BAC y PayPal se anotan siempre en dólares
  const notes = typeof req.body?.notes === "string" ? req.body.notes.slice(0, 1000) : null;
  if (Number.isNaN(bac) || Number.isNaN(paypal)) {
    return res.status(400).json({ ok: false, message: "Monto inválido" });
  }
  try {
    await pool.query(
      `INSERT INTO finance_months (month, bac_balance, bac_currency, paypal_balance, notes, updated_at)
       VALUES ($1::date, $2, $3, $4, $5, now())
       ON CONFLICT (month) DO UPDATE SET
         bac_balance = EXCLUDED.bac_balance,
         bac_currency = EXCLUDED.bac_currency,
         paypal_balance = EXCLUDED.paypal_balance,
         notes = EXCLUDED.notes,
         updated_at = now()`,
      [range.from, bac, bacCurrency, paypal, notes],
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("saveFinanceMonth error:", err);
    return res.status(500).json({ ok: false, message: "Error guardando" });
  }
}

// POST /api/finance/payments   { provider: viator|gyg, amount, paidAt, note }
export async function addFinancePayment(req, res) {
  const { provider, paidAt, note } = req.body || {};
  const amount = toAmount(req.body?.amount);
  if (!["viator", "gyg"].includes(provider)) {
    return res.status(400).json({ ok: false, message: "Origen inválido" });
  }
  if (!amount || Number.isNaN(amount)) {
    return res.status(400).json({ ok: false, message: "Monto inválido" });
  }
  if (!YMD_RE.test(paidAt || "")) {
    return res.status(400).json({ ok: false, message: "Fecha inválida" });
  }
  try {
    const q = await pool.query(
      `INSERT INTO finance_payments (provider, amount, paid_at, note)
       VALUES ($1, $2, $3::date, $4) RETURNING id`,
      [provider, amount, paidAt, typeof note === "string" && note.trim() ? note.trim().slice(0, 200) : null],
    );
    return res.json({ ok: true, id: q.rows[0].id });
  } catch (err) {
    console.error("addFinancePayment error:", err);
    return res.status(500).json({ ok: false, message: "Error guardando el pago" });
  }
}

// DELETE /api/finance/payments/:id
export async function deleteFinancePayment(req, res) {
  try {
    const q = await pool.query(`DELETE FROM finance_payments WHERE id = $1`, [req.params.id]);
    if (!q.rowCount) return res.status(404).json({ ok: false, message: "No existe" });
    return res.json({ ok: true });
  } catch (err) {
    console.error("deleteFinancePayment error:", err);
    return res.status(500).json({ ok: false, message: "Error borrando el pago" });
  }
}
