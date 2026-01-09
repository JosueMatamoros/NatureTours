import { useEffect } from "react";
import { FiX, FiClock, FiAlertTriangle, FiSlash, FiCreditCard } from "react-icons/fi";

export default function CancellationTermsModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", onKeyDown);
    // optional: lock scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Cancellation terms"
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close modal"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <h2 className="text-xl font-semibold text-gray-900">
            Cancellation Terms
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full p-2 text-gray-400 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
            aria-label="Close"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <div className="space-y-4">
            {/* >72h */}
            <div className="flex gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
              <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                <FiClock className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-base font-semibold text-emerald-900">
                  More than 72 hours before
                </div>
                <div className="mt-1 text-sm text-emerald-800">
                  You will receive a <span className="font-semibold">100% refund</span> of your purchase.
                </div>
              </div>
            </div>

            {/* 24-72h */}
            <div className="flex gap-4 rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4">
              <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-xl bg-orange-100 text-orange-700">
                <FiAlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-base font-semibold text-orange-900">
                  Between 24 and 72 hours before
                </div>
                <div className="mt-1 text-sm text-orange-800">
                  You will receive a <span className="font-semibold">50% refund</span> of your purchase.
                </div>
              </div>
            </div>

            {/* <24h */}
            <div className="flex gap-4 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
              <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-xl bg-rose-100 text-rose-700">
                <FiSlash className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-base font-semibold text-rose-900">
                  Less than 24 hours before
                </div>
                <div className="mt-1 text-sm text-rose-800">
                  <span className="font-semibold">No refund</span> will be issued.
                </div>
              </div>
            </div>

            {/* Deposit rule */}
            <div className="mt-2 flex gap-4 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4">
              <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-xl bg-gray-100 text-gray-600">
                <FiCreditCard className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-base font-semibold text-gray-900">
                  Deposit system (20%)
                </div>
                <div className="mt-1 text-sm text-gray-700">
                  For reservations paid with a <span className="font-semibold">20% deposit</span>, the deposit is{" "}
                  <span className="font-semibold">non-refundable</span> if the service is cancelled.
                </div>
              </div>
            </div>
          </div>

          {/* Footer button */}
          <div className="mt-6">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-black focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
