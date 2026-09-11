import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiCopy,
  FiPlus,
  FiUserCheck,
  FiUsers,
  FiX,
  FiAlertTriangle,
  FiCompass,
  FiCalendar,
} from "react-icons/fi";
import CalendarPicker from "../components/checkout/CalendarPicker";
import {
  getAttendance,
  setArrived as apiSetArrived,
  createManualBooking,
} from "../../services/attendance.api";
import {
  getGuides,
  getGuideAssignments,
  assignGuide as apiAssignGuide,
} from "../../services/guides.api";

const BUSINESS_TIME_ZONE = "America/Costa_Rica";
const TOUR_DURATION_MINUTES = 120;

// Tours reservables (para el alta manual). Si crece, traer del backend.
const TOURS = [
  { id: 2, name: "Horseback Riding", slots: ["08:00", "12:00", "15:00"] },
  { id: 1, name: "Night Walk", slots: ["18:00", "20:00"] },
];

const MONTH_NAMES_ES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "set", "oct", "nov", "dic",
];
const MONTH_NAMES_FULL_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "setiembre", "octubre", "noviembre", "diciembre",
];
const WEEKDAY_NAMES_ES = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado",
];
const WEEKDAY_SHORT_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

// ─── Fechas ──────────────────────────────────────────────────────────────────
function getTodayYmdInTimeZone(timeZone = BUSINESS_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const value = (t) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function shiftYmd(ymd, days) {
  if (!ymd || ymd.length < 10) return "";
  const base = new Date(`${ymd.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(base.getTime())) return "";
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

function ymdParts(ymd) {
  const [y, m, d] = String(ymd).split("-").map(Number);
  return { y, m, d };
}
function weekdayOf(ymd) {
  const { y, m, d } = ymdParts(ymd);
  return new Date(y, m - 1, d, 12, 0, 0).getDay();
}

function formatDayHeader(ymd, todayYmd, tomorrowYmd) {
  if (!ymd) return "";
  const { m, d, y } = ymdParts(ymd);
  const base = `${WEEKDAY_NAMES_ES[weekdayOf(ymd)]}, ${d} de ${MONTH_NAMES_FULL_ES[m - 1]} ${y}`;
  if (ymd === todayYmd) return `Hoy · ${base}`;
  if (ymd === tomorrowYmd) return `Mañana · ${base}`;
  return base;
}
function formatCompactDate(ymd) {
  if (!ymd) return "";
  const { m, d, y } = ymdParts(ymd);
  const month = MONTH_NAMES_ES[m - 1];
  return `${WEEKDAY_SHORT_ES[weekdayOf(ymd)]}, ${d} ${month.charAt(0).toUpperCase()}${month.slice(1)} ${y}`;
}

// ─── Horas ───────────────────────────────────────────────────────────────────
function formatClockTime(hhmm, { noon = "12 md" } = {}) {
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr), m = Number(mStr);
  if (h === 12 && m === 0) return noon;
  const period = h < 12 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12} ${period}` : `${h12}:${String(m).padStart(2, "0")} ${period}`;
}
function addMinutesToHHMM(hhmm, minutes) {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor((total % (24 * 60)) / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
function formatSlotRange(startHHMM) {
  return `${formatClockTime(startHHMM)} – ${formatClockTime(addMinutesToHHMM(startHHMM, TOUR_DURATION_MINUTES))}`;
}

function paxLabel(r) {
  const parts = [`${r.adults} adulto${r.adults === 1 ? "" : "s"}`];
  if (r.children > 0) parts.push(`${r.children} niño${r.children === 1 ? "" : "s"}`);
  if (r.babies > 0) parts.push(`${r.babies} bebé${r.babies === 1 ? "" : "s"}`);
  return parts.join(" · ");
}

// ─── Copiar teléfono ─────────────────────────────────────────────────────────
function CopyPhone({ text }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy(e) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      if (navigator.vibrate) navigator.vibrate(30);
      setCopied(true);
      clearTimeout(handleCopy._t);
      handleCopy._t = setTimeout(() => setCopied(false), 1000);
    } catch {
      /* clipboard no disponible — ignorar */
    }
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-700 hover:bg-gray-200"
      title="Copiar teléfono"
    >
      {text}
      {copied ? <FiCheck size={12} className="text-emerald-600" /> : <FiCopy size={12} className="text-gray-400" />}
    </button>
  );
}

// ─── Fila de una reserva ─────────────────────────────────────────────────────
function ReservationRow({ r, onToggleArrived, busy }) {
  const owes = r.owes;

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border p-4 transition sm:flex-row sm:items-center sm:justify-between ${
        r.arrived
          ? "border-emerald-200 bg-emerald-50/60"
          : owes
          ? "border-red-300 bg-red-50"
          : "border-gray-200 bg-white"
      }`}
    >
      {/* Info del cliente */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={`font-bold ${r.arrived ? "text-emerald-800" : "text-gray-900"}`}>
            {r.customer?.name || <span className="text-gray-400">Sin nombre</span>}
          </p>
          {r.source === "manual" && (
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
              Manual
            </span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              r.paymentType === "full"
                ? "bg-emerald-100 text-emerald-700"
                : r.paymentType === "deposit"
                ? "bg-amber-100 text-amber-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {r.paymentType === "full" ? "Pago completo" : r.paymentType === "deposit" ? "Apartado 20%" : "Manual"}
          </span>
          {r.reseller && (
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
              {r.reseller.name}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">{paxLabel(r)}</p>
        <div className="mt-2">
          {r.customer?.phone ? (
            <CopyPhone text={r.customer.phone} />
          ) : (
            <span className="text-xs text-gray-400">Sin teléfono</span>
          )}
        </div>
      </div>

      {/* Deuda — resaltada MUY llamativo */}
      <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
        {owes ? (
          <div className="flex animate-pulse items-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-white shadow-md shadow-red-200 ring-2 ring-red-300">
            <FiAlertTriangle className="h-4 w-4" />
            <span className="text-sm font-black leading-none">DEBE ${r.balanceDue.toFixed(2)}</span>
          </div>
        ) : (
          <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            Sin saldo
          </span>
        )}
        <span className="text-[11px] text-gray-400">Pagó ${r.paid.toFixed(2)}</span>
      </div>

      {/* Check-in */}
      <button
        type="button"
        disabled={busy}
        onClick={() => onToggleArrived(r)}
        className={`flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition disabled:opacity-50 ${
          r.arrived
            ? "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
            : "border-2 border-gray-300 bg-white text-gray-700 hover:border-emerald-400 hover:text-emerald-700"
        }`}
      >
        <FiUserCheck className="h-4 w-4" />
        {r.arrived ? "Llegó" : "Marcar"}
      </button>
    </div>
  );
}

// ─── Selector de guía de un horario ──────────────────────────────────────────
// Multi-guía: varios guías pueden compartir un mismo horario. `value` es un
// array de guideIds; `onToggle(guideId)` agrega/quita cada uno.
function SlotGuideMulti({ guides, value, onToggle, saving }) {
  const [open, setOpen] = useState(false);
  const assigned = guides.filter((g) => value.includes(g.id));
  const label =
    assigned.length === 0
      ? "Sin guía"
      : assigned.length === 1
        ? assigned[0].name
        : `${assigned.length} guías`;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={saving}
        title="Guías asignados a este horario"
        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition focus:outline-none disabled:opacity-50 ${
          assigned.length ? "border-teal-200 bg-teal-50 text-teal-700" : "border-gray-200 bg-white text-gray-500"
        }`}
      >
        <FiCompass className="h-4 w-4" />
        <span className="max-w-[9rem] truncate">{label}</span>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-20 cursor-default"
          />
          <div className="absolute right-0 top-full z-30 mt-1 w-52 rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
            {guides.length === 0 ? (
              <p className="px-3 py-2 text-xs text-gray-400">No hay guías activos</p>
            ) : (
              guides.map((g) => {
                const on = value.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => onToggle(g.id)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    <span className={on ? "font-semibold text-teal-700" : "text-gray-700"}>{g.name}</span>
                    {on && <FiCheck className="h-4 w-4 text-teal-600" />}
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

// ─── Modal de alta manual ────────────────────────────────────────────────────
const EMPTY_FORM = {
  tourId: 2,
  startTime: "08:00",
  name: "",
  phone: "",
  adults: 2,
  children: 0,
  babies: 0,
  paid: 0,
};

function ManualModal({ open, date, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const tour = TOURS.find((t) => t.id === Number(form.tourId)) || TOURS[0];

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function pickTour(id) {
    const t = TOURS.find((x) => x.id === Number(id)) || TOURS[0];
    setForm((f) => ({ ...f, tourId: t.id, startTime: t.slots[0] }));
  }

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await createManualBooking({
        tourId: Number(form.tourId),
        tourDate: date,
        startTime: form.startTime,
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        adults: Number(form.adults),
        children: Number(form.children),
        babies: Number(form.babies),
        paid: Number(form.paid) || 0,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message || "No se pudo crear la reserva");
    } finally {
      setSaving(false);
    }
  }

  const NumberField = ({ label, field, min = 0 }) => (
    <label className="flex-1">
      <span className="mb-1 block text-xs font-semibold text-gray-500">{label}</span>
      <input
        type="number"
        min={min}
        value={form[field]}
        onChange={(e) => set(field, e.target.value)}
        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-black text-gray-900">Reserva manual</h3>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl text-gray-400 hover:bg-gray-100">
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-xs text-gray-500">Para {formatCompactDate(date)}</p>

        <div className="space-y-4">
          <div className="flex gap-3">
            <label className="flex-1">
              <span className="mb-1 block text-xs font-semibold text-gray-500">Tour</span>
              <select
                value={form.tourId}
                onChange={(e) => pickTour(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              >
                {TOURS.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </label>
            <label className="flex-1">
              <span className="mb-1 block text-xs font-semibold text-gray-500">Horario</span>
              <select
                value={form.startTime}
                onChange={(e) => set("startTime", e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              >
                {tour.slots.map((s) => (
                  <option key={s} value={s}>{formatClockTime(s)}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-500">Nombre del cliente</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Ej. Familia Pérez"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-500">Teléfono (opcional)</span>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="8888-8888"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <div className="flex gap-3">
            <NumberField label="Adultos" field="adults" min={1} />
            <NumberField label="Niños" field="children" />
            <NumberField label="Bebés" field="babies" />
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-500">
              Ya pagó (USD) — deja 0 si debe todo
            </span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.paid}
              onChange={(e) => set("paid", e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </label>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>}

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
            {saving ? "Guardando..." : "Crear reserva"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Página ──────────────────────────────────────────────────────────────────
export default function AsistenciaPage() {
  const navigate = useNavigate();

  const todayYmd = useMemo(() => getTodayYmdInTimeZone(), []);
  const tomorrowYmd = useMemo(() => shiftYmd(todayYmd, 1), [todayYmd]);

  const [date, setDate] = useState(todayYmd);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [manualOpen, setManualOpen] = useState(false);

  // Guías (lista) y asignaciones del día, keyed por `${tourId}|${startTime}`.
  const [guides, setGuides] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [savingGuideKey, setSavingGuideKey] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getAttendance(date)
      .then((res) => setReservations(res.reservations || []))
      .catch(() => setError("Error al cargar la asistencia"))
      .finally(() => setLoading(false));
  }, [date]);

  useEffect(() => { load(); }, [load]);

  // Lista de guías activos (una vez).
  useEffect(() => {
    getGuides()
      .then((res) => setGuides((res.guides || []).filter((g) => g.active)))
      .catch(() => setGuides([]));
  }, []);

  // Asignaciones de guía por horario para la fecha activa. Cada horario puede
  // tener VARIOS guías → el valor es un array de guideIds.
  useEffect(() => {
    getGuideAssignments(date)
      .then((res) => {
        const map = {};
        for (const a of res.assignments || []) {
          const key = `${a.tourId}|${a.startTime}`;
          (map[key] ||= []).push(a.guideId);
        }
        setAssignments(map);
      })
      .catch(() => setAssignments({}));
  }, [date]);

  async function toggleSlotGuide(tourId, startTime, guideId) {
    const key = `${tourId}|${startTime}`;
    const current = assignments[key] || [];
    const isAssigned = current.includes(guideId);
    const next = isAssigned ? current.filter((id) => id !== guideId) : [...current, guideId];

    setSavingGuideKey(key);
    setAssignments((m) => ({ ...m, [key]: next })); // optimista
    try {
      await apiAssignGuide({ tourId, tourDate: date, startTime, guideId, assigned: !isAssigned });
    } catch {
      setAssignments((m) => ({ ...m, [key]: current })); // revertir
    } finally {
      setSavingGuideKey(null);
    }
  }

  async function toggleArrived(r) {
    setBusyId(r.id);
    const next = !r.arrived;
    // Optimista
    setReservations((list) => list.map((x) => (x.id === r.id ? { ...x, arrived: next } : x)));
    try {
      await apiSetArrived(r.id, next);
    } catch {
      // Revertir si falla
      setReservations((list) => list.map((x) => (x.id === r.id ? { ...x, arrived: !next } : x)));
    } finally {
      setBusyId(null);
    }
  }

  const stats = useMemo(() => {
    let groups = 0, pax = 0, arrived = 0, owedTotal = 0, owedCount = 0;
    for (const r of reservations) {
      groups += 1;
      pax += r.adults + r.children + r.babies;
      if (r.arrived) arrived += 1;
      if (r.owes) { owedTotal += r.balanceDue; owedCount += 1; }
    }
    return { groups, pax, arrived, owedTotal, owedCount };
  }, [reservations]);

  const bySlot = useMemo(() => {
    const map = new Map();
    for (const r of reservations) {
      const slot = String(r.startTime).slice(0, 5);
      if (!map.has(slot)) map.set(slot, []);
      map.get(slot).push(r);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([startTime, rows]) => ({
        startTime,
        tourId: rows[0]?.tourId ?? null,
        rows: rows.slice().sort((a, b) => (a.customer?.name || "").localeCompare(b.customer?.name || "")),
      }));
  }, [reservations]);

  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
      {/* Encabezado */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate("/matamoros")}
          className="grid h-10 w-10 place-items-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
        >
          <FiArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="flex items-center gap-2 text-2xl font-black text-gray-900">
            <FiUserCheck className="h-6 w-6 text-rose-600" />
            Control de Asistencia
          </h1>
          <p className="text-sm text-gray-500">Marcá quién va llegando. Los que deben dinero salen resaltados.</p>
        </div>
        <button
          onClick={() => setManualOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
        >
          <FiPlus className="h-4 w-4" /> <span className="hidden sm:inline">Reserva manual</span>
        </button>
      </div>

      {/* Navegador de fecha */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCalendarOpen((o) => !o)}
            aria-label="Elegir fecha"
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl shadow-sm transition ${
              calendarOpen ? "bg-emerald-600 text-white" : "bg-white text-gray-500 ring-1 ring-gray-200 hover:bg-gray-50"
            }`}
          >
            <FiCalendar className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-0.5 rounded-xl bg-white p-1 shadow-sm ring-1 ring-gray-200">
            <button onClick={() => setDate((d) => shiftYmd(d, -1))} aria-label="Día anterior" className="grid h-8 w-8 place-items-center rounded-lg text-gray-500 hover:bg-gray-100">
              <FiChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setDate((d) => shiftYmd(d, 1))} aria-label="Día siguiente" className="grid h-8 w-8 place-items-center rounded-lg text-gray-500 hover:bg-gray-100">
              <FiChevronRight className="h-4 w-4" />
            </button>
          </div>

          <span className="whitespace-nowrap text-base font-bold text-gray-800">{formatCompactDate(date)}</span>

          {calendarOpen && (
            <>
              <button
                type="button"
                aria-hidden
                tabIndex={-1}
                onClick={() => setCalendarOpen(false)}
                className="fixed inset-0 z-20 cursor-default"
              />
              <div className="absolute left-0 top-full z-30 mt-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl">
                <CalendarPicker
                  selected={date}
                  onSelect={(ymd) => {
                    if (ymd) {
                      setDate(ymd);
                      setCalendarOpen(false);
                    }
                  }}
                />
              </div>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setDate(todayYmd)}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              date === todayYmd ? "bg-emerald-600 text-white shadow-sm" : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setDate(tomorrowYmd)}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              date === tomorrowYmd ? "bg-orange-500 text-white shadow-sm" : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
            }`}
          >
            Mañana
          </button>
        </div>
      </div>

      {/* Resumen */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-gray-400">Grupos</p>
          <p className="mt-1 text-2xl font-black text-gray-900">{stats.groups}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-gray-400">Personas</p>
          <p className="mt-1 text-2xl font-black text-gray-900">{stats.pax}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase text-emerald-500">Llegaron</p>
          <p className="mt-1 text-2xl font-black text-emerald-700">{stats.arrived}<span className="text-base text-emerald-400">/{stats.groups}</span></p>
        </div>
        <div className={`rounded-2xl border p-4 ${stats.owedCount > 0 ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"}`}>
          <p className={`text-xs font-semibold uppercase ${stats.owedCount > 0 ? "text-red-500" : "text-gray-400"}`}>Por cobrar</p>
          <p className={`mt-1 text-2xl font-black ${stats.owedCount > 0 ? "text-red-600" : "text-gray-900"}`}>${stats.owedTotal.toFixed(2)}</p>
        </div>
      </div>

      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-emerald-700">
        {formatDayHeader(date, todayYmd, tomorrowYmd)}
      </h2>

      {loading && <p className="py-16 text-center text-sm text-gray-400">Cargando...</p>}
      {error && <p className="py-8 text-center font-semibold text-red-600">{error}</p>}

      {!loading && !error && bySlot.length === 0 && (
        <p className="py-16 text-center text-sm text-gray-400">No hay reservas para esta fecha.</p>
      )}

      {!loading && !error && (
        <div className="space-y-6">
          {bySlot.map((slot) => (
            <div key={slot.startTime}>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600 text-white">
                  <FiClock className="h-4 w-4" />
                </span>
                <h3 className="text-lg font-black text-emerald-700">{formatSlotRange(slot.startTime)}</h3>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  {slot.rows.length} grupo{slot.rows.length === 1 ? "" : "s"}
                </span>
                {slot.tourId && (
                  <div className="ml-auto">
                    <SlotGuideMulti
                      guides={guides}
                      value={assignments[`${slot.tourId}|${slot.startTime}`] || []}
                      saving={savingGuideKey === `${slot.tourId}|${slot.startTime}`}
                      onToggle={(guideId) => toggleSlotGuide(slot.tourId, slot.startTime, guideId)}
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {slot.rows.map((r) => (
                  <ReservationRow key={r.id} r={r} onToggleArrived={toggleArrived} busy={busyId === r.id} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ManualModal open={manualOpen} date={date} onClose={() => setManualOpen(false)} onCreated={load} />
    </div>
  );
}
