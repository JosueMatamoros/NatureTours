import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../services/api";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/matamoros";

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      await api.post("/api/auth/login", { username, password });
      navigate(from, { replace: true });
    } catch (e) {
      setErr(e.message || "Login inválido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 shadow-sm p-8">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M7 10V7a5 5 0 0 1 10 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M6 10h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Panel de Administración</h1>
          <p className="text-sm text-gray-500">Ingresa tus credenciales para acceder</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Usuario</label>
            <div className="mt-1 relative">
              <input
                className="w-full rounded-lg border border-gray-200 px-10 py-2 outline-none focus:ring-2 focus:ring-gray-200"
                placeholder="Usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21a8 8 0 1 0-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Contraseña</label>
            <div className="mt-1 relative">
              <input
                className="w-full rounded-lg border border-gray-200 px-10 py-2 outline-none focus:ring-2 focus:ring-gray-200"
                placeholder="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M7 10V7a5 5 0 0 1 10 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M6 10h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </span>
            </div>
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black text-white py-2 font-medium hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
