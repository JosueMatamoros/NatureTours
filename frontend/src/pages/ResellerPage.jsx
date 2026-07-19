// src/pages/ResellerPage.jsx
// Página pública de un reseller: /reseller/:resellerId
// Recicla el módulo de booking del Horseback Riding Tour, sin navegación
// hacia la página principal, con los precios descontados del reseller.
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FiTag } from "react-icons/fi";
import { TOURS } from "../data/tours";
import ReserveTourCard from "../components/checkout/ReserveTourCard";
import TourOverviewCard from "../components/checkout/TourOverviewCard";
import NotFound from "./NotFound";
import { getResellerById } from "../../services/resellers.api";

const RESELLER_TOUR_ID = 2; // Horseback Riding

export default function ResellerPage() {
  const { resellerId } = useParams();

  const [reseller, setReseller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!resellerId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const res = await getResellerById(resellerId);
        const data = res?.data ?? res;

        if (!data?.ok || !data?.reseller) throw new Error("Reseller inválido");

        if (!cancelled) setReseller(data.reseller);
      } catch (e) {
        console.error("Error loading reseller:", e);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [resellerId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
      </div>
    );
  }

  if (notFound) return <NotFound />;

  const tour = TOURS[RESELLER_TOUR_ID];

  return (
    <div>
      {/* Header mínimo, sin links a la página principal */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
              Official Partner
            </p>
            <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
              {reseller.name}
            </h1>
          </div>

          {Number(reseller.discount) > 0 && (
            <span className="flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700 ring-1 ring-amber-200">
              <FiTag className="h-4 w-4" />
              {reseller.discount}% OFF
            </span>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-5 md:flex md:space-x-6">
        <TourOverviewCard tour={tour} />
        <ReserveTourCard tour={tour} reseller={reseller} />
      </div>
    </div>
  );
}
