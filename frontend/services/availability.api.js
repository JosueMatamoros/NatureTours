import { api } from "./api"; // ajustá el path si tu api.js está en otro lado

export function getAvailabilityBlocked({ tourId, from, to }) {
  const qs = new URLSearchParams({
    tourId: String(tourId),
    from: String(from).trim(),
    to: String(to).trim(),
  }).toString();

  return api.get(`/api/availability/blocked?${qs}`);
}
