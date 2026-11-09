// Acceso a Mis Gastos: cédula + contraseña, sesión de 30 días.
// Los tokens se firman con una clave DERIVADA de JWT_SECRET: así un token de
// Mis Gastos nunca sirve para el panel de admin ni el portal de guías.
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { S, sembrarCategorias } from "./esquema.js";

const DURACION = 30 * 24 * 3600; // segundos
const MAX_INTENTOS = 5;
const BLOQUEO_MIN = 15;

const secreto = () => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET no está definido");
  return crypto.createHmac("sha256", process.env.JWT_SECRET).update("mis-gastos").digest();
};

export const limpiarCedula = (c) => String(c || "").replace(/\D/g, "");
export const hashCodigo = (c) => crypto.createHash("sha256").update(String(c || "").trim().toUpperCase()).digest("hex");

function emitir(usuario) {
  const token = jwt.sign({ uid: usuario.id, app: "mis-gastos" }, secreto(), { expiresIn: DURACION, audience: "mis-gastos" });
  return { token, expira: Date.now() + DURACION * 1000, usuario: { id: usuario.id, nombre: usuario.nombre } };
}

async function fallo(id) {
  await pool.query(
    `UPDATE ${S}.usuarios SET
       intentos = CASE WHEN intentos + 1 >= $2 THEN 0 ELSE intentos + 1 END,
       bloqueado_hasta = CASE WHEN intentos + 1 >= $2 THEN now() + make_interval(mins => $3) ELSE bloqueado_hasta END
     WHERE id = $1`,
    [id, MAX_INTENTOS, BLOQUEO_MIN]
  );
}

function revisarBloqueo(u) {
  if (u.bloqueado_hasta && new Date(u.bloqueado_hasta) > new Date()) {
    const min = Math.ceil((new Date(u.bloqueado_hasta) - Date.now()) / 60000);
    const e = new Error(`Demasiados intentos. Intenta de nuevo en ${min} min.`);
    e.status = 429;
    throw e;
  }
}

const error = (msg, status = 400) => Object.assign(new Error(msg), { status });

export async function login(cedula, password) {
  const q = await pool.query(`SELECT * FROM ${S}.usuarios WHERE cedula = $1`, [limpiarCedula(cedula)]);
  const u = q.rows[0];
  if (!u || !u.password_hash) {
    // Mismo tiempo de respuesta aunque la cédula no exista
    verifyPassword(String(password || ""), "scrypt$00$00");
    throw error("Cédula o contraseña incorrecta", 401);
  }
  revisarBloqueo(u);
  if (!verifyPassword(String(password || ""), u.password_hash)) {
    await fallo(u.id);
    throw error("Cédula o contraseña incorrecta", 401);
  }
  await pool.query(`UPDATE ${S}.usuarios SET intentos = 0, bloqueado_hasta = NULL WHERE id = $1`, [u.id]);
  return emitir(u);
}

/** Primer ingreso (o contraseña olvidada): código de un solo uso + cédula + contraseña nueva. */
export async function activar(codigo, cedula, password) {
  const ced = limpiarCedula(cedula);
  if (ced.length < 9) throw error("La cédula debe tener al menos 9 dígitos");
  if (String(password || "").length < 8) throw error("La contraseña debe tener al menos 8 caracteres");
  const q = await pool.query(
    `SELECT * FROM ${S}.usuarios WHERE activacion_hash = $1 AND activacion_expira > now()`,
    [hashCodigo(codigo)]
  );
  const u = q.rows[0];
  if (!u) throw error("El código no es válido o ya venció", 401);
  if (u.cedula && u.cedula !== ced) throw error("Esa cédula no corresponde a este código", 401);
  const otra = await pool.query(`SELECT 1 FROM ${S}.usuarios WHERE cedula = $1 AND id <> $2`, [ced, u.id]);
  if (otra.rowCount) throw error("Esa cédula ya tiene una cuenta");
  const r = await pool.query(
    `UPDATE ${S}.usuarios SET cedula = $2, password_hash = $3, activacion_hash = NULL, activacion_expira = NULL,
       intentos = 0, bloqueado_hasta = NULL, sesiones_desde = now() - interval '1 second'
     WHERE id = $1 RETURNING *`,
    [u.id, ced, hashPassword(password)]
  );
  const cats = await pool.query(`SELECT 1 FROM ${S}.categorias WHERE usuario_id = $1 LIMIT 1`, [u.id]);
  if (!cats.rowCount) await sembrarCategorias(pool, { usuarioId: u.id });
  return emitir(r.rows[0]);
}

/** Middleware: exige un token válido de Mis Gastos. Deja req.usuario = { id, nombre }. */
export async function requiereUsuario(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ ok: false, error: "Sesión vencida" });
  let payload;
  try {
    payload = jwt.verify(token, secreto(), { audience: "mis-gastos" });
  } catch {
    return res.status(401).json({ ok: false, error: "Sesión vencida" });
  }
  try {
    const q = await pool.query(`SELECT id, nombre, sesiones_desde FROM ${S}.usuarios WHERE id = $1`, [payload.uid]);
    const u = q.rows[0];
    if (!u || payload.iat * 1000 < new Date(u.sesiones_desde).getTime() - 1000) {
      return res.status(401).json({ ok: false, error: "Sesión vencida" });
    }
    req.usuario = { id: u.id, nombre: u.nombre };
    next();
  } catch (e) {
    next(e);
  }
}
