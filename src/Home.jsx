import React from "react";
import Navbar from "./components/home/Navbar";
import HeroSection from "./HeroSection";
import ToursSection from "./ToursSection";

export default function Home() {
  return (
    <div className="min-h-dvh">
      <Navbar />
      <HeroSection />
      <ToursSection />

    </div>
  );
}
