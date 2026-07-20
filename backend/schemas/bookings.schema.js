// src/schemas/bookings.schema.js
import { z } from "zod";

// Desglose por edad: adultos (>12) precio completo, niños (4-12) child_price,
// bebés (<4) gratis y no ocupan espacio (van con un adulto).
const ageBreakdown = {
  adults: z.number().int().min(1).max(25),
  children: z.number().int().min(0).max(24),
  babies: z.number().int().min(0).max(24),
};

export const createBookingSchema = z
  .object({
    tourId: z.number().int().positive(),
    tourDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "tourDate debe ser YYYY-MM-DD"),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "startTime debe ser HH:MM (24h)"),
    // Venta hecha por un reseller (opcional). NULL = venta propia.
    resellerId: z.string().uuid().nullable().optional(),
    ...ageBreakdown,
  })
  .refine((d) => d.adults + d.children >= 2, {
    message: "El tour requiere un mínimo de 2 personas",
    path: ["adults"],
  })
  .refine((d) => d.adults + d.children <= 25, {
    message: "Demasiadas personas para una sola reserva",
  })
  .refine((d) => d.babies <= d.adults, {
    message: "Cada bebé debe ir acompañado por un adulto",
  });

export const bookingIdSchema = z.object({
  id: z.string().uuid(),
});

export const changeBookingSchema = z.object({
  tourId: z.number().int().positive(),
  tourDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  ...ageBreakdown,
});
