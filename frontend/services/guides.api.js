// src/services/guides.api.js
import { api } from "./api";

export function getGuides() {
  return api.get("/api/guides");
}

export function createGuide({ name, email, phone, canCreateManual }) {
  return api.post("/api/guides", { name, email, phone, canCreateManual });
}

export function updateGuide(id, fields) {
  return api.patch(`/api/guides/${id}`, fields);
}

export function deleteGuide(id) {
  return api.delete(`/api/guides/${id}`);
}

// Asignaciones de guía por horario para un día.
export function getGuideAssignments(date) {
  if (!date) throw new Error("date requerido (YYYY-MM-DD)");
  return api.get(`/api/guides/assignments?date=${date}`);
}

// Agrega (assigned=true) o quita (assigned=false) UN guía de un horario.
// Varios guías pueden compartir el mismo horario.
export function assignGuide({ tourId, tourDate, startTime, guideId, assigned = true }) {
  return api.put("/api/guides/assignments", { tourId, tourDate, startTime, guideId, assigned });
}
