// Zona de un gasto según DÓNDE queda el comercio (no según las palabras del nombre).
// Gastos del banco: se busca el comercio en Google Places y se mide la distancia.
// Gastos manuales: se usa la ubicación del teléfono al anotarlo.
import { S } from "./esquema.js";

// Pueblo: alrededor de Chachagua (donde vivo ahora). Ciudad: San José y Cartago (Tres Ríos queda en medio).
export const CENTROS = {
  pueblo: [{ nombre: "Chachagua", lat: 10.4066, lng: -84.5805, km: 40 }],
  ciudad: [
    { nombre: "San José", lat: 9.9333, lng: -84.0833, km: 15 },
    { nombre: "Cartago", lat: 9.8644, lng: -83.9194, km: 15 },
  ],
};

export function distanciaKm(a, b) {
  const r = (x) => (x * Math.PI) / 180;
  const dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** 'pueblo' | 'ciudad' | null (lejos de los dos: no se adivina) */
export function zonaDePunto(p) {
  for (const [zona, centros] of Object.entries(CENTROS)) {
    if (centros.some((c) => distanciaKm(p, c) <= c.km)) return zona;
  }
  return null;
}

// ── Buscar el comercio en Google Places ──
const PROVINCIAS = /\s+(SAN JOSE|ALAJUELA|CARTAGO|HEREDIA|PUNTARENAS|LIMON|GUANACASTE)$/i;
const VACIAS = new Set(["de", "del", "la", "las", "los", "el", "y", "s", "sa", "srl", "ltda", "cr", "the"]);
// Palabras de tipo de negocio: no sirven para saber cuál comercio es (hay "super" y "soda" en todo lado)
const GENERICAS = new Set(["super", "mini", "minisuper", "supermercado", "licorera", "licoreria", "soda", "restaurante", "rest", "bar",
  "tienda", "pulperia", "abastecedor", "comercial", "market", "minimarket", "panaderia", "carniceria", "cafe", "cafeteria", "comidas", "comida", "y"]);
const sinTildes = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const palabras = (s) => sinTildes(s).split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !VACIAS.has(w));

/** Qué tanto se parece el lugar al texto del banco (0–1): palabras del comercio que aparecen en el nombre o la dirección. */
function parecido(comercio, lugar) {
  const ps = palabras(comercio);
  if (!ps.length) return 0;
  const texto = new Set(sinTildes(`${lugar.displayName?.text || ""} ${lugar.formattedAddress || ""}`).split(/[^a-z0-9]+/));
  // Palabra completa; solo la última puede venir cortada por el banco ("COMI" → comidas)
  const ultima = ps[ps.length - 1];
  const esta = (w) => texto.has(w) || (w === ultima && [...texto].some((t) => t.startsWith(w)));
  // Tiene que coincidir el nombre propio (al menos una palabra que no sea genérica), y se mide solo con esas
  const propias = ps.filter((w) => !GENERICAS.has(w));
  if (!propias.length) return 0;
  return propias.filter(esta).length / propias.length;
}

const clave = () => process.env.GOOGLE_MAPS_KEY || process.env.GOOGLE_PLACES_KEY || "";

/**
 * Busca el comercio solo DENTRO de cada zona. Si el banco dice la provincia, el lugar tiene que estar en ella.
 * Si aparece en las dos zonas (cadenas con varias sucursales) no se adivina: queda sin zona.
 */
async function buscarComercio(comercio) {
  if (!clave()) return null;
  const provincia = comercio.match(PROVINCIAS)?.[1];
  const consulta = comercio.replace(PROVINCIAS, "").trim();
  const porZona = {};
  for (const [zona, centros] of Object.entries(CENTROS)) {
    for (const c of centros) {
      const dLat = c.km / 111, dLng = c.km / (111 * Math.cos((c.lat * Math.PI) / 180));
      const r = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": clave(),
          "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location",
        },
        body: JSON.stringify({
          textQuery: consulta, regionCode: "CR", languageCode: "es", pageSize: 5,
          locationRestriction: { rectangle: { low: { latitude: c.lat - dLat, longitude: c.lng - dLng }, high: { latitude: c.lat + dLat, longitude: c.lng + dLng } } },
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) throw new Error(`Places ${r.status}`);
      for (const l of (await r.json()).places || []) {
        const p = { lat: l.location.latitude, lng: l.location.longitude };
        if (distanciaKm(p, c) > c.km) continue; // el rectángulo es más grande que el círculo
        if (provincia && !sinTildes(l.formattedAddress || "").includes(sinTildes(provincia))) continue;
        const s = parecido(consulta, l);
        if (s >= 0.6 && (!porZona[zona] || s > porZona[zona].s)) porZona[zona] = { s, zona, ...p, nombre: l.displayName?.text || null };
      }
    }
  }
  const [a, b] = Object.values(porZona).sort((x, y) => y.s - x.s);
  if (!a) return null;
  if (b && a.s - b.s < 0.3) return { ...a, zona: null, nombre: `${a.nombre} / ${b.nombre} (en las dos zonas)` };
  return a;
}

/**
 * Zona para un comercio del banco. Se guarda por comercio para no volver a buscarlo:
 * lo que yo corrija a mano también queda guardado ahí.
 */
export async function zonaDeComercio(db, usuarioId, comercio) {
  const c = await db.query(`SELECT zona FROM ${S}.lugares WHERE usuario_id = $1 AND comercio = $2`, [usuarioId, comercio]);
  if (c.rowCount) return c.rows[0].zona;
  let m = null;
  try {
    m = await buscarComercio(comercio);
  } catch (e) {
    console.error("[gastos] zona de comercio:", e.message);
    return null; // no se guarda: se vuelve a intentar con el próximo gasto
  }
  if (!clave()) return null;
  await db.query(
    `INSERT INTO ${S}.lugares (usuario_id, comercio, zona, lat, lng, nombre_google)
     VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (usuario_id, comercio) DO NOTHING`,
    [usuarioId, comercio, m?.zona || null, m?.lat ?? null, m?.lng ?? null, m?.nombre || null]
  );
  return m?.zona || null;
}

/** Lo que corrijo a mano queda como la zona de ese comercio para los próximos gastos. */
export async function recordarZona(db, usuarioId, comercio, zona) {
  await db.query(
    `INSERT INTO ${S}.lugares (usuario_id, comercio, zona, manual) VALUES ($1, $2, $3, true)
     ON CONFLICT (usuario_id, comercio) DO UPDATE SET zona = EXCLUDED.zona, manual = true, actualizado = now()`,
    [usuarioId, comercio, zona]
  );
}
