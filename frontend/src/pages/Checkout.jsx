import { useMemo } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { TOURS } from "../data/tours";
import ReserveTourCard from "../components/checkout/ReserveTourCard";
import TourOverviewCard from "../components/checkout/TourOverviewCard";
import Navbar from "../components/home/Navbar";

const ENABLED_TOURS = [1, 2];

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const tourType = Number(searchParams.get("tourType"));

  const isValidTour = ENABLED_TOURS.includes(tourType);

  const tour = useMemo(() => {
    if (!isValidTour) return null;
    return TOURS[tourType];
  }, [isValidTour, tourType]);

  if (!isValidTour) {
    return <Navigate to="/tours" replace />;
  }

  return (
    <div>
      <Navbar variant="solid" />

      <div className="mx-auto max-w-6xl px-6 py-5 md:flex md:space-x-6">
        <TourOverviewCard tour={tour} />
        <ReserveTourCard tour={tour} />
      </div>
    </div>
  );
}
