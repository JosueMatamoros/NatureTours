// Portal de guías. Usa token en localStorage + header Authorization (Safari/iOS
// bloquea cookies entre dominios, así que no dependemos de la cookie).
const API_URL = import.meta.env.VITE_API_URL;
if (!API_URL) throw new Error("VITE_API_URL no está definido");

const GUIDE_KEY = "nt_guide_token";
const ADMIN_KEY = "nt_admin_token";

export function getGuideToken() {
  try { return localStorage.getItem(GUIDE_KEY); } catch { return null; }
}
function setTokens(token, adminToken) {
  try {
    if (token) localStorage.setItem(GUIDE_KEY, token);
    // Si el guía es admin, guardamos también el token admin para que el panel
    // (services/api.js) lo mande por header y funcione en el iPhone.
    if (adminToken) localStorage.setItem(ADMIN_KEY, adminToken);
  } catch { /* localStorage no disponible */ }
}
function clearTokens() {
  try {
    localStorage.removeItem(GUIDE_KEY);
    localStorage.removeItem(ADMIN_KEY);
  } catch { /* noop */ }
}

async function guideRequest(path, options = {}) {
  const token = getGuideToken();
  const { headers: optHeaders, ...rest } = options;
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(optHeaders || {}),
    },
  });
  let data;
  try { data = await res.json(); } catch { data = null; }
  if (!res.ok) throw new Error(data?.message || "Request failed");
  return data;
}

export async function guideLogin(cedula, password) {
  const data = await guideRequest("/api/guide/login", {
    method: "POST",
    body: JSON.stringify({ cedula, password }),
  });
  setTokens(data?.token, data?.adminToken);
  return data;
}

export async function guideLogout() {
  try { await guideRequest("/api/guide/logout", { method: "POST" }); } finally { clearTokens(); }
}

export function guideMe() {
  return guideRequest("/api/guide/me");
}

export function getGuideMyDay(date) {
  if (!date) throw new Error("date requerido (YYYY-MM-DD)");
  return guideRequest(`/api/guide/my-day?date=${date}`);
}

export function getGuideMyDays() {
  return guideRequest("/api/guide/my-days");
}

export function guideSetArrived(bookingId, arrived) {
  if (!bookingId) throw new Error("bookingId requerido");
  return guideRequest(`/api/guide/attendance/${bookingId}`, {
    method: "PATCH",
    body: JSON.stringify({ arrived }),
  });
}
