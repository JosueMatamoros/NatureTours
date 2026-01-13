import React from 'react'
import HorsesSection from '../sections/HorsesSection'
import DogSection from '../sections/DogSection';
import Navbar from "../components/home/Navbar";
import AboutUsSection from '../sections/AboutUsSection';

export default function AboutUs() {
  return (
    <div>
      <Navbar variant='solid'/>
      <div className='-mt-3 sm:-mt-10'>
        <AboutUsSection />
      </div>
      <HorsesSection />
      <DogSection />
    </div>
  )
}
