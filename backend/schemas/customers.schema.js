import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().trim().min(3),
  email: z.string().trim().email(),
  phone: z.string().trim().optional().or(z.literal("")),
});

export const customerIdSchema = z.object({
  id: z.string().uuid(),
});
