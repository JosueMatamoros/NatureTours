// src/controllers/customers.controller.js
import { pool } from "../db.js";
import { createCustomerSchema } from "../schemas/customers.schema.js";

export async function upsertCustomer(req, res) {
  const parsed = createCustomerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const { name, email, phone } = parsed.data;

  try {
    const result = await pool.query(
      `
      insert into customers (name, email, phone)
      values ($1, $2, $3)
      on conflict (email)
      do update set
        name = excluded.name,
        phone = excluded.phone
      returning id;
      `,
      [name, email, phone || null]
    );

    return res.json({ ok: true, id: result.rows[0].id });
  } catch (err) {
    console.error("upsertCustomer error:", err);
    return res.status(500).json({ ok: false, message: "Error creando customer" });
  }
}
