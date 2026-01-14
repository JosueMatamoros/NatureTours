import { api } from "./api";

export function createBooking({ tourId, tourDate, startTime, guests }) {
  return api.post("/api/bookings", {
    tourId,
    tourDate,
    startTime,
    guests,
  });
}

export function getBookingById(bookingId) {
  return api.get(`/api/bookings/${bookingId}`);
}

export function expireBooking(bookingId) {
  if (!bookingId) throw new Error("bookingId requerido");
  return api.patch(`/api/bookings/${bookingId}/expire`);
}

export const validateBooking = (id) => api.get(`/api/bookings/${id}/validate`);

