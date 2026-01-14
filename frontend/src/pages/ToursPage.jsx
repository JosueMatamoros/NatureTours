import React from "react";
import TourVideo from "../components/tour/TourVideo";
import LocalFlavors from "../components/tour/LocalFlavors";
import Navbar from "../components/home/Navbar";
import TourImagesBento from "../components/tour/TourImagesBento";

export default function ToursPage() {
  return (
    <div>
      <Navbar variant="solid" />
      <TourVideo />
      <TourImagesBento
        images={[
          "/tours/bento/image1.JPG",
          "/tours/bento/image2.JPG",
          "/tours/bento/image3.JPG",
          "/tours/bento/image4.JPG",
          "/tours/bento/image5.JPG",
          "aboutUs/image1.JPG",
        ]}
      />
      <LocalFlavors />
    </div>
  );
}
