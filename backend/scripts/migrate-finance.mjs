// Migración única: módulo Finanzas (cierre mensual en el panel admin).
//   finance_months   → saldos que se anotan cada mes (BAC San José, PayPal)
//   finance_payments → pagos que llegan de Viator / GetYourGuide, con fecha
// Pensado para unirse después con el sistema de gastos. Idempotente.
// Correr desde backend/:  node scripts/migrate-finance.mjs
import { pool } from "../db.js";
try {
  await pool.query(`
    create table if not exists finance_months (
      month date primary key,                 -- primer día del mes
      bac_balance numeric(14,2),
      bac_currency text not null default 'USD' check (bac_currency in ('USD','CRC')),
      paypal_balance numeric(14,2),
      notes text,
      updated_at timestamptz not null default now()
    );
    create table if not exists finance_payments (
      id uuid primary key default gen_random_uuid(),
      provider text not null check (provider in ('viator','gyg')),
      amount numeric(14,2) not null check (amount > 0),
      paid_at date not null,
      note text,
      created_at timestamptz not null default now()
    );
    create index if not exists finance_payments_paid_at_idx on finance_payments (paid_at);
  `);
  console.log("migración OK");
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await pool.end();
}
