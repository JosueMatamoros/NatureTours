// Caballos: lo usan el encargado de caballos (sesión del portal de guías) y los
// admins (portal o panel). Manda el token del portal si hay; si no, el de admin.
const API_URL = import.meta.env.VITE_API_URL;
if (!API_URL) throw new Error("VITE_API_URL no está definido");

function authHeader() {
  try {
    const t = localStorage.getItem("nt_guide_token") || localStorage.getItem("nt_admin_token");
    return t ? { Authorization: `Bearer ${t}` } : {};
  } catch {
    return {};
  }
}

async function req(path, options = {}) {
  const res = await fetch(`${API_URL}/api/horses${path}`, {
    credentials: "include",
    ...options,
    headers: { "Content-Type": "application/json", ...authHeader() },
  });
  let data;
  try { data = await res.json(); } catch { data = null; }
  if (!res.ok) {
    const err = new Error(data?.message || "Algo falló");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

const send = (method) => (path, body) => req(path, { method, body: body ? JSON.stringify(body) : undefined });
const post = send("POST");
const patch = send("PATCH");
const put = send("PUT");

export const horsesMe = () => req("/me");
export const listHorses = () => req("");
export const createHorse = (body) => post("", body);
export const updateHorse = (id, body) => patch(`/${id}`, body);
export const addHorseEvent = (id, body) => post(`/${id}/events`, body);
export const horseHistory = (id) => req(`/${id}/events`);
export const horsesDay = (date) => req(`/day?date=${date}`);
export const assignHorse = (body) => put("/day/assign", body);
