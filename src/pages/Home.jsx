import React from "react";
import Navbar from "../components/home/Navbar";
import HeroSection from "../sections/HeroSection";
import ToursSection from "../sections/ToursSection";
import AboutUsSection from "../sections/AboutUsSection";
import MapSection from "../sections/MapSection";

export default function Home() {
  return (
    <div className="min-h-dvh">
      <Navbar variant="overlay" />
      <HeroSection />
      <ToursSection />
      <AboutUsSection />
      <MapSection />
    </div>
  );
}
