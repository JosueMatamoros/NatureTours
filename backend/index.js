// src/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import bookingsRoutes from "./routes/bookings.routes.js";
import customersRoutes from "./routes/customers.routes.js";
import paymentsRoutes from "./routes/payments.routes.js";
import availabilityRoutes from "./routes/availability.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true, now: new Date().toISOString() });
});

app.use("/api/bookings", bookingsRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/payments", paymentsRoutes)
app.use("/api/availability", availabilityRoutes);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
