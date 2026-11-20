import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import NotificationsBell from "../components/ui/NotificationsBell";
import { HorsesBar, SlotHorsesSheet } from "../components/horses/SlotHorses";
import { useHorseAssign } from "../components/horses/useHorseAssign";
import { horsesDay } from "../../services/horses.api";
import { useDateParam } from "../hooks/useDateParam";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiUsers,
  FiCompass,
  FiLock,
  FiUser,
  FiAlertCircle,
  FiCheck,
  FiSettings,
  FiEye,
  FiEyeOff,
  FiChevronDown,
  FiUserPlus,
  FiArrowRight,
  FiDollarSign,
  FiSend,
  FiX,
} from "react-icons/fi";
import CalendarPicker from "../components/checkout/CalendarPicker";
import SourceChip from "../components/SourceChip";
import InstallAppCard from "../components/ui/InstallAppCard";
import NotificationsCard from "../components/ui/NotificationsCard";
import {
  guideLogin,
  guideMe,
  getGuideMyDay,
  getGuideMyDays,
  guideSetArrived,
  getGuideAllGuides,
  assignGuideSlot,
  getGuideOffers,
  takeGuideOffer,
  replyGuideAssignment,
  publishSlotOffer,
  cancelSlotOffer,
} from "../../services/guide.api";
import { GuideAssignSheet, GuideChip } from "../components/guides/GuideAssign";

const WEEKDAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"];

function todayYmd() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}
function shiftYmd(ymd, days) {
  const d = new Date(`${ymd}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function navLabel(ymd) {
  const d = new Date(`${ymd}T00:00:00`);
  const mon = MONTHS[d.getMonth()];
  return `${WEEKDAYS_SHORT[d.getDay()]}, ${d.getDate()} ${mon.charAt(0).toUpperCase()}${mon.slice(1)} ${d.getFullYear()}`;
}
function formatClock(hhmm) {
  const [h] = hhmm.split(":").map(Number);
  const suffix = h < 12 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${hhmm.slice(3)} ${suffix}`;
}

// Cédula: solo dígitos (máx 9). Con 9 se agrupa 1-4-4 → "2 0862 0302";
// la forma corta de 7 dígitos (sin ceros) se agrupa 1-3-3 → "2 448 088".
function formatCedula(digits) {
  const d = digits.slice(0, 9);
  if (d.length <= 7) return [d.slice(0, 1), d.slice(1, 4), d.slice(4, 7)].filter(Boolean).join(" ");
  return [d.slice(0, 1), d.slice(1, 5), d.slice(5, 9)].filter(Boolean).join(" ");
}

// Cédula corta de 7 dígitos (x-xxx-xxx) → completa de 9 (x-0xxx-0xxx),
// ej. "2448088" → "204480088". Se aplica al salir del campo o al ingresar
// (no mientras escribe, para no estorbar a quien teclea los 9 dígitos).
// Excepción puntual: Marlon entra con "1234" (no tiene cédula de 9 dígitos).
const CEDULAS_CORTAS = new Set(["1234"]);

function expandCedula(digits) {
  return digits.length === 7 ? `${digits[0]}0${digits.slice(1, 4)}0${digits.slice(4)}` : digits;
}

// ─── Login ──────────────────────────────────────────────────────────────────
function GuideLogin({ onLoggedIn }) {
  const [cedula, setCedula] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const fullCedula = expandCedula(cedula);
    if (fullCedula !== cedula) setCedula(fullCedula);
    if (fullCedula.length !== 9 && !CEDULAS_CORTAS.has(fullCedula)) {
      setError("Revisá la cédula: debe tener 9 dígitos.");
      return;
    }
    setSubmitting(true);
    try {
      const r = await guideLogin(fullCedula, password); // cedula = solo dígitos
      onLoggedIn(r.guide);
    } catch (err) {
      setError(err?.message || "No se pudo iniciar sesión");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      {/* Fondo: franja verde con brillo suave */}
      <div className="absolute inset-x-0 top-0 h-[46vh] min-h-80 bg-linear-to-br from-emerald-500 via-emerald-600 to-teal-700">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-20 top-32 h-56 w-56 rounded-full bg-teal-300/20 blur-2xl" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-b from-transparent to-slate-50/0" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-sm flex-col px-5 pt-[max(3.5rem,env(safe-area-inset-top))] pb-8">
        {/* Marca */}
        <div className="text-center text-white">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-white p-2 shadow-xl shadow-emerald-900/25 ring-4 ring-white/30">
            <img src="/app/icon-192.png" alt="Nature Tours" className="h-full w-full rounded-2xl object-contain" />
          </span>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-50/80">
            Nature Tours La Fortuna
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">¡Bienvenido!</h1>
          <p className="mt-1 text-sm text-emerald-50/90">Ingresá con tu cédula para ver tu día.</p>
        </div>

        {/* Tarjeta */}
        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-3xl bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.14)] ring-1 ring-slate-100"
        >
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Cédula
          </label>
          <div className="mb-5 flex items-center gap-3 rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 transition focus-within:border-emerald-500 focus-within:bg-white">
            <FiUser className="h-5 w-5 shrink-0 text-emerald-600" />
            <input
              inputMode="numeric"
              value={formatCedula(cedula)}
              onChange={(e) => setCedula(e.target.value.replace(/\D/g, "").slice(0, 9))}
              onBlur={() => setCedula((c) => expandCedula(c))}
              required
              autoComplete="username"
              placeholder="0 0000 0000"
              className="w-full bg-transparent py-3.5 text-lg font-semibold tracking-[0.12em] text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-300"
            />
          </div>

          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Contraseña
          </label>
          <div className="flex items-center gap-3 rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 transition focus-within:border-emerald-500 focus-within:bg-white">
            <FiLock className="h-5 w-5 shrink-0 text-emerald-600" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full bg-transparent py-3.5 text-lg text-slate-900 outline-none placeholder:text-slate-300"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
            >
              {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
            </button>
          </div>

          {error && (
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
              <FiAlertCircle className="h-4 w-4 shrink-0" /> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="group mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-emerald-600 to-teal-600 py-4 text-base font-bold text-white shadow-lg shadow-emerald-600/30 transition hover:shadow-emerald-600/40 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Ingresando…
              </>
            ) : (
              <>
                Ingresar
                <FiArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        <InstallAppCard />

        <p className="mt-auto pt-8 text-center text-xs text-slate-400">
          Acceso solo para el equipo de Nature Tours
        </p>
      </div>
    </div>
  );
}

// ─── Reserva ────────────────────────────────────────────────────────────────
function ReservationRow({ r, onToggle, busy, readOnly = false }) {
  const parts = [];
  if (r.adults) parts.push(`${r.adults} adulto${r.adults === 1 ? "" : "s"}`);
  if (r.children) parts.push(`${r.children} niño${r.children === 1 ? "" : "s"}`);
  if (r.babies) parts.push(`${r.babies} bebé${r.babies === 1 ? "" : "s"}`);

  const bookingId = r.externalRef || `#${String(r.id).slice(0, 6).toUpperCase()}`;

  return (
    <div className={`flex items-center gap-3 border-t border-slate-100 py-3 first:border-t-0 ${r.arrived ? "opacity-70" : ""}`}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className={`truncate font-semibold ${r.arrived ? "text-slate-500 line-through" : "text-slate-900"}`}>
            {r.customer?.name || "Sin nombre"}
          </p>
          <SourceChip source={r.source} />
        </div>
        <p className="text-sm text-slate-500">{parts.join(" · ")}</p>
        {/* Debajo de la cantidad de personas: booking id y, solo si debe, el saldo */}
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-500">{bookingId}</span>
          {r.owes && (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600 ring-1 ring-red-200 tabular-nums">
              Debe ${r.balanceDue}
            </span>
          )}
        </div>
        {r.customer?.phone && (
          <a href={`tel:${r.customer.phone}`} className="mt-0.5 block text-sm font-medium text-blue-600">
            {r.customer.phone}
          </a>
        )}
      </div>

      {/* Pasar lista (solo lectura: solo muestra si ya llegó) */}
      {readOnly ? (
        r.arrived ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
            <FiCheck className="h-3.5 w-3.5" /> Llegó
          </span>
        ) : null
      ) : (
      <button
        type="button"
        onClick={() => onToggle(r)}
        disabled={busy}
        aria-pressed={r.arrived}
        aria-label={r.arrived ? "Marcar como no llegó" : "Marcar llegada"}
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 transition disabled:opacity-50 cursor-pointer ${
          r.arrived
            ? "border-emerald-600 bg-emerald-600 text-white"
            : "border-slate-300 bg-white text-slate-300 hover:border-emerald-400 hover:text-emerald-500"
        }`}
      >
        <FiCheck className="h-5 w-5" />
      </button>
      )}
    </div>
  );
}

// ─── Total generado del día (solo supervisores) ─────────────────────────────
// El monto se ve siempre; el desglose por origen se abre al tocarlo.
const REVENUE_ROWS = [
  { key: "direct", label: "Directo", dot: "bg-emerald-300", bar: "bg-emerald-300" },
  { key: "viator", label: "Viator", dot: "bg-sky-300", bar: "bg-sky-300" },
  { key: "gyg", label: "GetYourGuide", dot: "bg-rose-300", bar: "bg-rose-300" },
  { key: "localbird", label: "Localbird", dot: "bg-amber-300", bar: "bg-amber-300" },
];

function money(n) {
  const v = Number(n) || 0;
  return `$${v.toLocaleString("en-US", { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

function DayRevenueCard({ revenue }) {
  const [open, setOpen] = useState(false);
  const total = Number(revenue.total) || 0;
  const rows = REVENUE_ROWS
    .filter((r) => revenue.bySource?.[r.key] != null)
    .map((r) => ({ ...r, amount: Number(revenue.bySource[r.key]) || 0 }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="relative mb-4 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/20">
      {/* brillo decorativo */}
      <span aria-hidden className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <span aria-hidden className="pointer-events-none absolute -bottom-16 -left-8 h-36 w-36 rounded-full bg-teal-300/20 blur-2xl" />

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="day-revenue-breakdown"
        className="relative flex w-full items-center gap-3 px-5 py-4 text-left transition active:scale-[0.99] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white/70"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur-sm">
          <FiDollarSign className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-100/90">Generado del día</span>
          <span className="mt-0.5 block text-[2rem] font-black leading-none tabular-nums tracking-tight">{money(total)}</span>
        </span>
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 transition-transform duration-300 ease-out motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
        >
          <FiChevronDown className="h-4 w-4" />
        </span>
      </button>

      <div
        id="day-revenue-breakdown"
        className={`relative grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="mx-4 mb-4 space-y-3 rounded-2xl bg-black/15 p-4 ring-1 ring-white/10">
            {rows.map((r) => {
              const pct = total > 0 ? Math.round((r.amount / total) * 100) : 0;
              return (
                <div key={r.key}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="inline-flex min-w-0 items-center gap-2 font-semibold text-white/90">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${r.dot}`} />
                      <span className="truncate">{r.label}</span>
                    </span>
                    <span className="flex items-baseline gap-2 tabular-nums">
                      <span className="text-xs font-medium text-emerald-100/70">{pct}%</span>
                      <span className="font-bold">{money(r.amount)}</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className={`h-full rounded-full ${r.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {revenue.missing > 0 && (
              <p className="flex items-center gap-1.5 border-t border-white/10 pt-3 text-xs font-medium text-emerald-50/80">
                <FiAlertCircle className="h-3.5 w-3.5 shrink-0" />
                {revenue.missing} reserva{revenue.missing === 1 ? "" : "s"} OTA sin precio (no se suma{revenue.missing === 1 ? "" : "n"})
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Selector de guía por slot (solo supervisor) ────────────────────────────
function SlotGuidePicker({ slot, date, allGuides, onChanged, onReload }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState([]);
  const assigned = (slot.guides || []).map((g) => ({ id: g.id, name: g.name, status: g.status }));

  async function toggle(guideId) {
    const isOn = assigned.some((g) => g.id === guideId);
    setSaving((s) => [...s, guideId]);
    onChanged(guideId, !isOn); // optimista
    try {
      await assignGuideSlot({ tourId: slot.tourId, tourDate: date, startTime: slot.startTime, guideId, assigned: !isOn });
    } catch {
      onChanged(guideId, isOn); // revertir
    } finally {
      setSaving((s) => s.filter((x) => x !== guideId));
    }
  }

  return (
    <>
      <GuideChip guides={allGuides} assigned={assigned} offer={slot.offer} busy={saving.length > 0} onClick={() => setOpen(true)} />
      {open && (
        <GuideAssignSheet
          title={formatClock(slot.startTime)}
          subtitle={`${slot.tourName} · ${navLabel(date)}`}
          guides={allGuides}
          assigned={assigned}
          offer={slot.offer}
          pending={saving}
          onToggle={toggle}
          onPublish={async (ids) => { await publishSlotOffer({ tourId: slot.tourId, tourDate: date, startTime: slot.startTime, guideIds: ids }); await onReload(); }}
          onCancelOffer={async () => { await cancelSlotOffer(slot.offer.id); await onReload(); }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

// Tours publicados que este guía puede tomar: una barra delgada que abre la lista.
function OffersButton({ offers, onTake, onGo }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    if (!open) return;
    const esc = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);
  if (!offers.length && !open) return null;
  const n = offers.length;
  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); setMsg(""); }}
        className="mb-4 flex w-full items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-left shadow-sm transition hover:bg-orange-100 cursor-pointer"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-orange-500 text-white"><FiSend className="h-4 w-4" /></span>
        <span className="flex-1 text-sm font-black text-orange-900">
          {n} tour{n === 1 ? "" : "s"} disponible{n === 1 ? "" : "s"}
          <span className="block text-xs font-medium text-orange-800/70">¿Querés operar alguno? Apartalo</span>
        </span>
        <FiChevronRight className="h-5 w-5 text-orange-400" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-[2px] sm:items-center" onClick={() => setOpen(false)}>
          <section role="dialog" aria-label="Tours disponibles" onClick={(e) => e.stopPropagation()} className="flex max-h-[85vh] w-full max-w-md flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-slate-200 sm:hidden" />
            <header className="flex items-start justify-between gap-3 px-5 pb-3 pt-4">
              <div>
                <p className="text-lg font-black text-slate-900">Tours disponibles</p>
                <p className="text-sm text-slate-500">Si querés operar alguno de estos tours, apartalo.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar" className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer">
                <FiX className="h-5 w-5" />
              </button>
            </header>
            <ul className="flex-1 space-y-2 overflow-y-auto px-5 pb-5">
              {offers.length === 0 && <li className="py-6 text-center text-sm text-slate-400">Ya no hay tours disponibles.</li>}
              {offers.map((o) => (
                <li key={o.id} className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50/50 p-3">
                  <button type="button" onClick={() => { onGo(o.tourDate); setOpen(false); }} className="min-w-0 flex-1 text-left cursor-pointer">
                    <p className="text-base font-black leading-tight text-slate-900">{formatClock(o.startTime)}</p>
                    <p className="truncate text-xs font-medium capitalize text-slate-500">{navLabel(o.tourDate)} · {o.tourName}</p>
                    <p className="mt-0.5 text-xs font-bold text-orange-600">Ver el día ›</p>
                  </button>
                  <button
                    type="button"
                    disabled={busy === o.id}
                    onClick={async () => {
                      setBusy(o.id);
                      setMsg("");
                      try { await onTake(o); setMsg("¡Listo! Apartaste el tour."); }
                      catch (e) { setMsg(e.message || "No se pudo apartar"); }
                      finally { setBusy(null); }
                    }}
                    className="shrink-0 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-black text-white shadow-sm shadow-orange-500/30 transition hover:bg-orange-600 disabled:opacity-50 cursor-pointer"
                  >
                    {busy === o.id ? "…" : "Apartar"}
                  </button>
                </li>
              ))}
            </ul>
            {msg && <p className="px-5 pb-4 text-sm font-semibold text-emerald-700">{msg}</p>}
          </section>
        </div>
      )}
    </>
  );
}

// Asignación directa sin confirmar: "Lo hago" / "No puedo".
function ConfirmSlot({ onReply }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  async function reply(accept) {
    setBusy(accept ? "yes" : "no");
    setError("");
    try { await onReply(accept); } catch (e) { setError(e.message || "No se pudo guardar"); } finally { setBusy(null); }
  }
  return (
    <div className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-lg">
      <p className="text-sm font-black text-slate-900">Te asignaron este tour</p>
      <p className="mt-0.5 text-xs text-slate-500">Confirmá para ver los clientes</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button type="button" disabled={!!busy} onClick={() => reply(false)} className="rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 cursor-pointer">
          {busy === "no" ? "…" : "No puedo"}
        </button>
        <button type="button" disabled={!!busy} onClick={() => reply(true)} className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-sm font-black text-white shadow-sm shadow-emerald-600/30 transition hover:bg-emerald-700 disabled:opacity-50 cursor-pointer">
          <FiCheck className="h-4 w-4" /> {busy === "yes" ? "…" : "Lo hago"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}

// Tarjeta de un horario. Si el guía no ha confirmado, todo sale borroso (sin
// clientes ni cuántos vienen) con "Lo hago" / "No puedo"; si dijo que no, sale
// en rojo y sin información; al aceptar, la información aparece con animación.
function SlotCard({ slot, guide, header, onReply, renderRow, footer }) {
  // El supervisor nunca ve la tarjeta bloqueada (ni borrosa ni rechazada).
  const my = guide.isViewer || guide.isSupervisor ? null : slot.myStatus;
  const [prevMy, setPrevMy] = useState(my);
  const [reveal, setReveal] = useState(false);
  if (prevMy !== my) {
    setPrevMy(my);
    if (prevMy === "pending" && my === "confirmed") setReveal(true);
  }
  useEffect(() => {
    if (!reveal) return;
    const t = setTimeout(() => setReveal(false), 2200);
    return () => clearTimeout(t);
  }, [reveal]);

  const pending = my === "pending";
  const declined = my === "declined";
  // Supervisor: borde naranja si el horario está publicado para que lo aparten.
  const published = guide.isSupervisor && !!slot.offer;

  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-colors duration-500 ${
      declined ? "border-red-200" : reveal ? "border-emerald-300 nt-glow" : published ? "border-2 border-orange-400" : "border-slate-200"
    }`}>
      <div className={`border-b px-4 py-3 ${declined ? "border-red-100 bg-red-50" : "border-slate-100 bg-slate-50"}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className={`grid h-10 w-10 place-items-center rounded-xl bg-white ring-1 ${declined ? "text-red-500 ring-red-200" : "text-emerald-600 ring-slate-200"}`}>
              {declined ? <FiX className="h-4 w-4" /> : <FiClock className="h-4 w-4" />}
            </span>
            <div>
              <p className={`text-lg font-black leading-none ${declined ? "text-red-900/70 line-through decoration-red-300" : "text-slate-900"}`}>{formatClock(slot.startTime)}</p>
              <p className={`mt-0.5 text-xs font-medium ${declined ? "text-red-700/60" : "text-slate-500"}`}>{slot.tourName}</p>
            </div>
          </div>
          {declined ? (
            <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">Rechazado</span>
          ) : pending ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-500">
              <FiUsers className="h-3.5 w-3.5" /> <span className="blur-[3px] select-none">00</span>
            </span>
          ) : (
            <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 tabular-nums ${reveal ? "nt-pop" : ""}`}>
              <FiUsers className="h-3.5 w-3.5" /> {slot.totalGuests}
            </span>
          )}
        </div>
        {header && !(declined && !guide.isSupervisor) && <div className={`mt-2.5 ${pending && !guide.isSupervisor ? "blur-[3px] select-none pointer-events-none" : ""}`}>{header}</div>}
      </div>

      {declined ? (
        <div className="flex items-center gap-3 px-4 py-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-100 text-red-500"><FiX className="h-5 w-5" /></span>
          <div>
            <p className="text-sm font-bold text-red-800">Dijiste que no podés este tour</p>
            <p className="text-xs text-red-700/60">Ya se le avisó al administrador.</p>
          </div>
        </div>
      ) : pending ? (
        <div className="relative min-h-[11rem]">
          <div aria-hidden className="pointer-events-none select-none px-4 py-1 blur-[7px]">
            {(slot.reservations.length ? slot.reservations.slice(0, 3) : [0, 1, 2]).map((r, i) => (
              <div key={r?.id || i} className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-0">
                <div className="space-y-1.5">
                  <div className="h-3.5 w-32 rounded bg-slate-300" />
                  <div className="h-3 w-20 rounded bg-slate-200" />
                </div>
                <div className="h-8 w-20 rounded-lg bg-emerald-200" />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 grid place-items-center bg-white/40 p-4">
            <ConfirmSlot onReply={onReply} />
          </div>
        </div>
      ) : (
        <div className={`px-4 py-1 ${reveal ? "nt-reveal" : ""}`}>
          {reveal && (
            <p className="nt-pop mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 py-2 text-sm font-black text-emerald-700">
              <FiCheck className="h-4 w-4" /> ¡Tour confirmado!
            </p>
          )}
          {slot.reservations.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">Aún no hay reservas.</p>
          ) : (
            slot.reservations.map((r) => renderRow(r))
          )}
        </div>
      )}
      {footer && !declined && !pending && footer}
    </div>
  );
}

// Tour publicado en el día que se está viendo: la tarjeta del horario, borrosa,
// con "Apartar" (por dentro: el primero que lo aparta se lo queda).
function OfferSlotCard({ offer, onTake }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-orange-300 bg-white shadow-sm">
      <div className="border-b border-orange-100 bg-orange-50 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-orange-500 ring-1 ring-orange-200">
              <FiSend className="h-4 w-4" />
            </span>
            <div>
              <p className="text-lg font-black leading-none text-slate-900">{formatClock(offer.startTime)}</p>
              <p className="mt-0.5 text-xs font-medium text-slate-500">{offer.tourName}</p>
            </div>
          </div>
          <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-700">Disponible</span>
        </div>
      </div>
      <div className="relative min-h-[10rem]">
        <div aria-hidden className="pointer-events-none select-none px-4 py-1 blur-[7px]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-0">
              <div className="space-y-1.5">
                <div className="h-3.5 w-32 rounded bg-slate-300" />
                <div className="h-3 w-20 rounded bg-slate-200" />
              </div>
              <div className="h-8 w-20 rounded-lg bg-orange-200" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 grid place-items-center bg-white/40 p-4">
          <div className="w-full max-w-xs rounded-2xl border border-orange-200 bg-white p-4 text-center shadow-lg">
            <p className="text-sm font-black text-slate-900">Tour disponible</p>
            <p className="mt-0.5 text-xs text-slate-500">¿Querés operar este tour? Apartalo.</p>
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError("");
                try { await onTake(); } catch (e) { setError(e.message || "No se pudo apartar"); setBusy(false); }
              }}
              className="mt-3 w-full rounded-xl bg-orange-500 py-2.5 text-sm font-black text-white shadow-sm shadow-orange-500/30 transition hover:bg-orange-600 disabled:opacity-50 cursor-pointer"
            >
              {busy ? "Apartando…" : "Apartar"}
            </button>
            {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Día ────────────────────────────────────────────────────────────────────
function GuideDay({ guide }) {
  const navigate = useNavigate();
  const initialToday = useMemo(() => todayYmd(), []);
  const [date, setDate] = useDateParam(initialToday);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dayData, setDayData] = useState(null);
  const [myDays, setMyDays] = useState([]);
  const [allGuides, setAllGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const today = todayYmd();
  const tomorrow = shiftYmd(today, 1);

  const [offers, setOffers] = useState([]);
  const daySeq = useRef(0);
  const loadDay = useCallback(async (d, silent = false) => {
    const seq = ++daySeq.current;
    if (!silent) setLoading(true);
    try {
      const r = await getGuideMyDay(d);
      if (seq === daySeq.current) setDayData(r);
    } catch {
      if (!silent && seq === daySeq.current) setDayData({ slots: [] });
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);
  // Ni solo lectura ni supervisor ven "tours disponibles" (barra, calendario naranja ni tarjetas).
  const hideOffers = guide.isViewer || guide.isSupervisor;

  // Caballos de cada tour (admins y encargado de caballos): se tocan en la tarjeta.
  const [horseDay, setHorseDay] = useState(null);
  const [horseSlotKey, setHorseSlotKey] = useState(null);
  const loadHorses = useCallback((d) => {
    if (!guide.canHorses) return;
    horsesDay(d).then(setHorseDay).catch(() => setHorseDay(null));
  }, [guide.canHorses]);
  useEffect(() => { setHorseDay(null); loadHorses(date); }, [date, loadHorses]);
  const { openPick, picker: horsePicker } = useHorseAssign(horseDay, setHorseDay, () => loadHorses(date), (m) => console.error("caballos:", m));
  const horseSlotOf = (s) => horseDay?.slots.find((h) => h.tourId === s.tourId && h.startTime === s.startTime) || null;
  const openHorseSlot = horseDay?.slots.find((h) => `${h.tourId}|${h.startTime}` === horseSlotKey) || null;
  // El encargado de caballos que no es guía ni supervisor entra directo a Caballos
  // (una vez por sesión, para que "Volver" lo deje ver el portal si quiere).
  useEffect(() => {
    if (!guide.canHorses || guide.isGuide || guide.isSupervisor || guide.isAdmin) return;
    try {
      if (sessionStorage.getItem("nt_caballos_auto")) return;
      sessionStorage.setItem("nt_caballos_auto", "1");
    } catch { /* nada */ }
    navigate("/asistencia/caballos", { replace: false });
  }, [guide, navigate]);
  const loadOffers = useCallback(() => {
    if (hideOffers) return Promise.resolve();
    return getGuideOffers().then((r) => setOffers(r.offers || [])).catch(() => {});
  }, [hideOffers]);

  useEffect(() => { loadDay(date); }, [loadDay, date]);
  useEffect(() => { loadOffers(); }, [loadOffers]);
  // Se mantiene al día solo: al volver a la app y cada 30 s.
  useEffect(() => {
    const refresh = () => {
      if (document.hidden) return;
      loadDay(date, true);
      loadOffers();
    };
    const t = setInterval(refresh, 30000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [loadDay, loadOffers, date]);

  async function handleTakeOffer(o) {
    await takeGuideOffer(o.id);
    await loadOffers();
    getGuideMyDays().then((r) => setMyDays(r.days || [])).catch(() => {});
    if (o.tourDate === date) await loadDay(date, true);
    else setDate(o.tourDate);
  }

  async function handleReply(slot, accept) {
    await replyGuideAssignment({ tourId: slot.tourId, tourDate: date, startTime: slot.startTime, accept });
    await loadDay(date, true);
    if (!accept) getGuideMyDays().then((r) => setMyDays(r.days || [])).catch(() => {});
  }
  useEffect(() => {
    getGuideMyDays().then((r) => setMyDays(r.days || [])).catch(() => setMyDays([]));
  }, []);
  useEffect(() => {
    if (guide.isSupervisor) {
      getGuideAllGuides().then((r) => setAllGuides(r.guides || [])).catch(() => setAllGuides([]));
    }
  }, [guide.isSupervisor]);

  const slots = dayData?.slots || [];
  const totalGuests = slots.reduce((s, sl) => s + (sl.totalGuests || 0), 0);
  const markedSet = new Set(myDays.map((d) => d.date));
  const offerSet = new Set(offers.map((o) => o.tourDate));
  const dayOffers = offers.filter((o) => o.tourDate === date);

  // Pasar lista: cambia solo esa reserva en memoria (sin recargar el día).
  function patchReservation(bookingId, arrived) {
    setDayData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        slots: prev.slots.map((sl) => ({
          ...sl,
          reservations: sl.reservations.map((r) =>
            r.id === bookingId ? { ...r, arrived } : r
          ),
        })),
      };
    });
  }

  // Agrega/quita el guía de un slot en memoria (sin recargar el día).
  function patchSlotGuides(slot, guideId, assigned) {
    const g = allGuides.find((x) => x.id === guideId);
    setDayData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        slots: prev.slots.map((s) => {
          if (s.tourId !== slot.tourId || s.startTime !== slot.startTime) return s;
          const current = s.guides || [];
          const next = assigned
            ? (current.some((x) => x.id === guideId) ? current : [...current, { id: guideId, name: g?.name || "", status: guideId === guide.id ? "confirmed" : "pending" }])
            : current.filter((x) => x.id !== guideId);
          return { ...s, guides: next };
        }),
      };
    });
  }

  async function handleToggleArrived(r) {
    const next = !r.arrived;
    setBusyId(r.id);
    patchReservation(r.id, next); // optimista
    try {
      await guideSetArrived(r.id, next);
    } catch {
      patchReservation(r.id, r.arrived); // revertir
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-lg px-4 py-6">
        {/* Header */}
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/30">
                <FiCompass className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-slate-400">Hola,</p>
                  {guide.isSupervisor && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700 ring-1 ring-violet-100">
                      <FiEye className="h-3 w-3" /> Supervisor
                    </span>
                  )}
                </div>
                <p className="truncate text-xl font-black leading-tight text-slate-900">{guide.name}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <NotificationsBell />
              {guide.isAdmin && (
                <button
                  onClick={() => navigate("/matamoros")}
                  title="Ir al panel admin"
                  aria-label="Ir al panel admin"
                  className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-white transition hover:bg-slate-800 cursor-pointer"
                >
                  <FiSettings className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        <NotificationsCard isAdmin={guide.isAdmin} isViewer={guide.isViewer} className="mb-4" />

        <OffersButton offers={offers} onTake={handleTakeOffer} onGo={(d) => setDate(d)} />

        {/* Navegador de fecha */}
        <div className="relative mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCalendarOpen((o) => !o)}
              aria-label="Elegir fecha"
              className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-xl shadow-sm transition cursor-pointer ${
                calendarOpen ? "bg-emerald-600 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200"
              }`}
            >
              <FiCalendar className="h-4 w-4" />
              {offers.length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-orange-500 px-1 text-[11px] font-black text-white ring-2 ring-slate-50">
                  {offers.length}
                </span>
              )}
            </button>
            <div className="flex items-center gap-0.5 rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200">
              <button onClick={() => setDate((d) => shiftYmd(d, -1))} aria-label="Día anterior" className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer">
                <FiChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setDate((d) => shiftYmd(d, 1))} aria-label="Día siguiente" className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer">
                <FiChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setDate(today)}
              className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition cursor-pointer ${
                date === today ? "bg-emerald-600 text-white shadow-sm" : "bg-white text-slate-700 ring-1 ring-slate-200"
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setDate(tomorrow)}
              className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition cursor-pointer ${
                date === tomorrow ? "bg-orange-500 text-white shadow-sm" : "bg-white text-slate-700 ring-1 ring-slate-200"
              }`}
            >
              Mañana
            </button>
          </div>

          {calendarOpen && (
            <>
              <button
                type="button"
                aria-hidden
                tabIndex={-1}
                onClick={() => setCalendarOpen(false)}
                className="fixed inset-0 z-20 cursor-default"
              />
              <div className="absolute left-0 top-full z-30 mt-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                <CalendarPicker
                  selected={date}
                  onSelect={(ymd) => { if (ymd) { setDate(ymd); setCalendarOpen(false); } }}
                  markedDaysSet={markedSet}
                  offerDaysSet={offerSet}
                  bare
                  allowPast
                />
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-2 pb-1 pt-2 text-xs font-semibold text-slate-500">
                  <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-100 ring-1 ring-emerald-300" /> {guide.isSupervisor ? "Con reservas" : "Tus tours"}</span>
                  {!hideOffers && <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-orange-50 ring-2 ring-orange-400" /> Tours disponibles</span>}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Fecha + resumen */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-base font-bold capitalize text-slate-800">{navLabel(date)}</p>
          {!loading && slots.length > 0 && (
            <span className="inline-flex items-center gap-3 text-sm font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <FiClock className="h-4 w-4" /> {slots.length} tour{slots.length === 1 ? "" : "s"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FiUsers className="h-4 w-4" /> {totalGuests} persona{totalGuests === 1 ? "" : "s"}
              </span>
            </span>
          )}
        </div>

        {guide.isSupervisor && !loading && dayData?.revenue && slots.length > 0 && (
          <DayRevenueCard revenue={dayData.revenue} />
        )}

        {/* Contenido del día */}
        {loading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        ) : slots.length === 0 && dayOffers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-14 text-center">
            <FiCalendar className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 font-semibold text-slate-700">Sin tours asignados</p>
            <p className="mt-1 text-sm text-slate-400">No tenés horarios este día.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {dayOffers.map((o) => (
              <OfferSlotCard key={o.id} offer={o} onTake={() => handleTakeOffer(o)} />
            ))}
            {slots.map((slot) => (
              <SlotCard
                key={`${slot.tourId}-${slot.startTime}`}
                slot={slot}
                guide={guide}
                header={
                  guide.isSupervisor ? (
                    <SlotGuidePicker slot={slot} date={date} allGuides={allGuides} onChanged={(gid, on) => patchSlotGuides(slot, gid, on)} onReload={() => loadDay(date, true)} />
                  ) : slot.guides && slot.guides.length > 0 ? (
                    <GuideChip guides={[]} assigned={slot.guides} offer={null} onClick={() => {}} />
                  ) : null
                }
                onReply={(accept) => handleReply(slot, accept)}
                footer={horseSlotOf(slot) ? <HorsesBar slot={horseSlotOf(slot)} onOpen={() => setHorseSlotKey(`${slot.tourId}|${slot.startTime}`)} /> : null}
                renderRow={(r) => (
                  <ReservationRow key={r.id} r={r} onToggle={handleToggleArrived} busy={busyId === r.id} readOnly={guide.isViewer} />
                )}
              />
            ))}
          </div>
        )}
      </div>
      {openHorseSlot && (
        <SlotHorsesSheet slot={openHorseSlot} horses={horseDay.horses} onPick={openPick} onClose={() => setHorseSlotKey(null)} />
      )}
      {horsePicker}
    </div>
  );
}

// ─── Página ─────────────────────────────────────────────────────────────────
export default function GuiaPortalPage() {
  const [guide, setGuide] = useState(null);
  const [checking, setChecking] = useState(true);
  // Ya no hay "Ver como guía": se limpia por si quedó guardado.
  useEffect(() => { try { localStorage.removeItem("nt_ver_como_guia"); } catch { /* nada */ } }, []);

  useEffect(() => {
    guideMe()
      .then((r) => setGuide(r.guide))
      .catch(() => setGuide(null))
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
      </div>
    );
  }

  if (!guide) return <GuideLogin onLoggedIn={setGuide} />;
  return <GuideDay guide={guide} />;
}
