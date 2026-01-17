import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { getPaymentById } from "../../services/payments.api";
import { sendReceiptEmail } from "../../services/email.api";
import {
  FiCheckCircle,
  FiMapPin,
  FiUsers,
  FiCalendar,
  FiClock,
  FiFileText,
  FiDollarSign,
  FiCreditCard,
  FiTag,
} from "react-icons/fi";
import ReceiptPDF from "../components/payment/ReceiptPDF";

export default function Success() {
  const { paymentId } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);
  const emailSentRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const res = await getPaymentById(paymentId);
        const data = res?.data ?? res;

        if (!data?.ok || !data?.receipt) {
          throw new Error(data?.message || "No se pudo cargar la confirmación");
        }

        if (!cancelled) setReceipt(data.receipt);
      } catch (e) {
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "Error cargando la confirmación";

        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [paymentId]);

  // Enviar email automáticamente cuando se cargue el receipt
  useEffect(() => {
    if (receipt && !emailSentRef.current) {
      emailSentRef.current = true;
      sendReceiptEmail(receipt).catch((err) => {
        console.error("Error sending receipt email:", err);
      });
    }
  }, [receipt]);

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center bg-white px-6">
        <p className="text-gray-600">Loading confirmation...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen grid place-items-center bg-white px-6">
        <div className="max-w-md w-full rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
          <Link
            to="/"
            className="mt-4 inline-block rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  if (!receipt) return null;

  return (
    <main className="min-h-screen bg-white px-6 py-12">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <FiCheckCircle className="h-8 w-8 text-emerald-700" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            Thank you for your purchase!
          </h1>

          <p className="text-gray-600">
            Your reservation at <span className="font-semibold">Nature Tour</span> has been confirmed
          </p>
        </div>

        {/* Purchase details */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <FiMapPin className="text-emerald-700" />
            Purchase Details
          </h2>

          <div className="space-y-4 text-sm">
            <Row icon={FiMapPin} label="TOUR" value={receipt.tour} />
            <Row icon={FiUsers} label="PEOPLE" value={`${receipt.personas} people`} />
            <Row
              icon={FiCalendar}
              label="DATE"
              value={new Date(receipt.fecha).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            />
            <Row
              icon={FiClock}
              label="START TIME"
              value={receipt.hora.slice(0, 5)}
            />
            <Row
              icon={FiFileText}
              label="PURCHASE ID"
              value={
                <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 sm:px-3 py-1 font-mono text-xs sm:text-sm text-emerald-800 break-all">
                  {receipt.reservaId}
                </span>
              }
            />
            {receipt.paypalCaptureId && (
              <Row
                icon={FiFileText}
                label="PAYPAL ID"
                value={
                  <span className="rounded-lg border border-blue-200 bg-blue-50 px-2 sm:px-3 py-1 font-mono text-xs sm:text-sm text-blue-800 break-all">
                    {receipt.paypalCaptureId}
                  </span>
                }
              />
            )}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <FiCreditCard className="text-emerald-700" />
            Payment Summary
          </h2>

          <div className="space-y-4 text-sm">
            <Row
              icon={FiTag}
              label="PAYMENT TYPE"
              value={
                <span
                  className={`rounded-lg px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                    receipt.mode === "deposit"
                      ? "border border-amber-200 bg-amber-50 text-amber-800"
                      : "border border-emerald-200 bg-emerald-50 text-emerald-800"
                  }`}
                >
                  {receipt.mode === "deposit" ? "50% Deposit" : "Full Payment"}
                </span>
              }
            />
            <Row
              icon={FiDollarSign}
              label="AMOUNT PAID"
              value={`$${Number(receipt.amount).toFixed(2)}`}
            />
            {receipt.mode === "deposit" && (
              <Row
                icon={FiDollarSign}
                label="REMAINING BALANCE"
                value={
                  <span className="text-amber-700">
                    ${(Number(receipt.pricePerPerson) * receipt.personas - Number(receipt.amount)).toFixed(2)}
                  </span>
                }
              />
            )}
            <Row
              icon={FiDollarSign}
              label="TOUR TOTAL"
              value={`$${(Number(receipt.pricePerPerson) * receipt.personas).toFixed(2)}`}
            />
          </div>

          {receipt.mode === "deposit" && (
            <p className="mt-4 text-xs text-amber-700 bg-amber-50 rounded-lg p-3 border border-amber-200">
              <strong>Note:</strong> The remaining balance of{" "}
              <span className="font-semibold">
                ${(Number(receipt.pricePerPerson) * receipt.personas - Number(receipt.amount)).toFixed(2)}
              </span>{" "}
              is due on the day of the tour.
            </p>
          )}
        </div>

        {/* Recommendation */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <h3 className="mb-1 font-semibold text-emerald-900">
            Important Recommendation
          </h3>
          <p className="text-sm text-emerald-800">
            We recommend arriving <span className="font-semibold">15 minutes before</span> the scheduled time
            to register and receive tour instructions.
          </p>
        </div>

        {/* Save reminder */}
        <div className="flex items-center gap-3 rounded-2xl bg-amber-50 border border-amber-200 p-4">
          <div className="rounded-full bg-amber-100 p-2">
            <FiFileText className="text-amber-700" />
          </div>
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Important:</span> Save your{" "}
            <span className="font-semibold">Purchase ID</span> or download the PDF receipt to validate your reservation.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <ReceiptPDF receipt={receipt} />

          <Link
            to="/"
            className="block w-full rounded-xl border border-gray-300 py-3 text-center font-semibold text-gray-900 hover:bg-gray-50"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-3 last:border-b-0 gap-2">
      <div className="flex items-center gap-3 text-gray-500">
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="text-xs font-medium tracking-wide">{label}</span>
      </div>
      <div className="font-semibold text-gray-900 sm:text-right">{value}</div>
    </div>
  );
}
