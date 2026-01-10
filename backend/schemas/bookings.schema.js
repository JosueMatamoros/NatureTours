// src/schemas/bookings.schema.js
import { z } from "zod";

export const createBookingSchema = z.object({
  tourId: z.number().int().positive(),
  tourDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "tourDate debe ser YYYY-MM-DD"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "startTime debe ser HH:MM (24h)"),
  guests: z.number().int().min(1).max(25),
});

export const bookingIdSchema = z.object({
  id: z.string().uuid(),
});
