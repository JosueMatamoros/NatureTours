import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../../services/api";

export default function AdminGuard() {
  const location = useLocation();
  const [ok, setOk] = useState(null);

  useEffect(() => {
    let alive = true;
    api.get("/api/auth/me")
      .then(() => alive && setOk(true))
      .catch(() => alive && setOk(false));
    return () => { alive = false; };
  }, []);

  if (ok === null) return null;
  if (!ok) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
