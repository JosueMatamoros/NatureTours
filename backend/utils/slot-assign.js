// Asignación de guías por horario, compartida entre el panel admin
// (Asistencia) y el portal de guías (supervisores y guías).
//
//  - Asignar directo: el guía queda asignado ya, pero en "pending" (gris) hasta
//    que confirme "Lo hago". Si dice "No puedo", se quita y se avisa al admin.
//  - Publicar: se ofrece el horario a varios guías; el primero que lo toma
//    queda asignado y confirmado. Se puede cancelar mientras nadie lo tome.
import { z } from "zod";
import { pool } from "../db.js";
import { pushAssignmentToGuide, pushGuideReplyToAdmins, pushOfferToGuides } from "./push.js";

export const slotSchema = z.object({
  tourId: z.number().int().positive(),
  tourDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
});
export const offerSchema = slotSchema.extend({
  guideIds: z.array(z.string().uuid()).min(1).max(50),
});

const fail = (status, message) => Object.assign(new Error(message), { status });

/** Asigna o quita un guía. byGuideId = quien lo hace (si es él mismo, queda confirmado). */
export async function setSlotGuide({ tourId, tourDate, startTime, guideId, assigned, byGuideId = null }) {
  if (!assigned) {
    await pool.query(
      `DELETE FROM slot_guides
       WHERE tour_id = $1 AND tour_date = $2::date AND start_time = $3::time AND guide_id = $4`,
      [tourId, tourDate, startTime, guideId],
    );
    return { status: null };
  }
  const self = byGuideId && byGuideId === guideId;
  const ins = await pool.query(
    `INSERT INTO slot_guides (tour_id, tour_date, start_time, guide_id, status, confirmed_at)
     VALUES ($1, $2::date, $3::time, $4, $5, CASE WHEN $5 = 'confirmed' THEN now() END)
     ON CONFLICT (tour_id, tour_date, start_time, guide_id) DO NOTHING`,
    [tourId, tourDate, startTime, guideId, self ? "confirmed" : "pending"],
  );
  await clearDecline({ tourId, tourDate, startTime, guideId });
  if (ins.rowCount > 0) {
    // Ya tiene guía: las publicaciones abiertas de ese horario se cierran.
    await cancelOpenOffers({ tourId, tourDate, startTime });
    if (!self) pushAssignmentToGuide({ guideId, tourId, tourDate, startTime });
  }
  return { status: self ? "confirmed" : "pending" };
}

async function clearDecline({ tourId, tourDate, startTime, guideId }) {
  await pool.query(
    `DELETE FROM slot_declines WHERE tour_id = $1 AND tour_date = $2::date AND start_time = $3::time AND guide_id = $4`,
    [tourId, tourDate, startTime, guideId],
  );
}

async function cancelOpenOffers({ tourId, tourDate, startTime }) {
  await pool.query(
    `UPDATE slot_offers SET cancelled_at = now()
     WHERE tour_id = $1 AND tour_date = $2::date AND start_time = $3::time
       AND taken_by IS NULL AND cancelled_at IS NULL`,
    [tourId, tourDate, startTime],
  );
}

/** Publica el horario a esos guías (reemplaza una publicación abierta del mismo horario). */
export async function publishOffer({ tourId, tourDate, startTime, guideIds }) {
  const ids = [...new Set(guideIds)];
  const valid = await pool.query(
    `SELECT id FROM guides WHERE id = ANY($1::uuid[]) AND active AND is_guide`,
    [ids],
  );
  if (valid.rowCount !== ids.length) throw fail(400, "Algún guía no es válido");
  await cancelOpenOffers({ tourId, tourDate, startTime });
  const q = await pool.query(
    `INSERT INTO slot_offers (tour_id, tour_date, start_time, guide_ids)
     VALUES ($1, $2::date, $3::time, $4::uuid[]) RETURNING id`,
    [tourId, tourDate, startTime, ids],
  );
  pushOfferToGuides({ guideIds: ids, tourId, tourDate, startTime });
  return { id: q.rows[0].id };
}

export async function cancelOffer(id) {
  const q = await pool.query(
    `UPDATE slot_offers SET cancelled_at = now() WHERE id = $1 AND taken_by IS NULL AND cancelled_at IS NULL`,
    [id],
  );
  if (!q.rowCount) throw fail(409, "Esa publicación ya no está abierta");
}

/** Publicaciones abiertas de un día (para pintarlas en Asistencia). */
export async function openOffersForDate(date) {
  const q = await pool.query(
    `SELECT o.id, o.tour_id, to_char(o.start_time,'HH24:MI') AS start_time, o.guide_ids
     FROM slot_offers o
     WHERE o.tour_date = $1::date AND o.taken_by IS NULL AND o.cancelled_at IS NULL`,
    [date],
  );
  return q.rows.map((r) => ({ id: r.id, tourId: r.tour_id, startTime: r.start_time, guideIds: r.guide_ids }));
}

/** Tours publicados que este guía puede tomar (de hoy en adelante). */
export async function openOffersForGuide(guideId) {
  const q = await pool.query(
    `SELECT o.id, o.tour_id, t.name AS tour_name,
            to_char(o.tour_date,'YYYY-MM-DD') AS tour_date, to_char(o.start_time,'HH24:MI') AS start_time
     FROM slot_offers o JOIN tours t ON t.id = o.tour_id
     WHERE $1 = ANY(o.guide_ids) AND o.taken_by IS NULL AND o.cancelled_at IS NULL
       AND (o.tour_date + o.start_time) > (now() AT TIME ZONE 'America/Costa_Rica')
       AND NOT EXISTS (SELECT 1 FROM slot_guides sg WHERE sg.tour_id = o.tour_id AND sg.tour_date = o.tour_date
                         AND sg.start_time = o.start_time AND sg.guide_id = $1)
     ORDER BY o.tour_date, o.start_time`,
    [guideId],
  );
  return q.rows.map((r) => ({ id: r.id, tourId: r.tour_id, tourName: r.tour_name, tourDate: r.tour_date, startTime: r.start_time }));
}

/** El guía toma un tour publicado. Solo uno gana (UPDATE atómico). */
export async function takeOffer(id, guideId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const q = await client.query(
      `UPDATE slot_offers SET taken_by = $2, taken_at = now()
       WHERE id = $1 AND $2 = ANY(guide_ids) AND taken_by IS NULL AND cancelled_at IS NULL
       RETURNING tour_id, to_char(tour_date,'YYYY-MM-DD') AS tour_date, to_char(start_time,'HH24:MI') AS start_time`,
      [id, guideId],
    );
    const o = q.rows[0];
    if (!o) {
      await client.query("ROLLBACK");
      throw fail(409, "Este tour ya lo apartó otro guía");
    }
    await client.query(
      `INSERT INTO slot_guides (tour_id, tour_date, start_time, guide_id, status, confirmed_at)
       VALUES ($1, $2::date, $3::time, $4, 'confirmed', now())
       ON CONFLICT (tour_id, tour_date, start_time, guide_id) DO UPDATE SET status = 'confirmed', confirmed_at = now()`,
      [o.tour_id, o.tour_date, o.start_time, guideId],
    );
    await client.query("COMMIT");
    const slot = { tourId: o.tour_id, tourDate: o.tour_date, startTime: o.start_time };
    await clearDecline({ ...slot, guideId });
    pushGuideReplyToAdmins({ guideId, ...slot, reply: "taken" });
    return slot;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/** El guía responde a una asignación directa: "Lo hago" o "No puedo". */
export async function replyAssignment({ tourId, tourDate, startTime, guideId, accept }) {
  const q = accept
    ? await pool.query(
        `UPDATE slot_guides SET status = 'confirmed', confirmed_at = now(), updated_at = now()
         WHERE tour_id = $1 AND tour_date = $2::date AND start_time = $3::time AND guide_id = $4 AND status = 'pending'`,
        [tourId, tourDate, startTime, guideId],
      )
    : await pool.query(
        `DELETE FROM slot_guides
         WHERE tour_id = $1 AND tour_date = $2::date AND start_time = $3::time AND guide_id = $4`,
        [tourId, tourDate, startTime, guideId],
      );
  if (!q.rowCount) throw fail(409, "Ese tour ya no está asignado a vos");
  if (!accept) {
    await pool.query(
      `INSERT INTO slot_declines (tour_id, tour_date, start_time, guide_id) VALUES ($1, $2::date, $3::time, $4)
       ON CONFLICT (tour_id, tour_date, start_time, guide_id) DO UPDATE SET declined_at = now()`,
      [tourId, tourDate, startTime, guideId],
    );
  }
  pushGuideReplyToAdmins({ guideId, tourId, tourDate, startTime, reply: accept ? "confirmed" : "declined" });
}

/** Horarios de ese día que este guía rechazó (y no le volvieron a asignar). */
export async function declinesForGuide(guideId, date) {
  const q = await pool.query(
    `SELECT d.tour_id, t.name AS tour_name, to_char(d.start_time,'HH24:MI') AS start_time
     FROM slot_declines d JOIN tours t ON t.id = d.tour_id
     WHERE d.guide_id = $1 AND d.tour_date = $2::date
       AND NOT EXISTS (SELECT 1 FROM slot_guides sg WHERE sg.tour_id = d.tour_id AND sg.tour_date = d.tour_date
                         AND sg.start_time = d.start_time AND sg.guide_id = d.guide_id)`,
    [guideId, date],
  );
  return q.rows.map((r) => ({ tourId: r.tour_id, tourName: r.tour_name, startTime: r.start_time }));
}
