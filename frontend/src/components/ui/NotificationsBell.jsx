// Campanita del portal: historial de avisos (reservas, cancelaciones, tours
// asignados…) por si no se vio la notificación en el teléfono.
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBell, FiX, FiChevronRight } from "react-icons/fi";
import { getNotificationHistory, markNotificationsRead } from "../../../services/guide.api";

function ago(iso) {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  if (d === 1) return "ayer";
  if (d < 7) return `hace ${d} días`;
  return new Date(iso).toLocaleDateString("es-CR", { day: "numeric", month: "short" });
}

export default function NotificationsBell() {
  const navigate = useNavigate();
  const [data, setData] = useState({ unread: 0, items: [] });
  const [open, setOpen] = useState(false);

  const load = useCallback(() => {
    getNotificationHistory().then(setData).catch(() => {});
  }, []);

  // Al abrir la app, al volver a ella y cada 2 minutos.
  useEffect(() => {
    load();
    const t = setInterval(load, 120000);
    const onVis = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, [load]);

  function close() {
    setOpen(false);
    if (data.unread > 0) {
      markNotificationsRead().catch(() => {});
      setData((d) => ({ unread: 0, items: d.items.map((i) => ({ ...i, read: true })) }));
    }
  }

  function go(item) {
    close();
    if (item.url && item.url.startsWith("/")) navigate(item.url);
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center" onClick={close}>
          <div className="flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <p className="text-lg font-black text-slate-900">Notificaciones</p>
              <button onClick={close} aria-label="Cerrar" className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-600 cursor-pointer">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {data.items.length === 0 ? (
                <div className="py-14 text-center">
                  <FiBell className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 font-semibold text-slate-600">Todavía no hay notificaciones</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {data.items.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => go(n)}
                        className={`flex w-full items-start gap-3 rounded-2xl p-3 text-left transition cursor-pointer ${n.read ? "bg-white ring-1 ring-slate-100" : "bg-emerald-50 ring-1 ring-emerald-200"}`}
                      >
                        <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-emerald-500"}`} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-black text-slate-900">{n.title}</span>
                          {n.body && <span className="mt-0.5 block whitespace-pre-line text-sm text-slate-600">{n.body}</span>}
                          <span className="mt-1 block text-xs font-semibold text-slate-400">{ago(n.at)}</span>
                        </span>
                        {n.url && <FiChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
