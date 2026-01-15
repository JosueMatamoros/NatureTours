import React from "react";
import StayCarouselCard from "./StayCarouselCard";
import { HiOutlineWifi, HiOutlineLocationMarker } from "react-icons/hi";
import { FiWind } from "react-icons/fi";
import { MdHotTub, MdPets} from "react-icons/md";
import { BiBed } from "react-icons/bi";
import { GiShower } from "react-icons/gi";
import { FaUmbrellaBeach } from "react-icons/fa";

export default function StaysCarouselGrid() {
  const stays = [
    {
      title: "Villa Alma Verde",
      subtitle:
        "Only 1.8 miles (about 5 minutes) from downtown La Fortuna, with stunning rainforest and river views. Spacious, comfortable, and perfect for large groups.",
      locationLabel: "Javillos, La Fortuna",
      capacity: 12,
      highlight: "Largest capacity",
      airbnbUrl: "https://www.airbnb.com/h/villaalmaverde",
      images: [
        "/houses/villaMario/VillaMario1.JPG",
        "/houses/villaMario/VillaMario2.JPG",
        "/houses/villaMario/VillaMario3.JPG",
        "/houses/villaMario/VillaMario4.JPG",
      ],
      amenities: [
        { label: "Wi-Fi", icon: <HiOutlineWifi className="h-4 w-4" /> },
        { label: "A/C", icon: <FiWind className="h-4 w-4" /> },
        { label: "Outdoor shower", icon: <GiShower className="h-4 w-4" /> },
        { label: "3 bedrooms", icon: <BiBed className="h-4 w-4" /> },
        { label: "Pet friendly", icon: <MdPets className="h-4 w-4" /> },
      ],
    },
    {
      title: "Villa Aurora",
      subtitle:
        "Right in downtown La Fortuna, close to everything, yet private and peaceful. Enjoy open green pastures, friendly cows, and unwind in the jacuzzi after a day of adventure.",
      locationLabel: "La Fortuna Downtown",
      capacity: 7,
      highlight: "Closest to downtown",
      airbnbUrl: "https://www.airbnb.com/h/villaaurorafortuna",
      images: [
        "/houses/villaAurora/VillaAurora1.JPG",
        "/houses/villaAurora/VillaAurora2.JPG",
        "/houses/villaAurora/VillaAurora3.JPG",
        "/houses/villaAurora/VillaAurora4.JPG",
      ],
      amenities: [
        { label: "Wi-Fi", icon: <HiOutlineWifi className="h-4 w-4" /> },
        { label: "A/C", icon: <FiWind className="h-4 w-4" /> },
        { label: "2 bedrooms", icon: <BiBed className="h-4 w-4" /> },
        { label: "Jacuzzi", icon: <MdHotTub className="h-4 w-4" /> },
        { label: "Pet friendly", icon: <MdPets className="h-4 w-4" /> },
      ],
    },
  ];

  return (
    <section className=" py-6 sm:py-10">
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
