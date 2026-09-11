// Portal de guías: login propio (cédula + contraseña) y vista de su día.
import { api } from "./api";

export function guideLogin(cedula, password) {
  return api.post("/api/guide/login", { cedula, password });
}

export function guideLogout() {
  return api.post("/api/guide/logout");
}

export function guideMe() {
  return api.get("/api/guide/me");
}

// Horarios asignados al guía ese día + sus reservas.
export function getGuideMyDay(date) {
  if (!date) throw new Error("date requerido (YYYY-MM-DD)");
  return api.get(`/api/guide/my-day?date=${date}`);
}

// Días (desde hoy) con al menos un horario asignado.
export function getGuideMyDays() {
  return api.get("/api/guide/my-days");
}

// El guía marca (o desmarca) que un grupo ya llegó. Escribe el mismo estado
// que ve el admin en Asistencia/Reservaciones.
export function guideSetArrived(bookingId, arrived) {
  if (!bookingId) throw new Error("bookingId requerido");
  return api.patch(`/api/guide/attendance/${bookingId}`, { arrived });
}
