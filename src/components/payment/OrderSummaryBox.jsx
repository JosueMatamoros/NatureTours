import { FiInfo } from "react-icons/fi";

export default function OrderSummaryBox({
  subtotal,
  paypalFee,
  total,
  fmt,
  feePercentText,
  showPaypalFeeInfo,
  setShowPaypalFeeInfo,
}) {
  return (
    <div className="rounded-2xl bg-gray-50 px-6 py-5">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>Subtotal</span>
        <span className="font-semibold text-gray-900">{fmt(subtotal)}</span>
      </div>

      <p className="mt-2 text-xs text-gray-400">
        * Impuestos incluidos en el subtotal
      </p>

      <div className="mt-4 border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span className="flex items-center gap-2">
            Cargo PayPal
            <span className="relative inline-flex">
              <button
                type="button"
                onClick={() => setShowPaypalFeeInfo((s) => !s)}
                className="group inline-flex items-center justify-center rounded-full p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                aria-label="Información sobre cargo PayPal"
                aria-expanded={showPaypalFeeInfo}
              >
                <FiInfo className="h-4 w-4" />
              </button>

              <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-64 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 shadow-lg">
                  Este cargo corresponde al{" "}
                  <span className="font-semibold">{feePercentText}</span> del subtotal
                  y se calcula automáticamente.
                </div>
              </div>
            </span>
          </span>

          <span className="font-semibold text-orange-500">+{fmt(paypalFee)}</span>
        </div>

        {showPaypalFeeInfo ? (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            El <span className="font-semibold">cargo de PayPal</span> es un{" "}
            <span className="font-semibold">{feePercentText}</span> del subtotal.
          </div>
        ) : null}
      </div>

      <div className="mt-4 border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between text-base font-semibold">
          <span className="text-gray-900">Total con PayPal</span>
          <span className="text-gray-900">{fmt(total)}</span>
        </div>
      </div>
    </div>
  );
}
