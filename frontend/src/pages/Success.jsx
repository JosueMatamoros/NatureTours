import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPaymentById } from "../../services/payments.api";

export default function Success() {
  const { paymentId } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const res = await getPaymentById(paymentId);
        const data = res?.data ?? res;

        if (!data?.ok || !data?.payment) {
          console.error("Respuesta inválida:", data);
          throw new Error(data?.message || "No se pudo obtener el payment");
        }

        if (!cancelled) setPayment(data.payment);
      } catch (e) {
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "Error cargando el payment";

        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [paymentId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-white grid place-items-center px-6">
        <p className="text-gray-600">Loading payment...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-white grid place-items-center px-6">
        <div className="max-w-md w-full rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>

          <div className="mt-4 flex gap-3">
            <Link
              to="/"
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Back to home
            </Link>
            <Link
              to="/tours"
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              Browse tours
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!payment) return null;

  return (
    <main className="min-h-screen bg-white px-6 py-12">
      <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">
          Payment successful
        </h1>

        <p className="mt-2 text-gray-600">
          Your payment was completed and your booking is confirmed.
        </p>

        {/* Payment info */}
        <div className="mt-6 space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p>
            <span className="font-semibold">Payment ID:</span>{" "}
            <span className="font-mono break-all">{payment.id}</span>
          </p>
          <p>
            <span className="font-semibold">Booking ID:</span>{" "}
            <span className="font-mono break-all">{payment.booking_id}</span>
          </p>
          <p>
            <span className="font-semibold">Mode:</span> {payment.mode}
          </p>
          <p>
            <span className="font-semibold">Amount:</span>{" "}
            ${Number(payment.amount).toFixed(2)}
          </p>
          <p>
            <span className="font-semibold">Status:</span> {payment.status}
          </p>
          <p>
            <span className="font-semibold">PayPal Order ID:</span>{" "}
            <span className="font-mono break-all">
              {payment.paypal_order_id}
            </span>
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/"
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Back to home
          </Link>
          <Link
            to="/tours"
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
          >
            Browse tours
          </Link>
        </div>
      </div>
    </main>
  );
}
