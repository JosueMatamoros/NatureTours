// src/components/ui/TimeoutModal.jsx
export default function TimeoutModal({ open, onClose, onHelp }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-gray-200">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-600 border border-red-100">
            {/* iconito simple */}
            <span className="text-xl">⏳</span>
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              Time out
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              You have a maximum of <span className="font-semibold">10 minutes</span> to pay for your reservation.
              Otherwise, it will be released for other customers.
            </p>

            <p className="mt-3 text-sm text-gray-600">
              If you still want to reserve, please go back and try again. If you keep having trouble, contact us and we’ll help you.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            onClick={onHelp}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Contact support
          </button>

          <button
            onClick={onClose}
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
