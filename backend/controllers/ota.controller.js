// Ingesta de reservas de OTAs (GetYourGuide / Viator) desde el correo.
// Un script en Gmail (Apps Script) reenvía cada correo a este endpoint; acá se
// parsea y se inserta/cancela en la BD. Dedup por external_ref (idempotente).
import { pool } from "../db.js";
import { parseOtaEmail } from "../ota/ota-parser.js";

// POST /api/ota/inbound   header: x-ota-token
// body: { from, subject, body }
export async function otaInbound(req, res) {
  const token = req.headers["x-ota-token"];
  if (!process.env.OTA_INGEST_TOKEN || token !== process.env.OTA_INGEST_TOKEN) {
    return res.status(401).json({ ok: false, message: "Token inválido" });
  }

  const { from = "", subject = "", body = "" } = req.body || {};
  const parsed = parseOtaEmail({ from, subject, body });
  if (!parsed) {
    return res.json({ ok: true, ignored: true }); // no es una reserva OTA reconocible
  }

  try {
    if (parsed.kind === "cancellation") {
      const q = await pool.query(
        `UPDATE bookings
         SET status = 'cancelled', cancelled_at = now(), updated_at = now()
         WHERE external_ref = $1 AND status <> 'cancelled'
         RETURNING id`,
        [parsed.externalRef],
      );
      return res.json({ ok: true, action: q.rowCount ? "cancelled" : "cancel-noop", ref: parsed.externalRef });
    }

    // Confirmación → insertar una sola vez (dedup por external_ref).
    const q = await pool.query(
      `INSERT INTO bookings
         (tour_id, tour_date, start_time, adults, children, babies,
          status, source, manual_name, manual_phone, manual_paid, expires_at, external_ref)
       VALUES ($1,$2::date,$3::time,$4,$5,$6,'paid',$7,$8,$9,0,NULL,$10)
       ON CONFLICT (external_ref) WHERE external_ref IS NOT NULL DO NOTHING
       RETURNING id`,
      [
        parsed.tourId, parsed.date, parsed.time,
        parsed.adults, parsed.children, parsed.babies,
        parsed.provider, parsed.name, parsed.phone, parsed.externalRef,
      ],
    );
    return res.json({
      ok: true,
      action: q.rowCount ? "created" : "duplicate",
      ref: parsed.externalRef,
      provider: parsed.provider,
    });
  } catch (err) {
    console.error("otaInbound error:", err);
    return res.status(500).json({ ok: false, message: "Error importando la reserva" });
  }
}
