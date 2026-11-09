// Crea el esquema de Mis Gastos y los usuarios iniciales con un código de
// activación (válido 14 días) para que cada uno cree su contraseña en la app.
// Uso: node scripts/gastos-crear-usuarios.mjs
import crypto from "crypto";
import { pool } from "../db.js";
import { migrarGastos, S } from "../gastos/esquema.js";
import { hashCodigo } from "../gastos/auth.js";

const codigo = () => Array.from(crypto.randomBytes(8), (b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32]).join("");

await migrarGastos();
const josue = (await pool.query(`SELECT id, cedula FROM public.guides WHERE email = '1002matamoros@gmail.com'`)).rows[0];

const usuarios = [
  { nombre: "Josué", correo: "1002matamoros@gmail.com", lee: true, guide: josue?.id || null, cedula: josue?.cedula || null },
  { nombre: "Mario Andrés", correo: null, lee: false, guide: null, cedula: null },
];
for (const u of usuarios) {
  const c = codigo();
  const existe = await pool.query(`SELECT id FROM ${S}.usuarios WHERE nombre = $1`, [u.nombre]);
  if (existe.rowCount) {
    await pool.query(`UPDATE ${S}.usuarios SET activacion_hash = $2, activacion_expira = now() + interval '14 days' WHERE id = $1`, [existe.rows[0].id, hashCodigo(c)]);
  } else {
    await pool.query(
      `INSERT INTO ${S}.usuarios (nombre, correo, lee_correo, guide_id, cedula, activacion_hash, activacion_expira)
       VALUES ($1, $2, $3, $4, $5, $6, now() + interval '14 days')`,
      [u.nombre, u.correo, u.lee, u.guide, u.cedula ? u.cedula.replace(/\D/g, "") : null, hashCodigo(c)]
    );
  }
  console.log(`${u.nombre}: código ${c}${u.guide ? " (enlazado a su perfil de guía)" : ""}${u.cedula ? " · cédula ya registrada" : ""}`);
}
await pool.end();
