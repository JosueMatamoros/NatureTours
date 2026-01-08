import { FiLock } from "react-icons/fi";
import PayPalCheckout from "../payment/PayPalCheckout";

export default function PaymentPanel({
  mode,
  mustBlockPay,
  amount,
  description,
  onSuccess,
  blockedText,
}) {
  return (
    <div className={["px-8", mode === "full" ? "py-4" : "pb-8"].join(" ")}>
      <div className="flex flex-col items-center">
        <div className="w-full max-w-sm">
          {mustBlockPay ? (
            <>
              <div className="flex items-center justify-center gap-3 rounded-xl bg-gray-200 px-4 py-4 text-gray-700">
                <FiLock className="h-5 w-5" />
                <span className="text-base font-semibold">
                  {mode === "deposit" ? "Apartar y pagar" : "Book and pay"}
                </span>
              </div>
              <p className="mt-4 text-center text-sm text-gray-600">{blockedText}</p>
            </>
          ) : (
            <PayPalCheckout amount={amount} description={description} onSuccess={onSuccess} />
          )}
        </div>
      </div>
    </div>
  );
}
