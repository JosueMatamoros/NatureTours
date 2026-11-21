// Campanita del portal: historial de avisos (reservas, cancelaciones, tours
// asignados…) por si no se vio la notificación en el teléfono.
// El panel imita el Centro de notificaciones del iPhone: fondo desenfocado,
// tarjetas blancas translúcidas con el ícono de la app, agrupadas por día.
// Al tocar un aviso se abre Asistencia en ese día (y se resalta la reserva).
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBell, FiX } from "react-icons/fi";
import { getNotificationHistory, markNotificationsRead } from "../../../services/guide.api";

const TZ = "America/Costa_Rica";
const dayKey = (d) => d.toLocaleDateString("en-CA", { timeZone: TZ });

// Hora a la derecha, como en iOS: "ahora", "5 min", "3:42 p. m.", "ayer", "mar 18 nov".
function stamp(iso) {
  const d = new Date(iso);
  const min = Math.round((Date.now() - d.getTime()) / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `${min} min`;
  const today = dayKey(new Date());
  if (dayKey(d) === today) return d.toLocaleTimeString("es-CR", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
  const yesterday = dayKey(new Date(Date.now() - 864e5));
  if (dayKey(d) === yesterday) return "ayer";
  return d.toLocaleDateString("es-CR", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" });
}

function groupOf(iso) {
  const k = dayKey(new Date(iso));
  if (k === dayKey(new Date())) return "Hoy";
  if (k === dayKey(new Date(Date.now() - 864e5))) return "Ayer";
  return "Anteriores";
}

// Asistencia del portal en lugar de Reservaciones del panel admin.
function target(url) {
  if (!url || !url.startsWith("/")) return null;
  if (url.startsWith("/matamoros/")) {
    const fecha = new URLSearchParams(url.split("?")[1] || "").get("fecha");
    return fecha ? `/asistencia?fecha=${fecha}` : "/asistencia";
  }
  return url;
}

export default function NotificationsBell() {
  const navigate = useNavigate();
  const [data, setData] = useState({ unread: 0, items: [] });
  const [open, setOpen] = useState(false);

  const load = useCallback(() => {
    getNotificationHistory().then(setData).catch(() => {});
  }, []);

  // Al abrir la app, al volver a ella, cada 2 minutos y apenas llega un push
  // (el service worker avisa a la app abierta).
  useEffect(() => {
    load();
    const t = setInterval(load, 120000);
    const onVis = () => document.visibilityState === "visible" && load();
    const onMsg = (e) => e.data?.type === "nt-push" && setTimeout(load, 1500);
    document.addEventListener("visibilitychange", onVis);
    navigator.serviceWorker?.addEventListener("message", onMsg);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
      navigator.serviceWorker?.removeEventListener("message", onMsg);
    };
  }, [load]);

  const unread = data.unread;
  const close = useCallback(() => {
    setOpen(false);
    if (unread > 0) {
      markNotificationsRead().catch(() => {});
      setData((d) => ({ unread: 0, items: d.items.map((i) => ({ ...i, read: true })) }));
    }
  }, [unread]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  function go(item) {
    const to = target(item.url);
    close();
    if (to) navigate(to);
  }

  const groups = [];
  for (const n of data.items) {
    const g = groupOf(n.at);
    let last = groups[groups.length - 1];
    if (!last || last.label !== g) groups.push((last = { label: g, items: [] }));
    last.items.push(n);
  }

  return (
    <>
      <button
        onClick={() => { load(); setOpen(true); }}
        title="Notificaciones"
        aria-label="Notificaciones"
        className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 cursor-pointer"
      >
        <FiBell className="h-5 w-5" />
        {data.unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[11px] font-black text-white ring-2 ring-white">
            {data.unread > 99 ? "99+" : data.unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Notificaciones"
          className="nt-nc-backdrop fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-slate-900/55 backdrop-blur-2xl"
          onClick={close}
        >
          <div
            className="nt-nc-panel mx-auto w-full max-w-lg px-3 pb-10"
            style={{ paddingTop: "max(env(safe-area-inset-top), 1rem)" }}
          >
            <div className="flex items-center justify-between px-1 py-3" onClick={(e) => e.stopPropagation()}>
              <p className="text-[28px] font-bold tracking-tight text-white drop-shadow-sm">Notificaciones</p>
              <button
                onClick={close}
                aria-label="Cerrar"
                className="grid h-10 w-10 place-items-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/30 cursor-pointer"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {data.items.length === 0 ? (
              <div className="py-24 text-center text-white/70">
                <FiBell className="mx-auto h-10 w-10" />
                <p className="mt-3 font-semibold">No hay notificaciones</p>
              </div>
            ) : (
              groups.map((g) => (
                <section key={g.label} className="mt-3">
                  <p className="mb-2 px-2 text-[15px] font-semibold text-white/80">{g.label}</p>
                  <ul className="space-y-2">
                    {g.items.map((n, i) => (
                      <li key={n.id} className="nt-nc-card" style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); go(n); }}
                          className="flex w-full items-start gap-3 rounded-[22px] bg-white/85 p-3.5 text-left shadow-lg shadow-black/10 backdrop-blur-xl transition active:scale-[0.98] cursor-pointer"
                        >
                          <img src="/app/icon-192.png" alt="" className="h-10 w-10 shrink-0 rounded-[10px] shadow-sm" />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline justify-between gap-2">
                              <span className="truncate text-[15px] font-semibold leading-snug text-slate-900">{n.title}</span>
                              <span className="flex shrink-0 items-center gap-1.5 text-xs text-slate-500">
                                {!n.read && <span className="h-2 w-2 rounded-full bg-blue-500" aria-label="Sin leer" />}
                                {stamp(n.at)}
                              </span>
                            </span>
                            {n.body && (
                              <span className="mt-0.5 line-clamp-4 block whitespace-pre-line text-[14px] leading-snug text-slate-700">
                                {n.body}
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
