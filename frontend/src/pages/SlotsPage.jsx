import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiCalendar,
  FiUsers,
  FiClock,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiLock,
  FiUnlock,
  FiSliders,
} from "react-icons/fi";
import CalendarPicker from "../components/checkout/CalendarPicker";
import SourceChip from "../components/SourceChip";
import { getDayBlocks, blockDay, unblockDay } from "../../services/availability.blocks.api";
import { getSlotOverrides, upsertSlotOverride, deleteSlotOverride } from "../../services/slot-overrides.api";
import { getPayments } from "../../services/payments.api";

const TOUR_ID = 2;
const TOUR2_CAPACITY = 16;
const SLOTS = ["08:00", "12:00", "15:00"];
const TOUR_NAME = "La Fortuna: Horseback Riding Tour with River Crossing";
const TOUR_IMG = "/tours/familyHorsebackRiding.webp";

const WEEKDAYS_FULL = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
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

function fullDate(ymd) {
  const d = new Date(`${ymd}T00:00:00`);
  return `${WEEKDAYS_FULL[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

// "Vie, 11 Set 2026"
function navLabel(ymd) {
  const d = new Date(`${ymd}T00:00:00`);
  const mon = MONTHS[d.getMonth()];
  return `${WEEKDAYS_SHORT[d.getDay()]}, ${d.getDate()} ${mon.charAt(0).toUpperCase()}${mon.slice(1)} ${d.getFullYear()}`;
}

function parseFecha(raw) {
  if (!raw) return "";
  if (raw instanceof Date) return raw.toISOString().slice(0, 10);
  return String(raw).slice(0, 10);
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast, onClose }) {
  if (!toast) return null;
  const style = toast.type === "success"
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-red-200 bg-red-50 text-red-800";
  return (
    <div className="fixed top-4 right-4 z-50" role="status" aria-live="polite">
      <div className={`w-80 border rounded-xl shadow-lg p-4 ${style}`}>
        <div className="flex items-start gap-3">
          <p className="flex-1 text-sm font-medium">{toast.message}</p>
          <button onClick={onClose} className="opacity-60 hover:opacity-100 text-xs cursor-pointer">✕</button>
        </div>
      </div>
    </div>
  );
}

// ─── Stepper input (+/-) ──────────────────────────────────────────────────────
function StepperInput({ value, onChange, min = 0, max = TOUR2_CAPACITY, disabled }) {
  const base =
    "grid h-9 w-9 place-items-center text-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer";
  return (
    <div className={`inline-flex items-center rounded-lg border border-slate-200 overflow-hidden ${disabled ? "opacity-60" : ""}`}>
      <button
        type="button"
        aria-label="Quitar un cupo"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        className={base}
      >
        −
      </button>
      <span className="w-10 text-center text-sm font-semibold text-slate-900 tabular-nums select-none">
        {value}
      </span>
      <button
        type="button"
        aria-label="Agregar un cupo"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        className={base}
      >
        +
      </button>
    </div>
  );
}

// ─── Slot row ─────────────────────────────────────────────────────────────────
function SlotRow({
  slot, isDayBlocked, phantom, reservations,
  onSetCapacity, onBlock, onUnblock, loading, last,
}) {
  const [showReservas, setShowReservas] = useState(false);

  const slotReservations = useMemo(
    () => reservations.filter((p) => String(p?.booking?.hora ?? "").slice(0, 5) === slot),
    [reservations, slot]
  );

  // Asientos ocupados por reservas reales (adultos + niños; los bebés no cuentan)
  const guestsTaken = useMemo(
    () =>
      slotReservations.reduce(
        (sum, p) => sum + (Number(p.booking?.seats ?? p.booking?.personas) || 0),
        0
      ),
    [slotReservations]
  );

  // Capacidad efectiva = base − cupos retirados (phantom). No es una reserva:
  // solo baja cuántos cupos se ofrecen al público.
  const capacity = Math.max(0, TOUR2_CAPACITY - phantom);
  const effectiveCapacity = Math.max(capacity, guestsTaken);
  const available = Math.max(0, effectiveCapacity - guestsTaken);
  const slotBlocked = !isDayBlocked && available <= 0;
  const canBook = !isDayBlocked && available > 0;

  return (
    <div className={`px-5 py-5 ${last ? "" : "border-b border-slate-100"}`}>
      {/* Fila título */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
            <FiClock className="h-4 w-4" />
          </span>
          <span className="text-lg font-bold text-slate-900 tabular-nums">{slot}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isDayBlocked && (
            slotBlocked ? (
              <button
                type="button"
                onClick={onUnblock}
                disabled={loading}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <FiUnlock className="h-3.5 w-3.5" /> Desbloquear
              </button>
            ) : (
              <button
                type="button"
                onClick={onBlock}
                disabled={loading}
                className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <FiLock className="h-3.5 w-3.5" /> Bloquear
              </button>
            )
          )}
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ${
              isDayBlocked
                ? "bg-slate-50 text-slate-500 ring-slate-200"
                : canBook
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : "bg-red-50 text-red-600 ring-red-200"
            }`}
          >
            {isDayBlocked ? "Día bloqueado" : canBook ? "Disponible" : "No disponible"}
          </span>
        </div>
      </div>

      {/* Controles */}
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-600">Cupos disponibles</span>
          <StepperInput
            value={effectiveCapacity}
            onChange={onSetCapacity}
            min={guestsTaken}
            max={TOUR2_CAPACITY}
            disabled={isDayBlocked || loading}
          />
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-500">
          <span><span className="font-semibold text-slate-900 tabular-nums">{guestsTaken}</span> reservados</span>
          <span><span className="font-semibold text-slate-900 tabular-nums">{available}</span> libres</span>
          <span className="text-slate-300">·</span>
          <span className="tabular-nums">máx {TOUR2_CAPACITY}</span>
        </div>
      </div>

      {/* Reservas */}
      {slotReservations.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowReservas((v) => !v)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            <FiChevronDown className={`h-4 w-4 transition-transform ${showReservas ? "rotate-180" : ""}`} />
            {showReservas ? "Ocultar" : "Mostrar"} {slotReservations.length} reserva{slotReservations.length !== 1 ? "s" : ""}
          </button>

          {showReservas && (
            <div className="mt-3 space-y-2">
              {slotReservations.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-sm">
                  <span className="font-semibold text-slate-800">{p.customer?.name || "–"}</span>
                  <SourceChip source={p.booking?.source} />
                  {p.customer?.phone && <span className="text-slate-500">{p.customer.phone}</span>}
                  <span className="ml-auto font-semibold text-emerald-700 tabular-nums">
                    {p.booking?.personas ?? "?"} pers.
                    {Number(p.booking?.children) > 0 || Number(p.booking?.babies) > 0
                      ? ` (${p.booking.adults}A · ${p.booking.children}N · ${p.booking.babies}B)`
                      : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SlotsPage() {
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState(() => todayYmd());
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [dayBlocksData, setDayBlocksData] = useState([]);
  const [overrides, setOverrides] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  function showToast(type, message) {
    setToast({ type, message });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 3000);
  }

  const fetchDay = useCallback(async (day) => {
    setLoading(true);
    try {
      const [blocks, pays] = await Promise.all([
        getDayBlocks({ tourId: TOUR_ID, from: day, to: day }),
        getPayments(),
      ]);
      setDayBlocksData(blocks?.blocks || []);
      setPayments(pays?.payments || []);

      try {
        const ovr = await getSlotOverrides({ tourId: TOUR_ID, from: day, to: day });
        setOverrides(ovr?.overrides || []);
      } catch {
        setOverrides([]);
      }
    } catch (e) {
      showToast("error", "Error cargando datos: " + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDay(selectedDay); }, [fetchDay, selectedDay]);

  const isDayBlocked = useMemo(
    () => dayBlocksData.some((b) => b.day === selectedDay),
    [dayBlocksData, selectedDay]
  );

  const overrideMap = useMemo(() => {
    const m = new Map();
    for (const o of overrides) {
      if (o.tour_date === selectedDay) m.set(o.start_time, Number(o.capacity_override));
    }
    return m;
  }, [overrides, selectedDay]);

  const dayPayments = useMemo(
    () => payments.filter((p) => parseFecha(p?.booking?.fecha) === selectedDay),
    [payments, selectedDay]
  );

  const totalParticipants = useMemo(
    () =>
      dayPayments.reduce(
        (sum, p) => sum + (Number(p.booking?.seats ?? p.booking?.personas) || 0),
        0
      ),
    [dayPayments]
  );

  async function handleToggleDayBlock(block) {
    const key = "dayblock";
    setActionLoading((p) => ({ ...p, [key]: true }));
    try {
      if (block) await blockDay({ tourId: TOUR_ID, day: selectedDay });
      else await unblockDay({ tourId: TOUR_ID, day: selectedDay });
      // Solo actualizamos el estado del día en memoria; no recargamos la página.
      setDayBlocksData((prev) =>
        block
          ? [...prev.filter((b) => b.day !== selectedDay), { day: selectedDay }]
          : prev.filter((b) => b.day !== selectedDay)
      );
      showToast("success", block ? "Día bloqueado" : "Día desbloqueado");
    } catch (e) {
      showToast("error", e.message);
    } finally {
      setActionLoading((p) => ({ ...p, [key]: false }));
    }
  }

  // Refleja el cambio de un solo horario en memoria, sin volver a pedir todo.
  function applyOverrideLocal(slot, phantom) {
    setOverrides((prev) => {
      const rest = prev.filter(
        (o) => !(o.tour_date === selectedDay && o.start_time === slot)
      );
      if (phantom === 0) return rest;
      return [...rest, { tour_date: selectedDay, start_time: slot, capacity_override: phantom }];
    });
  }

  // Fija la capacidad efectiva del horario. Guarda phantom = base − capacidad.
  async function handleSetCapacity(slot, capacity) {
    const phantom = Math.max(0, TOUR2_CAPACITY - capacity);
    const key = `slot-${slot}`;
    setActionLoading((p) => ({ ...p, [key]: true }));
    try {
      if (phantom === 0) {
        await deleteSlotOverride({ tourId: TOUR_ID, tourDate: selectedDay, startTime: slot }).catch(() => {});
        showToast("success", `Horario ${slot}: cupo completo (${TOUR2_CAPACITY})`);
      } else {
        await upsertSlotOverride({ tourId: TOUR_ID, tourDate: selectedDay, startTime: slot, capacityOverride: phantom });
        showToast("success", `Horario ${slot}: ${capacity} cupos`);
      }
      applyOverrideLocal(slot, phantom);
    } catch (e) {
      showToast("error", e.message);
    } finally {
      setActionLoading((p) => ({ ...p, [key]: false }));
    }
  }

  async function handleBlockSlot(slot) {
    await handleSetCapacity(slot, 0);
  }

  async function handleUnblockSlot(slot) {
    await handleSetCapacity(slot, TOUR2_CAPACITY);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate("/matamoros")}
            aria-label="Volver al panel"
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <FiArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900">
              <FiSliders className="h-6 w-6 text-blue-600" />
              Disponibilidad
            </h1>
            <p className="text-sm text-slate-500">
              Elegí un día y ajustá cupos, horarios y bloqueos.
            </p>
          </div>
        </div>

        {/* Barra de navegación de fecha */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCalendarOpen((o) => !o)}
              aria-label="Elegir fecha"
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl shadow-sm transition cursor-pointer ${
                calendarOpen
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              <FiCalendar className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-0.5 rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200">
              <button
                type="button"
                onClick={() => setSelectedDay((d) => shiftYmd(d, -1))}
                aria-label="Día anterior"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <FiChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedDay((d) => shiftYmd(d, 1))}
                aria-label="Día siguiente"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <FiChevronRight className="h-4 w-4" />
              </button>
            </div>

            <span className="whitespace-nowrap text-base font-bold text-slate-800">
              {navLabel(selectedDay)}
            </span>

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
                    selected={selectedDay}
                    bare
                    onSelect={(ymd) => {
                      if (ymd) {
                        setSelectedDay(ymd);
                        setCalendarOpen(false);
                      }
                    }}
                  />
                </div>
              </>
            )}
          </div>

        </div>

        {/* Tarjeta del día */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Encabezado tipo supplier */}
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3.5 min-w-0">
              <img
                src={TOUR_IMG}
                alt="Horseback Riding Tour"
                loading="lazy"
                className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
              />
              <div className="min-w-0">
                <h2 className="text-base font-bold leading-snug text-slate-900">{TOUR_NAME}</h2>
                <p className="mt-0.5 text-sm text-slate-400 capitalize">{fullDate(selectedDay)}</p>
                <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm font-medium text-slate-700">
                  <span className="inline-flex items-center gap-2">
                    <FiUsers className="h-4 w-4 text-slate-400" />
                    {totalParticipants} participante{totalParticipants === 1 ? "" : "s"}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <FiClock className="h-4 w-4 text-slate-400" />
                    {SLOTS.length} horarios
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <FiCalendar className="h-4 w-4 text-slate-400" />
                    {TOUR2_CAPACITY} cupos/horario
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleToggleDayBlock(!isDayBlocked)}
              disabled={!!actionLoading["dayblock"]}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer ${
                isDayBlocked
                  ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  : "border-red-200 text-red-600 hover:bg-red-50"
              }`}
            >
              {isDayBlocked ? <><FiUnlock className="h-4 w-4" /> Desbloquear día</> : <><FiLock className="h-4 w-4" /> Bloquear día</>}
            </button>
          </div>

          {/* Aviso de día bloqueado */}
          {isDayBlocked && !loading && (
            <div className="flex items-center gap-2 border-b border-red-100 bg-red-50 px-5 py-3 text-sm font-medium text-red-700">
              <FiLock className="h-4 w-4" />
              Este día está bloqueado. Ningún horario acepta reservas nuevas.
            </div>
          )}

          {/* Horarios */}
          {loading ? (
            <div className="p-5 space-y-4">
              {SLOTS.map((s) => (
                <div key={s} className="h-24 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : (
            <div>
              {SLOTS.map((slot, i) => (
                <SlotRow
                  key={slot}
                  slot={slot}
                  last={i === SLOTS.length - 1}
                  isDayBlocked={isDayBlocked}
                  phantom={overrideMap.get(slot) ?? 0}
                  reservations={dayPayments}
                  loading={!!actionLoading[`slot-${slot}`]}
                  onSetCapacity={(cap) => handleSetCapacity(slot, cap)}
                  onBlock={() => handleBlockSlot(slot)}
                  onUnblock={() => handleUnblockSlot(slot)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
