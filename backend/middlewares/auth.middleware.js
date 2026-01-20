import jwt from "jsonwebtoken";

export function authenticateToken(req, res, next) {
  const cookieToken = req.cookies?.admin_token;

  const authHeader = req.headers.authorization;
  const headerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  const token = cookieToken || headerToken;

  if (!token) return res.status(401).json({ message: "Token requerido" });

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) return res.status(403).json({ message: "Token inválido o expirado" });
    req.user = payload;
    next();
  });
}
