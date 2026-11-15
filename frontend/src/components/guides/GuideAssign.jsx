// Asignar / publicar guías de un horario — compartido entre Asistencia (panel
// admin) y el portal de guías (supervisores).
//
//  - Asignar: el guía queda asignado ya, en gris ("Esperando") hasta que
//    confirme en su app; en verde cuando confirma.
//  - Publicar: se elige a varios guías, les llega una notificación y el primero
//    que lo toma se lo queda.
import React, { useEffect, useState } from "react";
import { FiCheck, FiClock, FiCompass, FiPlus, FiSend, FiUserPlus, FiX } from "react-icons/fi";

const CONFIRMED = "confirmed";

function initials(name) {
  return String(name || "?").trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

/** Botón del horario: muestra los guías con su estado (verde = confirmó, gris = esperando). */
export function GuideChip({ guides, assigned, offer, busy, onClick }) {
  const byId = new Map(guides.map((g) => [g.id, g]));
  const list = assigned.map((a) => ({ ...a, name: a.name || byId.get(a.id)?.name || "Guía" }));

  if (list.length === 0) {
    return offer ? (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-200 transition hover:bg-amber-100 cursor-pointer"
      >
        <FiSend className="h-3.5 w-3.5" /> Publicado · esperando
      </button>
    ) : (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-emerald-400 hover:text-emerald-600 cursor-pointer"
      >
        <FiUserPlus className="h-3.5 w-3.5" /> Asignar guía
      </button>
    );
  }

  return (
    <button type="button" onClick={onClick} title="Tocá para cambiar" className="inline-flex flex-wrap items-center gap-1.5 cursor-pointer">
      {busy ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      ) : (
        <FiCompass className="h-4 w-4 text-slate-400" />
      )}
      {list.map((g) => {
        const ok = g.status === CONFIRMED;
        return (
          <span
            key={g.id}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ring-1 transition ${
              ok ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-500 ring-slate-200"
            }`}
            title={ok ? "Confirmó" : "Esperando que confirme"}
          >
            {ok ? <FiCheck className="h-3 w-3" /> : <FiClock className="h-3 w-3" />}
            {g.name}
          </span>
        );
      })}
    </button>
  );
}

/**
 * Hoja para asignar o publicar.
 * assigned: [{ id, status }] · offer: { id, guideIds } | null · pending: [guideId]
 * onToggle(guideId) · onPublish(guideIds) → Promise · onCancelOffer() → Promise
 */
export function GuideAssignSheet({ title, subtitle, guides, assigned, offer, pending = [], onToggle, onPublish, onCancelOffer, onClose }) {
  const [tab, setTab] = useState(offer ? "publish" : "assign");
  const [picked, setPicked] = useState([]);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const statusOf = new Map(assigned.map((a) => [a.id, a.status]));
  const nameOf = new Map(guides.map((g) => [g.id, g.name]));

  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = prev; };
  }, [onClose]);

  async function run(fn) {
    setWorking(true);
    setError("");
    try { await fn(); } catch (e) { setError(e.message || "No se pudo guardar"); } finally { setWorking(false); }
  }

  const free = guides.filter((g) => !statusOf.has(g.id));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-[2px] sm:items-center" onClick={onClose}>
      <section
        role="dialog"
        aria-label="Guías del horario"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-md flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-slate-200 sm:hidden" />
        <header className="flex items-start justify-between gap-3 px-5 pb-3 pt-4">
          <div className="min-w-0">
            <p className="text-lg font-black leading-tight text-slate-900">{title}</p>
            {subtitle && <p className="mt-0.5 truncate text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 cursor-pointer">
            <FiX className="h-5 w-5" />
          </button>
        </header>

        <div className="mx-5 mb-3 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
          {[["assign", "Asignar", FiUserPlus], ["publish", "Publicar tour", FiSend]].map(([k, label, Icon]) => (
            <button
              key={k}
              type="button"
              onClick={() => { setTab(k); setError(""); }}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-bold transition cursor-pointer ${
                tab === k ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {React.createElement(Icon, { className: "h-4 w-4" })} {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {guides.length === 0 && <p className="py-6 text-center text-sm text-slate-400">No hay guías activos</p>}

          {tab === "assign" && guides.length > 0 && (
            <>
              <p className="mb-2 text-xs text-slate-500">
                Queda asignado de una vez. Sale en <span className="font-semibold text-slate-600">gris</span> hasta que el guía confirme en su app y en <span className="font-semibold text-emerald-600">verde</span> cuando confirma.
              </p>
              <ul className="space-y-1.5">
                {guides.map((g) => {
                  const st = statusOf.get(g.id);
                  const on = Boolean(st);
                  const ok = st === CONFIRMED;
                  const saving = pending.includes(g.id);
                  return (
                    <li key={g.id}>
                      <button
                        type="button"
                        onClick={() => onToggle(g.id)}
                        className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition cursor-pointer ${
                          on ? (ok ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-slate-50") : "border-slate-100 bg-white hover:border-emerald-200 hover:bg-emerald-50/30"
                        }`}
                      >
                        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-black ${
                          on ? (ok ? "bg-emerald-600 text-white" : "bg-slate-300 text-white") : "bg-slate-100 text-slate-500"
                        }`}>
                          {initials(g.name)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate text-sm font-bold ${on ? "text-slate-900" : "text-slate-700"}`}>{g.name}</span>
                          {on && (
                            <span className={`text-xs font-semibold ${ok ? "text-emerald-600" : "text-slate-400"}`}>
                              {ok ? "Confirmó" : "Esperando que confirme"}
                            </span>
                          )}
                        </span>
                        {saving ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                        ) : on ? (
                          <span className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 hover:text-red-500">Quitar</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">
                            <FiPlus className="h-3.5 w-3.5" /> Asignar
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {tab === "publish" && guides.length > 0 && (
            offer ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="flex items-center gap-2 text-sm font-black text-amber-800">
                  <FiSend className="h-4 w-4" /> Publicado · esperando que alguien lo tome
                </p>
                <p className="mt-2 text-sm text-amber-900/80">
                  Se les avisó a: <span className="font-semibold">{offer.guideIds.map((id) => nameOf.get(id) || "Guía").join(", ")}</span>
                </p>
                <p className="mt-1 text-xs text-amber-900/60">El primero que lo tome queda asignado y confirmado.</p>
                <button
                  type="button"
                  disabled={working}
                  onClick={() => run(onCancelOffer)}
                  className="mt-3 w-full rounded-xl border border-amber-300 bg-white py-2.5 text-sm font-bold text-amber-800 transition hover:bg-amber-100 disabled:opacity-50 cursor-pointer"
                >
                  {working ? "Cancelando…" : "Cancelar publicación"}
                </button>
              </div>
            ) : (
              <>
                <p className="mb-2 text-xs text-slate-500">
                  Marcá a quiénes avisar. A cada uno le llega una notificación y <span className="font-semibold text-slate-700">el primero que lo tome se lo queda</span>.
                </p>
                {free.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-400">Todos los guías ya están asignados a este horario.</p>
                ) : (
                  <>
                    <div className="mb-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setPicked(picked.length === free.length ? [] : free.map((g) => g.id))}
                        className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                      >
                        {picked.length === free.length ? "Quitar todos" : "Marcar todos"}
                      </button>
                    </div>
                    <ul className="space-y-1.5">
                      {free.map((g) => {
                        const on = picked.includes(g.id);
                        return (
                          <li key={g.id}>
                            <button
                              type="button"
                              onClick={() => setPicked(on ? picked.filter((x) => x !== g.id) : [...picked, g.id])}
                              className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition cursor-pointer ${
                                on ? "border-amber-300 bg-amber-50" : "border-slate-100 bg-white hover:border-amber-200"
                              }`}
                            >
                              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 transition ${
                                on ? "border-amber-500 bg-amber-500 text-white" : "border-slate-300 bg-white"
                              }`}>
                                {on && <FiCheck className="h-4 w-4" />}
                              </span>
                              <span className="truncate text-sm font-bold text-slate-800">{g.name}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                    <button
                      type="button"
                      disabled={working || picked.length === 0}
                      onClick={() => run(async () => { await onPublish(picked); setPicked([]); })}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 py-3 text-sm font-black text-white shadow-sm shadow-amber-500/30 transition hover:bg-amber-600 disabled:opacity-40 cursor-pointer"
                    >
                      <FiSend className="h-4 w-4" />
                      {working ? "Publicando…" : picked.length ? `Publicar tour a ${picked.length} guía${picked.length === 1 ? "" : "s"}` : "Publicar tour"}
                    </button>
                  </>
                )}
              </>
            )
          )}

          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>}
        </div>
      </section>
    </div>
  );
}
