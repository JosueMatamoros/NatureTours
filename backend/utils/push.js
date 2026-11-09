// Notificaciones push de la app (PWA) — Web Push estándar con VAPID.
//
// - Admins/owners (guides.is_admin): reservas nuevas (web y OTA) y
//   cancelaciones de OTA.
// - Guías: cuando se les asigna un tour.
// Claves VAPID: env VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY si existen; si no, las
// de app_settings (scripts/migrate-push.mjs). Nunca lanza: un fallo de push no
// debe romper la reserva ni la asignación.
import { setVapidDetails, sendNotification } from "web-push";
import { DateTime } from "luxon";
import { pool } from "../db.js";

let vapidReady = null;

async function loadVapid() {
  const envPub = process.env.VAPID_PUBLIC_KEY?.trim();
  const envPriv = process.env.VAPID_PRIVATE_KEY?.trim();
  if (envPub && envPriv) return { publicKey: envPub, privateKey: envPriv };
  const q = await pool.query(
    `select key, value from app_settings where key in ('vapid_public_key','vapid_private_key')`
  );
  const m = Object.fromEntries(q.rows.map((r) => [r.key, r.value]));
  if (!m.vapid_public_key || !m.vapid_private_key) return null;
  return { publicKey: m.vapid_public_key, privateKey: m.vapid_private_key };
}

export async function getVapidPublicKey() {
  const k = await loadVapid();
  return k?.publicKey ?? null;
}

export async function ensureVapid() {
  if (!vapidReady) {
    vapidReady = loadVapid().then((k) => {
      if (!k) throw new Error("VAPID sin configurar");
      setVapidDetails(
        process.env.VAPID_SUBJECT?.trim() || "mailto:naturetourslafortuna@gmail.com",
        k.publicKey,
        k.privateKey
      );
      return true;
    });
    vapidReady.catch(() => {
      vapidReady = null; // reintentar en el próximo envío
    });
  }
  return vapidReady;
}

// Envía a una lista de suscripciones (filas de push_subscriptions).
// Las que el navegador ya invalidó (404/410) se borran.
// payload puede ser un objeto o una función (fila) => objeto, para
// personalizar el mensaje por destinatario (ej. su nombre).
async function sendToSubscriptions(rows, payload) {
  if (rows.length === 0) return;
  await ensureVapid();
  await Promise.allSettled(
    rows.map(async (s) => {
      try {
        const data = typeof payload === "function" ? payload(s) : payload;
        await sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(data),
          { TTL: 60 * 60 * 24, urgency: "high" }
        );
        await pool.query(`update push_subscriptions set last_success_at = now() where id = $1`, [s.id]);
      } catch (err) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await pool.query(`delete from push_subscriptions where id = $1`, [s.id]);
        } else {
          console.error("push send error:", err?.statusCode, err?.body || err?.message);
        }
      }
    })
  );
}

export async function pushToAdmins(payload) {
  try {
    const q = await pool.query(
      `select s.*, g.name as guide_name from push_subscriptions s
       join guides g on g.id = s.guide_id
       where g.active and g.is_admin`
    );
    await sendToSubscriptions(q.rows, payload);
  } catch (err) {
    console.error("pushToAdmins error:", err);
  }
}

// Perfil de solo lectura (Eraida): recibe reservas nuevas y cancelaciones
// solo de hoy o mañana (filtro en pushBookingToAdmins).
export async function pushToViewers(payload) {
  try {
    const q = await pool.query(
      `select s.*, g.name as guide_name from push_subscriptions s
       join guides g on g.id = s.guide_id
       where g.active and g.is_viewer`
    );
    await sendToSubscriptions(q.rows, payload);
  } catch (err) {
    console.error("pushToViewers error:", err);
  }
}

export async function pushToGuide(guideId, payload) {
  try {
    const q = await pool.query(
      `select s.*, g.name as guide_name from push_subscriptions s
       join guides g on g.id = s.guide_id
       where g.active and g.id = $1`,
      [guideId]
    );
    await sendToSubscriptions(q.rows, payload);
  } catch (err) {
    console.error("pushToGuide error:", err);
  }
}

// ─── Mensajes ───────────────────────────────────────────────────────────────

const TZ = "America/Costa_Rica";

const SOURCE = {
  web: { label: "directa", emoji: "🟢" },
  manual: { label: "manual", emoji: "📝" },
  gyg: { label: "de GetYourGuide", emoji: "🟠" },
  viator: { label: "de Viator", emoji: "🔵" },
  localbird: { label: "de Localbird", emoji: "🟡" },
};

// Imagen grande (Android) según el tour.
const TOUR_IMAGE = { 1: "/app/notif-night.jpg", 2: "/app/notif-horse.jpg" };

const money = (n) => {
  const v = Number(n || 0);
  return Number.isInteger(v) ? `$${v}` : `$${v.toFixed(2)}`;
};
const firstName = (n) => String(n || "").trim().split(/\s+/)[0] || "";

function daysFromToday(ymd) {
  const d = DateTime.fromISO(ymd, { zone: TZ });
  const today = DateTime.now().setZone(TZ).startOf("day");
  return Math.round(d.startOf("day").diff(today, "days").days);
}

// "Hoy · 12:00 MD", "Mañana (sáb 7 nov) · 8:00 AM", "mié 12 nov · 6:00 PM"
function whenLabel(ymd, hm) {
  const d = DateTime.fromISO(ymd, { zone: TZ, locale: "es" });
  const today = DateTime.now().setZone(TZ).startOf("day");
  const diff = Math.round(d.startOf("day").diff(today, "days").days);
  const day = d.isValid ? d.toFormat("ccc d LLL") : ymd;
  const rel = diff === 0 ? "Hoy" : diff === 1 ? `Mañana (${day})` : day;
  return `${rel} · ${timeLabel(hm)}`;
}

function timeLabel(hm) {
  const [h, m] = String(hm).split(":").map(Number);
  if (h === 12 && m === 0) return "12:00 MD";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function paxShort(b) {
  const parts = [];
  if (b.adults) parts.push(`${b.adults} adulto${b.adults === 1 ? "" : "s"}`);
  if (b.children) parts.push(`${b.children} niño${b.children === 1 ? "" : "s"}`);
  if (b.babies) parts.push(`${b.babies} bebé${b.babies === 1 ? "" : "s"}`);
  return parts.join(", ");
}

function waLink(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.length >= 8 ? `https://wa.me/${digits}` : null;
}

async function loadBookingForPush(bookingId) {
  const q = await pool.query(
    `select b.id, b.tour_id, b.source, b.external_ref, b.adults, b.children, b.babies,
            b.subtotal, b.total, b.manual_paid,
            to_char(b.tour_date, 'YYYY-MM-DD') as tour_date,
            to_char(b.start_time, 'HH24:MI') as start_time,
            t.name as tour_name,
            coalesce(c.name, b.manual_name) as name,
            coalesce(c.phone, b.manual_phone) as phone,
            (select coalesce(sum(p.amount), 0) from payments p
              where p.booking_id = b.id and p.status = 'completed') as paid,
            (select p.mode from payments p
              where p.booking_id = b.id and p.status = 'completed'
              order by p.created_at limit 1) as pay_mode
     from bookings b
     join tours t on t.id = b.tour_id
     left join lateral (
       select cu.name, cu.phone from payments p
       join customers cu on cu.id = p.customer_id
       where p.booking_id = b.id and p.status = 'completed'
       order by p.created_at limit 1
     ) c on true
     where b.id = $1`,
    [bookingId]
  );
  return q.rows[0] || null;
}

// event: "new" | "cancelled"
export async function pushBookingToAdmins(bookingId, event = "new") {
  try {
    const b = await loadBookingForPush(bookingId);
    if (!b) return;
    const src = SOURCE[b.source] || { label: b.source, emoji: "🐴" };
    const cancelled = event === "cancelled";
    const who = `${b.name || "Cliente"} · ${paxShort(b)}`;
    const when = `${b.tour_name} · ${whenLabel(b.tour_date, b.start_time)}`;

    // Tercera línea: en cancelación, los espacios liberados; en reserva nueva,
    // solo si el cliente todavía debe plata (directas con depósito).
    let extra = null;
    if (cancelled) {
      const seats = Number(b.adults || 0) + Number(b.children || 0);
      extra = `Se liberan ${seats} espacio${seats === 1 ? "" : "s"} en ese horario.`;
    } else if (b.source === "web" || b.source === "manual") {
      const paid = Number(b.source === "web" ? b.paid : b.manual_paid) || 0;
      const due = Math.max(Number(b.subtotal || 0) - paid, 0);
      if (due > 0.009) {
        extra = paid > 0 ? `💵 Adelantó ${money(paid)} · debe ${money(due)}` : `💵 Debe ${money(due)}`;
      }
    }

    const phoneLink = waLink(b.phone);
    const title = cancelled
      ? `❌ Cancelación ${src.label === "directa" ? "" : src.label}`.trim()
      : `${src.emoji} Nueva reserva ${src.label}`;
    const body = [who, when, extra].filter(Boolean).join("\n");

    // Eraida (solo lectura): solo si la reserva es para hoy o mañana.
    const days = daysFromToday(b.tour_date);
    if (days === 0 || days === 1) {
      pushToViewers({
        title,
        body,
        image: cancelled ? undefined : TOUR_IMAGE[b.tour_id],
        url: `/asistencia?fecha=${b.tour_date}`,
        tag: `booking-${b.id}-${event}`,
        actions: [{ action: "open", title: "Ver" }],
      });
    }

    await pushToAdmins({
      title,
      body,
      image: cancelled ? undefined : TOUR_IMAGE[b.tour_id],
      url: `/matamoros/reservaciones?fecha=${b.tour_date}`,
      tag: `booking-${b.id}-${event}`,
      actions: [
        { action: "open", title: "Ver reserva" },
        ...(phoneLink && !cancelled ? [{ action: "whatsapp", title: "💬 WhatsApp" }] : []),
      ],
      whatsapp: phoneLink,
    });
  } catch (err) {
    console.error(`pushBookingToAdmins(${bookingId}) error:`, err);
  }
}

export async function pushAssignmentToGuide({ guideId, tourId, tourDate, startTime }) {
  try {
    const q = await pool.query(`select name from tours where id = $1`, [tourId]);
    const tourName = q.rows[0]?.name;
    if (!tourName) return;
    await pushToGuide(guideId, (sub) => ({
      title: `🧭 ¡${firstName(sub.guide_name) || "Hola"}, tenés un tour!`,
      body: `${tourName}\n${whenLabel(tourDate, startTime)}`,
      image: TOUR_IMAGE[tourId],
      url: `/asistencia?fecha=${tourDate}`,
      tag: `assign-${tourId}-${tourDate}-${startTime}`,
      actions: [{ action: "open", title: "Ver mi día" }],
    }));
  } catch (err) {
    console.error("pushAssignmentToGuide error:", err);
  }
}
