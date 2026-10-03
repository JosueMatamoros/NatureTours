// Prueba del aviso de WhatsApp.
//   node scripts/whatsapp-test.mjs <bookingId|ref>          → muestra el mensaje (no envía)
//   node scripts/whatsapp-test.mjs <bookingId|ref> --send   → lo envía a WHATSAPP_NOTIFY_TO
import { pool } from "../db.js";
import { loadBooking, buildParams, notifyBooking, whatsappConfigured } from "../utils/whatsapp.js";

const arg = process.argv[2];
const send = process.argv.includes("--send");
if (!arg) {
  console.error("Uso: node scripts/whatsapp-test.mjs <bookingId|external_ref> [--send]");
  process.exit(1);
}

const q = await pool.query(
  "SELECT id FROM bookings WHERE id::text = $1 OR external_ref = $1 LIMIT 1",
  [arg],
);
if (!q.rowCount) {
  console.error("Reserva no encontrada:", arg);
  process.exit(1);
}
const id = q.rows[0].id;
const params = buildParams(await loadBooking(id), "new");
params.forEach((p, i) => console.log(`{{${i + 1}}} ${p}`));

if (send) {
  if (!whatsappConfigured()) {
    console.error("Falta configurar WHATSAPP_* en .env");
    process.exit(1);
  }
  await notifyBooking(id, "new");
  console.log("Enviado (revisá el log por errores).");
}
await pool.end();
