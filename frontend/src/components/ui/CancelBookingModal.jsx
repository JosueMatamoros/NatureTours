import { FiAlertTriangle } from "react-icons/fi";

export default function CancelBookingModal({
  open,
  loading,
  onStay,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-start gap-3 px-6 pt-6">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-100 text-red-600">
            <FiAlertTriangle className="h-5 w-5" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Leave payment page?
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Your reservation is not confirmed yet
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pt-4">
          <p className="text-sm leading-relaxed text-gray-600">
            If you leave this page, your current booking will be{" "}
            <span className="font-semibold text-gray-800">automatically cancelled</span>{" "}
            and the selected date and time will be released for other customers.
          </p>

          <p className="mt-3 text-sm text-gray-600">
            You won’t be charged, but you’ll need to start a new reservation if
            you come back.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onStay}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Stay and complete booking
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-500/40"
          >
            {loading ? "Cancelling…" : "Cancel booking"}
          </button>
        </div>
      </div>
    </div>
  );
}
