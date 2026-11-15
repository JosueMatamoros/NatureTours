// Crea o actualiza una cuenta de Mis Gastos (ya no hay registro desde la app).
// Uso:
//   node scripts/gastos-usuario.mjs --nombre "Mario Andrés" --cedula 112345678 --password "clave-segura"
//   node scripts/gastos-usuario.mjs --cedula 112345678 --password "nueva-clave"   (cambiar contraseña)
//   node scripts/gastos-usuario.mjs --lista                                       (ver cuentas)
import { pool } from "../db.js";
import { S } from "../gastos/esquema.js";
import { limpiarCedula } from "../gastos/auth.js";
import { hashPassword } from "../utils/password.js";

const args = process.argv.slice(2);
const arg = (k) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : undefined; };

if (args.includes("--lista")) {
  const { rows } = await pool.query(
    `SELECT nombre, cedula, (password_hash IS NOT NULL) AS con_clave, lee_correo FROM ${S}.usuarios ORDER BY nombre`
  );
  console.table(rows);
  await pool.end();
  process.exit(0);
}

const nombre = arg("nombre")?.trim();
const cedula = limpiarCedula(arg("cedula"));
const password = arg("password");
if (!cedula || cedula.length < 9) throw new Error("Falta --cedula (mínimo 9 dígitos)");
if (!password || password.length < 8) throw new Error("Falta --password (mínimo 8 caracteres)");

const existe = (await pool.query(`SELECT id, nombre FROM ${S}.usuarios WHERE cedula = $1`, [cedula])).rows[0];
if (existe) {
  await pool.query(
    `UPDATE ${S}.usuarios SET password_hash = $2, intentos = 0, bloqueado_hasta = NULL, activacion_hash = NULL, activacion_expira = NULL
       ${nombre ? ", nombre = $3" : ""} WHERE id = $1`,
    nombre ? [existe.id, hashPassword(password), nombre] : [existe.id, hashPassword(password)]
  );
  console.log(`Actualizada: ${nombre || existe.nombre} (cédula ${cedula}) — contraseña nueva.`);
} else {
  if (!nombre) throw new Error("Cuenta nueva: falta --nombre");
  await pool.query(
    `INSERT INTO ${S}.usuarios (nombre, cedula, password_hash) VALUES ($1, $2, $3)`,
    [nombre, cedula, hashPassword(password)]
  );
  console.log(`Creada: ${nombre} (cédula ${cedula}). Ya puede entrar con cédula y contraseña.`);
}
await pool.end();
