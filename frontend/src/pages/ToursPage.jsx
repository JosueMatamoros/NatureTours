import React from "react";
import LocalFlavors from "../components/tour/LocalFlavors";
import Navbar from "../components/home/Navbar";

export default function ToursPage() {
  return (
    <div >
    <Navbar variant="solid"/>
      <LocalFlavors />
    </div>
  );
}
