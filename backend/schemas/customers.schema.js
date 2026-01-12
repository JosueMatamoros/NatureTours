import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().trim().min(3),
  email: z.string().trim().email(),
  phone: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().min(8).max(15).optional()
  ),
});
