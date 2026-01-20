import { Router } from "express";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5, // 5 intentos
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados intentos, intenta más tarde" },
});

router.post("/login", loginLimiter, (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign(
      { username, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.cookie("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 2 * 60 * 60 * 1000,
      path: "/",
    });

    return res.json({ ok: true });
  }

  return res.status(401).json({ message: "Credenciales inválidas" });
});

// para que el front valide sesión
router.get("/me", authenticateToken, (req, res) => {
  res.json({ ok: true, user: req.user });
});

// logout
router.post("/logout", (req, res) => {
  const isProd = process.env.NODE_ENV === "production";

  res.clearCookie("admin_token", {
    path: "/",
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
  });

  res.json({ ok: true });
});



export default router;
