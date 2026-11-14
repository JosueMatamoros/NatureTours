// Mis Gastos — app personal de gastos (PWA aparte) que vive en este backend.
// Todo está en su propio esquema de Postgres (por defecto "gastos") para no
// mezclarse con las tablas del negocio. Solo se enlaza a public.guides y
// public.tours de forma opcional.
import { pool } from "../db.js";

export const S = process.env.GASTOS_SCHEMA || "gastos";
if (!/^[a-z_][a-z0-9_]*$/.test(S)) throw new Error("GASTOS_SCHEMA inválido");

// Categorías con las que arranca cada usuario. `clave` no cambia aunque se
// renombre la categoría: así las palabras clave siguen funcionando.
export const CATEGORIAS_PERSONALES = [
  ["Supermercado", "ShoppingCart", "#8FB573"],
  ["Comida y restaurantes", "UtensilsCrossed", "#E0A458"],
  ["Transporte", "Car", "#6FA8C9"],
  ["Servicios", "Lightbulb", "#CDBB5E"],
  ["Vivienda", "House", "#B98668"],
  ["Salud", "Pill", "#DE7F72"],
  ["Entretenimiento", "Clapperboard", "#5FB8A5"],
  ["Suscripciones", "Tv", "#8E9DDB"],
  ["Otros", "Shapes", "#9AA396"],
];

export const CATEGORIAS_GRUPO = [
  ["Comida y restaurantes", "UtensilsCrossed", "#E0A458"],
  ["Transporte", "Car", "#6FA8C9"],
  ["Compras y equipo", "Wrench", "#B98668"],
  ["Servicios", "Lightbulb", "#CDBB5E"],
  ["Otros", "Shapes", "#9AA396"],
];

export async function migrarGastos() {
  const sql = [
    `CREATE SCHEMA IF NOT EXISTS ${S}`,
    `CREATE TABLE IF NOT EXISTS ${S}.usuarios (
       id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
       nombre text NOT NULL,
       cedula text UNIQUE,
       password_hash text,
       correo text UNIQUE,                 -- Gmail del que se leen los avisos del banco
       lee_correo boolean NOT NULL DEFAULT false,
       guide_id uuid REFERENCES public.guides(id) ON DELETE SET NULL,
       activacion_hash text,               -- código de un solo uso para crear la contraseña
       activacion_expira timestamptz,
       intentos integer NOT NULL DEFAULT 0,
       bloqueado_hasta timestamptz,
       sesiones_desde timestamptz NOT NULL DEFAULT now(),  -- tokens anteriores quedan inválidos
       creado timestamptz NOT NULL DEFAULT now()
     )`,
    `CREATE TABLE IF NOT EXISTS ${S}.grupos (
       id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
       nombre text NOT NULL,
       icono text NOT NULL DEFAULT 'Users',
       color text NOT NULL DEFAULT '#8FB573',
       tour_id integer REFERENCES public.tours(id) ON DELETE SET NULL,
       creado_por uuid REFERENCES ${S}.usuarios(id) ON DELETE SET NULL,
       creado timestamptz NOT NULL DEFAULT now()
     )`,
    `CREATE TABLE IF NOT EXISTS ${S}.grupo_miembros (
       grupo_id uuid NOT NULL REFERENCES ${S}.grupos(id) ON DELETE CASCADE,
       usuario_id uuid NOT NULL REFERENCES ${S}.usuarios(id) ON DELETE CASCADE,
       unido timestamptz NOT NULL DEFAULT now(),
       PRIMARY KEY (grupo_id, usuario_id)
     )`,
    `CREATE TABLE IF NOT EXISTS ${S}.categorias (
       id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
       usuario_id uuid REFERENCES ${S}.usuarios(id) ON DELETE CASCADE,
       grupo_id uuid REFERENCES ${S}.grupos(id) ON DELETE CASCADE,
       nombre text NOT NULL,
       icono text NOT NULL,
       color text NOT NULL,
       clave text,
       orden integer NOT NULL DEFAULT 0,
       CHECK ((usuario_id IS NULL) <> (grupo_id IS NULL))
     )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS categorias_nombre_uq
       ON ${S}.categorias (coalesce(usuario_id, grupo_id), lower(nombre))`,
    `CREATE TABLE IF NOT EXISTS ${S}.movimientos (
       id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
       usuario_id uuid NOT NULL REFERENCES ${S}.usuarios(id) ON DELETE CASCADE,  -- quién lo pagó / agregó
       grupo_id uuid REFERENCES ${S}.grupos(id) ON DELETE SET NULL,              -- null = personal
       origen text NOT NULL DEFAULT 'manual' CHECK (origen IN ('correo', 'manual')),
       ref_externa text,                    -- referencia del banco (evita duplicados)
       fecha timestamptz NOT NULL,
       banco text,
       tipo text,
       comercio text NOT NULL,
       texto_categoria text,
       monto numeric(14,2) NOT NULL CHECK (monto >= 0),
       moneda text NOT NULL DEFAULT 'CRC',
       monto_original numeric(14,2),
       categoria_id uuid REFERENCES ${S}.categorias(id) ON DELETE SET NULL,
       manual boolean NOT NULL DEFAULT false,   -- la categoría la eligió una persona
       eliminado boolean NOT NULL DEFAULT false,
       nota text,
       creado timestamptz NOT NULL DEFAULT now(),
       UNIQUE (usuario_id, ref_externa)
     )`,
    `ALTER TABLE ${S}.usuarios ADD COLUMN IF NOT EXISTS solo_grupos boolean NOT NULL DEFAULT false`, // sin personal ni crear grupos
    `CREATE INDEX IF NOT EXISTS movimientos_usuario_fecha ON ${S}.movimientos (usuario_id, fecha)`,
    `CREATE INDEX IF NOT EXISTS movimientos_grupo_fecha ON ${S}.movimientos (grupo_id, fecha) WHERE grupo_id IS NOT NULL`,
    `CREATE TABLE IF NOT EXISTS ${S}.reglas (
       id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
       usuario_id uuid REFERENCES ${S}.usuarios(id) ON DELETE CASCADE,
       grupo_id uuid REFERENCES ${S}.grupos(id) ON DELETE CASCADE,
       clave text NOT NULL,                 -- comercio normalizado
       categoria_id uuid NOT NULL REFERENCES ${S}.categorias(id) ON DELETE CASCADE,
       CHECK ((usuario_id IS NULL) <> (grupo_id IS NULL))
     )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS reglas_clave_uq ON ${S}.reglas (coalesce(usuario_id, grupo_id), clave)`,
    `CREATE TABLE IF NOT EXISTS ${S}.push (
       id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
       usuario_id uuid NOT NULL REFERENCES ${S}.usuarios(id) ON DELETE CASCADE,
       endpoint text NOT NULL UNIQUE,
       p256dh text NOT NULL,
       auth text NOT NULL,
       user_agent text,
       creado timestamptz NOT NULL DEFAULT now(),
       ultimo_ok timestamptz
     )`,
    // Pago de guías por tour: lee public.slot_guides (solo lectura, sin FK para no tocar el negocio)
    `ALTER TABLE ${S}.grupos ADD COLUMN IF NOT EXISTS pagos_guias boolean NOT NULL DEFAULT false`,
    `CREATE TABLE IF NOT EXISTS ${S}.pagos_guia (
       slot_id uuid NOT NULL,               -- public.slot_guides.id
       grupo_id uuid NOT NULL REFERENCES ${S}.grupos(id) ON DELETE CASCADE,
       movimiento_id uuid REFERENCES ${S}.movimientos(id) ON DELETE SET NULL,
       no_aplica boolean NOT NULL DEFAULT false,
       actualizado_por uuid REFERENCES ${S}.usuarios(id) ON DELETE SET NULL,
       actualizado timestamptz NOT NULL DEFAULT now(),
       PRIMARY KEY (grupo_id, slot_id)
     )`,
  ];
  for (const q of sql) await pool.query(q);
}

/** Crea las categorías iniciales de un usuario o de un grupo. */
export async function sembrarCategorias(db, { usuarioId = null, grupoId = null }) {
  const base = grupoId ? CATEGORIAS_GRUPO : CATEGORIAS_PERSONALES;
  let orden = 0;
  for (const [nombre, icono, color] of base) {
    await db.query(
      `INSERT INTO ${S}.categorias (usuario_id, grupo_id, nombre, icono, color, clave, orden)
       VALUES ($1, $2, $3, $4, $5, $3, $6) ON CONFLICT DO NOTHING`,
      [usuarioId, grupoId, nombre, icono, color, orden++]
    );
  }
}
