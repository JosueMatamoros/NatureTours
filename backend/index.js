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

dotenv.config();

const app = express();
app.set("trust proxy", 1);

app.use(helmet());
app.use(cookieParser());
app.use(express.json());

// CORS
const allowedOrigins = [
  "http://localhost:5173",
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

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
