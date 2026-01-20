import React, { useEffect, useMemo, useState } from "react";
import { getDayBlocks, blockDay, unblockDay } from "../../services/availability.blocks.api";
import { FaCalendarAlt, FaLock, FaUnlock, FaTrashAlt, FaPlusCircle } from "react-icons/fa";

const TOUR_ID = 2;

function formatDateYYYYMMDD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Formato tipo "21 ene 2026"
function formatDateEs(dateStr) {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

// Ej: "Miércoles"
function formatWeekdayEs(dateStr) {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  return new Intl.DateTimeFormat("es-MX", { weekday: "long" }).format(d);
}

/** Toast simple (no libs) */
function Toast({ toast, onClose }) {
  if (!toast) return null;
  const tone =
    toast.type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : toast.type === "error"
        ? "border-red-200 bg-red-50 text-red-800"
        : "border-gray-200 bg-gray-50 text-gray-800";

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`w-[340px] border rounded-xl shadow-sm p-4 ${tone}`}>
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="font-semibold">{toast.title}</div>
            {toast.message ? <div className="text-sm mt-1 opacity-90">{toast.message}</div> : null}
          </div>
          <button
            className="text-sm opacity-70 hover:opacity-100"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

/** Modal de confirmación */
function ConfirmModal({ open, title, description, confirmText, cancelText, loading, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={loading ? undefined : onCancel} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border">
          <div className="p-5">
            <div className="text-lg font-semibold">{title}</div>
            {description ? <div className="text-sm text-gray-600 mt-2">{description}</div> : null}
          </div>
          <div className="px-5 pb-5 flex gap-2 justify-end">
            <button
              className="px-4 py-2 rounded-xl border text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              onClick={onCancel}
              disabled={loading}
            >
              {cancelText || "Cancelar"}
            </button>
            <button
              className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? "Procesando..." : (confirmText || "Confirmar")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CabalgatasPage() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newBlockDay, setNewBlockDay] = useState("");
  const [newBlockReason, setNewBlockReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dayToUnblock, setDayToUnblock] = useState(null);
  const [unblocking, setUnblocking] = useState(false);

  const { from, to } = useMemo(() => {
    const today = new Date();
    return {
      from: formatDateYYYYMMDD(today),
      to: formatDateYYYYMMDD(addDays(today, 365)),
    };
  }, []);

  function showToast(next) {
    setToast(next);
    // autoclose
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 3500);
  }

  async function fetchBlocks() {
    setLoading(true);
    try {
      const res = await getDayBlocks({ tourId: TOUR_ID, from, to });
      setBlocks(res?.blocks || []);
    } catch (e) {
      showToast({
        type: "error",
        title: "No se pudieron cargar los bloqueos",
        message: e?.message || "Error desconocido",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBlocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBlockDay = async (e) => {
    e.preventDefault();
    if (!newBlockDay) return;

    setSubmitting(true);
    try {
      await blockDay({ tourId: TOUR_ID, day: newBlockDay, reason: newBlockReason });
      setNewBlockDay("");
      setNewBlockReason("");
      showToast({
        type: "success",
        title: "Día bloqueado",
        message: `${formatDateEs(newBlockDay)}${newBlockReason ? ` · ${newBlockReason}` : ""}`,
      });
      await fetchBlocks();
    } catch (e2) {
      showToast({
        type: "error",
        title: "No se pudo bloquear el día",
        message: e2?.message || "Error desconocido",
      });
    } finally {
      setSubmitting(false);
    }
  };

  function openUnblockConfirm(day) {
    setDayToUnblock(day);
    setConfirmOpen(true);
  }

  async function confirmUnblock() {
    if (!dayToUnblock) return;
    setUnblocking(true);
    try {
      await unblockDay({ tourId: TOUR_ID, day: dayToUnblock });
      showToast({
        type: "success",
        title: "Día desbloqueado",
        message: formatDateEs(dayToUnblock),
      });
      setConfirmOpen(false);
      setDayToUnblock(null);
      await fetchBlocks();
    } catch (e) {
      showToast({
        type: "error",
        title: "No se pudo desbloquear",
        message: e?.message || "Error desconocido",
      });
    } finally {
      setUnblocking(false);
    }
  }

  const count = blocks.length;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <ConfirmModal
        open={confirmOpen}
        title="¿Desbloquear día?"
        description={dayToUnblock ? `Esto volverá disponible el ${formatDateEs(dayToUnblock)} para reservas.` : ""}
        confirmText="Sí, desbloquear"
        cancelText="Cancelar"
        loading={unblocking}
        onConfirm={confirmUnblock}
        onCancel={() => (unblocking ? null : setConfirmOpen(false))}
      />

      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Bloqueo de días para Cabalgatas</h1>
        <p className="text-sm text-gray-600 mt-1">Gestiona los días no disponibles para reservaciones</p>
      </div>

      {/* Range indication */}
      <div className="mb-4 text-sm text-gray-700 flex items-center justify-center gap-2">
        <FaCalendarAlt className="text-emerald-600" />
        <span>Rango consultado:</span>
        <span className="font-semibold">{formatDateEs(from)}</span>
        <span>hasta</span>
        <span className="font-semibold">{formatDateEs(to)}</span>
      </div>

      {/* Block form card */}
      <div className="bg-white border rounded-2xl p-5 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-1">
          <FaPlusCircle className="text-emerald-600 text-xl" />
          <h2 className="text-lg font-semibold text-gray-900">Bloquear nuevo día</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">Selecciona una fecha y opcionalmente agrega un motivo</p>

        <form onSubmit={handleBlockDay} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha a bloquear</label>
            <input
              type="date"
              className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              value={newBlockDay}
              onChange={(e) => setNewBlockDay(e.target.value)}
              min={from}
              max={to}
              required
            />
          </div>

          <div className="md:col-span-7">
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (opcional)</label>
            <input
              type="text"
              className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              placeholder="Ej: Mantenimiento, evento privado, clima..."
              value={newBlockReason}
              onChange={(e) => setNewBlockReason(e.target.value)}
            />
          </div>

          <div className="md:col-span-2 flex md:justify-end">
            <button
              type="submit"
              className="w-full md:w-auto inline-flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 shadow-lg"
              disabled={submitting}
            >
              <FaLock className="text-lg" />
              {submitting ? "Bloqueando..." : "Bloquear"}
            </button>
          </div>
        </form>
      </div>

      {/* Blocks list card */}
      <div className="bg-white border rounded-2xl p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Días bloqueados</h2>
        <p className="text-sm text-gray-600 mt-1">{loading ? "Cargando..." : `${count} día${count === 1 ? "" : "s"} bloqueado${count === 1 ? "" : "s"}`}</p>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-3 pr-4">Fecha</th>
                <th className="py-3 pr-4">Motivo</th>
                <th className="py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-gray-500">
                    Cargando días bloqueados...
                  </td>
                </tr>
              ) : blocks.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-gray-400">
                    No hay días bloqueados en el rango.
                  </td>
                </tr>
              ) : (
                blocks
                  .slice()
                  .sort((a, b) => (a.day > b.day ? 1 : -1))
                  .map((b) => (
                    <tr key={b.id || b.day} className="border-b last:border-b-0">
                      <td className="py-4 pr-4">
                        <div className="font-medium text-gray-900">{formatDateEs(b.day)}</div>
                        <div className="text-xs text-gray-500 capitalize">{formatWeekdayEs(b.day)}</div>
                      </td>
                      <td className="py-4 pr-4 text-gray-800">
                        {b.reason ? b.reason : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="py-4 text-right">
                        <button
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 shadow"
                          onClick={() => openUnblockConfirm(b.day)}
                        >
                          <FaUnlock className="text-lg" /> <span>Desbloquear</span>
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
