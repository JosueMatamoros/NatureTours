// src/services/payments.api.js
import { api } from "./api";

export function createPayment(payload) {
  return api.post("/api/payments", payload);
}
