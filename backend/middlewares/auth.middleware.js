import jwt from "jsonwebtoken";
import { pool } from "../db.js";

// Las sesiones del portal duran 30 días: en cada request se confirma que el
// guía siga activo (y admin, si entra al panel). Desactivarlo corta el acceso.
async function guideStillAllowed(guideId, needAdmin) {
  const q = await pool.query(
    `SELECT active, is_admin FROM guides WHERE id = $1`,
    [guideId]
  );
  const g = q.rows[0];
  return Boolean(g && g.active && (!needAdmin || g.is_admin));
}

export function authenticateToken(req, res, next) {
  const cookieToken = req.cookies?.admin_token;

  const authHeader = req.headers.authorization;
  const headerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  const token = cookieToken || headerToken;

  if (!token) return res.status(401).json({ message: "Token requerido" });

  jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
    if (err) return res.status(403).json({ message: "Token inválido o expirado" });
    // Token de admin emitido por el login de guía: revalidar contra la BD.
    if (payload?.guideId) {
      try {
        if (!(await guideStillAllowed(payload.guideId, true))) {
          return res.status(403).json({ message: "Acceso revocado" });
        }
      } catch (e) {
        console.error("authenticateToken guide check error:", e);
        return res.status(500).json({ message: "Error de autenticación" });
      }
    }
    req.user = payload;
    next();
  });
}

// Auth para el portal de guías: token propio (cookie guide_token o Bearer),
// con role="guide". No comparte sesión con el admin.
export function authenticateGuide(req, res, next) {
  const cookieToken = req.cookies?.guide_token;
  const authHeader = req.headers.authorization;
  const headerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  const token = cookieToken || headerToken;
  if (!token) return res.status(401).json({ message: "Token requerido" });

  jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
    if (err) return res.status(403).json({ message: "Token inválido o expirado" });
    if (payload?.role !== "guide" || !payload?.guideId) {
      return res.status(403).json({ message: "Token no es de guía" });
    }
    try {
      if (!(await guideStillAllowed(payload.guideId, false))) {
        return res.status(403).json({ message: "Acceso revocado" });
      }
    } catch (e) {
      console.error("authenticateGuide check error:", e);
      return res.status(500).json({ message: "Error de autenticación" });
    }
    req.guide = payload;
    next();
  });
}
