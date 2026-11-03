// src/services/special-links.api.js
import { api } from "./api";

// Público — página /link/:id
export function getSpecialLink(id) {
  return api.get(`/api/special-links/${id}`);
}

export function bookSpecialLink(id) {
  return api.post(`/api/special-links/${id}/book`, {});
}

// Admin
export function getAllSpecialLinks() {
  return api.get("/api/special-links");
}

export function createSpecialLink(fields) {
  return api.post("/api/special-links", fields);
}

export function setSpecialLinkActive(id, active) {
  return api.patch(`/api/special-links/${id}`, { active });
}
