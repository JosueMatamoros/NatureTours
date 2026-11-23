// Migración única: monto pagado registrado a mano (bookings.paid_override).
// null = se usa lo cobrado en línea. Correr desde backend/: node scripts/migrate-paid-override.mjs
import { pool } from "../db.js";
try {
  await pool.query(`alter table bookings add column if not exists paid_override numeric(10,2)`);
  console.log("migración OK");
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await pool.end();
}
