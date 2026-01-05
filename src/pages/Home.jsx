import React from "react";
import Navbar from "../components/home/Navbar";
import HeroSection from "../sections/HeroSection";
import ToursSection from "../sections/ToursSection";
import AboutUsSection from "../sections/AboutUsSection";
import MapSection from "../sections/MapSection";
import PayPalCheckout from "../components/payment/PaypalCheckout";

export default function Home() {
  return (
    <div className="min-h-dvh">
      <Navbar />
      <HeroSection />
      <ToursSection />
      ]
      <AboutUsSection />
      <MapSection />
      <PayPalCheckout
        amount={10}
        description="Tour Costa Rica (6–8 pm)"
        onSuccess={(details) => {
          console.log("Pago OK", details);
        }}
      />
    </div>
  );
}
