import React from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import Navbar from "../components/home/Navbar";
import HeroSection from "../sections/HeroSection";
import ToursSection from "../sections/ToursSection";
import AboutUsSection from "../sections/AboutUsSection";
import MapSection from "../sections/MapSection";
import WhatsAppButton from "../components/ui/WhatsAppButton";
import TourImagesBento from "../components/tour/TourImagesBento";
import HorsesSection from "../sections/HorsesSection";

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="min-h-dvh">
      <Navbar variant="overlay" />
      <HeroSection />
      <ToursSection />
      <TourImagesBento
        images={[
          "/tours/bento/image1.JPG",
          "/tours/bento/image2.JPG",
          "/tours/bento/image3.JPG",
          "/tours/bento/image4.JPG",
          "/tours/bento/image5.JPG",
          "/tours/bento/image6.JPG",
        ]}
      />
      <div className="w-full  flex justify-center sm:-mt-12">
        <button
          type="button"
          onClick={() => navigate("/tours")}
          className="it rounded-xl border border-emerald-700 px-5 py-2.5 text-sm font-semibold text-emerald-700 transition-all duration-300 hover:bg-emerald-50 hover:scale-105 inline-flex items-center gap-2"
        >
          Know more about the tour
          <FiArrowRight className="h-4 w-4" />
        </button>
      </div>
      <AboutUsSection />
      <HorsesSection limit={3} />
      <div className="w-full  flex justify-center mt-4">
        <button
          type="button"
          onClick={() => navigate("/about#horses")}
          className="it rounded-xl border border-emerald-700 px-5 py-2.5 text-sm font-semibold text-emerald-700 transition-all duration-300 hover:bg-emerald-50 hover:scale-105 inline-flex items-center gap-2"
        >
          Know more about our horses
          <FiArrowRight className="h-4 w-4" />
        </button>
      </div>
      <MapSection />
      <WhatsAppButton />
    </div>
  );
}
