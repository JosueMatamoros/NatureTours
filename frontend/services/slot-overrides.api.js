import { api } from "./api";

export function getSlotOverrides({ tourId, from, to }) {
  const qs = new URLSearchParams({
    tourId: String(tourId),
    from: String(from).trim(),
    to: String(to).trim(),
  }).toString();
  return api.get(`/api/availability/slot-overrides?${qs}`);
}

export function upsertSlotOverride({ tourId, tourDate, startTime, capacityOverride }) {
  return api.put("/api/availability/slot-overrides", {
    tourId,
    tourDate,
    startTime,
    capacityOverride,
  });
}

export function deleteSlotOverride({ tourId, tourDate, startTime }) {
  const qs = new URLSearchParams({
    tourId: String(tourId),
    tourDate: String(tourDate).trim(),
    startTime: String(startTime).trim(),
  }).toString();
  return api.delete(`/api/availability/slot-overrides?${qs}`);
}
