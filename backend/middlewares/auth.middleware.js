import jwt from "jsonwebtoken";
import { pool } from "../db.js";

// Las sesiones del portal duran 30 días: en cada request se confirma que el
// guía siga activo (y admin, si entra al panel). Desactivarlo corta el acceso.
async function loadGuide(guideId) {
  const q = await pool.query(
    `SELECT name, active, is_admin, is_supervisor, is_viewer, is_guide, can_horses FROM guides WHERE id = $1`,
    [guideId]
  );
  return q.rows[0] || null;
}

async function guideStillAllowed(guideId, needAdmin) {
  const g = await loadGuide(guideId);
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
    let g;
    try {
      g = await loadGuide(payload.guideId);
    } catch (e) {
      console.error("authenticateGuide check error:", e);
      return res.status(500).json({ message: "Error de autenticación" });
    }
    if (!g || !g.active) {
      return res.status(403).json({ message: "Acceso revocado" });
    }
    // Los roles salen SIEMPRE de la BD, no del token (que dura 30 días): si a
    // alguien le quitan supervisor, deja de ver lo de supervisor (p. ej. el
    // dinero del día) en la siguiente consulta. Solo lectura nunca es admin
    // ni supervisor.
    const isViewer = Boolean(g.is_viewer);
    req.guide = {
      ...payload,
      isViewer,
      isAdmin: !isViewer && Boolean(g.is_admin),
      isSupervisor: !isViewer && Boolean(g.is_supervisor),
      isGuide: !isViewer && g.is_guide !== false,
      canHorses: !isViewer && (Boolean(g.can_horses) || Boolean(g.is_admin)),
    };
    next();
  });
}

// Caballos: entra el encargado de caballos (guía con can_horses) y cualquier
// admin, sea con la sesión del portal (guía) o con la del panel (admin).
export function authenticateHorses(req, res, next) {
  const authHeader = req.headers.authorization;
  const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  const tokens = [headerToken, req.cookies?.guide_token, req.cookies?.admin_token].filter(Boolean);
  if (!tokens.length) return res.status(401).json({ message: "Token requerido" });

  (async () => {
    for (const t of tokens) {
      let payload;
      try { payload = jwt.verify(t, process.env.JWT_SECRET); } catch { continue; }
      if (payload?.guideId) {
        const g = await loadGuide(payload.guideId);
        if (!g || !g.active || g.is_viewer) continue;
        if (!(g.is_admin || g.can_horses)) continue;
        req.horseUser = { guideId: payload.guideId, name: g.name, isAdmin: Boolean(g.is_admin) };
        return next();
      }
      if (payload?.role === "admin") {
        req.horseUser = { guideId: null, name: payload.username || "Admin", isAdmin: true };
        return next();
      }
    }
    return res.status(403).json({ message: "Sin acceso a caballos" });
  })().catch((e) => {
    console.error("authenticateHorses error:", e);
    res.status(500).json({ message: "Error de autenticación" });
  });
}
