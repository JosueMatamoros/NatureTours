import React from "react";
import StayCarouselCard from "./StayCarouselCard";
import { HiOutlineWifi } from "react-icons/hi";
import { FiWind } from "react-icons/fi";

export default function StaysCarouselGrid() {
  const stays = [
    {
      title: "Casa Vista al Valle",
      subtitle:
        "Hermosa casa con vista panorámica al valle, ideal para familias.",
      locationLabel: "Valle Central",
      capacity: 6,
      highlight: "Mayor capacidad",
      airbnbUrl: "https://www.airbnb.com/tu-link-1",
      images: [
        "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80",
      ],
      amenities: [
        { label: "Wifi", icon: <HiOutlineWifi className="h-4 w-4" /> },
        { label: "A/C", icon: <FiWind className="h-4 w-4" /> },
        { label: "TV" },
        { label: "Private bathroom" },
      ],
    },
    {
      title: "Cabaña El Bosque",
      subtitle: "Acogedora cabaña rodeada de naturaleza y tranquilidad.",
      locationLabel: "Bosque Norte",
      capacity: 4,
      highlight: "Centro de Fortuna",
      airbnbUrl: "https://www.airbnb.com/tu-link-2",
      images: [
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80",
      ],
      amenities: [{ label: "Wifi" }, { label: "Private bathroom" }, { label: "View" }],
    },
    {
      title: "Casa Vista al Valle",
      subtitle:
        "Hermosa casa con vista panorámica al valle, ideal para familias.",
      locationLabel: "Valle Central",
      capacity: 6,
      highlight: "Mayor capacidad",
      airbnbUrl: "https://www.airbnb.com/tu-link-1",
      images: [
        "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80",
      ],
      amenities: [
        { label: "Wifi", icon: <HiOutlineWifi className="h-4 w-4" /> },
        { label: "A/C", icon: <FiWind className="h-4 w-4" /> },
        { label: "TV" },
        { label: "Private bathroom" },
      ],
    },
    {
      title: "Cabaña El Bosque",
      subtitle: "Acogedora cabaña rodeada de naturaleza y tranquilidad.",
      locationLabel: "Bosque Norte",
      capacity: 4,
      highlight: "Centro de Fortuna",
      airbnbUrl: "https://www.airbnb.com/tu-link-2",
      images: [
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80",
      ],
      amenities: [{ label: "Wifi" }, { label: "Private bathroom" }, { label: "View" }],
    },
  ];

  return (
    <section className="bg-[#FBFAF8] py-6 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {stays.map((s) => (
            <StayCarouselCard key={s.title} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}
