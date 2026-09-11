import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiUsers,
  FiLogOut,
  FiCompass,
  FiLock,
  FiUser,
  FiAlertCircle,
  FiCheck,
  FiSettings,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import CalendarPicker from "../components/checkout/CalendarPicker";
import SourceChip from "../components/SourceChip";
import {
  guideLogin,
  guideLogout,
  guideMe,
  getGuideMyDay,
  getGuideMyDays,
  guideSetArrived,
} from "../../services/guide.api";

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

// Cédula: solo dígitos (máx 9), mostrada agrupada 1-4-4 → "2 0862 0302".
function formatCedula(digits) {
  const d = digits.slice(0, 9);
  return [d.slice(0, 1), d.slice(1, 5), d.slice(5, 9)].filter(Boolean).join(" ");
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
    if (cedula.length !== 9) {
      setError("La cédula debe tener 9 dígitos.");
      return;
    }
    setSubmitting(true);
    try {
      const r = await guideLogin(cedula, password); // cedula = solo dígitos
      onLoggedIn(r.guide);
    } catch (err) {
      setError(err?.message || "No se pudo iniciar sesión");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
            <FiCompass className="h-7 w-7" />
          </span>
          <h1 className="text-2xl font-black text-slate-900">Portal de guías</h1>
          <p className="mt-1 text-sm text-slate-500">Ingresá para ver tus tours del día.</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Cédula
          </label>
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 px-3 focus-within:border-emerald-400">
            <FiUser className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              inputMode="numeric"
              value={formatCedula(cedula)}
              onChange={(e) => setCedula(e.target.value.replace(/\D/g, "").slice(0, 9))}
              required
              autoComplete="username"
              placeholder="0 0000 0000"
              className="w-full bg-transparent py-2.5 text-base tracking-wider outline-none"
            />
          </div>

          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Contraseña
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 focus-within:border-emerald-400">
            <FiLock className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full bg-transparent py-2.5 text-base outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
            >
              {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
            </button>
          </div>

          {error && (
            <p className="mt-4 flex items-center gap-1.5 text-sm font-medium text-red-600">
              <FiAlertCircle className="h-4 w-4" /> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
          >
            {submitting ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Reserva ────────────────────────────────────────────────────────────────
function ReservationRow({ r, onToggle, busy }) {
  const parts = [];
  if (r.adults) parts.push(`${r.adults} adulto${r.adults === 1 ? "" : "s"}`);
  if (r.children) parts.push(`${r.children} niño${r.children === 1 ? "" : "s"}`);
  if (r.babies) parts.push(`${r.babies} bebé${r.babies === 1 ? "" : "s"}`);

  return (
    <div className={`flex items-center gap-3 border-t border-slate-100 py-3 first:border-t-0 ${r.arrived ? "opacity-70" : ""}`}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-bold text-slate-500 tabular-nums">
        {r.guests}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={`truncate font-semibold ${r.arrived ? "text-slate-500 line-through" : "text-slate-900"}`}>
            {r.customer?.name || "Sin nombre"}
          </p>
          <SourceChip source={r.source} />
          {r.owes ? (
            <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600 ring-1 ring-red-200 tabular-nums">
              Debe ${r.balanceDue}
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
              Pagado
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500">{parts.join(" · ")}</p>
        {r.customer?.phone && (
          <a href={`tel:${r.customer.phone}`} className="text-sm font-medium text-blue-600">
            {r.customer.phone}
          </a>
        )}
      </div>

      {/* Pasar lista */}
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
    </div>
  );
}

// ─── Día ────────────────────────────────────────────────────────────────────
function GuideDay({ guide, onLogout }) {
  const navigate = useNavigate();
  const [date, setDate] = useState(() => todayYmd());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dayData, setDayData] = useState(null);
  const [myDays, setMyDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const today = todayYmd();
  const tomorrow = shiftYmd(today, 1);

  const loadDay = useCallback(async (d) => {
    setLoading(true);
    try {
      const r = await getGuideMyDay(d);
      setDayData(r);
    } catch {
      setDayData({ slots: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDay(date); }, [loadDay, date]);
  useEffect(() => {
    getGuideMyDays().then((r) => setMyDays(r.days || [])).catch(() => setMyDays([]));
  }, []);

  const slots = dayData?.slots || [];
  const totalGuests = slots.reduce((s, sl) => s + (sl.totalGuests || 0), 0);
  const markedSet = new Set(myDays.map((d) => d.date));

  async function handleLogout() {
    try { await guideLogout(); } catch { /* noop */ }
    onLogout();
  }

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
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white">
              <FiCompass className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">Hola,</p>
              <p className="truncate text-lg font-black leading-tight text-slate-900">{guide.name}</p>
              {guide.isSupervisor && (
                <span className="mt-0.5 inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-700">
                  Supervisor · todos los tours
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {guide.isAdmin && (
              <button
                onClick={() => navigate("/matamoros")}
                title="Ir al panel admin"
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 cursor-pointer"
              >
                <FiSettings className="h-4 w-4" /> <span className="hidden sm:inline">Admin</span>
              </button>
            )}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <FiLogOut className="h-4 w-4" /> <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>

        {/* Navegador de fecha */}
        <div className="relative mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCalendarOpen((o) => !o)}
              aria-label="Elegir fecha"
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl shadow-sm transition cursor-pointer ${
                calendarOpen ? "bg-emerald-600 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200"
              }`}
            >
              <FiCalendar className="h-4 w-4" />
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
                  bare
                  allowPast
                />
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

        {/* Contenido del día */}
        {loading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        ) : slots.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-14 text-center">
            <FiCalendar className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 font-semibold text-slate-700">Sin tours asignados</p>
            <p className="mt-1 text-sm text-slate-400">No tenés horarios este día.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {slots.map((slot) => (
              <div key={`${slot.tourId}-${slot.startTime}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-emerald-600 ring-1 ring-slate-200">
                      <FiClock className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-lg font-black leading-none text-slate-900">{formatClock(slot.startTime)}</p>
                      <p className="mt-0.5 text-xs font-medium text-slate-500">{slot.tourName}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 tabular-nums">
                    <FiUsers className="h-3.5 w-3.5" /> {slot.totalGuests}
                  </span>
                </div>

                <div className="px-4 py-1">
                  {slot.reservations.length === 0 ? (
                    <p className="py-4 text-center text-sm text-slate-400">Aún no hay reservas.</p>
                  ) : (
                    slot.reservations.map((r) => (
                      <ReservationRow key={r.id} r={r} onToggle={handleToggleArrived} busy={busyId === r.id} />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Página ─────────────────────────────────────────────────────────────────
export default function GuiaPortalPage() {
  const [guide, setGuide] = useState(null);
  const [checking, setChecking] = useState(true);

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
  return <GuideDay guide={guide} onLogout={() => setGuide(null)} />;
}
