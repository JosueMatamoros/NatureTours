import { api } from "./api";

export function getDayBlocks({ tourId, from, to }) {
  const qs = new URLSearchParams({
    tourId: String(tourId),
    from: String(from).trim(),
    to: String(to).trim(),
  }).toString();
  return api.get(`/api/availability/blocks?${qs}`);
}

export function blockDay({ tourId, day, reason }) {
  return api.post("/api/availability/blocks", { tourId, day, reason });
}

export function unblockDay({ tourId, day }) {
  const qs = new URLSearchParams({
    tourId: String(tourId),
    day: String(day).trim(),
  }).toString();
  return api.delete(`/api/availability/blocks?${qs}`);
}
