// Migración única: rol de solo lectura (guides.is_viewer). Idempotente.
// Correr desde backend/:  node scripts/migrate-viewer.mjs
import { pool } from "../db.js";
try {
  await pool.query(`alter table guides add column if not exists is_viewer boolean not null default false`);
  console.log("migración OK");
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await pool.end();
}
