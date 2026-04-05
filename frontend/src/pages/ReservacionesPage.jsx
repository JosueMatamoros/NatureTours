import React, { useEffect, useMemo, useState } from "react";
import { FiCopy, FiCheck } from "react-icons/fi";
import { getPayments } from "../../services/payments.api";

const BUSINESS_TIME_ZONE = "America/Costa_Rica";
const MONTH_NAMES_ES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "set",
  "oct",
  "nov",
  "dic",
];

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

function getBookingDateYmd(p) {
  return String(p?.booking?.fecha ?? "").slice(0, 10);
}

function getBookingSortKey(p) {
  const date = getBookingDateYmd(p);
  const time = String(p?.booking?.hora ?? "00:00").slice(0, 5);
  return `${date}T${time}`;
}

function formatDate(isoStr) {
  if (!isoStr) return "-";
  const date = String(isoStr).slice(0, 10);
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return isoStr;
  return `${day} ${MONTH_NAMES_ES[Number(month) - 1] ?? month} ${year}`;
}

function formatTimeFromBooking(fechaIso, horaStr) {
  if (!fechaIso && !horaStr) return "-";

  const base = fechaIso ? new Date(fechaIso) : new Date();
  let h = base.getHours();
  let m = base.getMinutes();

  if (horaStr) {
    const [hh, mm] = horaStr.split(":");
    h = Number(hh);
    m = Number(mm);
  }

  const d = new Date(base);
  d.setHours(h, m, 0, 0);

  return d.toLocaleTimeString("es-CR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Costa_Rica",
  });
}

function CopyButton({ text, label = "Copiar", truncate = true }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      if (navigator.vibrate) navigator.vibrate(30);
      setCopied(true);
      window.clearTimeout(handleCopy._t);
      handleCopy._t = window.setTimeout(() => setCopied(false), 1000);
    } catch (e) {
      console.error("Clipboard error:", e);
    }
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <span
        className="font-mono text-xs text-gray-700 bg-gray-100 rounded px-2 py-0.5 cursor-pointer select-all max-w-22.5 truncate inline-block"
        title={text}
        onClick={handleCopy}
      >
        {truncate ? `${text.slice(0, 8)} ...` : text}
      </span>
      <button
        className={`ml-1 text-xs transition transform ${
          copied ? "text-emerald-700 scale-110" : "text-emerald-600"
        } opacity-0 group-hover:opacity-100`}
        title={label}
        onClick={handleCopy}
        aria-label={label}
        type="button"
      >
        {copied ? <FiCheck size={16} /> : <FiCopy size={16} />}
      </button>
      <span
        className={`text-[11px] text-emerald-700 ml-1 transition-all ${
          copied ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
        }`}
      >
        Copiado
      </span>
    </div>
  );
}

export default function ReservacionesPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRange, setSelectedRange] = useState("today");
  const todayYmd = useMemo(() => getTodayYmdInTimeZone(), []);
  const tomorrowYmd = useMemo(() => shiftYmd(todayYmd, 1), [todayYmd]);

  useEffect(() => {
    getPayments()
      .then((res) => {
        const pagos = (res.payments || [])
          .slice()
          .sort((a, b) => getBookingSortKey(b).localeCompare(getBookingSortKey(a)));
        setPayments(pagos);
        setLoading(false);
      })
      .catch(() => {
        setError("Error al cargar los pagos");
        setLoading(false);
      });
  }, []);

  const visiblePayments = useMemo(() => {
    return payments.filter((p) => {
      const fechaYmd = getBookingDateYmd(p);
      if (!fechaYmd || fechaYmd < todayYmd) return false;
      if (selectedRange === "today") return fechaYmd === todayYmd;
      if (selectedRange === "tomorrow") return fechaYmd === tomorrowYmd;
      return fechaYmd >= todayYmd;
    });
  }, [payments, selectedRange, todayYmd, tomorrowYmd]);

  const counts = useMemo(() => {
    let todayCount = 0;
    let tomorrowCount = 0;
    let futureCount = 0;

    for (const p of payments) {
      const fechaYmd = getBookingDateYmd(p);
      if (!fechaYmd || fechaYmd < todayYmd) continue;
      futureCount += 1;
      if (fechaYmd === todayYmd) todayCount += 1;
      if (fechaYmd === tomorrowYmd) tomorrowCount += 1;
    }

    return { todayCount, tomorrowCount, futureCount };
  }, [payments, todayYmd, tomorrowYmd]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-40 text-lg">
        Cargando pagos...
      </div>
    );

  if (error)
    return (
      <div className="text-red-600 font-semibold text-center mt-8">
        {error}
      </div>
    );

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-linear-to-br from-white via-emerald-50/70 to-amber-50/60 p-4 sm:p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-emerald-500 via-lime-400 to-amber-400" />
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 inline-flex rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 shadow-sm">
              Panel de Reservaciones
            </p>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-1">
              Historial de Pagos
            </h2>
            <p className="max-w-2xl text-sm text-slate-600">
              Hoy es la vista principal. Puedes revisar mañana o ver todas las reservaciones futuras.
            </p>
          </div>
          <div className="grid gap-2 rounded-2xl border border-white/70 bg-white/75 p-2 shadow-sm sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setSelectedRange("today")}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                selectedRange === "today"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                  : "bg-transparent text-slate-700 hover:bg-emerald-50"
              }`}
            >
              Hoy <span className="ml-1 opacity-80">({counts.todayCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedRange("tomorrow")}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                selectedRange === "tomorrow"
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                  : "bg-transparent text-slate-700 hover:bg-slate-100"
              }`}
            >
              Mañana <span className="ml-1 opacity-80">({counts.tomorrowCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedRange("all")}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                selectedRange === "all"
                  ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30"
                  : "bg-transparent text-slate-700 hover:bg-amber-50"
              }`}
            >
              Todos <span className="ml-1 opacity-80">({counts.futureCount})</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-center align-middle">
            <thead>
              <tr className="border-b">
                <th className="text-center text-xs font-semibold text-gray-500 pb-2">
                  ID Transacción
                </th>
                <th className="text-center text-xs font-semibold text-gray-500 pb-2">
                  Cliente
                </th>
                <th className="text-center text-xs font-semibold text-gray-500 pb-2">
                  Teléfono
                </th>
                <th className="text-center text-xs font-semibold text-gray-500 pb-2">
                  Monto
                </th>
                <th className="text-center text-xs font-semibold text-gray-500 pb-2">
                  Modo
                </th>
                <th className="text-center text-xs font-semibold text-gray-500 pb-2">
                  Fecha / Hora
                </th>
                <th className="text-center text-xs font-semibold text-gray-500 pb-2">
                  Personas
                </th>
                <th className="text-center text-xs font-semibold text-gray-500 pb-2">
                  PayPal
                </th>
              </tr>
            </thead>
            <tbody>
              {visiblePayments.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-gray-400">
                    No hay reservaciones para este filtro.
                  </td>
                </tr>
              )}
              {visiblePayments.map((p) => (
                <tr
                  key={p.id}
                  className="border-b last:border-0 hover:bg-emerald-50/70 group transition text-center align-middle"
                >
                  <td className="py-3 px-2 align-middle">
                    <CopyButton text={p.id} label="Copiar ID" />
                  </td>
                  <td className="py-3 px-2 align-middle">
                    <div className="font-semibold text-sm text-gray-800">
                      {p.customer?.name || (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2 align-middle">
                    {p.customer?.phone ? (
                      <CopyButton
                        text={p.customer.phone}
                        label="Copiar teléfono"
                        truncate={false}
                      />
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-2 align-middle">
                    <span className="font-bold text-emerald-700 text-sm">
                      USD {Number(p.amount).toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3 px-2 align-middle">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        p.mode === "full"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {p.mode === "full" ? "Pago completo" : "Pago parcial"}
                    </span>
                  </td>
                  <td className="py-3 px-2 align-middle">
                    <div className="text-sm text-gray-800">
                      {formatDate(p.booking?.fecha)},{" "}
                      {formatTimeFromBooking(p.booking?.fecha, p.booking?.hora)}
                    </div>
                  </td>
                  <td className="py-3 px-2 align-middle">
                    <span className="text-sm font-semibold text-gray-800">
                      {p.booking?.personas ?? "-"}
                    </span>
                  </td>
                  <td className="py-3 px-2 align-middle">
                    {p.paypal?.orderId ? (
                      <CopyButton
                        text={p.paypal.orderId}
                        label="Copiar Order ID"
                      />
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
