// Confirmación propia (reemplaza window.confirm del navegador).
import { FiAlertTriangle } from "react-icons/fi";

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Sí, continuar",
  cancelLabel = "No, volver",
  danger = true,
  busy = false,
  onConfirm,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={busy ? undefined : onClose}>
      <div className="w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${danger ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>
            <FiAlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-black text-slate-900">{title}</h3>
            {message && <p className="mt-1 text-sm text-slate-600">{message}</p>}
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} disabled={busy}
            className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 cursor-pointer">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} disabled={busy}
            className={`flex-1 rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60 cursor-pointer ${danger ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}`}>
            {busy ? "Un momento…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
