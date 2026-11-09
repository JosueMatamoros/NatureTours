// Clasificación automática: reglas aprendidas → palabras clave → "por clasificar".
import { S } from "./esquema.js";

export const normalizar = (s) =>
  String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();

// Se comparan como palabras completas, en mayúscula y sin tildes. El orden importa.
const PALABRAS_CLAVE = [
  ["Suscripciones", ["NETFLIX", "SPOTIFY", "DISNEY", "DISNEYPLUS", "HBO", "HBO MAX", "PRIME VIDEO", "AMAZON PRIME", "APPLE COM", "APPLE COM BILL", "ICLOUD",
    "YOUTUBE", "GOOGLE ONE", "GOOGLE STORAGE", "CHATGPT", "OPENAI", "ANTHROPIC", "CLAUDE", "CANVA", "PARAMOUNT", "CRUNCHYROLL", "DUOLINGO",
    "MICROSOFT", "ADOBE", "SUSCRIPCION", "MEMBRESIA", "STAR PLUS", "DEEZER", "TIDAL"]],
  ["Comida y restaurantes", ["TACO BELL", "MCDONALDS", "MC DONALDS", "BURGER KING", "KFC", "PIZZA", "PIZZERIA", "SUBWAY", "STARBUCKS", "SPOON", "POPS",
    "CAFE", "CAFETERIA", "COFFEE", "RESTAURANTE", "RESTAURANT", "REST", "SODA", "UBER EATS", "UBEREATS", "RAPPI", "DIDI FOOD", "PEDIDOSYA",
    "PEDIDOS YA", "WENDYS", "CHURCHS", "BAR", "SUSHI", "POLLO", "POLLOS", "BRASA", "PANADERIA", "REPOSTERIA", "HELADOS", "HELADERIA", "BOSTON",
    "DOMINOS", "PAPA JOHNS", "CHINESE", "CHINO", "TACOS", "BURGER", "BURGERS", "GRILL", "COMIDA", "ALMUERZO", "DESAYUNO", "CENA", "TAQUERIA",
    "MARISQUERIA", "CEVICHERA", "CEVICHE", "DINER", "PIZZAHUT", "PIZZA HUT", "CAFE BRITT", "BAGELMENS", "ROOFTOP"]],
  ["Supermercado", ["AUTOMERCADO", "AUTO MERCADO", "WALMART", "WAL MART", "MAS X MENOS", "MASXMENOS", "PALI", "MAXI PALI", "MAXIPALI", "PRICESMART",
    "PRICE SMART", "PERIMERCADOS", "PERI", "MEGASUPER", "MEGA SUPER", "FRESH MARKET", "SUPER", "MINI SUPER", "MINISUPER", "SUPERMERCADO",
    "AMPM", "AM PM", "VINDI", "CARNICERIA", "VERDULERIA", "FERIA", "PULPERIA", "ABASTECEDOR", "MERCADO", "LICORERA", "COMPRAS SUPER", "CONVENIENCE"]],
  ["Transporte", ["UBER", "DIDI", "INDRIVER", "TAXI", "GASOLINERA", "SERVICENTRO", "ESTACION DE SERVICIO", "DELTA", "PUMA", "TEXACO", "SHELL",
    "GASOLINA", "COMBUSTIBLE", "PARQUEO", "PARKING", "PEAJE", "QUICK PASS", "QUICKPASS", "COMPASS", "GLOBALVIA", "GLOBAL VIA", "AUTOBUS", "BUS", "BUSES",
    "RITEVE", "MARCHAMO", "TREN", "INCOFER", "LAVACAR", "TALLER", "LLANTAS", "REPUESTOS"]],
  ["Servicios", ["ICE", "KOLBI", "LIBERTY", "CLARO", "CNFL", "AYA", "ESPH", "JASEC", "COOPELESCA", "COOPEGUANACASTE", "CABLETICA", "TIGO",
    "TELECABLE", "AGUA", "LUZ", "ELECTRICIDAD", "INTERNET", "TELEFONO", "CELULAR", "RECARGA", "MUNICIPALIDAD", "CABLE"]],
  ["Vivienda", ["ALQUILER", "RENTA", "CONDOMINIO", "EPA", "CONSTRUPLAZA", "EL LAGAR", "LAGAR", "FERRETERIA", "MUEBLES", "MUEBLERIA", "COLCHONES",
    "HOGAR", "CASA", "LIMPIEZA", "CUOTA"]],
  ["Salud", ["FARMACIA", "FARMACIAS", "FISCHEL", "SUCRE", "LA BOMBA", "FARMAVALUE", "CLINICA", "HOSPITAL", "LABORATORIO", "LABORATORIOS",
    "MEDICO", "MEDICA", "DENTAL", "DENTISTA", "ODONTOLOGIA", "OPTICA", "CCSS", "CITA", "DOCTOR", "DOCTORA", "PSICOLOGO", "PSICOLOGA",
    "MEDICAMENTOS", "SALUD", "CIMA", "HOSPITAL CLINICA BIBLICA", "METROPOLITANO"]],
  ["Entretenimiento", ["CINEPOLIS", "CINEMARK", "CCM", "NOVA CINEMAS", "CINE", "TEATRO", "TICKET", "TICKETS", "ETICKET", "BOLETERIA", "CONCIERTO",
    "STEAM", "PLAYSTATION", "XBOX", "NINTENDO", "BOLICHE", "KARAOKE", "MUSEO", "PARQUE", "DISCOTECA", "EVENTO", "ENTRADAS", "ZOOLOGICO"]],
];

/** Para SINPE se aprende de la descripción, no del texto "SINPE · ...". */
export function claveDe(mov) {
  const texto = mov.tipo === "SINPE" ? String(mov.comercio || "").replace(/^SINPE\s*·\s*/, "") : mov.comercio;
  if (mov.tipo === "SINPE" && /sin descripci/i.test(mov.comercio || "")) return "";
  return normalizar(texto);
}

/**
 * Devuelve el id de categoría (o null = por clasificar) para un texto, dentro
 * del ámbito de un usuario (personal) o de un grupo.
 */
export async function categorizar(db, { usuarioId = null, grupoId = null }, texto) {
  const n = normalizar(texto);
  if (!n) return null;
  const relleno = ` ${n} `;
  const reglas = await db.query(
    `SELECT clave, categoria_id FROM ${S}.reglas
     WHERE ${grupoId ? "grupo_id = $1" : "usuario_id = $1"}
     ORDER BY length(clave) DESC`,
    [grupoId || usuarioId]
  );
  for (const r of reglas.rows) if (relleno.includes(` ${r.clave} `)) return r.categoria_id;
  if (grupoId) return null; // las palabras clave son para los gastos personales
  for (const [clave, palabras] of PALABRAS_CLAVE) {
    if (palabras.some((p) => relleno.includes(` ${p} `))) {
      const c = await db.query(`SELECT id FROM ${S}.categorias WHERE usuario_id = $1 AND clave = $2`, [usuarioId, clave]);
      return c.rows[0]?.id || null;
    }
  }
  return null;
}
