import { api } from "./api";

/**
 * Envía el recibo por email
 * @param {Object} receipt - Datos del recibo
 * @param {string} paymentId - ID del pago para idempotencia
 */
export async function sendReceiptEmail(receipt, paymentId) {
  return api.post("/api/email/send-receipt", { receipt, paymentId });
}
