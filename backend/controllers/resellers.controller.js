// src/controllers/resellers.controller.js
import { pool } from "../db.js";
import { z } from "zod";

const resellerIdSchema = z.object({ id: z.string().uuid() });

// GET /api/resellers/:id
// Endpoint publico para la pagina /reseller/:id.
// Solo expone lo necesario para renderizar precios: nombre y descuento.
export async function getResellerById(req, res) {
  const parsed = resellerIdSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(404).json({ ok: false, message: "Reseller no encontrado" });
  }

  try {
    const q = await pool.query(
      `
      SELECT id, name, GREATEST(30 - commission, 0) AS discount
      FROM resellers
      WHERE id = $1 AND active = true
      `,
      [parsed.data.id],
    );

    if (q.rowCount === 0) {
      return res.status(404).json({ ok: false, message: "Reseller no encontrado" });
    }

    const r = q.rows[0];

    return res.json({
      ok: true,
      reseller: {
        id: r.id,
        name: r.name,
        discount: Number(r.discount), // % de descuento al cliente (30 - commission)
      },
    });
  } catch (err) {
    console.error("getResellerById error:", err);
    return res.status(500).json({ ok: false, message: "Error obteniendo reseller" });
  }
}
