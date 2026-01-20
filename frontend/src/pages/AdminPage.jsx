import React, { useEffect, useMemo, useState } from "react";
import { FiCopy, FiCheck } from "react-icons/fi";
import { getPayments } from "../../services/payments.api";

function formatDate(isoStr) {
  if (!isoStr) return "-";
  const d = new Date(isoStr);
  return d.toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Costa_Rica",
  });
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

function getBookingDateTimeMs(p) {
  const fechaIso = p?.booking?.fecha;
  if (!fechaIso) return 0;

  const d = new Date(fechaIso);

  const horaStr = p?.booking?.hora;
  if (horaStr) {
    const [hh, mm] = horaStr.split(":");
    d.setHours(Number(hh), Number(mm), 0, 0);
  }
  return d.getTime();
}

/**
 * Botón reutilizable para copiar + feedback visual.
 * - cambia de FiCopy a FiCheck
 * - muestra "Copiado" por 1s
 */
function CopyButton({ text, label = "Copiar", truncate = true }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);

      // feedback haptico opcional
      if (navigator.vibrate) navigator.vibrate(30);

      setCopied(true);
      window.clearTimeout(handleCopy._t);
      handleCopy._t = window.setTimeout(() => setCopied(false), 1000);
    } catch (e) {
      // si el clipboard falla, no hacemos show de éxito falso
      console.error("Clipboard error:", e);
    }
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <span
        className="font-mono text-xs text-gray-700 bg-gray-100 rounded px-2 py-0.5 cursor-pointer select-all max-w-[90px] truncate inline-block"
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

      {/* Mini etiqueta animada */}
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

export default function AdminPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("all");

  useEffect(() => {
    getPayments()
      .then((res) => {
        const pagos = (res.payments || [])
          .slice()
          .sort((a, b) => getBookingDateTimeMs(b) - getBookingDateTimeMs(a));

        setPayments(pagos);
        setLoading(false);
      })
      .catch(() => {
        setError("Error al cargar los pagos");
        setLoading(false);
      });
  }, []);

  const months = useMemo(() => {
    const set = new Set();

    for (const p of payments) {
      const fechaIso = p?.booking?.fecha;
      if (!fechaIso) continue;
      const d = new Date(fechaIso);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      set.add(ym);
    }

    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [payments]);

  const filteredPayments = useMemo(() => {
    if (selectedMonth === "all") return payments;

    return payments.filter((p) => {
      const fechaIso = p?.booking?.fecha;
      if (!fechaIso) return false;
      const d = new Date(fechaIso);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return ym === selectedMonth;
    });
  }, [payments, selectedMonth]);

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
    <div className="w-full max-w-7xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow border border-gray-200 p-6 w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-emerald-700 mb-1">
              Historial de Pagos
            </h2>
            <p className="text-gray-500">
              Lista completa de todas las transacciones
            </p>
          </div>

          <div className="flex gap-2 items-center">
            <select
              className="border rounded px-2 py-1 text-sm text-gray-700 focus:outline-emerald-500"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="all">Todos los meses</option>
              {months.map((m) => {
                const [year, month] = m.split("-");
                const date = new Date(`${year}-${month}-01T00:00:00`);
                return (
                  <option key={m} value={m}>
                    {date.toLocaleString("es-CR", {
                      month: "long",
                      year: "numeric",
                      timeZone: "America/Costa_Rica",
                    })}
                  </option>
                );
              })}
            </select>
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
                  Monto
                </th>
                <th className="text-center text-xs font-semibold text-gray-500 pb-2">
                  Modo
                </th>
                <th className="text-center text-xs font-semibold text-gray-500 pb-2">
                  Fecha / Hora
                </th>
                {/* NUEVA: Personas */}
                <th className="text-center text-xs font-semibold text-gray-500 pb-2">
                  Personas
                </th>
                <th className="text-center text-xs font-semibold text-gray-500 pb-2">
                  PayPal
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-gray-400">
                    No hay pagos registrados.
                  </td>
                </tr>
              )}

              {filteredPayments.map((p) => (
                <tr
                  key={p.id}
                  className="border-b last:border-0 hover:bg-emerald-50 group transition text-center align-middle"
                >
                  {/* ID Transacción */}
                  <td className="py-3 px-2 align-middle">
                    <CopyButton text={p.id} label="Copiar ID" />
                  </td>

                  {/* Cliente */}
                  <td className="py-3 px-2 align-middle">
                    <div className="font-semibold text-sm text-gray-800">
                      {p.customer?.name || (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </td>

                  {/* Monto */}
                  <td className="py-3 px-2 align-middle">
                    <span className="font-bold text-emerald-700 text-sm">
                      USD {Number(p.amount).toFixed(2)}
                    </span>
                  </td>

                  {/* Modo */}
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

                  {/* PayPal Order */}
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
