import { api } from "./api";

/**
 * Envía el recibo por email
 * @param {Object} receipt - Datos del recibo
 */
export async function sendReceiptEmail(receipt) {
  return api.post("/api/email/send-receipt", { receipt });
}
