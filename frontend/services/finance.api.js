// src/services/finance.api.js — Finanzas (cierre mensual, solo admin)
import { api } from "./api";

export function getFinanceMonth(month) {
  return api.get(`/api/finance?month=${encodeURIComponent(month)}`);
}

export function saveFinanceMonth(month, fields) {
  return api.put(`/api/finance/${month}`, fields);
}

export function addFinancePayment(fields) {
  return api.post("/api/finance/payments", fields);
}

export function deleteFinancePayment(id) {
  return api.delete(`/api/finance/payments/${id}`);
}
