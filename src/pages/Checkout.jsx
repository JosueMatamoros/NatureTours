import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { TOURS } from "../data/tours";
import ReserveTourCard from "../components/payment/ReserveTourCard";
import TourOverviewCard from "../components/payment/TourOverviewCard";
import Navbar from "../components/home/Navbar";

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const tourType = Number(searchParams.get("tourType") || 1);

  const tour = useMemo(() => TOURS[tourType] ?? TOURS[1], [tourType]);

  return (
    <div className="md:flex px-6 py-8 space-x-6 space-y-6">
      <Navbar/>
      <TourOverviewCard tour={tour} />
      <ReserveTourCard />
    </div>
  );
}
