import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPaymentById } from "../../services/payments.api";
import {
  FiCheckCircle,
  FiMapPin,
  FiUsers,
  FiCalendar,
  FiClock,
  FiFileText,
  FiDownload,
  FiMail,
} from "react-icons/fi";

export default function Success() {
  const { paymentId } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);

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
                <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 font-mono text-emerald-800">
                  {receipt.reservaId}
                </span>
              }
            />
          </div>
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

        {/* Email notice */}
        <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-4">
          <div className="rounded-full bg-gray-200 p-2">
            <FiMail className="text-gray-700" />
          </div>
          <p className="text-sm text-gray-600">
            A copy of this confirmation will be sent to your{" "}
            <span className="font-semibold text-gray-900">email address</span>
          </p>
        </div>

        <p className="text-center text-sm text-gray-500">
          Save your <span className="font-semibold text-gray-900">Purchase ID</span> to validate your reservation
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3d5a3d] py-3 font-semibold text-white hover:bg-[#2f4a2f]">
            <FiDownload />
            Download PDF Receipt
          </button>

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
    <div className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-b-0">
      <div className="flex items-center gap-3 text-gray-500">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium tracking-wide">{label}</span>
      </div>
      <div className="font-semibold text-gray-900 text-right">{value}</div>
    </div>
  );
}
