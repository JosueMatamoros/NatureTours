import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAvailabilityBlocked } from "../../services/availability.api";
import { getDayBlocks, blockDay, unblockDay } from "../../services/availability.blocks.api";
import { getSlotOverrides, upsertSlotOverride, deleteSlotOverride } from "../../services/slot-overrides.api";
import { getPayments } from "../../services/payments.api";

const TOUR_ID = 2;
const TOUR2_CAPACITY = 16;
const SLOTS = ["08:00", "12:00", "15:00"];
const DAYS_AHEAD = 6;
const TOUR_NAME = "La Fortuna: Horseback Riding Tour with River Crossing";

const WEEKDAYS_SHORT = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const WEEKDAYS_FULL = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"];

function todayYmd() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

function addDays(ymd, n) {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function shortDate(ymd) {
  const d = new Date(`${ymd}T00:00:00`);
  return `${WEEKDAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function fullDate(ymd) {
  const d = new Date(`${ymd}T00:00:00`);
  return `${WEEKDAYS_FULL[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
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
    <div className="fixed top-4 right-4 z-50">
      <div className={`w-80 border rounded-xl shadow p-4 ${style}`}>
        <div className="flex items-start gap-3">
          <p className="flex-1 text-sm font-medium">{toast.message}</p>
          <button onClick={onClose} className="opacity-60 hover:opacity-100 text-xs">✕</button>
        </div>
      </div>
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
        checked ? "bg-blue-500" : "bg-gray-300"
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
        checked ? "translate-x-6" : "translate-x-1"
      }`} />
    </button>
  );
}

// ─── Stepper input (+/-) ──────────────────────────────────────────────────────
function StepperInput({ value, onChange, min = 0, max = TOUR2_CAPACITY }) {
  return (
    <div className="flex items-center gap-0 rounded-lg border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        −
      </button>
      <span className="w-8 text-center text-sm font-semibold text-gray-800 select-none">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        +
      </button>
    </div>
  );
}

// ─── Phantom popover ──────────────────────────────────────────────────────────
function PhantomPopover({ phantom, maxPhantom, onSave, onReset, onClose, saving }) {
  const [val, setVal] = useState(phantom ?? 0);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const hasChanged = val !== (phantom ?? 0);

  return (
    <div
      ref={ref}
      className="absolute left-0 z-20 mt-2 w-56 sm:w-60 rounded-xl border border-gray-200 bg-white shadow-lg p-4"
    >
      <p className="text-xs font-medium text-gray-500 mb-3">Espacios bloqueados (fantasma)</p>

      <div className="flex items-center gap-3">
        <StepperInput value={val} onChange={setVal} min={0} max={maxPhantom} />
        <span className="text-xs text-gray-400">/ {maxPhantom}</span>
      </div>

      <div className="flex items-center gap-2 mt-3">
        {hasChanged && (
          <button
            onClick={() => onSave(val)}
            disabled={saving}
            className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        )}
        {(phantom ?? 0) > 0 && (
          <button
            onClick={onReset}
            disabled={saving}
            className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
          >
            Quitar
          </button>
        )}
        <button onClick={onClose} className="ml-auto text-xs text-gray-400 hover:text-gray-600">
          Cerrar
        </button>
      </div>
    </div>
  );
}

// ─── Slot row ─────────────────────────────────────────────────────────────────
function SlotRow({
  date, slot, isDayBlocked, phantom, slotRemaining, reservations,
  onBlockSlot, onUnblockSlot, onSavePhantom, onResetPhantom,
  slotLoading, phantomLoading,
}) {
  const [showPhantom, setShowPhantom] = useState(false);
  const [showReservas, setShowReservas] = useState(false);

  const slotReservations = useMemo(
    () => reservations.filter((p) => String(p?.booking?.hora ?? "").slice(0, 5) === slot),
    [reservations, slot]
  );

  const guestsTaken = useMemo(
    () => slotReservations.reduce((sum, p) => sum + (Number(p.booking?.personas) || 0), 0),
    [slotReservations]
  );

  // Spots still available for customers (what's left after real bookings)
  const freeSpots = Math.max(0, TOUR2_CAPACITY - guestsTaken);
  // Phantom blocks ALL remaining free spots
  const isPhantomBlocked = phantom >= freeSpots && freeSpots > 0 || phantom >= TOUR2_CAPACITY;
  // Effective capacity shown = real capacity - phantom
  const effectiveCapacity = Math.max(0, TOUR2_CAPACITY - phantom);
  const isApiBlocked = isDayBlocked || (slotRemaining !== null && slotRemaining <= 0);
  const isBlocked = isPhantomBlocked || isApiBlocked;
  const canBook = !isBlocked;

  function handleToggle(checked) {
    if (checked) onBlockSlot(freeSpots); // phantom = remaining free spots
    else onUnblockSlot();
  }

  return (
    <div className="flex border-b last:border-b-0">
      {/* Time column */}
      <div className="w-20 sm:w-24 shrink-0 flex flex-col justify-center py-4 pl-3 sm:pl-4 pr-2 text-gray-500">
        <span className="text-xs hidden sm:block">{shortDate(date)}</span>
        <span className="text-sm font-bold text-gray-800 mt-0.5">{slot}</span>
      </div>

      {/* Content */}
      <div className="flex-1 py-4 pr-3 sm:pr-4 min-w-0">
        {/* Badge — top on mobile, inline on sm+ */}
        <div className="flex items-start justify-between gap-2 mb-2 sm:mb-0">
          <p className="text-sm font-semibold text-gray-900 truncate flex-1">{TOUR_NAME}</p>
          <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
            canBook ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
          }`}>
            {canBook ? "Disponible" : "No disponible"}
          </span>
        </div>

        {/* Bloquear toggle — blocks this slot via phantom */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-gray-700">Bloquear</span>
          <Toggle
            checked={isPhantomBlocked || isDayBlocked}
            onChange={handleToggle}
            disabled={slotLoading || isDayBlocked}
          />
        </div>

        {/* Disponibilidad */}
        <div className="flex items-center gap-1 mt-1.5 text-sm text-gray-700 flex-wrap">
          <span>Disponibilidad</span>
          <span className="font-medium">
            {guestsTaken} / {effectiveCapacity} Participantes
          </span>
          <div className="relative">
            <button
              onClick={() => setShowPhantom((v) => !v)}
              className="ml-1 text-blue-600 text-xs hover:underline"
            >
              actualizar
            </button>
            {showPhantom && (
              <PhantomPopover
                phantom={phantom}
                maxPhantom={freeSpots}
                onSave={(n) => { onSavePhantom(n); setShowPhantom(false); }}
                onReset={() => { onResetPhantom(); setShowPhantom(false); }}
                onClose={() => setShowPhantom(false)}
                saving={phantomLoading}
              />
            )}
          </div>
        </div>

        {/* Hora límite */}
        <p className="mt-1 text-sm text-gray-500">
          Hora límite <span className="font-medium text-gray-700">2 horas</span>
        </p>

        {/* Reservas */}
        {slotReservations.length > 0 && (
          <button
            onClick={() => setShowReservas((v) => !v)}
            className="mt-2 text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            <span>{showReservas ? "▲" : "▼"}</span>
            Mostrar {slotReservations.length} reserva{slotReservations.length !== 1 ? "s" : ""}
          </button>
        )}

        {showReservas && (
          <div className="mt-2 space-y-1">
            {slotReservations.map((p) => (
              <div key={p.id} className="text-xs bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 flex flex-wrap items-center gap-2">
                <span className="font-medium text-gray-800">{p.customer?.name || "–"}</span>
                {p.customer?.phone && <span className="text-gray-500">{p.customer.phone}</span>}
                <span className="ml-auto text-emerald-700 font-semibold">{p.booking?.personas ?? "?"} pers.</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SlotsPage() {
  const from = useMemo(() => todayYmd(), []);
  const to = useMemo(() => addDays(from, DAYS_AHEAD), [from]);

  const [availData, setAvailData] = useState(null);
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

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [avail, blocks, pays] = await Promise.all([
        getAvailabilityBlocked({ tourId: TOUR_ID, from, to }),
        getDayBlocks({ tourId: TOUR_ID, from, to }),
        getPayments(),
      ]);
      setAvailData(avail);
      setDayBlocksData(blocks?.blocks || []);
      setPayments(pays?.payments || []);

      try {
        const ovr = await getSlotOverrides({ tourId: TOUR_ID, from, to });
        setOverrides(ovr?.overrides || []);
      } catch (_) {
        setOverrides([]);
      }
    } catch (e) {
      showToast("error", "Error cargando datos: " + e.message);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const blockedDaySet = useMemo(
    () => new Set(dayBlocksData.map((b) => b.day)),
    [dayBlocksData]
  );

  const overrideMap = useMemo(() => {
    const m = new Map();
    for (const o of overrides) {
      m.set(`${o.tour_date}|${o.start_time}`, Number(o.capacity_override));
    }
    return m;
  }, [overrides]);

  const availMap = useMemo(() => {
    const m = new Map();
    for (const day of availData?.days || []) m.set(day.date, day);
    return m;
  }, [availData]);

  const paymentsByDate = useMemo(() => {
    const m = new Map();
    for (const p of payments) {
      const fecha = parseFecha(p?.booking?.fecha);
      if (fecha.length < 10) continue;
      if (!m.has(fecha)) m.set(fecha, []);
      m.get(fecha).push(p);
    }
    return m;
  }, [payments]);

  const dates = useMemo(() => {
    const list = [];
    for (let i = 0; i <= DAYS_AHEAD; i++) list.push(addDays(from, i));
    return list;
  }, [from]);

  async function handleToggleDayBlock(date, block) {
    const key = `dayblock-${date}`;
    setActionLoading((p) => ({ ...p, [key]: true }));
    try {
      if (block) await blockDay({ tourId: TOUR_ID, day: date });
      else await unblockDay({ tourId: TOUR_ID, day: date });
      showToast("success", block ? "Día bloqueado" : "Día desbloqueado");
      await fetchAll();
    } catch (e) {
      showToast("error", e.message);
    } finally {
      setActionLoading((p) => ({ ...p, [key]: false }));
    }
  }

  async function handleBlockSlot(date, slot, freeSpots) {
    // Phantom = remaining free spots (locks out new bookings without touching existing ones)
    await handleSavePhantom(date, slot, freeSpots);
  }

  async function handleUnblockSlot(date, slot) {
    await handleResetPhantom(date, slot);
  }

  async function handleSavePhantom(date, slot, n) {
    const key = `phantom-${date}|${slot}`;
    setActionLoading((p) => ({ ...p, [key]: true }));
    try {
      await upsertSlotOverride({ tourId: TOUR_ID, tourDate: date, startTime: slot, capacityOverride: n });
      showToast("success", n >= TOUR2_CAPACITY ? `Slot ${slot} bloqueado` : `Actualizado: ${slot}`);
      await fetchAll();
    } catch (e) {
      showToast("error", e.message);
    } finally {
      setActionLoading((p) => ({ ...p, [key]: false }));
    }
  }

  async function handleResetPhantom(date, slot) {
    const key = `phantom-${date}|${slot}`;
    setActionLoading((p) => ({ ...p, [key]: true }));
    try {
      await deleteSlotOverride({ tourId: TOUR_ID, tourDate: date, startTime: slot });
      showToast("success", "Bloqueo eliminado");
      await fetchAll();
    } catch (e) {
      showToast("error", e.message);
    } finally {
      setActionLoading((p) => ({ ...p, [key]: false }));
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-3 py-4 sm:px-6 sm:py-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Disponibilidad por slot</h1>
        <p className="text-sm text-gray-400 mt-1">
          Próximos 7 días · Tour 2 · {TOUR2_CAPACITY} participantes por horario
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32 text-gray-400">Cargando...</div>
      ) : (
        <div className="space-y-6">
          {dates.map((date) => {
            const isDayBlocked = blockedDaySet.has(date);
            const dayData = availMap.get(date);
            const datePayments = paymentsByDate.get(date) || [];

            return (
              <div key={date} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                {/* Date header */}
                <div className={`px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b ${
                  isDayBlocked ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"
                }`}>
                  <span className={`text-sm font-semibold capitalize ${isDayBlocked ? "text-red-700" : "text-gray-700"}`}>
                    {fullDate(date)}
                  </span>
                  <button
                    onClick={() => handleToggleDayBlock(date, !isDayBlocked)}
                    disabled={!!actionLoading[`dayblock-${date}`]}
                    className={`shrink-0 text-xs font-medium px-3 py-1 rounded-full transition disabled:opacity-50 ${
                      isDayBlocked
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        : "bg-red-100 text-red-600 hover:bg-red-200"
                    }`}
                  >
                    {isDayBlocked ? "Desbloquear día" : "Bloquear día"}
                  </button>
                </div>

                {/* Slots */}
                {SLOTS.map((slot) => {
                  const overrideKey = `${date}|${slot}`;
                  const phantom = overrideMap.get(overrideKey) ?? 0;
                  const slotRemaining = dayData?.slotRemaining?.[slot] ?? null;

                  return (
                    <SlotRow
                      key={slot}
                      date={date}
                      slot={slot}
                      isDayBlocked={isDayBlocked}
                      phantom={phantom}
                      slotRemaining={slotRemaining}
                      reservations={datePayments}
                      slotLoading={!!actionLoading[`phantom-${overrideKey}`]}
                      phantomLoading={!!actionLoading[`phantom-${overrideKey}`]}
                      onBlockSlot={(free) => handleBlockSlot(date, slot, free)}
                      onUnblockSlot={() => handleUnblockSlot(date, slot)}
                      onSavePhantom={(n) => handleSavePhantom(date, slot, n)}
                      onResetPhantom={() => handleResetPhantom(date, slot)}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
