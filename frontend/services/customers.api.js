// src/services/customers.api.js
import { api } from "./api";

export function upsertCustomer({ name, email, phone }) {
  return api.post("/api/customers", {
    name,
    email,
    phone,
  });
}
