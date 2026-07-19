// src/services/resellers.api.js
import { api } from "./api";

// Público — página /reseller/:id
export function getResellerById(resellerId) {
  if (!resellerId) throw new Error("resellerId requerido");
  return api.get(`/api/resellers/${resellerId}`);
}

// Admin
export function getAllResellers() {
  return api.get("/api/resellers");
}

export function createReseller({ name, email, phone, commission }) {
  return api.post("/api/resellers", { name, email, phone, commission });
}

export function updateReseller(resellerId, fields) {
  return api.patch(`/api/resellers/${resellerId}`, fields);
}

export function getResellerCommissions(resellerId) {
  return api.get(`/api/resellers/${resellerId}/commissions`);
}

export function updateCommissionStatus(paymentId, status) {
  return api.patch(`/api/resellers/commissions/${paymentId}`, { status });
}
