import React from "react";
import StayCarouselCard from "./StayCarouselCard";
import { HiOutlineWifi} from "react-icons/hi";
import { FiWind } from "react-icons/fi";
import { MdHotTub, MdPets, MdGarage} from "react-icons/md";
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
        "/houses/villaMario/VillaMario1.webp",
        "/houses/villaMario/VillaMario2.webp",
        "/houses/villaMario/VillaMario3.webp",
        "/houses/villaMario/VillaMario4.webp",
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
        "/houses/villaAurora/VillaAurora1.webp",
        "/houses/villaAurora/VillaAurora2.webp",
        "/houses/villaAurora/VillaAurora3.webp",
        "/houses/villaAurora/VillaAurora4.webp",
      ],
      amenities: [
        { label: "Wi-Fi", icon: <HiOutlineWifi className="h-4 w-4" /> },
        { label: "A/C", icon: <FiWind className="h-4 w-4" /> },
        { label: "2 bedrooms", icon: <BiBed className="h-4 w-4" /> },
        { label: "Jacuzzi", icon: <MdHotTub className="h-4 w-4" /> },
        { label: "Pet friendly", icon: <MdPets className="h-4 w-4" /> },
      ],
    },
    {
      title: "Casa Luciernaga",
      subtitle:
        "Just 20 minutes from La Fortuna, this spacious house is perfect for large groups or families. It features a jacuzzi with hydro massage and waterfall, plus ample spaces to relax and share.",
      locationLabel: "Chachagua, La Fortuna",
      capacity: 6,
      highlight: "Near our Tour",
      airbnbUrl: "https://www.airbnb.com/rooms/831826017675770487?source_impression_id=p3_1768506915_P3GuK4Gk_ocPDOkV",
      images: [
        "/houses/luciernaga/Luciernaga3.webp",
        "/houses/luciernaga/Luciernaga2.webp",
        "/houses/luciernaga/Luciernaga1.webp",
        "/houses/luciernaga/Luciernaga5.webp",
        "/houses/luciernaga/Luciernaga4.webp",
      ],
      amenities: [
        { label: "Wi-Fi", icon: <HiOutlineWifi className="h-4 w-4" /> },
        { label: "A/C", icon: <FiWind className="h-4 w-4" /> },
        { label: "3 bedrooms", icon: <BiBed className="h-4 w-4" /> },
        { label: "Jacuzzi", icon: <MdHotTub className="h-4 w-4" /> },
        { label: "Pet friendly", icon: <MdPets className="h-4 w-4" /> },
        { label: "Garage", icon: <MdGarage className="h-4 w-4" /> },

      ],
    },
    {
      title: "Cabaña Yalala",
      subtitle:
        "Located within Nature Tours, this cabin is perfect for couples or solo travelers seeking an immersive nature experience with all modern comforts.",
      locationLabel: "Chachagua, La Fortuna",
      capacity: 3,
      highlight: "Inside Nature Tours",
      airbnbUrl: "https://es-l.airbnb.com/rooms/1563963422967697287?guests=1&adults=1&s=67&unique_share_id=19eea760-ea76-4ac1-a711-9939074d2166",
      images: [
        "/houses/yalala/Yalala5.webp",
        "/houses/yalala/Yalala2.webp",
        "/houses/yalala/Yalala3.webp",
        "/houses/yalala/Yalala4.webp",
        "/houses/yalala/Yalala1.webp",
      ],
      amenities: [
        { label: "Wi-Fi", icon: <HiOutlineWifi className="h-4 w-4" /> },
        { label: "A/C", icon: <FiWind className="h-4 w-4" /> },
        { label: "1 bedrooms", icon: <BiBed className="h-4 w-4" /> },
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
