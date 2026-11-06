// Notificaciones push de la app (PWA) — Web Push estándar con VAPID.
//
// - Admins/owners (guides.is_admin): reservas nuevas (web y OTA),
//   cancelaciones de OTA y pagos personalizados.
// - Guías: cuando se les asigna un tour.
// Claves VAPID: env VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY si existen; si no, las
// de app_settings (scripts/migrate-push.mjs). Nunca lanza: un fallo de push no
// debe romper la reserva ni la asignación.
import { setVapidDetails, sendNotification } from "web-push";
import { DateTime } from "luxon";
import { pool } from "../db.js";
import { loadBooking } from "./whatsapp.js";

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

async function ensureVapid() {
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
async function sendToSubscriptions(rows, payload) {
  if (rows.length === 0) return;
  await ensureVapid();
  const body = JSON.stringify(payload);
  await Promise.allSettled(
    rows.map(async (s) => {
      try {
        await sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
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
      `select s.* from push_subscriptions s
       join guides g on g.id = s.guide_id
       where g.active and g.is_admin`
    );
    await sendToSubscriptions(q.rows, payload);
  } catch (err) {
    console.error("pushToAdmins error:", err);
  }
}

export async function pushToGuide(guideId, payload) {
  try {
    const q = await pool.query(
      `select s.* from push_subscriptions s
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

const SOURCE = { web: "Web", gyg: "GetYourGuide", viator: "Viator", manual: "Manual", localbird: "Localbird" };

function dateShort(ymd) {
  const d = DateTime.fromISO(ymd, { locale: "es" });
  return d.isValid ? d.toFormat("ccc d LLL") : ymd;
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

// event: "new" | "cancelled"
export async function pushBookingToAdmins(bookingId, event = "new") {
  try {
    const b = await loadBooking(bookingId);
    if (!b) return;
    const origin = SOURCE[b.source] || b.source;
    const cancelled = event === "cancelled";
    await pushToAdmins({
      title: cancelled ? `❌ Cancelada (${origin})` : `🐴 Nueva reserva · ${origin}`,
      body: [
        `${b.tour_name} · ${dateShort(b.tour_date)} · ${timeLabel(b.start_time)}`,
        `${b.name || "Cliente"} · ${paxShort(b)}`,
      ].join("\n"),
      url: `/matamoros/reservaciones?fecha=${b.tour_date}`,
      tag: `booking-${b.id}-${event}`,
    });
  } catch (err) {
    console.error(`pushBookingToAdmins(${bookingId}) error:`, err);
  }
}

export async function pushCustomPaymentToAdmins({ name, amount, description }) {
  await pushToAdmins({
    title: `💳 Pago personalizado · $${Number(amount).toFixed(2)}`,
    body: `${name}: ${String(description).slice(0, 120)}`,
    url: "/matamoros",
    tag: `custom-payment-${Date.now()}`,
  });
}

export async function pushAssignmentToGuide({ guideId, tourId, tourDate, startTime }) {
  try {
    const q = await pool.query(
      `select t.name,
              (select coalesce(sum(b.adults + b.children), 0)::int from bookings b
                where b.tour_id = $1 and b.tour_date = $2::date and b.start_time = $3::time
                  and b.status in ('paid','pending')
                  and (b.status <> 'pending' or b.expires_at > now())) as seats
       from tours t where t.id = $1`,
      [tourId, tourDate, startTime]
    );
    const r = q.rows[0];
    if (!r) return;
    await pushToGuide(guideId, {
      title: "🧭 Te asignaron un tour",
      body: `${r.name} · ${dateShort(tourDate)} · ${timeLabel(startTime)}${
        r.seats ? ` · ${r.seats} persona${r.seats === 1 ? "" : "s"}` : ""
      }`,
      url: `/asistencia?fecha=${tourDate}`,
      tag: `assign-${tourId}-${tourDate}-${startTime}`,
    });
  } catch (err) {
    console.error("pushAssignmentToGuide error:", err);
  }
}
