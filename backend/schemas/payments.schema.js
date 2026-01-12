// src/schemas/payments.schema.js
import { z } from "zod";

export const createPaymentSchema = z.object({
  bookingId: z.string().uuid(),
  customerId: z.string().uuid().nullable().optional(),
  mode: z.enum(["full", "deposit"]),
  amount: z.number().positive(),
  paypalOrderId: z.string().min(6),
  paypalCaptureId: z.string().min(6).nullable().optional(),
  status: z.enum(["created", "completed", "cancelled", "failed"]),
});
