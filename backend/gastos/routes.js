// API de Mis Gastos: /api/gastos/*
import { Router } from "express";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import { z } from "zod";
import { pool } from "../db.js";
import { getVapidPublicKey } from "../utils/push.js";
import { activar, login, requiereUsuario } from "./auth.js";
import { categorizar, claveDe, normalizar } from "./categorizar.js";
import { S, sembrarCategorias } from "./esquema.js";
import { avisarGastosNuevos } from "./push.js";

const router = Router();
const TZ = "America/Costa_Rica";

const err = (msg, status = 400) => Object.assign(new Error(msg), { status });
const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const validar = (schema, data) => {
  const r = schema.safeParse(data);
  if (!r.success) throw err(r.error.issues[0]?.message || "Datos inválidos");
  return r.data;
};

const uuid = z.string().uuid();
const icono = z.string().regex(/^[A-Za-z0-9]{2,40}$/, "Ícono inválido");
const color = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color inválido");
const nombreCat = z.string().trim().min(1, "Escribe un nombre").max(30, "El nombre es muy largo (máximo 30 letras)")
  .refine((n) => !/^por clasificar$/i.test(n), "Ese nombre está reservado");

// ───────────── Acceso ─────────────

const limiteAcceso = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false,
  message: { ok: false, error: "Demasiados intentos, intenta más tarde" } });

router.post("/login", limiteAcceso, h(async (req, res) => {
  const { cedula, password } = req.body || {};
  const s = await login(cedula, password);
  res.json({ ok: true, ...s, ...(await datos(s.usuario.id)) });
}));

router.post("/activar", limiteAcceso, h(async (req, res) => {
  const { codigo, cedula, password } = req.body || {};
  const s = await activar(codigo, cedula, password);
  res.json({ ok: true, ...s, ...(await datos(s.usuario.id)) });
}));

// ───────────── Ingesta desde el Apps Script de Gmail ─────────────

const gastoCorreo = z.object({
  ref: z.string().min(1).max(120),
  fecha: z.string().min(8).max(40),
  banco: z.string().max(40).nullish(),
  tipo: z.string().max(40).nullish(),
  comercio: z.string().min(1).max(200),
  textoCategoria: z.string().max(300).nullish(),
  monto: z.number().nonnegative().max(1e10),
  moneda: z.string().max(5).nullish(),
  montoOriginal: z.number().nonnegative().max(1e10).nullish(),
  // Solo para traer lo que ya estaba en la hoja de Google:
  categoria: z.string().max(60).nullish(),
  manual: z.boolean().nullish(),
  eliminado: z.boolean().nullish(),
});
const ingestaSchema = z.object({
  correo: z.string().email().max(200),
  gastos: z.array(gastoCorreo).max(2000),
  reglas: z.array(z.object({ comercio: z.string().max(200), categoria: z.string().max(60) })).max(2000).optional(),
  avisar: z.boolean().optional(),
});

function tokenValido(recibido) {
  const esperado = process.env.GASTOS_INGEST_TOKEN || "";
  const a = Buffer.from(String(recibido || ""));
  const b = Buffer.from(esperado);
  return esperado.length >= 24 && a.length === b.length && crypto.timingSafeEqual(a, b);
}

router.post("/ingesta", h(async (req, res) => {
  if (!tokenValido(req.headers["x-gastos-token"])) return res.status(401).json({ ok: false, error: "Token inválido" });
  const body = validar(ingestaSchema, req.body);
  const u = await pool.query(`SELECT id FROM ${S}.usuarios WHERE lower(correo) = lower($1) AND lee_correo`, [body.correo]);
  if (!u.rowCount) return res.status(404).json({ ok: false, error: "Ese correo no está conectado a ningún usuario" });
  const usuarioId = u.rows[0].id;

  const cats = await pool.query(`SELECT id, nombre FROM ${S}.categorias WHERE usuario_id = $1`, [usuarioId]);
  const porNombre = Object.fromEntries(cats.rows.map((c) => [c.nombre.toLowerCase(), c.id]));

  // Reglas aprendidas que vienen de la hoja
  for (const r of body.reglas || []) {
    const catId = porNombre[r.categoria.toLowerCase()];
    const clave = normalizar(r.comercio);
    if (!catId || !clave) continue;
    await pool.query(
      `INSERT INTO ${S}.reglas (usuario_id, clave, categoria_id) VALUES ($1, $2, $3)
       ON CONFLICT (coalesce(usuario_id, grupo_id), clave) DO UPDATE SET categoria_id = excluded.categoria_id`,
      [usuarioId, clave, catId]
    );
  }

  const nuevos = [];
  for (const g of body.gastos) {
    const fecha = new Date(g.fecha);
    if (isNaN(fecha)) continue;
    let categoriaId = g.categoria ? porNombre[g.categoria.toLowerCase()] || null : undefined;
    if (categoriaId === undefined) categoriaId = await categorizar(pool, { usuarioId }, g.textoCategoria || g.comercio);
    const r = await pool.query(
      `INSERT INTO ${S}.movimientos (usuario_id, origen, ref_externa, fecha, banco, tipo, comercio, texto_categoria, monto, moneda, monto_original, categoria_id, manual, eliminado)
       VALUES ($1, 'correo', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (usuario_id, ref_externa) DO NOTHING
       RETURNING id, comercio, monto, categoria_id`,
      [usuarioId, g.ref, fecha, g.banco || null, g.tipo || null, g.comercio, g.textoCategoria || null, g.monto,
        g.moneda || "CRC", g.montoOriginal ?? g.monto, categoriaId, Boolean(g.manual), Boolean(g.eliminado)]
    );
    if (r.rowCount && !g.eliminado) {
      const n = r.rows[0];
      n.categoria_nombre = cats.rows.find((c) => c.id === n.categoria_id)?.nombre;
      nuevos.push(n);
    }
  }
  if (body.avisar !== false) avisarGastosNuevos(usuarioId, nuevos); // sin esperar
  res.json({ ok: true, nuevos: nuevos.length });
}));

// ───────────── Todo lo demás requiere sesión ─────────────

router.use(requiereUsuario);

const SEL_MOV = `
  SELECT m.id, to_char(m.fecha AT TIME ZONE '${TZ}', 'YYYY-MM-DD"T"HH24:MI:SS') AS fecha,
         m.banco, m.tipo, m.comercio, m.monto::float AS monto, m.moneda, m.monto_original::float AS "montoOriginal",
         m.categoria_id AS "categoriaId", coalesce(c.nombre, '') AS categoria, m.origen, m.nota,
         m.usuario_id AS "usuarioId", u.nombre AS quien, m.grupo_id AS "grupoId"
  FROM ${S}.movimientos m
  JOIN ${S}.usuarios u ON u.id = m.usuario_id
  LEFT JOIN ${S}.categorias c ON c.id = m.categoria_id`;

async function soloGrupos(uid) {
  const r = await pool.query(`SELECT solo_grupos FROM ${S}.usuarios WHERE id = $1`, [uid]);
  return Boolean(r.rows[0]?.solo_grupos);
}

const SEL_CAT = `SELECT id, nombre, icono, color FROM ${S}.categorias`;

/** Todo lo que la app necesita para pintar: personal + cada grupo. */
// ── Guías por tour (lee la asignación de guías del sistema de tours) ──
const PRECIO_GUIA = Number(process.env.GASTOS_PRECIO_GUIA) || 10000;
const GUIAS_DESDE = "2026-11-01";
// Para usar dentro de un LATERAL con gr.id = grupo
const SEL_GUIAS_ESTADO = `
  SELECT sg.tour_date AS fecha,
         CASE WHEN m.id IS NOT NULL THEN 'pagado' WHEN p.no_aplica THEN 'no_aplica' ELSE 'pendiente' END AS estado
  FROM public.slot_guides sg
  LEFT JOIN ${S}.pagos_guia p ON p.slot_id = sg.id AND p.grupo_id = gr.id
  LEFT JOIN ${S}.movimientos m ON m.id = p.movimiento_id AND NOT m.eliminado
  WHERE sg.tour_date >= '${GUIAS_DESDE}'`;

async function listaGuias(grupoId, mes) {
  const q = await pool.query(
    `SELECT sg.id, to_char(sg.tour_date, 'YYYY-MM-DD') AS fecha, to_char(sg.start_time, 'HH24:MI') AS hora,
            t.name AS tour, g.name AS guia, coalesce(p.no_aplica, false) AS "noAplica",
            m.usuario_id AS "pagadoPor", m.id AS "movimientoId", m.monto::float AS monto
     FROM public.slot_guides sg
     JOIN public.tours t ON t.id = sg.tour_id
     JOIN public.guides g ON g.id = sg.guide_id
     LEFT JOIN ${S}.pagos_guia p ON p.slot_id = sg.id AND p.grupo_id = $1
     LEFT JOIN ${S}.movimientos m ON m.id = p.movimiento_id AND NOT m.eliminado
     WHERE sg.tour_date >= '${GUIAS_DESDE}' AND to_char(sg.tour_date, 'YYYY-MM') = $2
     ORDER BY sg.tour_date DESC, sg.start_time DESC`, [grupoId, mes]);
  return q.rows.map((r) => ({ ...r, pagadoPor: r.pagadoPor || null, monto: r.monto ?? PRECIO_GUIA }));
}

async function grupoConGuias(grupoId, uid) {
  if (!(await esMiembro(pool, grupoId, uid))) throw err("No eres parte de ese grupo", 403);
  const g = await pool.query(`SELECT pagos_guias FROM ${S}.grupos WHERE id = $1`, [grupoId]);
  if (!g.rows[0]?.pagos_guias) throw err("Este grupo no lleva pagos de guías", 404);
}

async function datos(uid) {
  const [usuario, usuarios, personalCats, personalMovs, grupos] = await Promise.all([
    pool.query(`SELECT id, nombre, solo_grupos AS "soloGrupos" FROM ${S}.usuarios WHERE id = $1`, [uid]),
    pool.query(`SELECT id, nombre FROM ${S}.usuarios ORDER BY nombre`),
    pool.query(`${SEL_CAT} WHERE usuario_id = $1 ORDER BY orden, nombre`, [uid]),
    pool.query(`${SEL_MOV} WHERE m.usuario_id = $1 AND m.grupo_id IS NULL AND NOT m.eliminado ORDER BY m.fecha DESC`, [uid]),
    pool.query(
      `SELECT g.id, g.nombre, g.icono, g.color, g.tour_id AS "tourId", g.creado_por AS "creadoPor", g.pagos_guias AS "pagosGuias"
       FROM ${S}.grupos g JOIN ${S}.grupo_miembros gm ON gm.grupo_id = g.id
       WHERE gm.usuario_id = $1 ORDER BY g.creado`, [uid]),
  ]);
  const ids = grupos.rows.map((g) => g.id);
  const conGuias = grupos.rows.filter((g) => g.pagosGuias).map((g) => g.id);
  const [miembros, cats, movs, guias] = ids.length ? await Promise.all([
    pool.query(`SELECT gm.grupo_id, u.id, u.nombre FROM ${S}.grupo_miembros gm JOIN ${S}.usuarios u ON u.id = gm.usuario_id WHERE gm.grupo_id = ANY($1) ORDER BY gm.unido`, [ids]),
    pool.query(`SELECT grupo_id, id, nombre, icono, color FROM ${S}.categorias WHERE grupo_id = ANY($1) ORDER BY orden, nombre`, [ids]),
    pool.query(`${SEL_MOV} WHERE m.grupo_id = ANY($1) AND NOT m.eliminado ORDER BY m.fecha DESC`, [ids]),
    conGuias.length ? pool.query(
      `SELECT gr.id AS grupo_id, count(*) FILTER (WHERE l.estado = 'pendiente')::int AS pendientes
       FROM unnest($1::uuid[]) AS gr(id) CROSS JOIN LATERAL (${SEL_GUIAS_ESTADO}) l
       WHERE l.fecha <= (now() AT TIME ZONE '${TZ}')::date GROUP BY gr.id`, [conGuias]) : { rows: [] },
  ]) : [{ rows: [] }, { rows: [] }, { rows: [] }, { rows: [] }];
  const de = (rows, gid) => rows.filter((r) => r.grupo_id === gid).map(({ grupo_id: _g, ...r }) => r); // eslint-disable-line no-unused-vars
  return {
    usuario: usuario.rows[0],
    usuarios: usuarios.rows,
    personal: { categorias: personalCats.rows, movimientos: personalMovs.rows },
    grupos: grupos.rows.map((g) => ({
      ...g,
      miembros: de(miembros.rows, g.id),
      categorias: de(cats.rows, g.id),
      movimientos: movs.rows.filter((m) => m.grupoId === g.id),
      ...(g.pagosGuias ? { guiasPendientes: guias.rows.find((r) => r.grupo_id === g.id)?.pendientes || 0 } : {}),
    })),
  };
}

async function esMiembro(db, grupoId, uid) {
  const q = await db.query(`SELECT 1 FROM ${S}.grupo_miembros WHERE grupo_id = $1 AND usuario_id = $2`, [grupoId, uid]);
  return q.rowCount > 0;
}

/** Carga un movimiento y confirma que el usuario lo puede tocar. */
async function movimientoPermitido(db, id, uid) {
  const q = await db.query(`SELECT * FROM ${S}.movimientos WHERE id = $1`, [id]);
  const m = q.rows[0];
  if (!m) throw err("Gasto no encontrado", 404);
  const ok = m.grupo_id ? await esMiembro(db, m.grupo_id, uid) : m.usuario_id === uid;
  if (!ok) throw err("No tienes acceso a ese gasto", 403);
  return m;
}

/** Confirma que la categoría pertenece al ámbito (personal del usuario o el grupo). */
async function categoriaDelAmbito(db, categoriaId, { uid, grupoId }) {
  if (!categoriaId) return null;
  const q = await db.query(`SELECT * FROM ${S}.categorias WHERE id = $1`, [categoriaId]);
  const c = q.rows[0];
  const ok = c && (grupoId ? c.grupo_id === grupoId : c.usuario_id === uid);
  if (!ok) throw err("Categoría inválida");
  return c;
}

/** Categoría de una categoría: valida que el usuario la pueda editar. */
async function categoriaPermitida(db, id, uid) {
  const q = await db.query(`SELECT * FROM ${S}.categorias WHERE id = $1`, [id]);
  const c = q.rows[0];
  if (!c) throw err("Categoría no encontrada", 404);
  const ok = c.grupo_id ? await esMiembro(db, c.grupo_id, uid) : c.usuario_id === uid;
  if (!ok) throw err("No tienes acceso a esa categoría", 403);
  return c;
}

async function enTransaccion(fn) {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const r = await fn(c);
    await c.query("COMMIT");
    return r;
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}

router.get("/datos", h(async (req, res) => res.json({ ok: true, ...(await datos(req.usuario.id)) })));

// Buscar gastos nuevos ya: le pide al Apps Script que revise el correo ahora.
router.post("/sync", h(async (req, res) => {
  let nuevos = 0;
  const url = process.env.GASTOS_SCRIPT_URL;
  if (url && process.env.GASTOS_INGEST_TOKEN) {
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "sync", token: process.env.GASTOS_INGEST_TOKEN }),
        redirect: "follow",
        signal: AbortSignal.timeout(60000),
      });
      const d = await r.json().catch(() => ({}));
      nuevos = Number(d.nuevos) || 0;
    } catch (e) {
      console.error("gastos sync script error:", e.message);
    }
  }
  res.json({ ok: true, nuevos, ...(await datos(req.usuario.id)) });
}));

// ── Movimientos ──

const nuevoMov = z.object({
  grupoId: uuid.nullish(),
  fecha: z.string().max(40).optional(),
  comercio: z.string().trim().min(1, "Escribe en qué fue el gasto").max(120),
  monto: z.number().positive("El monto debe ser mayor a 0").max(1e10),
  categoriaId: uuid.nullish(),
  nota: z.string().max(300).nullish(),
});

router.post("/movimientos", h(async (req, res) => {
  const b = validar(nuevoMov, req.body);
  const uid = req.usuario.id;
  if (b.grupoId && !(await esMiembro(pool, b.grupoId, uid))) throw err("No eres parte de ese grupo", 403);
  if (!b.grupoId && (await soloGrupos(uid))) throw err("Tu cuenta solo maneja gastos de grupos", 403);
  await categoriaDelAmbito(pool, b.categoriaId, { uid, grupoId: b.grupoId || null });
  const fecha = b.fecha ? new Date(b.fecha) : new Date();
  if (isNaN(fecha)) throw err("Fecha inválida");
  await pool.query(
    `INSERT INTO ${S}.movimientos (usuario_id, grupo_id, origen, fecha, tipo, comercio, monto, moneda, monto_original, categoria_id, manual, nota)
     VALUES ($1, $2, 'manual', $3, 'Manual', $4, $5, 'CRC', $5, $6, true, $7)`,
    [uid, b.grupoId || null, fecha, b.comercio, b.monto, b.categoriaId || null, b.nota || null]
  );
  res.json({ ok: true, ...(await datos(uid)) });
}));

// Cambiar categoría: también aprende la regla para ese comercio en ese ámbito.
router.patch("/movimientos/:id/categoria", h(async (req, res) => {
  const id = validar(uuid, req.params.id);
  const { categoriaId } = validar(z.object({ categoriaId: uuid }), req.body);
  const uid = req.usuario.id;
  const actualizados = await enTransaccion(async (db) => {
    const m = await movimientoPermitido(db, id, uid);
    const ambito = { uid: m.usuario_id, grupoId: m.grupo_id };
    if (m.grupo_id) ambito.uid = uid;
    await categoriaDelAmbito(db, categoriaId, ambito);
    await db.query(`UPDATE ${S}.movimientos SET categoria_id = $2, manual = true WHERE id = $1`, [id, categoriaId]);
    const clave = claveDe(m);
    if (!clave) return 1;
    const dueño = m.grupo_id ? { col: "grupo_id", val: m.grupo_id } : { col: "usuario_id", val: m.usuario_id };
    await db.query(
      `INSERT INTO ${S}.reglas (${dueño.col}, clave, categoria_id) VALUES ($1, $2, $3)
       ON CONFLICT (coalesce(usuario_id, grupo_id), clave) DO UPDATE SET categoria_id = excluded.categoria_id`,
      [dueño.val, clave, categoriaId]
    );
    // Aplica a los demás gastos del mismo comercio que nadie clasificó a mano
    const otros = await db.query(
      `SELECT id, comercio, tipo FROM ${S}.movimientos
       WHERE id <> $1 AND NOT manual AND NOT eliminado AND ${m.grupo_id ? "grupo_id = $2" : "usuario_id = $2 AND grupo_id IS NULL"}
         AND categoria_id IS DISTINCT FROM $3`,
      [id, dueño.val, categoriaId]
    );
    const mismos = otros.rows.filter((o) => claveDe(o) === clave).map((o) => o.id);
    if (mismos.length) await db.query(`UPDATE ${S}.movimientos SET categoria_id = $2 WHERE id = ANY($1)`, [mismos, categoriaId]);
    return 1 + mismos.length;
  });
  res.json({ ok: true, actualizados, ...(await datos(uid)) });
}));

// Mandar un gasto a un grupo (o devolverlo a personal con grupoId = null).
router.post("/movimientos/:id/mover", h(async (req, res) => {
  const id = validar(uuid, req.params.id);
  const { grupoId } = validar(z.object({ grupoId: uuid.nullable() }), req.body);
  const uid = req.usuario.id;
  const m = await movimientoPermitido(pool, id, uid);
  if (m.usuario_id !== uid) throw err("Solo quien hizo el gasto lo puede mover", 403);
  if (grupoId && !(await esMiembro(pool, grupoId, uid))) throw err("No eres parte de ese grupo", 403);
  if (!grupoId && (await soloGrupos(uid))) throw err("Tu cuenta solo maneja gastos de grupos", 403);
  const categoriaId = await categorizar(pool, { usuarioId: uid, grupoId }, m.texto_categoria || m.comercio);
  await pool.query(`UPDATE ${S}.movimientos SET grupo_id = $2, categoria_id = $3, manual = false WHERE id = $1`, [id, grupoId, categoriaId]);
  res.json({ ok: true, ...(await datos(uid)) });
}));

router.delete("/movimientos/:id", h(async (req, res) => {
  const id = validar(uuid, req.params.id);
  await movimientoPermitido(pool, id, req.usuario.id);
  await pool.query(`UPDATE ${S}.movimientos SET eliminado = true WHERE id = $1`, [id]);
  res.json({ ok: true, ...(await datos(req.usuario.id)) });
}));

router.post("/movimientos/:id/restaurar", h(async (req, res) => {
  const id = validar(uuid, req.params.id);
  await movimientoPermitido(pool, id, req.usuario.id);
  await pool.query(`UPDATE ${S}.movimientos SET eliminado = false WHERE id = $1`, [id]);
  res.json({ ok: true, ...(await datos(req.usuario.id)) });
}));

// ── Categorías ──

router.post("/categorias", h(async (req, res) => {
  const b = validar(z.object({ grupoId: uuid.nullish(), nombre: nombreCat, icono, color }), req.body);
  const uid = req.usuario.id;
  if (b.grupoId && !(await esMiembro(pool, b.grupoId, uid))) throw err("No eres parte de ese grupo", 403);
  const cuenta = await pool.query(`SELECT count(*)::int AS n FROM ${S}.categorias WHERE ${b.grupoId ? "grupo_id" : "usuario_id"} = $1`, [b.grupoId || uid]);
  if (cuenta.rows[0].n >= 30) throw err("Máximo 30 categorías");
  try {
    await pool.query(
      `INSERT INTO ${S}.categorias (usuario_id, grupo_id, nombre, icono, color, orden) VALUES ($1, $2, $3, $4, $5, $6)`,
      [b.grupoId ? null : uid, b.grupoId || null, b.nombre, b.icono, b.color.toUpperCase(), cuenta.rows[0].n]
    );
  } catch (e) {
    if (e.code === "23505") throw err("Ya existe una categoría con ese nombre");
    throw e;
  }
  res.json({ ok: true, ...(await datos(uid)) });
}));

router.patch("/categorias/:id", h(async (req, res) => {
  const id = validar(uuid, req.params.id);
  const b = validar(z.object({ nombre: nombreCat, icono, color }), req.body);
  await categoriaPermitida(pool, id, req.usuario.id);
  try {
    await pool.query(`UPDATE ${S}.categorias SET nombre = $2, icono = $3, color = $4 WHERE id = $1`, [id, b.nombre, b.icono, b.color.toUpperCase()]);
  } catch (e) {
    if (e.code === "23505") throw err("Ya existe una categoría con ese nombre");
    throw e;
  }
  res.json({ ok: true, ...(await datos(req.usuario.id)) });
}));

// Borrar: sus gastos quedan "por clasificar" (las reglas se borran solas).
router.delete("/categorias/:id", h(async (req, res) => {
  const id = validar(uuid, req.params.id);
  const c = await categoriaPermitida(pool, id, req.usuario.id);
  const quedan = await pool.query(`SELECT count(*)::int AS n FROM ${S}.categorias WHERE ${c.grupo_id ? "grupo_id" : "usuario_id"} = $1`, [c.grupo_id || c.usuario_id]);
  if (quedan.rows[0].n <= 1) throw err("Debe quedar al menos una categoría");
  const movidos = await enTransaccion(async (db) => {
    const r = await db.query(`UPDATE ${S}.movimientos SET categoria_id = NULL, manual = false WHERE categoria_id = $1 AND NOT eliminado`, [id]);
    await db.query(`DELETE FROM ${S}.categorias WHERE id = $1`, [id]);
    return r.rowCount;
  });
  res.json({ ok: true, movidos, ...(await datos(req.usuario.id)) });
}));

// ── Guías por tour ──

const mesValido = z.string().regex(/^\d{4}-\d{2}$/, "Mes inválido");

router.get("/grupos/:id/guias", h(async (req, res) => {
  const grupoId = validar(uuid, req.params.id);
  const mes = validar(mesValido, req.query.mes);
  await grupoConGuias(grupoId, req.usuario.id);
  res.json({ ok: true, precio: PRECIO_GUIA, guias: await listaGuias(grupoId, mes) });
}));

// Marca quién pagó el guía de un tour (o que no aplica / pendiente).
// Pagado = un gasto del grupo en "Guías" a nombre de quien pagó.
router.put("/grupos/:id/guias/:slotId", h(async (req, res) => {
  const grupoId = validar(uuid, req.params.id);
  const slotId = validar(uuid, req.params.slotId);
  const b = validar(z.object({ pagadoPor: uuid.nullable(), noAplica: z.boolean().optional(), mes: mesValido }), req.body);
  const uid = req.usuario.id;
  await grupoConGuias(grupoId, uid);
  if (b.pagadoPor && !(await esMiembro(pool, grupoId, b.pagadoPor))) throw err("Esa persona no es del grupo");
  const ref = "guia:" + slotId;

  await enTransaccion(async (db) => {
    const s = await db.query(
      `SELECT sg.id, sg.tour_date, to_char(sg.tour_date, 'YYYY-MM-DD') AS fecha, to_char(sg.start_time, 'HH24:MI') AS hora,
              t.name AS tour, g.name AS guia
       FROM public.slot_guides sg JOIN public.tours t ON t.id = sg.tour_id JOIN public.guides g ON g.id = sg.guide_id
       WHERE sg.id = $1 AND sg.tour_date >= '${GUIAS_DESDE}'`, [slotId]);
    const slot = s.rows[0];
    if (!slot) throw err("Ese tour ya no tiene ese guía asignado", 404);
    await db.query(`SELECT 1 FROM ${S}.grupos WHERE id = $1 FOR UPDATE`, [grupoId]); // serializa cambios del grupo
    const prev = await db.query(
      `SELECT m.id FROM ${S}.pagos_guia p JOIN ${S}.movimientos m ON m.id = p.movimiento_id AND NOT m.eliminado
       WHERE p.grupo_id = $1 AND p.slot_id = $2`, [grupoId, slotId]);
    let movId = prev.rows[0]?.id || null;

    if (b.pagadoPor) {
      if (movId) {
        await db.query(`UPDATE ${S}.movimientos SET usuario_id = $2 WHERE id = $1`, [movId, b.pagadoPor]);
      } else {
        // Limpia gastos de guía eliminados de este tour para no chocar con la referencia única
        await db.query(`DELETE FROM ${S}.movimientos WHERE grupo_id = $1 AND ref_externa = $2 AND eliminado`, [grupoId, ref]);
        const cat = await db.query(
          `SELECT id FROM ${S}.categorias WHERE grupo_id = $1 AND lower(nombre) IN ('guías', 'guias', 'guía', 'guia') LIMIT 1`, [grupoId]);
        const ins = await db.query(
          `INSERT INTO ${S}.movimientos (usuario_id, grupo_id, origen, ref_externa, fecha, tipo, comercio, monto, moneda, monto_original, categoria_id, manual)
           VALUES ($1, $2, 'manual', $3, ($4::date + $5::time) AT TIME ZONE '${TZ}', 'Guía', $6, $7, 'CRC', $7, $8, true)
           RETURNING id`,
          [b.pagadoPor, grupoId, ref, slot.fecha, slot.hora, `Guía ${slot.guia} · ${slot.tour} ${slot.hora}`, PRECIO_GUIA, cat.rows[0]?.id || null]);
        movId = ins.rows[0].id;
      }
    } else {
      if (movId) await db.query(`DELETE FROM ${S}.movimientos WHERE id = $1`, [movId]);
      movId = null;
    }
    await db.query(
      `INSERT INTO ${S}.pagos_guia (slot_id, grupo_id, movimiento_id, no_aplica, actualizado_por)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (grupo_id, slot_id) DO UPDATE SET movimiento_id = $3, no_aplica = $4, actualizado_por = $5, actualizado = now()`,
      [slotId, grupoId, movId, !b.pagadoPor && Boolean(b.noAplica), uid]);
  });
  res.json({ ok: true, precio: PRECIO_GUIA, guias: await listaGuias(grupoId, b.mes), ...(await datos(uid)) });
}));

// ── Grupos ──

router.post("/grupos", h(async (req, res) => {
  const b = validar(z.object({
    nombre: z.string().trim().min(1, "Escribe un nombre").max(40),
    icono: icono.optional(), color: color.optional(),
    miembros: z.array(uuid).max(20).optional(),
  }), req.body);
  const uid = req.usuario.id;
  if (await soloGrupos(uid)) throw err("Tu cuenta no puede crear grupos", 403);
  await enTransaccion(async (db) => {
    const g = await db.query(
      `INSERT INTO ${S}.grupos (nombre, icono, color, creado_por) VALUES ($1, $2, $3, $4) RETURNING id`,
      [b.nombre, b.icono || "Users", (b.color || "#8FB573").toUpperCase(), uid]
    );
    const gid = g.rows[0].id;
    const miembros = [...new Set([uid, ...(b.miembros || [])])];
    await db.query(
      `INSERT INTO ${S}.grupo_miembros (grupo_id, usuario_id) SELECT $1, id FROM ${S}.usuarios WHERE id = ANY($2) ON CONFLICT DO NOTHING`,
      [gid, miembros]
    );
    await sembrarCategorias(db, { grupoId: gid });
  });
  res.json({ ok: true, ...(await datos(uid)) });
}));

router.patch("/grupos/:id", h(async (req, res) => {
  const id = validar(uuid, req.params.id);
  const b = validar(z.object({ nombre: z.string().trim().min(1).max(40), icono, color, miembros: z.array(uuid).max(20).optional() }), req.body);
  const uid = req.usuario.id;
  if (!(await esMiembro(pool, id, uid))) throw err("No eres parte de ese grupo", 403);
  await enTransaccion(async (db) => {
    await db.query(`UPDATE ${S}.grupos SET nombre = $2, icono = $3, color = $4 WHERE id = $1`, [id, b.nombre, b.icono, b.color.toUpperCase()]);
    if (b.miembros) {
      // Se pueden agregar miembros; uno mismo no se puede sacar por aquí
      await db.query(
        `INSERT INTO ${S}.grupo_miembros (grupo_id, usuario_id) SELECT $1, id FROM ${S}.usuarios WHERE id = ANY($2) ON CONFLICT DO NOTHING`,
        [id, b.miembros]
      );
      await db.query(`DELETE FROM ${S}.grupo_miembros WHERE grupo_id = $1 AND usuario_id <> $2 AND NOT (usuario_id = ANY($3))`, [id, uid, b.miembros]);
    }
  });
  res.json({ ok: true, ...(await datos(uid)) });
}));

// ── Notificaciones ──

router.get("/push/clave", h(async (_req, res) => {
  const key = await getVapidPublicKey();
  if (!key) throw err("Las notificaciones no están configuradas", 503);
  res.json({ ok: true, publicKey: key });
}));

router.post("/push/suscribir", h(async (req, res) => {
  const s = validar(z.object({
    endpoint: z.string().url().max(1000),
    keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(8).max(100) }),
  }), req.body?.subscription);
  await pool.query(
    `INSERT INTO ${S}.push (usuario_id, endpoint, p256dh, auth, user_agent) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (endpoint) DO UPDATE SET usuario_id = excluded.usuario_id, p256dh = excluded.p256dh, auth = excluded.auth, user_agent = excluded.user_agent`,
    [req.usuario.id, s.endpoint, s.keys.p256dh, s.keys.auth, String(req.headers["user-agent"] || "").slice(0, 300)]
  );
  res.json({ ok: true });
}));

router.post("/push/desuscribir", h(async (req, res) => {
  await pool.query(`DELETE FROM ${S}.push WHERE endpoint = $1 AND usuario_id = $2`, [String(req.body?.endpoint || ""), req.usuario.id]);
  res.json({ ok: true });
}));

// Errores → { ok:false, error }
router.use((e, _req, res, _next) => { // eslint-disable-line no-unused-vars
  if (!e.status || e.status >= 500) console.error("gastos error:", e);
  res.status(e.status || 500).json({ ok: false, error: e.status ? e.message : "Error del servidor" });
});

export default router;
