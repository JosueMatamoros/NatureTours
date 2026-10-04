// Avisos de reservas por WhatsApp (API oficial, vía plantilla aprobada).
//
// Cada reserva nueva (web, GYG, Viator) o cancelación de OTA manda la
// plantilla WHATSAPP_TEMPLATE a cada número de WHATSAPP_NOTIFY_TO.
// Proveedor:
//   - "ycloud" (default): BSP que permite coexistencia con la app WhatsApp
//     Business (el número del negocio se sigue usando normal en el teléfono).
//   - "meta": Cloud API directo de Meta.
// Si falta configuración no hace nada (solo loguea), y nunca lanza: un fallo
// de WhatsApp no debe romper el flujo de la reserva.
import { DateTime } from "luxon";
import { pool } from "../db.js";

const env = (k, d = "") => process.env[k]?.trim() || d;

function config() {
  return {
    provider: env("WHATSAPP_PROVIDER", "ycloud").toLowerCase(),
    apiKey: env("WHATSAPP_API_KEY"), // YCloud: API key · Meta: access token
    from: env("WHATSAPP_FROM"), // YCloud: número del negocio en E.164 (+506...)
    phoneNumberId: env("WHATSAPP_PHONE_NUMBER_ID"), // solo Meta
    graphVersion: env("WHATSAPP_GRAPH_VERSION", "v23.0"),
    template: env("WHATSAPP_TEMPLATE", "aviso_reserva"),
    lang: env("WHATSAPP_TEMPLATE_LANG", "es"),
    to: env("WHATSAPP_NOTIFY_TO")
      .split(",")
      .map((n) => n.replace(/[^\d+]/g, ""))
      .filter(Boolean),
  };
}

export function whatsappConfigured() {
  const c = config();
  if (!c.apiKey || c.to.length === 0) return false;
  return c.provider === "meta" ? Boolean(c.phoneNumberId) : Boolean(c.from);
}

const SOURCE_LABEL = {
  web: "Web (directa)",
  manual: "Manual",
  viator: "Viator",
  gyg: "GetYourGuide",
  localbird: "Localbird",
};

// Los parámetros de plantilla no aceptan saltos de línea, tabs ni más de 4
// espacios seguidos, ni texto vacío.
function clean(v, fallback = "-") {
  const s = String(v ?? "").replace(/[\n\r\t]+/g, " ").replace(/ {2,}/g, " ").trim();
  return s || fallback;
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function paxText(b) {
  const parts = [];
  if (b.adults) parts.push(plural(b.adults, "adulto", "adultos"));
  if (b.children) parts.push(plural(b.children, "niño", "niños"));
  if (b.babies) parts.push(plural(b.babies, "bebé", "bebés"));
  return parts.join(", ") || "0";
}

function money(n) {
  return `$${Number(n || 0).toFixed(2)}`;
}

// Última línea del aviso: solo a las directas (web con apartado, manuales) les
// importa el saldo; las OTA ya vienen pagadas.
function statusText(b, event) {
  const origin = SOURCE_LABEL[b.source] || b.source;
  if (event === "cancelled") return `❌ Esta reserva fue CANCELADA en ${origin}.`;
  if (b.source === "web" || b.source === "manual") {
    const paid = Number(b.source === "web" ? b.paid : b.manual_paid) || 0;
    const balance = Math.max(Number(b.subtotal || 0) - paid, 0);
    if (balance > 0.009) {
      return paid > 0
        ? `💵 Reserva directa: debe ${money(balance)} el día del tour (adelantó ${money(paid)}).`
        : `💵 Reserva directa: debe ${money(balance)} el día del tour.`;
    }
    return "💵 Reserva directa: no debe nada, pagó completo.";
  }
  return `Reserva de ${origin}, ya viene pagada.`;
}

export async function loadBooking(bookingId) {
  const q = await pool.query(
    `SELECT b.id, b.source, b.external_ref, b.adults, b.children, b.babies,
            b.subtotal, b.manual_paid,
            to_char(b.tour_date, 'YYYY-MM-DD') AS tour_date,
            to_char(b.start_time, 'HH24:MI') AS start_time,
            t.name AS tour_name,
            COALESCE(c.name, b.manual_name) AS name,
            COALESCE(c.phone, b.manual_phone) AS phone,
            (SELECT COALESCE(sum(p.amount), 0) FROM payments p
              WHERE p.booking_id = b.id AND p.status = 'completed') AS paid
     FROM bookings b
     JOIN tours t ON t.id = b.tour_id
     LEFT JOIN LATERAL (
       SELECT cu.name, cu.phone FROM payments p
       JOIN customers cu ON cu.id = p.customer_id
       WHERE p.booking_id = b.id AND p.status = 'completed'
       ORDER BY p.created_at LIMIT 1
     ) c ON true
     WHERE b.id = $1`,
    [bookingId],
  );
  return q.rows[0] || null;
}

function dateText(ymd) {
  const d = DateTime.fromISO(ymd, { locale: "es" });
  if (!d.isValid) return ymd;
  const sameYear = d.year === DateTime.now().year;
  return d.toFormat(sameYear ? "cccc d 'de' LLLL" : "cccc d 'de' LLLL 'de' yyyy");
}

// Orden = variables de la plantilla aviso_reserva (ver WHATSAPP.md).
export function buildParams(b, event) {
  return [
    b.name,
    dateText(b.tour_date),
    b.start_time,
    paxText(b),
    b.external_ref || String(b.id).slice(0, 8),
    statusText(b, event),
  ].map((v) => clean(v));
}

async function sendTemplate(c, to, params) {
  const template = {
    name: c.template,
    language: { code: c.lang },
    components: [
      { type: "body", parameters: params.map((text) => ({ type: "text", text })) },
    ],
  };

  let url, headers, body;
  if (c.provider === "meta") {
    url = `https://graph.facebook.com/${c.graphVersion}/${c.phoneNumberId}/messages`;
    headers = { Authorization: `Bearer ${c.apiKey}` };
    body = { messaging_product: "whatsapp", to: to.replace(/^\+/, ""), type: "template", template };
  } else {
    url = "https://api.ycloud.com/v2/whatsapp/messages/sendDirectly";
    headers = { "X-API-Key": c.apiKey };
    body = { from: c.from, to, type: "template", template };
  }

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    throw new Error(`WhatsApp ${c.provider} ${resp.status}: ${await resp.text()}`);
  }
}

// event: "new" | "cancelled"
export async function notifyBooking(bookingId, event = "new") {
  try {
    if (!whatsappConfigured()) {
      console.warn("WhatsApp: sin configurar, no se envía aviso de", bookingId);
      return;
    }
    const c = config();
    const b = await loadBooking(bookingId);
    if (!b) return;
    const params = buildParams(b, event);
    const results = await Promise.allSettled(c.to.map((to) => sendTemplate(c, to, params)));
    results.forEach((r, i) => {
      if (r.status === "rejected") console.error(`WhatsApp aviso a ${c.to[i]} falló:`, r.reason?.message);
    });
  } catch (err) {
    console.error(`notifyBooking(${bookingId}) error:`, err);
  }
}
