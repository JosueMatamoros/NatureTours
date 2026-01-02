import React from "react";
import Navbar from "./components/home/Navbar";
import HeroSection from "./sections/HeroSection";
import ToursSection from "./sections/ToursSection";
import AboutUsSection from "./sections/AboutUsSection";

export default function Home() {
  return (
    <div className="min-h-dvh">
      <Navbar />
      <HeroSection />
      <ToursSection />
      <AboutUsSection />
    </div>
  );
}
