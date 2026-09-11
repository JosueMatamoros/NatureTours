// Migración + seed del portal de guías. Idempotente: se puede correr varias veces.
import { pool } from "../db.js";
import { hashPassword } from "../utils/password.js";

const GUIDE_EMAIL = "1002matamoros@gmail.com"; // Josué (ya existe)
const CEDULA = "118640777";
const PASSWORD = "guia123";
const TOUR_ID = 2; // Horseback Riding

async function main() {
  // 1. Columnas cedula + password_hash
  await pool.query(`ALTER TABLE guides ADD COLUMN IF NOT EXISTS cedula text`);
  await pool.query(`ALTER TABLE guides ADD COLUMN IF NOT EXISTS password_hash text`);
  await pool.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS guides_cedula_key ON guides (cedula) WHERE cedula IS NOT NULL`,
  );

  // 2. Credenciales de Josué
  const upd = await pool.query(
    `UPDATE guides SET cedula = $1, password_hash = $2
     WHERE email = $3 RETURNING id, name`,
    [CEDULA, hashPassword(PASSWORD), GUIDE_EMAIL],
  );
  if (upd.rowCount === 0) throw new Error("No se encontró el guía Josué por email");
  const guide = upd.rows[0];
  console.log(`Guía: ${guide.name} (${guide.id}) → cédula ${CEDULA} / ${PASSWORD}`);

  // 3. Fechas hoy y mañana (en la zona del negocio)
  const dRes = await pool.query(
    `SELECT to_char(current_date,'YYYY-MM-DD') AS today,
            to_char(current_date + 1,'YYYY-MM-DD') AS tomorrow`,
  );
  const { today, tomorrow } = dRes.rows[0];
  console.log(`Hoy=${today}  Mañana=${tomorrow}`);

  // 4. Asignar a Josué a horarios (slot_guides)
  const assignments = [
    [today, "08:00"],
    [today, "12:00"],
    [tomorrow, "08:00"],
  ];
  for (const [date, time] of assignments) {
    await pool.query(
      `INSERT INTO slot_guides (tour_id, tour_date, start_time, guide_id)
       VALUES ($1, $2::date, $3::time, $4)
       ON CONFLICT (tour_id, tour_date, start_time)
       DO UPDATE SET guide_id = EXCLUDED.guide_id, updated_at = now()`,
      [TOUR_ID, date, time, guide.id],
    );
  }
  console.log(`Asignados ${assignments.length} horarios a Josué`);

  // 5. Reservas falsas (manual). Idempotente: borra las de estos nombres primero.
  const fakeNames = ["Kendra Zaruba", "Mike Ross", "Sarah Connor", "John Doe", "Emma Stone"];
  await pool.query(
    `DELETE FROM bookings
     WHERE source = 'manual' AND tour_id = $1
       AND tour_date IN ($2::date, $3::date)
       AND manual_name = ANY($4)`,
    [TOUR_ID, today, tomorrow, fakeNames],
  );

  // [date, time, name, phone, adults, children, babies, manual_paid]
  // manual_paid alto (999) = pagó; 0 = debe (sale resaltado).
  const fakes = [
    [today, "08:00", "Kendra Zaruba", "+1 717 271 9260", 2, 0, 0, 0],
    [today, "08:00", "Mike Ross", "+1 555 010 2020", 1, 1, 0, 999],
    [today, "12:00", "Sarah Connor", "+1 555 030 4040", 3, 0, 0, 0],
    [tomorrow, "08:00", "John Doe", "+1 555 050 6060", 2, 0, 0, 999],
    [tomorrow, "08:00", "Emma Stone", "+1 555 070 8080", 2, 0, 1, 0],
  ];
  for (const [date, time, name, phone, adults, children, babies, paid] of fakes) {
    await pool.query(
      `INSERT INTO bookings
         (tour_id, tour_date, start_time, adults, children, babies,
          status, source, manual_name, manual_phone, manual_paid, expires_at)
       VALUES ($1, $2::date, $3::time, $4, $5, $6,
               'paid', 'manual', $7, $8, $9, NULL)`,
      [TOUR_ID, date, time, adults, children, babies, name, phone, paid],
    );
  }
  console.log(`Insertadas ${fakes.length} reservas falsas`);

  await pool.end();
  console.log("Listo ✓");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
