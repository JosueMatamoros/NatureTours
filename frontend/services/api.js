const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) throw new Error("VITE_API_URL no está definido");

// Además de la cookie (que Safari/iOS bloquea entre dominios), mandamos el token
// admin por header si está guardado. El cliente normal no lo tiene → sin efecto.
function adminAuthHeader() {
  try {
    const t = localStorage.getItem("nt_admin_token");
    return t ? { Authorization: `Bearer ${t}` } : {};
  } catch {
    return {};
  }
}

async function request(path, options = {}) {
  const { headers: optHeaders, ...rest } = options;
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...adminAuthHeader(),
      ...(optHeaders || {}),
    },
  });

  let data;
  try { data = await res.json(); } catch { data = null; }

  if (!res.ok) {
    const message = data?.message || "Request failed";
    throw new Error(message);
  }

  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: (path) => request(path, { method: "DELETE" }),
};
