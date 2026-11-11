// Ingesta de reservas de OTAs (GetYourGuide / Viator) desde el correo.
// Un script en Gmail (Apps Script) reenvía cada correo a este endpoint; acá se
// parsea y se inserta/cancela en la BD. Dedup por external_ref (idempotente).
import { pool } from "../db.js";
import { parseOtaEmail } from "../ota/ota-parser.js";
import { notifyBooking } from "../utils/whatsapp.js";
import { pushBookingToAdmins } from "../utils/push.js";

// POST /api/ota/inbound   header: x-ota-token
// body: { from, subject, body }
export async function otaInbound(req, res) {
  const token = req.headers["x-ota-token"];
  if (!process.env.OTA_INGEST_TOKEN || token !== process.env.OTA_INGEST_TOKEN) {
    return res.status(401).json({ ok: false, message: "Token inválido" });
  }

  const { from = "", subject = "", body = "", backfill = false } = req.body || {};
  const parsed = parseOtaEmail({ from, subject, body });
  if (!parsed) {
    return res.json({ ok: true, ignored: true }); // no es una reserva OTA reconocible
  }

  try {
    // Relleno de precios (correos viejos re-enviados por `rellenarPrecios` del
    // Apps Script): SOLO completa el precio de reservas que ya existen. Nunca
    // crea, cancela ni notifica.
    if (backfill) {
      if (parsed.kind !== "confirmation" || parsed.net == null) {
        return res.json({ ok: true, action: "backfill-skip", ref: parsed.externalRef });
      }
      const u = await pool.query(
        `UPDATE bookings SET ota_gross = $2, ota_net = $3, updated_at = now()
         WHERE external_ref = $1 AND ota_net IS NULL`,
        [parsed.externalRef, parsed.gross, parsed.net],
      );
      return res.json({ ok: true, action: u.rowCount ? "price-filled" : "backfill-skip", ref: parsed.externalRef });
    }

    if (parsed.kind === "cancellation") {
      const q = await pool.query(
        `UPDATE bookings
         SET status = 'cancelled', cancelled_at = now(), updated_at = now()
         WHERE external_ref = $1 AND status <> 'cancelled'
         RETURNING id`,
        [parsed.externalRef],
      );
      if (q.rowCount) { notifyBooking(q.rows[0].id, "cancelled"); pushBookingToAdmins(q.rows[0].id, "cancelled"); }
      // Siempre se recuerda la cancelación: si la confirmación llega (o se
      // procesa) después, la reserva se crea ya cancelada.
      await pool.query(
        `INSERT INTO ota_cancellations (external_ref, provider) VALUES ($1, $2)
         ON CONFLICT (external_ref) DO NOTHING`,
        [parsed.externalRef, parsed.provider],
      );
      return res.json({ ok: true, action: q.rowCount ? "cancelled" : "cancel-noop", ref: parsed.externalRef });
    }

    // ¿Ya llegó la cancelación de esta reserva? (correos fuera de orden)
    const preCancelled = (
      await pool.query(`SELECT 1 FROM ota_cancellations WHERE external_ref = $1`, [parsed.externalRef])
    ).rowCount > 0;

    // Confirmación → insertar una sola vez (dedup por external_ref). Si ya
    // estaba cancelada, se guarda como cancelada y no se notifica.
    const q = await pool.query(
      `INSERT INTO bookings
         (tour_id, tour_date, start_time, adults, children, babies,
          status, source, manual_name, manual_phone, manual_paid, expires_at, external_ref,
          cancelled_at, ota_gross, ota_net)
       VALUES ($1,$2::date,$3::time,$4,$5,$6,
               CASE WHEN $11 THEN 'cancelled' ELSE 'paid' END,
               $7,$8,$9,0,NULL,$10,
               CASE WHEN $11 THEN now() ELSE NULL END,
               $12,$13)
       ON CONFLICT (external_ref) WHERE external_ref IS NOT NULL DO NOTHING
       RETURNING id`,
      [
        parsed.tourId, parsed.date, parsed.time,
        parsed.adults, parsed.children, parsed.babies,
        parsed.provider, parsed.name, parsed.phone, parsed.externalRef,
        preCancelled, parsed.gross, parsed.net,
      ],
    );
    if (q.rowCount && !preCancelled) { notifyBooking(q.rows[0].id, "new"); pushBookingToAdmins(q.rows[0].id, "new"); }
    return res.json({
      ok: true,
      action: q.rowCount ? (preCancelled ? "created-cancelled" : "created") : "duplicate",
      ref: parsed.externalRef,
      provider: parsed.provider,
    });
  } catch (err) {
    console.error("otaInbound error:", err);
    return res.status(500).json({ ok: false, message: "Error importando la reserva" });
  }
}
