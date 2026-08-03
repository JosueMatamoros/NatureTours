import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import {
  FiArrowLeft,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiCopy,
  FiCheck,
  FiX,
  FiUsers,
} from "react-icons/fi";
import { getPayments } from "../../services/payments.api";

const BUSINESS_TIME_ZONE = "America/Costa_Rica";
// Duración fija del único tour reservable hoy (Horseback Riding, 2 horas).
// Si algún día se venden tours de otra duración, esto necesita venir del backend.
const TOUR_DURATION_MINUTES = 120;

// Verde de marca para el calendario (react-day-picker lee estas variables).
const CALENDAR_THEME_VARS = {
  "--rdp-accent-color": "#059669", // emerald-600
  "--rdp-accent-background-color": "#d1fae5", // emerald-100
};

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

// ─── Fechas (todas en YYYY-MM-DD, calculadas en hora de Costa Rica) ──────────
function getTodayYmdInTimeZone(timeZone = BUSINESS_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const value = (type) => parts.find((part) => part.type === type)?.value ?? "00";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function shiftYmd(ymd, days) {
  if (!ymd || typeof ymd !== "string" || ymd.length < 10) return "";
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

function fromYMDLocal(ymd) {
  if (!ymd) return undefined;
  const { y, m, d } = ymdParts(ymd);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

function toYMDLocal(date) {
  if (!date) return undefined;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getBookingDateYmd(p) {
  return String(p?.booking?.fecha ?? "").slice(0, 10);
}

// "HH:MM:SS" -> "HH:MM"
function startTimeKey(p) {
  return String(p?.booking?.hora ?? "00:00").slice(0, 5);
}

// "Domingo, 2 de agosto" · antepone Hoy/Mañana cuando aplica
function formatDayHeader(ymd, todayYmd, tomorrowYmd) {
  const { y, m, d } = ymdParts(ymd);
  const weekday = WEEKDAY_NAMES_ES[weekdayOf(ymd)];
  const base = `${weekday}, ${d} de ${MONTH_NAMES_FULL_ES[m - 1]} ${y}`;
  if (ymd === todayYmd) return `Hoy · ${base}`;
  if (ymd === tomorrowYmd) return `Mañana · ${base}`;
  return base;
}

// "Dom, 2 Ago 2026" — formato compacto usado en el navegador del encabezado
function formatCompactDate(ymd) {
  if (!ymd) return "";
  const { y, m, d } = ymdParts(ymd);
  const month = MONTH_NAMES_ES[m - 1];
  return `${WEEKDAY_SHORT_ES[weekdayOf(ymd)]}, ${d} ${month.charAt(0).toUpperCase()}${month.slice(1)} ${y}`;
}

// "HH:MM" -> "8 am" / "12 md" / "3:30 pm"
function formatClockTime(hhmm, { noon = "12 md" } = {}) {
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
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
  const endHHMM = addMinutesToHHMM(startHHMM, TOUR_DURATION_MINUTES);
  return `${formatClockTime(startHHMM)} – ${formatClockTime(endHHMM)}`;
}

// ─── Copiar al portapapeles ───────────────────────────────────────────────────
function CopyButton({ text, label = "Copiar" }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      if (navigator.vibrate) navigator.vibrate(30);
      setCopied(true);
      window.clearTimeout(handleCopy._t);
      handleCopy._t = window.setTimeout(() => setCopied(false), 1000);
    } catch (e2) {
      console.error("Clipboard error:", e2);
    }
  }

  return (
    <span className="inline-flex items-center gap-1">
      <span
        className="cursor-pointer select-all rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-700"
        title={text}
        onClick={handleCopy}
      >
        {text}
      </span>
      <button
        className={`transition ${copied ? "text-emerald-600" : "text-gray-400 hover:text-emerald-600"}`}
        title={label}
        onClick={handleCopy}
        aria-label={label}
        type="button"
      >
        {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
      </button>
    </span>
  );
}

// ─── Fila de un cliente dentro de la vista de un horario ─────────────────────
function ClientRow({ p }) {
  const isDeposit = p.mode === "deposit";
  const balanceDue = Number(p.booking?.balanceDue ?? 0);

  return (
    <tr className="border-b border-gray-100 align-top last:border-0">
      <td className="py-4 pr-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-gray-900">
            {p.customer?.name || <span className="text-gray-400">Sin nombre</span>}
          </p>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              isDeposit ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {isDeposit ? "Pago parcial" : "Pago completo"}
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {p.booking.adults} adulto{p.booking.adults === 1 ? "" : "s"}
          {Number(p.booking.children) > 0 ? ` · ${p.booking.children} niño${p.booking.children === 1 ? "" : "s"}` : ""}
          {Number(p.booking.babies) > 0 ? ` · ${p.booking.babies} bebé${p.booking.babies === 1 ? "" : "s"}` : ""}
        </p>
      </td>

      <td className="py-4 pr-4">
        {p.customer?.phone ? (
          <CopyButton text={p.customer.phone} label="Copiar teléfono" />
        ) : (
          <span className="text-xs text-gray-400">Sin teléfono</span>
        )}
      </td>

      <td className="py-4 pr-4 text-right">
        <p className="font-bold text-emerald-700">USD {p.amount.toFixed(2)}</p>
      </td>

      <td className="py-4 text-right">
        {isDeposit ? (
          <p className="font-bold text-amber-700">USD {balanceDue.toFixed(2)}</p>
        ) : (
          <p className="text-gray-300">—</p>
        )}
      </td>
    </tr>
  );
}

// ─── Carta de un horario ──────────────────────────────────────────────────────
function SlotCard({ startTime, bookings, onOpen }) {
  const adults = bookings.reduce((sum, p) => sum + Number(p.booking.adults || 0), 0);
  const children = bookings.reduce((sum, p) => sum + Number(p.booking.children || 0), 0);
  const babies = bookings.reduce((sum, p) => sum + Number(p.booking.babies || 0), 0);
  const groups = bookings.length;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/70 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-100"
    >
      <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-lime-400 to-amber-400" />
      <div className="p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm transition group-hover:bg-emerald-700">
            <FiClock className="h-5 w-5" />
          </div>
          <p className="text-xl font-black leading-tight text-emerald-700">
            {formatSlotRange(startTime)}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            {adults} adulto{adults === 1 ? "" : "s"}
          </span>
          {children > 0 && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
              {children} niño{children === 1 ? "" : "s"}
            </span>
          )}
          {babies > 0 && (
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
              {babies} bebé{babies === 1 ? "" : "s"}
            </span>
          )}
          <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
            {groups} grupo{groups === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── Vista completa de un horario (todos sus clientes) ───────────────────────
function SlotDetailModal({ open, ymd, startTime, bookings, todayYmd, tomorrowYmd, onClose }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
              {formatDayHeader(ymd, todayYmd, tomorrowYmd)}
            </p>
            <h3 className="text-xl font-black text-gray-900">
              {formatSlotRange(startTime)}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-gray-400 hover:bg-gray-100"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-x-auto px-6 py-2 sm:px-8">
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                <th className="pb-2 pr-4 font-semibold">Cliente</th>
                <th className="pb-2 pr-4 font-semibold">Teléfono</th>
                <th className="pb-2 pr-4 text-right font-semibold">Pagado</th>
                <th className="pb-2 text-right font-semibold">Debe</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((p) => (
                <ClientRow key={p.id} p={p} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Popover del calendario (fecha exacta o rango) ───────────────────────────
function CalendarPopover({ mode, onModeChange, singleValue, rangeValue, onPickSingle, onPickRange, onClose }) {
  return (
    <div
      className="absolute left-0 top-full z-30 mt-2 w-[min(92vw,340px)] rounded-2xl border border-gray-200 bg-white p-3 shadow-xl"
      style={CALENDAR_THEME_VARS}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => onModeChange("single")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              mode === "single" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500"
            }`}
          >
            Fecha exacta
          </button>
          <button
            type="button"
            onClick={() => onModeChange("range")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              mode === "range" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500"
            }`}
          >
            Rango
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid h-7 w-7 place-items-center rounded-lg text-gray-400 hover:bg-gray-100"
        >
          <FiX className="h-4 w-4" />
        </button>
      </div>

      {mode === "single" ? (
        <DayPicker
          mode="single"
          style={CALENDAR_THEME_VARS}
          selected={fromYMDLocal(singleValue)}
          onSelect={(d) => d && onPickSingle(toYMDLocal(d))}
        />
      ) : (
        <DayPicker
          mode="range"
          style={CALENDAR_THEME_VARS}
          selected={{
            from: fromYMDLocal(rangeValue.from),
            to: fromYMDLocal(rangeValue.to),
          }}
          onSelect={(r) =>
            onPickRange({
              from: r?.from ? toYMDLocal(r.from) : undefined,
              to: r?.to ? toYMDLocal(r.to) : undefined,
            })
          }
        />
      )}
    </div>
  );
}

export default function ReservacionesPage() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const todayYmd = useMemo(() => getTodayYmdInTimeZone(), []);
  const tomorrowYmd = useMemo(() => shiftYmd(todayYmd, 1), [todayYmd]);

  // viewMode: "day" (una fecha exacta) | "range" (rango) | "all" (todas las futuras)
  const [viewMode, setViewMode] = useState("day");
  const [activeDate, setActiveDate] = useState(todayYmd);
  const [range, setRange] = useState({ from: undefined, to: undefined });

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState("single");
  const [selectedSlot, setSelectedSlot] = useState(null); // { ymd, startTime, bookings }

  useEffect(() => {
    getPayments()
      .then((res) => {
        setPayments(res.payments || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Error al cargar los pagos");
        setLoading(false);
      });
  }, []);

  function goToday() {
    setViewMode("day");
    setActiveDate(todayYmd);
  }
  function goTomorrow() {
    setViewMode("day");
    setActiveDate(tomorrowYmd);
  }
  function goAll() {
    setViewMode("all");
  }
  function shiftActiveDate(days) {
    setViewMode("day");
    setActiveDate((d) => shiftYmd(d || todayYmd, days));
  }
  function pickSingleDate(ymd) {
    setActiveDate(ymd);
    setViewMode("day");
    setCalendarOpen(false);
  }
  function pickRange(r) {
    setRange(r);
    if (r.from && r.to) {
      setViewMode("range");
      setCalendarOpen(false);
    }
  }

  const visiblePayments = useMemo(() => {
    return payments.filter((p) => {
      const ymd = getBookingDateYmd(p);
      if (!ymd) return false;

      if (viewMode === "day") return ymd === activeDate;
      if (viewMode === "range") {
        if (!range.from) return false;
        const to = range.to || range.from;
        return ymd >= range.from && ymd <= to;
      }
      return ymd >= todayYmd; // "all"
    });
  }, [payments, viewMode, activeDate, range, todayYmd]);

  const counts = useMemo(() => {
    let todayCount = 0;
    let tomorrowCount = 0;
    let futureCount = 0;
    for (const p of payments) {
      const ymd = getBookingDateYmd(p);
      if (!ymd || ymd < todayYmd) continue;
      futureCount += 1;
      if (ymd === todayYmd) todayCount += 1;
      if (ymd === tomorrowYmd) tomorrowCount += 1;
    }
    return { todayCount, tomorrowCount, futureCount };
  }, [payments, todayYmd, tomorrowYmd]);

  // Agrupa: fecha -> horario (HH:MM) -> pagos, ambos niveles ordenados.
  const groupedByDay = useMemo(() => {
    const byDay = new Map();
    for (const p of visiblePayments) {
      const ymd = getBookingDateYmd(p);
      if (!byDay.has(ymd)) byDay.set(ymd, new Map());
      const bySlot = byDay.get(ymd);
      const slot = startTimeKey(p);
      if (!bySlot.has(slot)) bySlot.set(slot, []);
      bySlot.get(slot).push(p);
    }

    return [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ymd, bySlot]) => ({
        ymd,
        slots: [...bySlot.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([startTime, bookings]) => ({
            startTime,
            bookings: bookings
              .slice()
              .sort((a, b) => (a.customer?.name || "").localeCompare(b.customer?.name || "")),
          })),
      }));
  }, [visiblePayments]);

  const navLabel =
    viewMode === "day"
      ? formatCompactDate(activeDate)
      : viewMode === "range"
      ? range.from
        ? `${formatCompactDate(range.from)} — ${formatCompactDate(range.to || range.from)}`
        : "Elegir rango"
      : "Todas las próximas";

  if (loading)
    return (
      <div className="flex h-40 items-center justify-center text-lg">
        Cargando pagos...
      </div>
    );

  if (error)
    return (
      <div className="mt-8 text-center font-semibold text-red-600">{error}</div>
    );

  return (
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate("/matamoros")}
          className="grid h-10 w-10 place-items-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
        >
          <FiArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-gray-900">
            <FiUsers className="h-6 w-6 text-emerald-600" />
            Reservaciones
          </h1>
          <p className="text-sm text-gray-500">Pagos agrupados por horario del tour.</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        {/* Navegador: ícono de calendario, flechas y fecha, cada uno aparte */}
        <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setPickerMode(viewMode === "range" ? "range" : "single");
              setCalendarOpen((o) => !o);
            }}
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl shadow-sm transition ${
              calendarOpen
                ? "bg-emerald-600 text-white"
                : "bg-white text-gray-500 ring-1 ring-gray-200 hover:bg-gray-50"
            }`}
            title="Elegir fecha o rango"
          >
            <FiCalendar className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-0.5 rounded-xl bg-white p-1 shadow-sm ring-1 ring-gray-200">
            <button
              type="button"
              onClick={() => shiftActiveDate(-1)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-gray-500 hover:bg-gray-100"
            >
              <FiChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => shiftActiveDate(1)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-gray-500 hover:bg-gray-100"
            >
              <FiChevronRight className="h-4 w-4" />
            </button>
          </div>

          <span className="whitespace-nowrap text-base font-bold text-gray-800">
            {navLabel}
          </span>

          {calendarOpen && (
            <CalendarPopover
              mode={pickerMode}
              onModeChange={setPickerMode}
              singleValue={activeDate || todayYmd}
              rangeValue={range}
              onPickSingle={pickSingleDate}
              onPickRange={pickRange}
              onClose={() => setCalendarOpen(false)}
            />
          )}
        </div>

        {/* Filtros rápidos */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={goToday}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              viewMode === "day" && activeDate === todayYmd
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
            }`}
          >
            Hoy <span className="opacity-80">({counts.todayCount})</span>
          </button>
          <button
            type="button"
            onClick={goTomorrow}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              viewMode === "day" && activeDate === tomorrowYmd
                ? "bg-orange-500 text-white shadow-sm"
                : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
            }`}
          >
            Mañana <span className="opacity-80">({counts.tomorrowCount})</span>
          </button>
          <button
            type="button"
            onClick={goAll}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              viewMode === "all"
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
            }`}
          >
            Todos <span className="opacity-80">({counts.futureCount})</span>
          </button>
        </div>
      </div>

      {groupedByDay.length === 0 && (
        <p className="py-16 text-center text-sm text-gray-400">
          No hay reservaciones para este filtro.
        </p>
      )}

      <div className="space-y-8">
        {groupedByDay.map((day) => (
          <div key={day.ymd}>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-emerald-700">
              {formatDayHeader(day.ymd, todayYmd, tomorrowYmd)}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {day.slots.map((slot) => (
                <SlotCard
                  key={`${day.ymd}|${slot.startTime}`}
                  startTime={slot.startTime}
                  bookings={slot.bookings}
                  onOpen={() =>
                    setSelectedSlot({ ymd: day.ymd, startTime: slot.startTime, bookings: slot.bookings })
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <SlotDetailModal
        open={Boolean(selectedSlot)}
        ymd={selectedSlot?.ymd}
        startTime={selectedSlot?.startTime}
        bookings={selectedSlot?.bookings ?? []}
        todayYmd={todayYmd}
        tomorrowYmd={tomorrowYmd}
        onClose={() => setSelectedSlot(null)}
      />
    </div>
  );
}
