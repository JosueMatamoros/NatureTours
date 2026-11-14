// Cálculo de "lo generado" (lo que le queda al negocio) — compartido entre el
// portal (total del día, solo supervisores) y Finanzas (total del mes, admin).
//   directo (web/manual) → precio del tour (subtotal, sin la comisión de PayPal
//     que paga el cliente)
//   Localbird → precio del tour (su correo no trae precio)
//   Viator → "Net Rate" del correo
//   GetYourGuide → precio del correo − 30 % de comisión
// Las reservas OTA sin precio guardado se cuentan aparte en `missing`.
import { pool } from "../db.js";

const OTA_SOURCES = new Set(["viator", "gyg"]);

// rows: { source, subtotal, ota_net }
export function computeRevenue(rows) {
  const bySource = {};
  let total = 0;
  let missing = 0;
  for (const r of rows) {
    const isOta = OTA_SOURCES.has(r.source);
    const amount = isOta ? r.ota_net : r.subtotal;
    if (amount == null) { missing += 1; continue; }
    const n = Number(amount) || 0;
    const key = isOta ? r.source : r.source === "localbird" ? "localbird" : "direct";
    bySource[key] = Math.round(((bySource[key] || 0) + n) * 100) / 100;
    total += n;
  }
  return { total: Math.round(total * 100) / 100, bySource, missing };
}

// Reservas que cuentan: no canceladas y, si son web, con un pago completado
// (mismo criterio que la vista del día).
export async function revenueBetween(fromYmd, toYmdExclusive) {
  const q = await pool.query(
    `SELECT b.source, b.subtotal, b.ota_net
     FROM bookings b
     WHERE b.tour_date >= $1::date AND b.tour_date < $2::date
       AND b.status <> 'cancelled'
       AND (b.source <> 'web' OR EXISTS (
             SELECT 1 FROM payments p WHERE p.booking_id = b.id AND p.status = 'completed'))`,
    [fromYmd, toYmdExclusive],
  );
  return { ...computeRevenue(q.rows), bookings: q.rowCount };
}
