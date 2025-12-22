import React from 'react'
import Navbar from './components/home/Navbar'
import HeroSection from './HeroSection'

export default function Home() {
  return (
    <div className='min-h-dvh'>
      <HeroSection />
      <Navbar />
    </div>
  )
}
