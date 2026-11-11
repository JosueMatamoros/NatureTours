// Migración única: precio que traen los correos de las OTAs.
//   ota_gross = lo que dice el correo (GYG: "Precio", lo que pagó el cliente)
//   ota_net   = lo que le queda al negocio (Viator: "Net Rate"; GYG: precio − 30 %)
// Idempotente. Correr desde backend/:  node scripts/migrate-ota-price.mjs
import { pool } from "../db.js";
try {
  await pool.query(`
    alter table bookings add column if not exists ota_gross numeric(10,2);
    alter table bookings add column if not exists ota_net numeric(10,2);
  `);
  console.log("migración OK");
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await pool.end();
}
