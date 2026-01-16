import React from "react";
import TourVideo from "../components/tour/TourVideo";
import LocalFlavors from "../components/tour/LocalFlavors";
import Navbar from "../components/home/Navbar";
import TourImagesBento from "../components/tour/TourImagesBento";
import WhatToBring from "../components/tour/WhatToBring";

export default function ToursPage() {
  return (
    <div>
      <Navbar variant="solid" />
      <TourVideo />
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
      <LocalFlavors />
      <WhatToBring />
    </div>
  );
}
