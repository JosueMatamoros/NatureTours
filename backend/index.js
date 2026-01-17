// src/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import bookingsRoutes from "./routes/bookings.routes.js";
import customersRoutes from "./routes/customers.routes.js";
import paymentsRoutes from "./routes/payments.routes.js";
import availabilityRoutes from "./routes/availability.routes.js";
import emailRoutes from "./routes/email.routes.js";

dotenv.config();

const app = express();

/**
 * CORS configuration
 * - Local dev: http://localhost:5173
 * - Production: process.env.FRONTEND_URL (Pages now, domain later)
 */
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests without Origin (Postman, curl, PayPal webhooks)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) return callback(null, true);

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true, now: new Date().toISOString() });
});

app.use("/api/bookings", bookingsRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/email", emailRoutes);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
