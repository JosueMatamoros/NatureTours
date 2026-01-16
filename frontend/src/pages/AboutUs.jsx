import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import HorsesSection from "../sections/HorsesSection";
import DogSection from "../sections/DogSection";
import Navbar from "../components/home/Navbar";
import Footer from "../components/home/Footer";
import AboutUsSection from "../sections/AboutUsSection";

export default function AboutUs() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash === "#horses") {
      // Deja que el DOM renderice antes de scrollear
      requestAnimationFrame(() => {
        const el = document.getElementById("horses");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [location.hash]);

  return (
    <div>
      <Navbar variant="solid" />
      <div className="-mt-3 sm:-mt-10">
        <AboutUsSection />
      </div>
      <HorsesSection />
      <DogSection />
      <Footer />
    </div>
  );
}
