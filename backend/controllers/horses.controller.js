// Caballos: ficha de cada caballo (herraduras por casco, descanso por lesión),
// historial de lo que se reporta y qué caballo salió en cada tour.
//
// Cascos: mi / md = manos (adelante, izquierda / derecha)
//         pi / pd = patas (atrás, izquierda / derecha)
//
// Asientos de un tour (tour_horses.seat):
//   m:<guideId>        caballo del encargado de caballos (Marlon): va en todos los tours
//   g:<guideId>        caballo del guía (g:0 si el horario aún no tiene guía)
//   b:<bookingId>:<n>  caballo n de una reserva (uno por adulto/niño)
//   x:<n>              caballo extra (ayudante, otro guía…)
import { pool } from "../db.js";
import { z } from "zod";
import { DateTime } from "luxon";
import { getBusinessTimeZone, todayYmdInBusinessZone } from "../utils/businessTime.js";

const HOOVES = ["mi", "md", "pi", "pd"];
const FRONT = ["mi", "md"];
const BACK = ["pi", "pd"];
const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const idSchema = z.object({ id: z.string().uuid() });

const horseBody = z.object({
  name: z.string().trim().min(1).max(60),
  // Foto chica (el teléfono la achica antes de mandarla): data URL JPEG.
  photo: z.string().max(95000).regex(/^data:image\/(jpeg|png|webp);base64,/).nullable().optional(),
  color: z.string().trim().max(60).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  active: z.boolean().optional(),
  shoes: z.object({ mi: z.boolean(), md: z.boolean(), pi: z.boolean(), pd: z.boolean() }).optional(),
});

const eventBody = z.object({
  kind: z.enum(["herrado", "herradura_caida", "lastimado", "recuperado", "nota"]),
  hooves: z.array(z.enum(HOOVES)).max(4).optional(),
  date: ymd.optional(),
  restDays: z.number().int().min(1).max(90).optional(),
  detail: z.string().trim().max(300).optional(),
});

const assignBody = z.object({
  tourId: z.number().int().positive(),
  date: ymd,
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  seat: z.string().regex(/^(m:[0-9a-f-]{36}|g:([0-9a-f-]{36}|0)|b:[0-9a-f-]{36}:\d{1,2}|x:\d{1,2})$/),
  horseId: z.string().uuid().nullable(),
  force: z.boolean().optional(),
});

const fmt = (d) => d || null; // las fechas ya vienen como 'YYYY-MM-DD' (to_char)

function daysSince(date, today) {
  if (!date) return null;
  return Math.round(DateTime.fromISO(today).diff(DateTime.fromISO(date), "days").days);
}

function mapHorse(r, today = todayYmdInBusinessZone()) {
  const restUntil = fmt(r.rest_until);
  const shoes = { mi: false, md: false, pi: false, pd: false, ...(r.shoes || {}) };
  const shodFrontAt = fmt(r.shod_front_at);
  const shodBackAt = fmt(r.shod_back_at);
  return {
    id: r.id,
    name: r.name,
    photo: r.photo,
    color: r.color,
    notes: r.notes,
    active: r.active,
    shoes,
    shodFrontAt,
    shodBackAt,
    daysFront: daysSince(shodFrontAt, today),
    daysBack: daysSince(shodBackAt, today),
    resting: Boolean(restUntil && restUntil >= today),
    restUntil,
    restReason: r.rest_reason,
  };
}

const HORSE_COLS = `id, name, photo, color, notes, active, shoes,
  to_char(shod_front_at,'YYYY-MM-DD') AS shod_front_at, to_char(shod_back_at,'YYYY-MM-DD') AS shod_back_at,
  to_char(rest_until,'YYYY-MM-DD') AS rest_until, rest_reason`;

// GET /api/horses/me
export function horsesMe(req, res) {
  return res.json({ ok: true, user: req.horseUser, today: todayYmdInBusinessZone() });
}

// GET /api/horses
export async function listHorses(_req, res) {
  try {
    const q = await pool.query(`SELECT ${HORSE_COLS} FROM horses ORDER BY active DESC, lower(name)`);
    const today = todayYmdInBusinessZone();
    return res.json({ ok: true, today, horses: q.rows.map((r) => mapHorse(r, today)) });
  } catch (err) {
    console.error("listHorses error:", err);
    return res.status(500).json({ ok: false, message: "Error cargando caballos" });
  }
}

// POST /api/horses
export async function createHorse(req, res) {
  const p = horseBody.safeParse(req.body);
  if (!p.success) return res.status(400).json({ ok: false, message: "Revisá el nombre o la foto" });
  const { name, photo, color, notes, shoes } = p.data;
  try {
    const q = await pool.query(
      `INSERT INTO horses (name, photo, color, notes, shoes)
       VALUES ($1, $2, $3, $4, COALESCE($5::jsonb, '{"mi":false,"md":false,"pi":false,"pd":false}'))
       RETURNING ${HORSE_COLS}`,
      [name, photo || null, color || null, notes || null, shoes ? JSON.stringify(shoes) : null],
    );
    return res.status(201).json({ ok: true, horse: mapHorse(q.rows[0]) });
  } catch (err) {
    console.error("createHorse error:", err);
    return res.status(500).json({ ok: false, message: "Error guardando el caballo" });
  }
}

// PATCH /api/horses/:id
export async function updateHorse(req, res) {
  const idp = idSchema.safeParse(req.params);
  const p = horseBody.partial().safeParse(req.body);
  if (!idp.success || !p.success) return res.status(400).json({ ok: false, message: "Datos inválidos" });
  const d = p.data;
  const sets = [];
  const vals = [idp.data.id];
  const add = (col, v) => { vals.push(v); sets.push(`${col} = $${vals.length}`); };
  if (d.name !== undefined) add("name", d.name);
  if (d.photo !== undefined) add("photo", d.photo || null);
  if (d.color !== undefined) add("color", d.color || null);
  if (d.notes !== undefined) add("notes", d.notes || null);
  if (d.active !== undefined) add("active", d.active);
  if (d.shoes !== undefined) { vals.push(JSON.stringify(d.shoes)); sets.push(`shoes = $${vals.length}::jsonb`); }
  if (!sets.length) return res.status(400).json({ ok: false, message: "Nada que cambiar" });
  try {
    const q = await pool.query(
      `UPDATE horses SET ${sets.join(", ")}, updated_at = now() WHERE id = $1 RETURNING ${HORSE_COLS}`,
      vals,
    );
    if (!q.rowCount) return res.status(404).json({ ok: false, message: "Caballo no encontrado" });
    return res.json({ ok: true, horse: mapHorse(q.rows[0]) });
  } catch (err) {
    console.error("updateHorse error:", err);
    return res.status(500).json({ ok: false, message: "Error guardando el caballo" });
  }
}

// POST /api/horses/:id/events  { kind, hooves?, date?, restDays?, detail? }
// Lo que reporta el encargado: se herró, se le cayó una herradura, está
// renco / lastimado (descansa N días), ya está bien, o una nota.
export async function addHorseEvent(req, res) {
  const idp = idSchema.safeParse(req.params);
  const p = eventBody.safeParse(req.body);
  if (!idp.success || !p.success) return res.status(400).json({ ok: false, message: "Datos inválidos" });
  const { kind, detail } = p.data;
  const hooves = [...new Set(p.data.hooves || [])];
  const today = todayYmdInBusinessZone();
  const date = p.data.date && p.data.date <= today ? p.data.date : today;

  if ((kind === "herrado" || kind === "herradura_caida") && !hooves.length) {
    return res.status(400).json({ ok: false, message: "Tocá cuáles cascos" });
  }
  if (kind === "nota" && !detail) {
    return res.status(400).json({ ok: false, message: "Escribí la nota" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const cur = await client.query(`SELECT ${HORSE_COLS} FROM horses WHERE id = $1 FOR UPDATE`, [idp.data.id]);
    if (!cur.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ ok: false, message: "Caballo no encontrado" });
    }
    const h = cur.rows[0];
    const shoes = { mi: false, md: false, pi: false, pd: false, ...(h.shoes || {}) };
    let restDays = null;

    if (kind === "herrado") {
      hooves.forEach((k) => { shoes[k] = true; });
      await client.query(
        `UPDATE horses SET shoes = $2::jsonb,
           shod_front_at = CASE WHEN $3 THEN $5::date ELSE shod_front_at END,
           shod_back_at  = CASE WHEN $4 THEN $5::date ELSE shod_back_at END,
           updated_at = now()
         WHERE id = $1`,
        [h.id, JSON.stringify(shoes), hooves.some((k) => FRONT.includes(k)), hooves.some((k) => BACK.includes(k)), date],
      );
    } else if (kind === "herradura_caida") {
      hooves.forEach((k) => { shoes[k] = false; });
      await client.query(`UPDATE horses SET shoes = $2::jsonb, updated_at = now() WHERE id = $1`, [h.id, JSON.stringify(shoes)]);
    } else if (kind === "lastimado") {
      // Sin días: queda no disponible hasta que lo marquen "disponible".
      restDays = p.data.restDays || null;
      const until = restDays
        ? DateTime.fromISO(today, { zone: getBusinessTimeZone() }).plus({ days: restDays }).toFormat("yyyy-LL-dd")
        : "2999-12-31";
      await client.query(
        `UPDATE horses SET rest_until = $2::date, rest_reason = $3, updated_at = now() WHERE id = $1`,
        [h.id, until, detail || null],
      );
    } else if (kind === "recuperado") {
      await client.query(`UPDATE horses SET rest_until = NULL, rest_reason = NULL, updated_at = now() WHERE id = $1`, [h.id]);
    }

    await client.query(
      `INSERT INTO horse_events (horse_id, kind, event_date, hooves, rest_days, detail, by_guide, by_name)
       VALUES ($1, $2, $3::date, $4, $5, $6, $7, $8)`,
      [h.id, kind, date, hooves.length ? hooves : null, restDays, detail || null, req.horseUser.guideId, req.horseUser.name],
    );
    const out = await client.query(`SELECT ${HORSE_COLS} FROM horses WHERE id = $1`, [h.id]);
    await client.query("COMMIT");
    return res.json({ ok: true, horse: mapHorse(out.rows[0], today) });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("addHorseEvent error:", err);
    return res.status(500).json({ ok: false, message: "No se pudo guardar" });
  } finally {
    client.release();
  }
}

// GET /api/horses/:id/events — historial (últimos 60) + últimas salidas.
export async function horseHistory(req, res) {
  const idp = idSchema.safeParse(req.params);
  if (!idp.success) return res.status(400).json({ ok: false, message: "Id inválido" });
  try {
    const ev = await pool.query(
      `SELECT id, kind, to_char(event_date,'YYYY-MM-DD') AS date, hooves, rest_days, detail, by_name, created_at
       FROM horse_events WHERE horse_id = $1 ORDER BY created_at DESC LIMIT 60`,
      [idp.data.id],
    );
    const tours = await pool.query(
      `SELECT to_char(th.tour_date,'YYYY-MM-DD') AS date, to_char(th.start_time,'HH24:MI') AS start_time,
              th.role, t.name AS tour_name
       FROM tour_horses th JOIN tours t ON t.id = th.tour_id
       WHERE th.horse_id = $1 ORDER BY th.tour_date DESC, th.start_time DESC LIMIT 20`,
      [idp.data.id],
    );
    return res.json({
      ok: true,
      events: ev.rows.map((r) => ({
        id: r.id, kind: r.kind, date: r.date, hooves: r.hooves || [], restDays: r.rest_days,
        detail: r.detail, by: r.by_name, at: r.created_at,
      })),
      tours: tours.rows.map((r) => ({ date: r.date, startTime: r.start_time, role: r.role, tourName: r.tour_name })),
    });
  } catch (err) {
    console.error("horseHistory error:", err);
    return res.status(500).json({ ok: false, message: "Error cargando historial" });
  }
}

// Cuántos caballos necesita una reserva: uno por adulto y niño (los bebés no montan).
function ridersOf(b) {
  const n = Number(b.adults || 0) + Number(b.children || 0);
  if (n > 0) return Math.min(n, 30);
  return Math.max(Math.min(Number(b.guests || 0) - Number(b.babies || 0), 30), 1);
}

// GET /api/horses/day?date=YYYY-MM-DD
// Tours con caballos ese día: guía(s), reservas con cuántos caballos necesitan,
// y qué caballo está en cada asiento. También la lista de caballos.
export async function horsesDay(req, res) {
  const p = z.object({ date: ymd }).safeParse(req.query);
  if (!p.success) return res.status(400).json({ ok: false, message: "date debe ser YYYY-MM-DD" });
  const { date } = p.data;
  try {
    const [bq, gq, aq, hq, wq] = await Promise.all([
      pool.query(
        `SELECT b.id, b.tour_id, t.name AS tour_name, to_char(b.start_time,'HH24:MI') AS start_time,
                b.adults, b.children, b.babies, b.guests, b.source, b.arrived,
                b.manual_name, c.name AS customer_name
         FROM bookings b
         JOIN tours t ON t.id = b.tour_id
         LEFT JOIN LATERAL (
           SELECT p.mode, p.customer_id FROM payments p
           WHERE p.booking_id = b.id AND p.status = 'completed'
           ORDER BY p.created_at DESC LIMIT 1
         ) pay ON true
         LEFT JOIN customers c ON c.id = pay.customer_id
         WHERE b.tour_date = $1::date
           AND b.status <> 'cancelled'
           AND (b.source <> 'web' OR pay.mode IS NOT NULL)
           AND t.uses_horses
         ORDER BY b.start_time, b.created_at`,
        [date],
      ),
      pool.query(
        `SELECT sg.tour_id, to_char(sg.start_time,'HH24:MI') AS st, g.id, g.name
         FROM slot_guides sg JOIN guides g ON g.id = sg.guide_id
         WHERE sg.tour_date = $1::date ORDER BY sg.created_at`,
        [date],
      ),
      pool.query(
        `SELECT tour_id, to_char(start_time,'HH24:MI') AS st, seat, horse_id
         FROM tour_horses WHERE tour_date = $1::date`,
        [date],
      ),
      pool.query(`SELECT ${HORSE_COLS} FROM horses ORDER BY lower(name)`),
      // Encargados de caballos (Marlon): van en todos los tours, antes del guía.
      pool.query(`SELECT id, name FROM guides WHERE active AND can_horses AND NOT is_admin AND NOT is_viewer ORDER BY name`),
    ]);

    const slots = new Map();
    for (const b of bq.rows) {
      const key = `${b.tour_id}|${b.start_time}`;
      if (!slots.has(key)) {
        slots.set(key, {
          tourId: b.tour_id, tourName: b.tour_name, startTime: b.start_time,
          wranglers: wq.rows.map((w) => ({ id: w.id, name: w.name })), guides: [], groups: [], assigned: {},
        });
      }
      const riders = ridersOf(b);
      slots.get(key).groups.push({
        bookingId: b.id,
        name: (b.source === "web" ? b.customer_name : b.manual_name) || "Sin nombre",
        source: b.source,
        arrived: Boolean(b.arrived),
        riders,
        adults: Math.min(Number(b.adults || 0), riders),
        kids: Math.max(riders - Math.min(Number(b.adults || 0), riders), 0),
        seats: Array.from({ length: riders }, (_, i) => `b:${b.id}:${i + 1}`),
      });
    }
    for (const g of gq.rows) {
      const s = slots.get(`${g.tour_id}|${g.st}`);
      if (s) s.guides.push({ id: g.id, name: g.name });
    }
    // Uso de cada caballo en el día (para avisar "ya salió a las 8:00").
    const usage = {};
    for (const a of aq.rows) {
      const s = slots.get(`${a.tour_id}|${a.st}`);
      if (s) s.assigned[a.seat] = a.horse_id;
      (usage[a.horse_id] ||= []).push(a.st);
    }

    const today = todayYmdInBusinessZone();
    return res.json({
      ok: true,
      date,
      today,
      slots: [...slots.values()].sort((a, b) => a.startTime.localeCompare(b.startTime)),
      horses: hq.rows.map((r) => mapHorse(r, today)),
      usage,
    });
  } catch (err) {
    console.error("horsesDay error:", err);
    return res.status(500).json({ ok: false, message: "Error cargando el día" });
  }
}

// GET /api/horses/days?from=&to= — días con tours a caballo (para el calendario).
export async function horsesDays(req, res) {
  const p = z.object({ from: ymd, to: ymd }).safeParse(req.query);
  if (!p.success) return res.status(400).json({ ok: false, message: "Rango inválido" });
  try {
    const q = await pool.query(
      `SELECT to_char(b.tour_date,'YYYY-MM-DD') AS date
       FROM bookings b JOIN tours t ON t.id = b.tour_id
       WHERE b.tour_date BETWEEN $1::date AND $2::date AND b.status <> 'cancelled' AND t.uses_horses
         AND (b.source <> 'web' OR EXISTS (SELECT 1 FROM payments p WHERE p.booking_id = b.id AND p.status = 'completed'))
       GROUP BY b.tour_date ORDER BY b.tour_date`,
      [p.data.from, p.data.to],
    );
    return res.json({ ok: true, days: q.rows.map((r) => r.date) });
  } catch (err) {
    console.error("horsesDays error:", err);
    return res.status(500).json({ ok: false, message: "Error cargando días" });
  }
}

// PUT /api/horses/day/assign  { tourId, date, startTime, seat, horseId|null, force? }
// Pone (o quita) un caballo en un asiento. Si ese caballo ya estaba en otro
// asiento a la misma hora, se mueve. Un caballo descansando pide force.
export async function assignHorse(req, res) {
  const p = assignBody.safeParse(req.body);
  if (!p.success) return res.status(400).json({ ok: false, message: "Datos inválidos" });
  const { tourId, date, startTime, seat, horseId, force } = p.data;
  const role = seat.startsWith("m:") ? "encargado" : seat.startsWith("g:") ? "guia" : seat.startsWith("b:") ? "cliente" : "extra";
  const bookingId = role === "cliente" ? seat.split(":")[1] : null;
  const guideId = (role === "guia" && seat !== "g:0") || role === "encargado" ? seat.slice(2) : null;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (horseId) {
      const h = await client.query(`SELECT ${HORSE_COLS} FROM horses WHERE id = $1`, [horseId]);
      if (!h.rowCount) {
        await client.query("ROLLBACK");
        return res.status(404).json({ ok: false, message: "Caballo no encontrado" });
      }
      const horse = mapHorse(h.rows[0]);
      if (horse.resting && date <= horse.restUntil && !force) {
        await client.query("ROLLBACK");
        return res.status(409).json({ ok: false, resting: true, message: `${horse.name} está descansando` });
      }
    }
    await client.query(
      `DELETE FROM tour_horses WHERE tour_id = $1 AND tour_date = $2::date AND start_time = $3::time AND seat = $4`,
      [tourId, date, startTime, seat],
    );
    let movedFrom = null;
    if (horseId) {
      const mv = await client.query(
        `DELETE FROM tour_horses WHERE tour_date = $1::date AND start_time = $2::time AND horse_id = $3 RETURNING seat`,
        [date, startTime, horseId],
      );
      movedFrom = mv.rows[0]?.seat || null;
      await client.query(
        `INSERT INTO tour_horses (tour_id, tour_date, start_time, seat, role, booking_id, guide_id, horse_id, by_name)
         VALUES ($1, $2::date, $3::time, $4, $5, $6, $7, $8, $9)`,
        [tourId, date, startTime, seat, role, bookingId, guideId, horseId, req.horseUser.name],
      );
    }
    await client.query("COMMIT");
    return res.json({ ok: true, movedFrom });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    if (err.code === "23503") return res.status(400).json({ ok: false, message: "La reserva o el guía ya no existe" });
    console.error("assignHorse error:", err);
    return res.status(500).json({ ok: false, message: "No se pudo asignar" });
  } finally {
    client.release();
  }
}
