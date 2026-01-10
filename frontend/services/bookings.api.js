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
