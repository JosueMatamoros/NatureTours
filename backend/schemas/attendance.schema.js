// src/schemas/attendance.schema.js
import { z } from "zod";

export const attendanceDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date debe ser YYYY-MM-DD"),
});

export const setArrivedSchema = z.object({
  arrived: z.boolean(),
});

// Alta manual de una reserva (walk-in / teléfono / OTA cargada a mano).
// No lleva reseller ni pasarela: el admin registra cuánto se cobró (paid).
export const manualBookingSchema = z
  .object({
    tourId: z.number().int().positive(),
    tourDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "tourDate debe ser YYYY-MM-DD"),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "startTime debe ser HH:MM (24h)"),
    name: z.string().trim().min(1, "El nombre es requerido").max(120),
    phone: z.string().trim().max(30).nullable().optional().or(z.literal("")),
    adults: z.number().int().min(1).max(25),
    children: z.number().int().min(0).max(24),
    babies: z.number().int().min(0).max(24),
    paid: z.number().min(0).max(100000).default(0),
  })
  .refine((d) => d.adults + d.children >= 1, {
    message: "La reserva necesita al menos 1 persona",
    path: ["adults"],
  })
  .refine((d) => d.babies <= d.adults, {
    message: "Cada bebé debe ir acompañado por un adulto",
    path: ["babies"],
  });
