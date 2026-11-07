// Migración única: cancelaciones de OTA que llegan ANTES que la confirmación.
// Se guarda la referencia para que, si la confirmación entra después, la
// reserva se cree ya cancelada. Idempotente.
// Correr desde backend/:  node scripts/migrate-ota-cancellations.mjs
import { pool } from "../db.js";
try {
  await pool.query(`
    create table if not exists ota_cancellations (
      external_ref text primary key,
      provider text,
      received_at timestamptz not null default now()
    );
  `);
  console.log("migración OK");
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await pool.end();
}
