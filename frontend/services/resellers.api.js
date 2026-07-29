// src/services/resellers.api.js
import { api } from "./api";

// Público — página /reseller/:id
export function getResellerById(resellerId) {
  if (!resellerId) throw new Error("resellerId requerido");
  return api.get(`/api/resellers/${resellerId}`);
}

// Admin — month opcional "YYYY-MM" para ver solo las ventas de ese mes
export function getAllResellers(month) {
  return api.get(`/api/resellers${month ? `?month=${month}` : ""}`);
}

export function createReseller({
  name,
  email,
  phone,
  commission,
  bacAccount,
  iban,
  accountCurrency,
  paymentFrequency,
}) {
  return api.post("/api/resellers", {
    name,
    email,
    phone,
    commission,
    bacAccount,
    iban,
    accountCurrency,
    paymentFrequency,
  });
}

export function updateReseller(resellerId, fields) {
  return api.patch(`/api/resellers/${resellerId}`, fields);
}

export function getResellerCommissions(resellerId, month) {
  return api.get(
    `/api/resellers/${resellerId}/commissions${month ? `?month=${month}` : ""}`,
  );
}

export function updateCommissionStatus(paymentId, status) {
  return api.patch(`/api/resellers/commissions/${paymentId}`, { status });
}
