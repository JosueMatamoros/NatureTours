// Gestión de reservas del admin (crear / editar / cancelar / mover).
import { api } from "./api";

export function listReservations(date) {
  if (!date) throw new Error("date requerido (YYYY-MM-DD)");
  return api.get(`/api/reservations?date=${date}`);
}

export function createReservation(payload) {
  return api.post("/api/reservations", payload);
}

export function editReservation(id, payload) {
  return api.patch(`/api/reservations/${id}`, payload);
}

export function cancelReservation(id) {
  return api.post(`/api/reservations/${id}/cancel`);
}

export function moveReservation(id, tourDate, startTime) {
  return api.post(`/api/reservations/${id}/move`, { tourDate, startTime });
}
