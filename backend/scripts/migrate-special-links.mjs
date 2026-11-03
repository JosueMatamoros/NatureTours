// Migración única: links especiales (fecha / horario / pasajeros / monto fijos).
// Correr desde backend/:  node scripts/migrate-special-links.mjs
// Compatible hacia atrás: con bookings.custom_subtotal = null el trigger
// calcula igual que antes. Si el trigger ya fue actualizado, lo detecta y sigue.
import { pool } from "../db.js";

const c = await pool.connect();
try {
  await c.query("BEGIN");

  await c.query(`
    create table if not exists special_links (
      id uuid primary key default gen_random_uuid(),
      tour_id int not null references tours(id),
      tour_date date not null,
      start_time time not null,
      adults int not null default 1 check (adults >= 1),
      children int not null default 0 check (children >= 0),
      babies int not null default 0 check (babies >= 0),
      custom_subtotal numeric(10,2) check (custom_subtotal is null or custom_subtotal > 0),
      note text,
      active boolean not null default true,
      created_at timestamptz not null default now()
    );
    alter table bookings add column if not exists custom_subtotal numeric(10,2);
    alter table bookings add column if not exists special_link_id uuid references special_links(id);
    create index if not exists bookings_special_link_idx on bookings(special_link_id);
  `);

  const { rows } = await c.query(
    `select prosrc from pg_proc where proname = 'bookings_calculate_amounts'`
  );
  let src = rows[0].prosrc;

  if (src.includes("custom_subtotal")) {
    console.log("trigger ya actualizado, se omite");
  } else {
    const old = `  -- subtotal = adultos + ninos (bebes gratis)
  NEW.subtotal := round(adult_price * NEW.adults + kid_price * NEW.children, 2);`;
    if (!src.includes(old)) throw new Error("No se encontró el cálculo de subtotal en el trigger");

    src = src.replace(
      old,
      `  -- subtotal = adultos + ninos (bebes gratis); un link especial puede fijar el monto
  IF NEW.custom_subtotal IS NOT NULL THEN
    NEW.subtotal := round(NEW.custom_subtotal, 2);
  ELSE
    NEW.subtotal := round(adult_price * NEW.adults + kid_price * NEW.children, 2);
  END IF;`
    );
    await c.query(
      `create or replace function bookings_calculate_amounts() returns trigger language plpgsql as $fn$${src}$fn$`
    );
  }

  await c.query("COMMIT");
  console.log("migración OK");
} catch (e) {
  await c.query("ROLLBACK");
  console.error(e);
  process.exitCode = 1;
} finally {
  c.release();
  await pool.end();
}
