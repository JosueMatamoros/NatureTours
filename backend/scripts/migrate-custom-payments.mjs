// Migración única: pagos personalizados (/custom-payment).
// Monto y descripción libres, sin reserva asociada. Idempotente.
// Correr desde backend/:  node scripts/migrate-custom-payments.mjs
import { pool } from "../db.js";

try {
  await pool.query(`
    create table if not exists custom_payments (
      id uuid primary key default gen_random_uuid(),
      customer_name text not null,
      customer_email text not null,
      customer_phone text,
      description text not null,
      amount numeric(10,2) not null check (amount > 0),
      currency text not null default 'USD',
      paypal_order_id text not null unique,
      paypal_capture_id text,
      status text not null default 'completed',
      email_sent boolean not null default false,
      created_at timestamptz not null default now()
    );
    create index if not exists custom_payments_created_idx on custom_payments(created_at desc);
  `);
  console.log("migración OK");
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await pool.end();
}
