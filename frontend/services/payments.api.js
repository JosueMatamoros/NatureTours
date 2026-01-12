import { api } from "./api";

export function createPayment(payload) {
  return api.post("/api/payments", payload);
}

export function getPaymentById(paymentId) {
  if (!paymentId) {
    throw new Error("paymentId es requerido");
  }

  return api.get(`/api/payments/${paymentId}`);
}
