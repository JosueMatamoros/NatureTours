// API de Mis Gastos: /api/gastos/*
import { Router } from "express";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import { z } from "zod";
import { pool } from "../db.js";
import { getVapidPublicKey } from "../utils/push.js";
import { revenueBetween } from "../utils/revenue.js";
import { login, requiereUsuario } from "./auth.js";
import { categorizar, claveDe, normalizar } from "./categorizar.js";
import { S, ZONAS, sembrarCategorias } from "./esquema.js";
import { recordarZona, zonaDeComercio, zonaDePunto } from "./zonas.js";
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
const CAJA = "caja"; // "quién pagó" = la empresa (caja chica)
const pagador = z.union([uuid, z.literal(CAJA)]);
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

// Ya no se crean cuentas desde la app: las crea el administrador con
// scripts/gastos-usuario.mjs. Los códigos de activación viejos dejan de servir.
router.post("/activar", limiteAcceso, (req, res) => {
  res.status(410).json({ ok: false, error: "Las cuentas las crea el administrador. Pídele tu acceso." });
});

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
    if (r.rowCount && !g.eliminado) { // zona según dónde queda el comercio
      const zona = await zonaDeComercio(pool, usuarioId, g.comercio);
      if (zona) await pool.query(`UPDATE ${S}.movimientos SET zona = $2 WHERE id = $1`, [r.rows[0].id, zona]);
    }
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
         m.usuario_id AS "usuarioId", CASE WHEN m.caja THEN 'Caja chica' ELSE u.nombre END AS quien,
         m.caja, m.grupo_id AS "grupoId", m.zona,
         (SELECT coalesce(json_agg(json_build_object('id', k.id, 'persona', k.persona, 'monto', k.monto::float, 'pagado', k.pagado) ORDER BY k.creado), '[]')
          FROM ${S}.cobros k WHERE k.movimiento_id = m.id) AS cobros
  FROM ${S}.movimientos m
  JOIN ${S}.usuarios u ON u.id = m.usuario_id
  LEFT JOIN ${S}.categorias c ON c.id = m.categoria_id`;

async function soloGrupos(uid) {
  const r = await pool.query(`SELECT solo_grupos FROM ${S}.usuarios WHERE id = $1`, [uid]);
  return Boolean(r.rows[0]?.solo_grupos);
}

// Ingresos del negocio: el dueño (cuenta completa) o quien tenga ver_ingresos.
async function puedeVerIngresos(uid) {
  const r = await pool.query(`SELECT solo_grupos, ver_ingresos FROM ${S}.usuarios WHERE id = $1`, [uid]);
  const u = r.rows[0];
  return Boolean(u && (!u.solo_grupos || u.ver_ingresos));
}

const SEL_CAT = `SELECT id, nombre, icono, color, clave FROM ${S}.categorias`;

/** Todo lo que la app necesita para pintar: personal + cada grupo. */
// ── Guías por tour (lee la asignación de guías del sistema de tours) ──
const PRECIO_GUIA = Number(process.env.GASTOS_PRECIO_GUIA) || 10000;
const GUIAS_DESDE = "2026-11-01";
// Para usar dentro de un LATERAL con gr.id = grupo
const SEL_GUIAS_ESTADO = `
  SELECT sg.tour_date AS fecha, (sg.tour_date + sg.start_time) AS inicio,
         CASE WHEN m.id IS NOT NULL THEN 'pagado' WHEN p.no_aplica THEN 'no_aplica' ELSE 'pendiente' END AS estado
  FROM public.slot_guides sg
  LEFT JOIN ${S}.pagos_guia p ON p.slot_id = sg.id AND p.grupo_id = gr.id
  LEFT JOIN ${S}.movimientos m ON m.id = p.movimiento_id AND NOT m.eliminado
  WHERE sg.tour_date >= '${GUIAS_DESDE}'`;

/**
 * Si en el sistema de tours cambian el guía de un turno (quitan a uno y ponen a otro),
 * el pago ya marcado pasa al guía que quedó. Así cuenta siempre la asignación final del día.
 */
async function reconciliarGuias(grupoId) {
  const huerfanos = await pool.query(
    `SELECT p.slot_id, p.tour_id, p.tour_date::text AS tour_date, p.start_time::text AS start_time, p.movimiento_id FROM ${S}.pagos_guia p
     WHERE p.grupo_id = $1 AND p.tour_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM public.slot_guides sg WHERE sg.id = p.slot_id)`, [grupoId]);
  for (const h of huerfanos.rows) {
    const c = await pool.query(
      `SELECT sg.id, g.name AS guia, t.name AS tour, to_char(sg.start_time, 'HH24:MI') AS hora
       FROM public.slot_guides sg JOIN public.guides g ON g.id = sg.guide_id JOIN public.tours t ON t.id = sg.tour_id
       WHERE sg.tour_id = $1 AND sg.tour_date = $2::date AND sg.start_time = $3::time
         AND NOT EXISTS (SELECT 1 FROM ${S}.pagos_guia p WHERE p.grupo_id = $4 AND p.slot_id = sg.id)
       ORDER BY sg.created_at LIMIT 1`, [h.tour_id, h.tour_date, h.start_time, grupoId]);
    const nuevo = c.rows[0];
    if (!nuevo) continue; // el turno quedó sin guía: el gasto se deja como está
    await enTransaccion(async (db) => {
      await db.query(`UPDATE ${S}.pagos_guia SET slot_id = $3, actualizado = now() WHERE grupo_id = $1 AND slot_id = $2`, [grupoId, h.slot_id, nuevo.id]);
      if (h.movimiento_id) {
        await db.query(
          `UPDATE ${S}.movimientos SET ref_externa = $2,
             comercio = CASE WHEN comercio LIKE 'Guía %' THEN $3 ELSE comercio END WHERE id = $1`,
          [h.movimiento_id, "guia:" + nuevo.id, `Guía ${nuevo.guia} · ${nuevo.tour} ${nuevo.hora}`]);
      }
    }).catch((e) => console.error("Mis Gastos: no se pudo pasar el pago de guía", e.message));
  }
}

// Con mes: todos los de ese mes. Sin mes: los que faltan por pagar de tours que ya empezaron (los más viejos primero).
async function listaGuias(grupoId, mes = null) {
  const filtro = mes
    ? `to_char(sg.tour_date, 'YYYY-MM') = $2 ORDER BY sg.tour_date DESC, sg.start_time DESC`
    : `m.id IS NULL AND NOT coalesce(p.no_aplica, false) AND (sg.tour_date + sg.start_time) <= (now() AT TIME ZONE '${TZ}')
       ORDER BY sg.tour_date, sg.start_time`;
  const q = await pool.query(
    `SELECT sg.id, to_char(sg.tour_date, 'YYYY-MM-DD') AS fecha, to_char(sg.start_time, 'HH24:MI') AS hora,
            t.name AS tour, g.name AS guia, coalesce(p.no_aplica, false) AS "noAplica",
            CASE WHEN m.caja THEN '${CAJA}' ELSE m.usuario_id::text END AS "pagadoPor", m.id AS "movimientoId", m.monto::float AS monto
     FROM public.slot_guides sg
     JOIN public.tours t ON t.id = sg.tour_id
     JOIN public.guides g ON g.id = sg.guide_id
     LEFT JOIN ${S}.pagos_guia p ON p.slot_id = sg.id AND p.grupo_id = $1
     LEFT JOIN ${S}.movimientos m ON m.id = p.movimiento_id AND NOT m.eliminado
     WHERE sg.tour_date >= '${GUIAS_DESDE}' AND ${filtro}`, mes ? [grupoId, mes] : [grupoId]);
  return q.rows.map((r) => ({ ...r, pagadoPor: r.pagadoPor || null, monto: r.monto ?? PRECIO_GUIA }));
}

async function grupoConGuias(grupoId, uid) {
  if (!(await esMiembro(pool, grupoId, uid))) throw err("No eres parte de ese grupo", 403);
  const g = await pool.query(`SELECT pagos_guias FROM ${S}.grupos WHERE id = $1`, [grupoId]);
  if (!g.rows[0]?.pagos_guias) throw err("Este grupo no lleva pagos de guías", 404);
}

async function datos(uid) {
  const [usuario, usuarios, personalCats, personalMovs, grupos] = await Promise.all([
    pool.query(`SELECT id, nombre, solo_grupos AS "soloGrupos", ver_ingresos AS "verIngresos" FROM ${S}.usuarios WHERE id = $1`, [uid]),
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
  for (const gid of conGuias) await reconciliarGuias(gid);
  const [miembros, cats, movs, guias] = ids.length ? await Promise.all([
    pool.query(`SELECT gm.grupo_id, u.id, u.nombre FROM ${S}.grupo_miembros gm JOIN ${S}.usuarios u ON u.id = gm.usuario_id WHERE gm.grupo_id = ANY($1) ORDER BY gm.unido`, [ids]),
    pool.query(`SELECT grupo_id, id, nombre, icono, color FROM ${S}.categorias WHERE grupo_id = ANY($1) ORDER BY orden, nombre`, [ids]),
    pool.query(`${SEL_MOV} WHERE m.grupo_id = ANY($1) AND NOT m.eliminado ORDER BY m.fecha DESC`, [ids]),
    conGuias.length ? pool.query(
      `SELECT gr.id AS grupo_id, count(*) FILTER (WHERE l.estado = 'pendiente')::int AS pendientes
       FROM unnest($1::uuid[]) AS gr(id) CROSS JOIN LATERAL (${SEL_GUIAS_ESTADO}) l
       WHERE l.inicio <= (now() AT TIME ZONE '${TZ}') GROUP BY gr.id`, [conGuias]) : { rows: [] },
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
      // Ingresos del negocio: el dueño o las cuentas "solo grupos" con ver_ingresos
      ...(g.pagosGuias && (!usuario.rows[0]?.soloGrupos || usuario.rows[0]?.verIngresos) ? { verIngresos: true } : {}),
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
  pagadoPor: pagador.optional(), // solo en grupos: otra persona del grupo o la caja chica
  moneda: z.enum(["CRC", "USD"]).optional(), // en dólares se guarda el original y se convierte a colones
  lat: z.number().min(-90).max(90).optional(), // dónde estaba el teléfono al anotarlo (para la zona)
  lng: z.number().min(-180).max(180).optional(),
});

/** Monto en colones: si fue en dólares, al tipo de cambio del mes del gasto. */
async function enColones(monto, moneda, fecha) {
  if (moneda !== "USD") return { monto, moneda: "CRC", original: monto };
  const mesActual = (await pool.query(`SELECT to_char(now() AT TIME ZONE '${TZ}', 'YYYY-MM') AS mes`)).rows[0].mes;
  const mes = (await pool.query(`SELECT to_char($1::timestamptz AT TIME ZONE '${TZ}', 'YYYY-MM') AS mes`, [fecha])).rows[0].mes;
  const tc = await tipoCambioDelMes(mes, mesActual);
  return { monto: Math.round(monto * tc.valor * 100) / 100, moneda: "USD", original: monto };
}

router.post("/movimientos", h(async (req, res) => {
  const b = validar(nuevoMov, req.body);
  const uid = req.usuario.id;
  if (b.grupoId && !(await esMiembro(pool, b.grupoId, uid))) throw err("No eres parte de ese grupo", 403);
  if (!b.grupoId && (await soloGrupos(uid))) throw err("Tu cuenta solo maneja gastos de grupos", 403);
  await categoriaDelAmbito(pool, b.categoriaId, { uid, grupoId: b.grupoId || null });
  const fecha = b.fecha ? new Date(b.fecha) : new Date();
  if (isNaN(fecha)) throw err("Fecha inválida");
  const caja = Boolean(b.grupoId) && b.pagadoPor === CAJA;
  let dueño = uid;
  if (b.grupoId && b.pagadoPor && !caja) {
    if (!(await esMiembro(pool, b.grupoId, b.pagadoPor))) throw err("Esa persona no es del grupo");
    dueño = b.pagadoPor;
  }
  const c = await enColones(b.monto, b.moneda, fecha);
  await pool.query(
    `INSERT INTO ${S}.movimientos (usuario_id, grupo_id, origen, fecha, tipo, comercio, monto, moneda, monto_original, categoria_id, manual, nota, caja, zona)
     VALUES ($1, $2, 'manual', $3, 'Manual', $4, $5, $9, $10, $6, true, $7, $8, $11)`,
    [dueño, b.grupoId || null, fecha, b.comercio, c.monto, b.categoriaId || null, b.nota || null, caja, c.moneda, c.original,
      !b.grupoId && b.lat != null && b.lng != null ? zonaDePunto({ lat: b.lat, lng: b.lng }) : null]
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
// Editar un gasto agregado a mano (incluye pagos de guías): descripción, monto y, en grupos, quién pagó
router.patch("/movimientos/:id", h(async (req, res) => {
  const id = validar(uuid, req.params.id);
  const b = validar(z.object({
    comercio: nuevoMov.shape.comercio.optional(),
    monto: nuevoMov.shape.monto.optional(),
    pagadoPor: pagador.optional(),
    moneda: nuevoMov.shape.moneda,
  }), req.body);
  const m = await movimientoPermitido(pool, id, req.usuario.id);
  if (m.origen !== "manual") throw err("Los gastos que vienen del banco no se pueden editar");
  // Monto y/o moneda: el monto viene en la moneda elegida; sin monto se reusa el original.
  let c = null;
  if (b.monto !== undefined || b.moneda !== undefined) {
    const moneda = b.moneda ?? m.moneda;
    const monto = b.monto ?? Number(m.monto_original ?? m.monto);
    c = await enColones(monto, moneda, m.fecha);
  }
  const caja = b.pagadoPor === undefined ? null : b.pagadoPor === CAJA;
  const persona = b.pagadoPor && !caja ? b.pagadoPor : null;
  if (b.pagadoPor && !m.grupo_id) throw err("Solo en gastos de grupo se puede cambiar quién pagó");
  if (persona && persona !== m.usuario_id && !(await esMiembro(pool, m.grupo_id, persona))) throw err("Esa persona no es del grupo");
  await enTransaccion(async (db) => {
    if (persona && m.ref_externa) // evita chocar con un gasto eliminado de la misma referencia
      await db.query(`DELETE FROM ${S}.movimientos WHERE usuario_id = $1 AND ref_externa = $2 AND eliminado AND id <> $3`, [persona, m.ref_externa, id]);
    await db.query(
      `UPDATE ${S}.movimientos SET comercio = coalesce($2, comercio), monto = coalesce($3, monto),
         monto_original = coalesce($6, monto_original), moneda = coalesce($7, moneda),
         usuario_id = coalesce($4, usuario_id), caja = coalesce($5, caja) WHERE id = $1`,
      [id, b.comercio ?? null, c?.monto ?? null, persona, caja, c?.original ?? null, c?.moneda ?? null]);
  });
  res.json({ ok: true, ...(await datos(req.usuario.id)) });
}));

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

// ── Zona y "me deben" (gastos personales) ──

// Zona a mano: queda recordada para ese comercio (próximos gastos) y se pone en los que no tienen zona.
router.patch("/movimientos/:id/zona", h(async (req, res) => {
  const id = validar(uuid, req.params.id);
  const { zona } = validar(z.object({ zona: z.enum(ZONAS).nullable() }), req.body);
  const m = await movimientoPermitido(pool, id, req.usuario.id);
  await pool.query(`UPDATE ${S}.movimientos SET zona = $2 WHERE id = $1`, [id, zona]);
  if (zona && zona !== "viaje" && m.origen === "correo") {
    await recordarZona(pool, m.usuario_id, m.comercio, zona);
    await pool.query(
      `UPDATE ${S}.movimientos SET zona = $3 WHERE usuario_id = $1 AND comercio = $2 AND zona IS NULL AND NOT eliminado`,
      [m.usuario_id, m.comercio, zona]);
  }
  res.json({ ok: true, ...(await datos(req.usuario.id)) });
}));

const cobroBody = z.object({
  cobros: z.array(z.object({ persona: z.string().trim().min(1).max(40), monto: z.number().positive().max(100000000) })).min(1).max(30),
});

router.post("/movimientos/:id/cobros", h(async (req, res) => {
  const id = validar(uuid, req.params.id);
  const b = validar(cobroBody, req.body);
  const m = await movimientoPermitido(pool, id, req.usuario.id);
  const ya = await pool.query(`SELECT coalesce(sum(monto), 0)::float AS t FROM ${S}.cobros WHERE movimiento_id = $1`, [id]);
  const nuevo = b.cobros.reduce((s, k) => s + k.monto, 0);
  if (ya.rows[0].t + nuevo > Number(m.monto) + 1) throw err("Lo que te deben no puede pasar del total del gasto");
  await enTransaccion(async (db) => {
    for (const k of b.cobros) {
      await db.query(`INSERT INTO ${S}.cobros (movimiento_id, persona, monto) VALUES ($1, $2, $3)`, [id, k.persona, k.monto]);
    }
  });
  res.json({ ok: true, ...(await datos(req.usuario.id)) });
}));

async function cobroPermitido(id, uid) {
  const q = await pool.query(`SELECT movimiento_id FROM ${S}.cobros WHERE id = $1`, [id]);
  if (!q.rowCount) throw err("No se encontró", 404);
  await movimientoPermitido(pool, q.rows[0].movimiento_id, uid);
}

// Marcar pagado / no pagado. Con ids varios a la vez ("ya me pagó todo").
router.post("/cobros/pagar", h(async (req, res) => {
  const { ids, pagado } = validar(z.object({ ids: z.array(uuid).min(1).max(200), pagado: z.boolean() }), req.body);
  for (const id of ids) await cobroPermitido(id, req.usuario.id);
  await pool.query(
    `UPDATE ${S}.cobros SET pagado = $2, pagado_en = CASE WHEN $2 THEN now() END WHERE id = ANY($1)`, [ids, pagado]);
  res.json({ ok: true, ...(await datos(req.usuario.id)) });
}));

router.delete("/cobros/:id", h(async (req, res) => {
  const id = validar(uuid, req.params.id);
  await cobroPermitido(id, req.usuario.id);
  await pool.query(`DELETE FROM ${S}.cobros WHERE id = $1`, [id]);
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
  const mes = req.query.mes ? validar(mesValido, req.query.mes) : null;
  await grupoConGuias(grupoId, req.usuario.id);
  await reconciliarGuias(grupoId);
  res.json({ ok: true, precio: PRECIO_GUIA, guias: await listaGuias(grupoId, mes) });
}));

// Ingresos del mes según las reservas (mismo cálculo que Finanzas del panel), en
// colones al tipo de cambio de compra del BCCR. El del mes en curso se guarda
// cada vez que se consulta; al pasar el mes queda fijo el último guardado.
const TC_RESPALDO = Number(process.env.GASTOS_TIPO_CAMBIO) || 505;
let tcCache = null; // { valor, fecha, hasta }
async function tipoCambioBCCR() {
  if (tcCache && tcCache.hasta > Date.now()) return tcCache;
  try {
    const r = await fetch("https://api.hacienda.go.cr/indicadores/tc/dolar", { signal: AbortSignal.timeout(6000) });
    const j = await r.json();
    const valor = Number(j?.compra?.valor);
    if (!r.ok || !(valor > 100)) throw new Error("respuesta inválida");
    tcCache = { valor, fecha: j.compra.fecha, hasta: Date.now() + 60 * 60 * 1000 };
    return tcCache;
  } catch (e) {
    console.error("Mis Gastos: no se pudo traer el tipo de cambio del BCCR:", e.message);
    return null;
  }
}

async function tipoCambioDelMes(mes, mesActual) {
  const guardado = async () => (await pool.query(
    `SELECT valor::float AS valor, to_char(fecha, 'YYYY-MM-DD') AS fecha FROM ${S}.tipo_cambio WHERE mes = $1`, [mes])).rows[0];
  if (mes < mesActual) {
    const g = await guardado();
    if (g) return { ...g, cerrado: true };
  }
  const hoy = await tipoCambioBCCR();
  if (hoy) {
    if (mes === mesActual) {
      await pool.query(
        `INSERT INTO ${S}.tipo_cambio (mes, valor, fecha) VALUES ($1, $2, $3::date)
         ON CONFLICT (mes) DO UPDATE SET valor = EXCLUDED.valor, fecha = EXCLUDED.fecha, actualizado = now()`,
        [mes, hoy.valor, hoy.fecha]);
    }
    return { valor: hoy.valor, fecha: hoy.fecha, cerrado: false };
  }
  // Sin conexión con el BCCR: el último guardado, o el de respaldo.
  const ult = (await pool.query(
    `SELECT valor::float AS valor, to_char(fecha, 'YYYY-MM-DD') AS fecha FROM ${S}.tipo_cambio ORDER BY fecha DESC LIMIT 1`)).rows[0];
  return ult ? { ...ult, cerrado: false } : { valor: TC_RESPALDO, fecha: null, cerrado: false };
}

router.get("/grupos/:id/ingresos", h(async (req, res) => {
  const grupoId = validar(uuid, req.params.id);
  const mes = validar(mesValido, req.query.mes);
  await grupoConGuias(grupoId, req.usuario.id);
  if (!(await puedeVerIngresos(req.usuario.id))) throw err("No tienes acceso a los ingresos", 403);
  const [y, m] = mes.split("-").map(Number);
  const desde = `${mes}-01`;
  const hasta = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const f = (await pool.query(
    `SELECT to_char(now() AT TIME ZONE '${TZ}', 'YYYY-MM') AS mes`)).rows[0];
  // Mes completo (incluye tours ya reservados que aún no pasan), igual que Finanzas.
  const [ing, tc] = await Promise.all([revenueBetween(desde, hasta), tipoCambioDelMes(mes, f.mes)]);
  res.json({
    ok: true, mes, usd: ing.total, crc: Math.round(ing.total * tc.valor),
    tipoCambio: tc.valor, fechaTipoCambio: tc.fecha, cerrado: tc.cerrado,
  });
}));

// Marca quién pagó el guía de un tour (o que no aplica / pendiente).
// Pagado = un gasto del grupo en "Guías" a nombre de quien pagó.
router.put("/grupos/:id/guias/:slotId", h(async (req, res) => {
  const grupoId = validar(uuid, req.params.id);
  const slotId = validar(uuid, req.params.slotId);
  const b = validar(z.object({ pagadoPor: pagador.nullable(), noAplica: z.boolean().optional(), mes: mesValido.optional() }), req.body);
  const uid = req.usuario.id;
  await grupoConGuias(grupoId, uid);
  const caja = b.pagadoPor === CAJA;
  const persona = caja ? uid : b.pagadoPor; // en caja chica queda registrado por quien lo marcó
  if (b.pagadoPor && !caja && !(await esMiembro(pool, grupoId, b.pagadoPor))) throw err("Esa persona no es del grupo");
  const ref = "guia:" + slotId;

  await enTransaccion(async (db) => {
    const s = await db.query(
      `SELECT sg.id, sg.tour_id, sg.tour_date, sg.start_time, to_char(sg.tour_date, 'YYYY-MM-DD') AS fecha, to_char(sg.start_time, 'HH24:MI') AS hora,
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
        await db.query(`UPDATE ${S}.movimientos SET usuario_id = $2, caja = $3 WHERE id = $1`, [movId, persona, caja]);
      } else {
        // Limpia gastos de guía eliminados de este tour para no chocar con la referencia única
        await db.query(`DELETE FROM ${S}.movimientos WHERE grupo_id = $1 AND ref_externa = $2 AND eliminado`, [grupoId, ref]);
        const cat = await db.query(
          `SELECT id FROM ${S}.categorias WHERE grupo_id = $1 AND lower(nombre) IN ('guías', 'guias', 'guía', 'guia') LIMIT 1`, [grupoId]);
        const ins = await db.query(
          `INSERT INTO ${S}.movimientos (usuario_id, grupo_id, origen, ref_externa, fecha, tipo, comercio, monto, moneda, monto_original, categoria_id, manual, caja)
           VALUES ($1, $2, 'manual', $3, ($4::date + $5::time) AT TIME ZONE '${TZ}', 'Guía', $6, $7, 'CRC', $7, $8, true, $9)
           RETURNING id`,
          [persona, grupoId, ref, slot.fecha, slot.hora, `Guía ${slot.guia} · ${slot.tour} ${slot.hora}`, PRECIO_GUIA, cat.rows[0]?.id || null, caja]);
        movId = ins.rows[0].id;
      }
    } else {
      if (movId) await db.query(`DELETE FROM ${S}.movimientos WHERE id = $1`, [movId]);
      movId = null;
    }
    await db.query(
      `INSERT INTO ${S}.pagos_guia (slot_id, grupo_id, movimiento_id, no_aplica, actualizado_por, tour_id, tour_date, start_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (grupo_id, slot_id) DO UPDATE SET movimiento_id = $3, no_aplica = $4, actualizado_por = $5, actualizado = now(),
         tour_id = $6, tour_date = $7, start_time = $8`,
      [slotId, grupoId, movId, !b.pagadoPor && Boolean(b.noAplica), uid, slot.tour_id, slot.fecha, slot.hora]);
  });
  res.json({ ok: true, precio: PRECIO_GUIA, guias: await listaGuias(grupoId, b.mes || null), ...(await datos(uid)) });
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
