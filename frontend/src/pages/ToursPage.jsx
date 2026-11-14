import React from "react";
import TourVideo from "../components/tour/TourVideo";
import {
  HorsebackIntro,
  HorsebackStory,
  HorsebackRoutes,
  HorsebackKids,
  HorsebackVisit,
} from "../components/tour/HorsebackGuide";
import LocalFlavors from "../components/tour/LocalFlavors";
import Navbar from "../components/home/Navbar";
import Footer from "../components/home/Footer";
import TourImagesBento from "../components/tour/TourImagesBento";
import WhatToBring from "../components/tour/WhatToBring";
import StickyBookingBar from "../components/tour/StickyBookingBar";
import { useSEO, SEO_CONFIG } from "../hooks/useSEO";

// Página de la cabalgata, contada como un recorrido: video + datos clave →
// capítulos con fotos → sabores locales → galería → estilos de ruta → niños →
// qué llevar → cómo llegar, preguntas y reserva. Las fotos van repartidas
// entre las secciones, no amontonadas al final.
export default function ToursPage() {
  useSEO(SEO_CONFIG.horseback);

  return (
    <div>
      <Navbar variant="solid" />
      <TourVideo />
      <HorsebackIntro />
      <HorsebackStory />
      <LocalFlavors />

      <TourImagesBento
        images={[
          "/tours/bento/image1.webp",
          "/tours/bento/image2.webp",
          "/tours/bento/image3.webp",
          "/tours/bento/image4.webp",
          "/tours/bento/image5.webp",
          "/tours/bento/image6.webp",
        ]}
      />

      <HorsebackRoutes />
      <HorsebackKids />
      <WhatToBring />
      <HorsebackVisit />
      <Footer />

      <StickyBookingBar tourId={2} />
    </div>
  );
}
