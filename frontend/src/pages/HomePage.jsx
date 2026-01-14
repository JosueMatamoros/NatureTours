import React from "react";
import Navbar from "../components/home/Navbar";
import HeroSection from "../sections/HeroSection";
import ToursSection from "../sections/ToursSection";
import AboutUsSection from "../sections/AboutUsSection";
import MapSection from "../sections/MapSection";
import WhatsAppButton from '../components/ui/WhatsAppButton'
import TourImagesBento from "../components/tour/TourImagesBento";

export default function Home() {
  return (
    <div className="min-h-dvh">
      <Navbar variant="overlay" />
      <HeroSection />
      <ToursSection />
      <TourImagesBento images={[
        "/tours/bento/image1.JPG",
        "/tours/bento/image2.JPG",
        "/tours/bento/image3.JPG",
        "/tours/bento/image4.JPG",
        "/tours/bento/image5.JPG",
        "/tours/bento/image6.JPG",
      ]} />
      <AboutUsSection />
      <MapSection />
      <WhatsAppButton />
    </div>
  );
}
