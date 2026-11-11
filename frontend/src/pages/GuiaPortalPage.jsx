import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDateParam } from "../hooks/useDateParam";
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
  FiChevronDown,
  FiUserPlus,
  FiArrowRight,
  FiDollarSign,
} from "react-icons/fi";
import CalendarPicker from "../components/checkout/CalendarPicker";
import SourceChip from "../components/SourceChip";
import InstallAppCard from "../components/ui/InstallAppCard";
import NotificationsCard from "../components/ui/NotificationsCard";
import {
  guideLogin,
  guideLogout,
  guideMe,
  getGuideMyDay,
  getGuideMyDays,
  guideSetArrived,
  getGuideAllGuides,
  assignGuideSlot,
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
    if (fullCedula.length !== 9) {
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
const REVENUE_ROWS = [
  { key: "direct", label: "Directo", dot: "bg-emerald-500" },
  { key: "viator", label: "Viator", dot: "bg-blue-500" },
  { key: "gyg", label: "GetYourGuide", dot: "bg-red-500" },
  { key: "localbird", label: "Localbird", dot: "bg-yellow-400" },
];

function money(n) {
  const v = Number(n) || 0;
  return `$${v.toLocaleString("en-US", { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

function DayRevenueCard({ revenue }) {
  const rows = REVENUE_ROWS.filter((r) => revenue.bySource?.[r.key] != null);
  return (
    <div className="mb-4 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-4 text-white shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-100">Generado del día</p>
          <p className="mt-0.5 text-3xl font-black tabular-nums leading-tight">{money(revenue.total)}</p>
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/15">
          <FiDollarSign className="h-5 w-5" />
        </span>
      </div>
      {rows.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {rows.map((r) => (
            <div key={r.key} className="flex items-center justify-between gap-2 rounded-xl bg-white/10 px-3 py-2">
              <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-semibold text-emerald-50">
                <span className={`h-2 w-2 shrink-0 rounded-full ${r.dot}`} />
                <span className="truncate">{r.label}</span>
              </span>
              <span className="text-sm font-bold tabular-nums">{money(revenue.bySource[r.key])}</span>
            </div>
          ))}
        </div>
      )}
      {revenue.missing > 0 && (
        <p className="mt-2.5 text-xs font-medium text-emerald-100">
          {revenue.missing} reserva{revenue.missing === 1 ? "" : "s"} OTA sin precio todavía (no se suma{revenue.missing === 1 ? "" : "n"}).
        </p>
      )}
      <p className="mt-2 text-[11px] text-emerald-100/80">Neto para el negocio: Viator ya sin comisión, GetYourGuide −30 %.</p>
    </div>
  );
}

// ─── Selector de guía por slot (solo supervisor) ────────────────────────────
function SlotGuidePicker({ slot, date, allGuides, onChanged }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const assignedIds = new Set((slot.guides || []).map((g) => g.id));

  async function toggle(guideId) {
    const isOn = assignedIds.has(guideId);
    setSaving(true);
    try {
      await assignGuideSlot({
        tourId: slot.tourId, tourDate: date, startTime: slot.startTime, guideId, assigned: !isOn,
      });
      onChanged(guideId, !isOn); // update local del slot, sin recargar la página
    } catch { /* noop */ } finally {
      setSaving(false);
    }
  }

  const names = (slot.guides || []).map((g) => g.name).join(", ");
  const hasGuide = (slot.guides || []).length > 0;

  return (
    <div className="relative">
      {hasGuide ? (
        // Con guía: se cambia tocando el nombre (no hay botón aparte).
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          disabled={saving}
          title="Tocá para cambiar el guía"
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100 disabled:opacity-50 cursor-pointer"
        >
          <FiCompass className="h-3.5 w-3.5" /> Guía: {names}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 px-3 py-1 text-xs font-semibold text-slate-500 hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-50 cursor-pointer"
        >
          <FiUserPlus className="h-3.5 w-3.5" /> Asignar guía
        </button>
      )}
      {open && (
        <>
          <button type="button" aria-hidden tabIndex={-1} onClick={() => setOpen(false)} className="fixed inset-0 z-20 cursor-default" />
          <div className="absolute left-0 top-full z-30 mt-1 w-56 max-w-[calc(100vw-3rem)] rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
            {allGuides.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-400">No hay guías</p>
            ) : (
              allGuides.map((g) => {
                const on = assignedIds.has(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggle(g.id)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer"
                  >
                    <span className={on ? "font-semibold text-emerald-700" : "text-slate-700"}>{g.name}</span>
                    {on && <FiCheck className="h-4 w-4 text-emerald-600" />}
                  </button>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Día ────────────────────────────────────────────────────────────────────
function GuideDay({ guide, onLogout }) {
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
  useEffect(() => {
    if (guide.isSupervisor) {
      getGuideAllGuides().then((r) => setAllGuides(r.guides || [])).catch(() => setAllGuides([]));
    }
  }, [guide.isSupervisor]);

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
            ? (current.some((x) => x.id === guideId) ? current : [...current, { id: guideId, name: g?.name || "" }])
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
            {!guide.isViewer && (
            <div className="flex shrink-0 items-center gap-2">
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
              <button
                onClick={handleLogout}
                title="Salir"
                aria-label="Salir"
                className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 cursor-pointer"
              >
                <FiLogOut className="h-5 w-5" />
              </button>
            </div>
            )}
          </div>
        </div>

        <NotificationsCard isAdmin={guide.isAdmin} isViewer={guide.isViewer} className="mb-4" />

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

        {guide.isSupervisor && !loading && dayData?.revenue && slots.length > 0 && (
          <DayRevenueCard revenue={dayData.revenue} />
        )}

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
              <div key={`${slot.tourId}-${slot.startTime}`} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="rounded-t-2xl border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
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

                  {/* Guía asignado al slot (antes de los clientes) */}
                  <div className="mt-2.5">
                    {guide.isSupervisor ? (
                      <SlotGuidePicker slot={slot} date={date} allGuides={allGuides} onChanged={(gid, on) => patchSlotGuides(slot, gid, on)} />
                    ) : slot.guides && slot.guides.length > 0 ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                        <FiCompass className="h-3.5 w-3.5" /> Guía: {slot.guides.map((g) => g.name).join(", ")}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">Sin guía asignado</span>
                    )}
                  </div>
                </div>

                <div className="px-4 py-1">
                  {slot.reservations.length === 0 ? (
                    <p className="py-4 text-center text-sm text-slate-400">Aún no hay reservas.</p>
                  ) : (
                    slot.reservations.map((r) => (
                      <ReservationRow key={r.id} r={r} onToggle={handleToggleArrived} busy={busyId === r.id} readOnly={guide.isViewer} />
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
