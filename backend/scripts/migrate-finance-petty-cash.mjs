// Migración única: saldo de caja chica en el cierre mensual (Finanzas).
// Idempotente. Correr desde backend/:  node scripts/migrate-finance-petty-cash.mjs
import { pool } from "../db.js";
try {
  await pool.query(`alter table finance_months add column if not exists petty_cash numeric(14,2)`);
  console.log("migración OK");
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await pool.end();
}
