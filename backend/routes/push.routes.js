// Suscripción a notificaciones push de la app (PWA).
// Se asocia al usuario del portal (login por cédula): guías y admins.
import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";
import { authenticateGuide } from "../middlewares/auth.middleware.js";
import { getVapidPublicKey } from "../utils/push.js";

const router = Router();

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({
    p256dh: z.string().min(10).max(200),
    auth: z.string().min(8).max(100),
  }),
});

// GET /api/push/public-key — clave pública VAPID para suscribirse.
router.get("/public-key", async (_req, res) => {
  try {
    const key = await getVapidPublicKey();
    if (!key) return res.status(503).json({ ok: false, message: "Push sin configurar" });
    return res.json({ ok: true, publicKey: key });
  } catch (err) {
    console.error("push public-key error:", err);
    return res.status(500).json({ ok: false, message: "Error" });
  }
});

// POST /api/push/subscribe { subscription } — guarda/actualiza este teléfono.
router.post("/subscribe", authenticateGuide, async (req, res) => {
  const parsed = subscriptionSchema.safeParse(req.body?.subscription);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "Suscripción inválida" });
  }
  const { endpoint, keys } = parsed.data;
  try {
    await pool.query(
      `insert into push_subscriptions (guide_id, endpoint, p256dh, auth, user_agent)
       values ($1, $2, $3, $4, $5)
       on conflict (endpoint) do update set
         guide_id = excluded.guide_id, p256dh = excluded.p256dh,
         auth = excluded.auth, user_agent = excluded.user_agent`,
      [
        req.guide.guideId,
        endpoint,
        keys.p256dh,
        keys.auth,
        String(req.headers["user-agent"] || "").slice(0, 300),
      ]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("push subscribe error:", err);
    return res.status(500).json({ ok: false, message: "Error guardando suscripción" });
  }
});

// POST /api/push/unsubscribe { endpoint }
router.post("/unsubscribe", authenticateGuide, async (req, res) => {
  const endpoint = String(req.body?.endpoint || "");
  try {
    await pool.query(
      `delete from push_subscriptions where endpoint = $1 and guide_id = $2`,
      [endpoint, req.guide.guideId]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("push unsubscribe error:", err);
    return res.status(500).json({ ok: false, message: "Error" });
  }
});

export default router;
