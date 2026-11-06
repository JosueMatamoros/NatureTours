// src/hooks/useAppShell.js
// "Modo app" (PWA) solo para las rutas internas: portal de guías (/asistencia),
// panel admin (/matamoros) y login. Inyecta el manifest y los meta de iOS para
// que se pueda instalar en la pantalla de inicio; el sitio público no cambia.
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const APP_PREFIXES = ["/asistencia", "/matamoros", "/login"];

export function isAppRoute(pathname) {
  return APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// ¿Ya está abierta como app instalada?
export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function setHeadTag(tag, attrs) {
  const key = Object.entries(attrs)
    .filter(([k]) => k === "rel" || k === "name")
    .map(([k, v]) => `[${k}="${v}"]`)
    .join("");
  let el = document.head.querySelector(`${tag}${key}`);
  const prev = el ? Object.fromEntries([...el.attributes].map((a) => [a.name, a.value])) : null;
  if (!el) {
    el = document.createElement(tag);
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  // Restaurar al salir: valores previos o quitar la etiqueta si no existía.
  return () => {
    if (prev) {
      [...el.attributes].forEach((a) => el.removeAttribute(a.name));
      Object.entries(prev).forEach(([k, v]) => el.setAttribute(k, v));
    } else {
      el.remove();
    }
  };
}

export function useAppShell() {
  const { pathname } = useLocation();
  const active = isAppRoute(pathname);

  useEffect(() => {
    if (!active) return;
    const undo = [
      setHeadTag("link", { rel: "manifest", href: "/app/manifest.webmanifest" }),
      setHeadTag("link", { rel: "apple-touch-icon", href: "/app/apple-touch-icon.png" }),
      setHeadTag("meta", { name: "apple-mobile-web-app-capable", content: "yes" }),
      setHeadTag("meta", { name: "mobile-web-app-capable", content: "yes" }),
      setHeadTag("meta", { name: "apple-mobile-web-app-title", content: "Nature Tours" }),
      setHeadTag("meta", { name: "apple-mobile-web-app-status-bar-style", content: "default" }),
      setHeadTag("meta", { name: "robots", content: "noindex, nofollow" }),
    ];
    return () => undo.forEach((fn) => fn());
  }, [active]);
}
