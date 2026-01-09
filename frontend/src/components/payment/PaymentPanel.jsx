import { FiLock } from "react-icons/fi";
import { useEffect, useState } from "react";
import PayPalCheckout from "../payment/PayPalCheckout";

function PaypalLoadingPlaceholder() {
  return (
    <div className="flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-4 text-gray-700 shadow-sm">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      <span className="text-sm font-semibold">Loading PayPal...</span>
    </div>
  );
}

export default function PaymentPanel({
  mode,
  mustBlockPay,
  amount,
  description,
  onSuccess,
  blockedText,
}) {
  const [showPaypal, setShowPaypal] = useState(false);

  useEffect(() => {
    if (mustBlockPay) {
      setShowPaypal(false);
      return;
    }

    // Small delay so the placeholder renders immediately and avoids layout flicker.
    const t = setTimeout(() => setShowPaypal(true), 50);
    return () => clearTimeout(t);
  }, [mustBlockPay]);

  return (
    <div className={["px-8", mode === "full" ? "py-4" : "pb-8"].join(" ")}>
      <div className="flex flex-col items-center">
        <div className="w-full max-w-sm">
          {mustBlockPay ? (
            <>
              <div className="flex items-center justify-center gap-3 rounded-xl bg-gray-200 px-4 py-4 text-gray-700">
                <FiLock className="h-5 w-5" />
                <span className="text-base font-semibold">
                  {mode === "deposit" ? "Reserve and pay" : "Book and pay"}
                </span>
              </div>
              <p className="mt-4 text-center text-sm text-gray-600">
                {blockedText}
              </p>
            </>
          ) : (
            <>
              {!showPaypal ? <PaypalLoadingPlaceholder /> : null}

              <div className={showPaypal ? "block" : "hidden"}>
                <PayPalCheckout
                  amount={amount}
                  description={description}
                  onSuccess={onSuccess}
                  deferLoading={!showPaypal}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
