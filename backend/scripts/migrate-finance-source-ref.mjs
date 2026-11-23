// Migración única: pagos de OTAs anotados automáticamente (Viator Payment
// Advice). source_ref = "viator-advice-YYYY-MM-DD"; null = anotado a mano.
// Correr desde backend/:  node scripts/migrate-finance-source-ref.mjs
import { pool } from "../db.js";
try {
  await pool.query(`
    alter table finance_payments add column if not exists source_ref text;
    create unique index if not exists finance_payments_source_ref_idx
      on finance_payments(source_ref) where source_ref is not null;
  `);
  console.log("migración OK");
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await pool.end();
}
