// src/pages/SpecialLinkPage.jsx
// Página pública de un link especial: /link/:linkId
// Tour, fecha, horario, pasajeros y monto vienen fijos desde el admin;
// el cliente solo confirma y pasa al pago.
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiCalendar, FiClock, FiUsers, FiCheckCircle } from "react-icons/fi";
import { TOURS } from "../data/tours";
import TourOverviewCard from "../components/checkout/TourOverviewCard";
import WhatsAppButton from "../components/ui/WhatsAppButton";
import NotFound from "./NotFound";
import { getSpecialLink, bookSpecialLink } from "../../services/special-links.api";

const fmt = (n) => `$${Number(n ?? 0).toFixed(2)}`;

function formatDate(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d, 12).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(hm) {
  const [h, m] = hm.split(":").map(Number);
  if (h === 12 && m === 0) return "12:00 MD";
  const suffix = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${suffix}`;
}

function guestsText(l) {
  const parts = [`${l.adults} adult${l.adults === 1 ? "" : "s"}`];
  if (l.children > 0) parts.push(`${l.children} child${l.children === 1 ? "" : "ren"}`);
  if (l.babies > 0) parts.push(`${l.babies} bab${l.babies === 1 ? "y" : "ies"}`);
  return parts.join(" · ");
}

export default function SpecialLinkPage() {
  const { linkId } = useParams();
  const navigate = useNavigate();

  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getSpecialLink(linkId);
        if (!data?.ok || !data?.link) throw new Error("Link inválido");
        if (!cancelled) setLink(data.link);
      } catch (e) {
        console.error("Error loading special link:", e);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [linkId]);

  async function handleContinue() {
    setError("");
    try {
      setBooking(true);
      const data = await bookSpecialLink(linkId);
      if (!data?.id) throw new Error("Could not create the booking.");
      navigate(`/payment/${data.id}`, { state: { backTo: `/link/${linkId}` } });
    } catch (e) {
      setError(e?.message || "Could not create the booking.");
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
      </div>
    );
  }

  if (notFound || !link) return <NotFound />;

  const tour = TOURS[link.tourId];

  return (
    <div>
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
            Nature Tours La Fortuna
          </p>
          <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
            Your private booking link
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-5 md:flex md:space-x-6">
        {tour && <TourOverviewCard tour={tour} />}

        <aside className="mt-4 h-fit w-full rounded-2xl border border-gray-200 bg-white shadow-sm md:mt-0 md:max-w-sm">
          <div className="border-b border-gray-100 px-6 pt-5 pb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {tour?.name ?? link.tourName}
            </h3>
            <p className="text-xs text-gray-500">Reserved for you</p>
          </div>

          <div className="space-y-5 px-6 py-6">
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-center gap-3">
                <FiCalendar className="h-4 w-4 text-emerald-600" />
                {formatDate(link.tourDate)}
              </li>
              <li className="flex items-center gap-3">
                <FiClock className="h-4 w-4 text-emerald-600" />
                {formatTime(link.startTime)}
              </li>
              <li className="flex items-center gap-3">
                <FiUsers className="h-4 w-4 text-emerald-600" />
                {guestsText(link)}
              </li>
            </ul>

            <section className="rounded-xl bg-gray-50 px-4 py-4 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Tour price</span>
                <span className="font-medium text-gray-900">{fmt(link.subtotal)}</span>
              </div>
              <div className="mt-2 flex justify-between text-gray-600">
                <span>PayPal processing fee</span>
                <span className="font-medium text-gray-900">{fmt(link.fee)}</span>
              </div>
              <div className="mt-3 flex justify-between border-t border-gray-200 pt-3 text-base font-semibold">
                <span className="text-gray-900">Total</span>
                <span className="text-emerald-600">{fmt(link.total)}</span>
              </div>
            </section>

            {link.used ? (
              <p className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-3 text-sm font-semibold text-emerald-700">
                <FiCheckCircle className="h-4 w-4" />
                This booking is already paid
              </p>
            ) : (
              <button
                type="button"
                disabled={booking}
                onClick={handleContinue}
                className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {booking ? "Creating booking..." : "Continue to payment"}
              </button>
            )}

            {error ? (
              <p className="text-center text-xs text-red-600">{error}</p>
            ) : (
              !link.used && (
                <p className="text-center text-xs text-gray-400">
                  You can pay in full or a 20% deposit on the next step
                </p>
              )
            )}
          </div>
        </aside>
      </div>

      <WhatsAppButton message="Hello, I have a question about my booking link." />
    </div>
  );
}
