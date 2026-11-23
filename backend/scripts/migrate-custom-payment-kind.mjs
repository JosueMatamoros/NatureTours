// Migración única: tipo de pago personalizado (custom / custom_fee / tip /
// balance) y fee PayPal cobrado al cliente. Idempotente.
// Correr desde backend/:  node scripts/migrate-custom-payment-kind.mjs
import { pool } from "../db.js";
try {
  await pool.query(`
    alter table custom_payments add column if not exists kind text not null default 'custom';
    alter table custom_payments add column if not exists fee numeric(10,2) not null default 0;
  `);
  console.log("migración OK");
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await pool.end();
}
