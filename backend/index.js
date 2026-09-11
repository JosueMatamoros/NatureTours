import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import bookingsRoutes from "./routes/bookings.routes.js";
import customersRoutes from "./routes/customers.routes.js";
import paymentsRoutes from "./routes/payments.routes.js";
import availabilityRoutes from "./routes/availability.routes.js";
import emailRoutes from "./routes/email.routes.js";
import availabilityBlocksRoutes from "./routes/availability.blocks.routes.js";
import slotOverridesRoutes from "./routes/availability.slot-overrides.routes.js";
import resellersRoutes from "./routes/resellers.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import guidesRoutes from "./routes/guides.routes.js";
import guidePortalRoutes from "./routes/guide-portal.routes.js";
import bookingsManageRoutes from "./routes/bookings.manage.routes.js";
import { pool } from "./db.js";

dotenv.config();

const app = express();
app.set("trust proxy", 1);

app.use(helmet());
app.use(cookieParser());
app.use(express.json());

// CORS
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174", // Vite usa este puerto cuando el 5173 está ocupado
  "http://localhost:5175", // fallback cuando 5173/5174 están ocupados
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));

app.get("/health", (req, res) => {
  res.json({ ok: true, now: new Date().toISOString() });
});

// Auth
app.use("/api/auth", authRoutes);

// Rutas
app.use("/api/bookings", bookingsRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/availability/blocks", availabilityBlocksRoutes);
app.use("/api/availability/slot-overrides", slotOverridesRoutes);
app.use("/api/resellers", resellersRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/guides", guidesRoutes);
app.use("/api/guide", guidePortalRoutes);
app.use("/api/reservations", bookingsManageRoutes);

const port = process.env.PORT || 4000;

// Migraciones idempotentes al arranque.
const startupMigrations = [
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS email_sent BOOLEAN NOT NULL DEFAULT FALSE`,
  // Módulo de asistencia + reservas manuales.
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS arrived BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMPTZ`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'web'`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS manual_name TEXT`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS manual_phone TEXT`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS manual_paid NUMERIC(10,2) NOT NULL DEFAULT 0`,
  // Módulo de guías + asignación por horario.
  `CREATE TABLE IF NOT EXISTS guides (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     name text NOT NULL,
     email text NOT NULL UNIQUE,
     phone text,
     active boolean NOT NULL DEFAULT true,
     can_create_manual boolean NOT NULL DEFAULT false,
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS slot_guides (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     tour_id integer NOT NULL REFERENCES tours(id),
     tour_date date NOT NULL,
     start_time time NOT NULL,
     guide_id uuid NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
     created_at timestamptz NOT NULL DEFAULT now(),
     updated_at timestamptz NOT NULL DEFAULT now(),
     UNIQUE (tour_id, tour_date, start_time)
   )`,
  // Guía inicial: Josué (sin permiso para crear reservas manuales).
  `INSERT INTO guides (name, email, can_create_manual)
   VALUES ('Josué', '1002matamoros@gmail.com', false)
   ON CONFLICT (email) DO NOTHING`,
];

(async () => {
  try {
    for (const sql of startupMigrations) {
      await pool.query(sql);
    }
    app.listen(port, () => console.log(`API running on http://localhost:${port}`));
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
})();
