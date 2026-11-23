// "Viator Payment Advice": correo semanal de finance@viator.com con un Excel
// adjunto (reservas pagadas + monto). Viator paga cada lunes, a PayPal, los
// tours de domingo a sábado de la semana anterior.
//
// El total viene en la fila "TOTAL PAYMENT", pero queda VACÍO cuando alguna
// reserva vino en otra moneda (EUR/GBP). En ese caso se suman las líneas en
// USD y, para las otras, se usa el neto de la reserva en la BD (ota_net):
// el monto queda marcado como aproximado.
import readXlsxFile from "read-excel-file/node";
import { pool } from "../db.js";

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const round2 = (n) => Math.round(n * 100) / 100;
const pad = (n) => String(n).padStart(2, "0");

// "16-Nov-26" → "2026-11-16"
function adviceDate(s) {
  const m = /^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/.exec(String(s || "").trim());
  if (!m || !MONTHS[m[2].toLowerCase()]) return null;
  return `20${m[3]}-${pad(MONTHS[m[2].toLowerCase()])}-${pad(m[1])}`;
}
// "11/08/2026" → "2026-11-08"
function usDate(s) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(s || "").trim());
  return m ? `${m[3]}-${m[1]}-${m[2]}` : null;
}

// Lee el Excel (Buffer o ruta). Devuelve { payDate, total, lines[] } o null.
export async function parseViatorAdvice(file) {
  const rows = await readXlsxFile(file);
  const payDate = adviceDate(rows[0]?.[7]);
  const head = rows.findIndex((r) => String(r[0] || "").trim() === "VIATOR REFERENCE");
  if (!payDate || head < 0) return null;

  const lines = [];
  let total = null;
  for (const r of rows.slice(head + 1)) {
    const c0 = String(r[0] ?? "").trim();
    if (c0 === "TOTAL PAYMENT") {
      const t = Number(r[4]);
      total = r[4] != null && r[4] !== "" && Number.isFinite(t) ? round2(t) : null;
      break;
    }
    if (!/^\d+$/.test(c0)) continue;
    lines.push({
      ref: `BR-${c0}`,
      tourDate: usDate(r[1]),
      amount: Number(r[4]),
      currency: String(r[5] || "USD").trim().toUpperCase(),
    });
  }
  return { payDate, total, lines };
}

// Calcula el monto en USD (exacto si viene el total; si no, aproximado).
async function amountUsd(advice) {
  if (advice.total != null) return { amount: advice.total, approx: false };
  let sum = 0;
  let approx = false;
  for (const l of advice.lines) {
    if (l.currency === "USD") { sum += l.amount; continue; }
    approx = true;
    const q = await pool.query(`SELECT ota_net FROM bookings WHERE external_ref = $1`, [l.ref]);
    const net = q.rows[0]?.ota_net;
    sum += net != null ? Math.sign(l.amount) * Number(net) : 0;
  }
  return { amount: round2(sum), approx };
}

const shortDay = (ymd) => {
  const [, m, d] = ymd.split("-").map(Number);
  return `${d} ${["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"][m - 1]}`;
};

// Anota el pago en finance_payments (idempotente por source_ref). Si alguien
// ya lo había anotado a mano (mismo monto, ±3 días), lo adopta en vez de
// duplicarlo. Devuelve { action, amount, payDate }.
export async function recordViatorAdvice(advice) {
  const ref = `viator-advice-${advice.payDate}`;
  const exists = await pool.query(`SELECT id FROM finance_payments WHERE source_ref = $1`, [ref]);
  if (exists.rowCount) return { action: "already", payDate: advice.payDate };

  const { amount, approx } = await amountUsd(advice);
  if (!(amount > 0)) return { action: "zero", payDate: advice.payDate, amount };

  const dates = advice.lines.map((l) => l.tourDate).filter(Boolean).sort();
  const n = new Set(advice.lines.filter((l) => l.amount > 0).map((l) => l.ref)).size;
  const note = [
    `Automático · ${n} reserva${n === 1 ? "" : "s"}`,
    dates.length ? `tours del ${shortDay(dates[0])} al ${shortDay(dates.at(-1))}` : null,
    approx ? "monto aprox. (otra moneda)" : null,
  ].filter(Boolean).join(" · ");

  const manual = await pool.query(
    `SELECT id FROM finance_payments
     WHERE provider = 'viator' AND source_ref IS NULL AND amount = $1
       AND abs(paid_at - $2::date) <= 3
     ORDER BY abs(paid_at - $2::date) LIMIT 1`,
    [amount, advice.payDate],
  );
  if (manual.rowCount) {
    await pool.query(
      `UPDATE finance_payments SET paid_at = $2::date, note = $3, source_ref = $4 WHERE id = $1`,
      [manual.rows[0].id, advice.payDate, note, ref],
    );
    return { action: "adopted", payDate: advice.payDate, amount };
  }

  await pool.query(
    `INSERT INTO finance_payments (provider, amount, paid_at, note, source_ref)
     VALUES ('viator', $1, $2::date, $3, $4)`,
    [amount, advice.payDate, note, ref],
  );
  return { action: "recorded", payDate: advice.payDate, amount };
}
