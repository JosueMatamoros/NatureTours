// src/services/pendingBooking.api.js
import { api } from "./api";

export function getBookingById(id) {
  return api.get(`/api/bookings/${id}`);
}

export function changePendingBooking(id, payload) {
  return api.post(`/api/bookings/${id}/change`, payload);
}
