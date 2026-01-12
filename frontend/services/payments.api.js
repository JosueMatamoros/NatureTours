// src/services/payments.api.js
import { api } from "./api";

export function createPayment({
  bookingId,
  customerId,
  mode,               // "deposit" | "full"
  amount,
  paypalOrderId,
  paypalCaptureId,
  status,             // "completed"
}) {
  return api.post("/payments", {
    bookingId,
    customerId,
    mode,
    amount,
    paypalOrderId,
    paypalCaptureId,
    status,
  });
}
