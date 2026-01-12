import React from "react";
import TourCard from "../components/tour/tourCard";
import { useNavigate } from "react-router-dom";

export default function ToursSection() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 space-y-6">
      <div className="text-center">
        <h2 className="mt-6 text-center text-4xl font-extrabold tracking-tight text-[#2B241D] sm:text-5xl lg:text-6xl">
          Discover our tours
        </h2>

        <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-emerald-900/70 sm:text-lg">
          Enjoy unique experiences surrounded by nature, adventure, and
          unforgettable landscapes in La Fortuna.
        </p>

        <div className="mx-auto mt-6 h-1 w-20 rounded-full bg-emerald-900/20" />
      </div>

      <TourCard
        imageSrcMobile="/tours/horsebackCoverMobile.JPG"
        imageSrcDesktop="/tours/horsebackCoverDesktop.JPG"
        imageAlt="Horseback riding tour"
        title="Horseback Riding Tour"
        description="Enjoy an authentic horseback riding experience through natural trails, crossing rivers and exploring the forest while discovering the beauty of the surroundings alongside experienced local guides."
        stats={{
          duration: "2 hrs",
          group: "2–20 people",
          location: "Tropical Forest Trails",
        }}
        highlights={[
          "Experienced local guide",
          "Bilingual guide available",
          "Calm, well-trained horses",
          "All riding equipment included",
        ]}
        price={30}
        currency="$"
        per="/ person"
        onReserve={() =>
          navigate({
            pathname: "/checkout",
            search: "?tourType=2",
          })
        }
        reverse
      />
    </div>
  );
}
