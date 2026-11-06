// src/services/custom-payments.api.js
import { api } from "./api";

// Público — página /custom-payment
export function createCustomPayment(fields) {
  return api.post("/api/custom-payments", fields);
}

export function getCustomPayment(id) {
  return api.get(`/api/custom-payments/${id}`);
}

// Admin
export function getAllCustomPayments() {
  return api.get("/api/custom-payments");
}
