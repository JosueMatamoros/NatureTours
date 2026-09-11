// src/services/attendance.api.js
import { api } from "./api";

// Lista de reservas de un día (web confirmadas + manuales) para control de asistencia.
export function getAttendance(date) {
  if (!date) throw new Error("date requerido (YYYY-MM-DD)");
  return api.get(`/api/attendance?date=${date}`);
}

// Marca (o desmarca) que un grupo ya llegó.
export function setArrived(bookingId, arrived) {
  if (!bookingId) throw new Error("bookingId requerido");
  return api.patch(`/api/attendance/${bookingId}`, { arrived });
}

// Alta manual de una reserva (walk-in / teléfono).
export function createManualBooking(payload) {
  return api.post("/api/attendance/manual", payload);
}
