// Notificaciones de Mis Gastos (Web Push con las mismas claves VAPID del negocio).
import { sendNotification } from "web-push";
import { pool } from "../db.js";
import { ensureVapid } from "../utils/push.js";
import { S } from "./esquema.js";

const colones = (n) => "₡" + Math.round(Number(n) || 0).toLocaleString("en-US");

export async function avisarUsuario(usuarioId, payload) {
  try {
    const q = await pool.query(`SELECT * FROM ${S}.push WHERE usuario_id = $1`, [usuarioId]);
    if (!q.rowCount) return;
    await ensureVapid();
    await Promise.allSettled(q.rows.map(async (s) => {
      try {
        await sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: 86400, urgency: "normal" });
        await pool.query(`UPDATE ${S}.push SET ultimo_ok = now() WHERE id = $1`, [s.id]);
      } catch (err) {
        if (err?.statusCode === 404 || err?.statusCode === 410) await pool.query(`DELETE FROM ${S}.push WHERE id = $1`, [s.id]);
        else console.error("gastos push error:", err?.statusCode, err?.body || err?.message);
      }
    }));
  } catch (err) {
    console.error("gastos avisarUsuario error:", err);
  }
}

/** Un aviso por gasto nuevo; si llegan muchos juntos, uno solo con el resumen. */
export async function avisarGastosNuevos(usuarioId, nuevos) {
  if (!nuevos.length) return;
  if (nuevos.length > 3) {
    const total = nuevos.reduce((t, g) => t + Number(g.monto), 0);
    return avisarUsuario(usuarioId, { title: `${nuevos.length} gastos nuevos`, body: `${colones(total)} en total · tócalos para clasificarlos`, url: "./", tag: "gastos-varios" });
  }
  for (const g of nuevos) {
    const pendiente = !g.categoria_id;
    await avisarUsuario(usuarioId, {
      title: `${colones(g.monto)} · ${g.comercio}`,
      body: pendiente ? "Toca para elegir su categoría" : `Guardado en ${g.categoria_nombre}. Toca si quieres cambiarla.`,
      url: `./#gasto=${g.id}`,
      tag: `gasto-${g.id}`,
    });
  }
}
