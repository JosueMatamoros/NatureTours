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

export function getPayments() {
  const path = "/api/payments";
  console.log("Solicitando:", import.meta.env.VITE_API_URL + path);
  return api.get(path);
}
