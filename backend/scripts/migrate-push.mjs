// Migración única: notificaciones push (PWA).
// - push_subscriptions: un registro por teléfono/navegador suscrito.
// - app_settings: guarda las claves VAPID (generadas una sola vez) para no
//   depender de variables de entorno. Idempotente.
// Correr desde backend/:  node scripts/migrate-push.mjs
import { generateVAPIDKeys } from "web-push";
import { pool } from "../db.js";

try {
  await pool.query(`
    create table if not exists push_subscriptions (
      id uuid primary key default gen_random_uuid(),
      guide_id uuid not null references guides(id) on delete cascade,
      endpoint text not null unique,
      p256dh text not null,
      auth text not null,
      user_agent text,
      created_at timestamptz not null default now(),
      last_success_at timestamptz
    );
    create index if not exists push_subscriptions_guide_idx on push_subscriptions(guide_id);

    create table if not exists app_settings (
      key text primary key,
      value text not null,
      updated_at timestamptz not null default now()
    );
  `);

  const has = await pool.query(`select 1 from app_settings where key = 'vapid_public_key'`);
  if (has.rowCount === 0) {
    const keys = generateVAPIDKeys();
    await pool.query(
      `insert into app_settings (key, value) values
         ('vapid_public_key', $1), ('vapid_private_key', $2)`,
      [keys.publicKey, keys.privateKey]
    );
    console.log("claves VAPID generadas");
  } else {
    console.log("claves VAPID ya existían");
  }
  console.log("migración OK");
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await pool.end();
}
