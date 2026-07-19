// src/pages/ResellerPage.jsx
// Página pública de un reseller: /reseller/:resellerId
// Recicla el módulo de booking del Horseback Riding Tour, sin navegación
// hacia la página principal, con los precios descontados del reseller.
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <img src="/logo.webp" alt="Nature Tours" className="h-10 w-auto" />
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Partner: {reseller.name}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-5 md:flex md:space-x-6">
        <TourOverviewCard tour={tour} />
        <ReserveTourCard tour={tour} reseller={reseller} />
      </div>
    </div>
  );
}
