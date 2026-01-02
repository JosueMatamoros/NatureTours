import React from 'react'
import TourCard from '../components/tour/tourCard'

export default function ToursSection() {
  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
            <TourCard
              imageSrc="/tours/night-walk-tour.jpg"
              imageAlt="Night walk tour"
              title="Night Walk Tour"
              description="Explore a family-owned forest in a small town near La Fortuna and discover its nocturnal wildlife on a safe, guided walk. Wander along natural trails while observing animals that only appear at night, accompanied by an expert guide."
              stats={{
                duration: "2 hrs",
                group: "2–12 people",
                location: "Tropical Forest Trails",
              }}
              highlights={[
                "Expert bilingual guide",
                "Professional flashlight included",
                "Wildlife observation",
              ]}
              price={45}
              oldPrice={55}
              currency="$"
              per="/ person"
              onReserve={() => console.log("Book tour")}
            />
            <TourCard
              imageSrc="/tours/horseBac-tour.JPG"
              imageAlt="Horseback riding tour"
              title="Horseback Riding Tour"
              description="Enjoy an authentic horseback riding experience through natural trails, crossing rivers and exploring the forest while discovering the beauty of the surroundings alongside experienced local guides."
              stats={{
                duration: "2 hrs",
                group: "2–15 people",
                location: "Tropical Forest Trails",
              }}
              highlights={[
                "Experienced local guide",
                "Bilingual guide available",
                "Calm, well-trained horses",
                "All riding equipment included",
              ]}
              price={25}
              currency="$"
              per="/ person"
              onReserve={() => console.log("Reserve horseback tour")}
              reverse
            />
          </div>
  )
}
