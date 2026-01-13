import { HiOutlineClock } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/home/Navbar";

const TOURS = [
  {
    id: 2,
    title: "Horseback Riding Tour",
    description:
      "Enjoy a memorable horseback riding experience along scenic forest trails and crystal-clear rivers. Ride through lush tropical landscapes, spot local wildlife, and take in the natural beauty that makes Costa Rica truly unforgettable.",
    image: "/tours/familyHorsebackRiding.JPG",
    duration: "2 hours",
    price: 30,
    objectPosition: "object-center",
    available: true,
    cta: "Select date",
  },
  {
    id: 1,
    title: "Night Walk Tour",
    description:
      "Join a guided night walk through the tropical forest and discover a completely different side of Costa Rica. Observe nocturnal wildlife such as red-eyed tree frogs, insects, and other fascinating creatures that come to life after sunset.",
    image: "/tours/AgalychnisCallidryas.png",
    duration: "2 hours",
    price: 45,
    objectPosition: "object-top",
    available: false,
    cta: "Coming soon",
    badge: "Coming Soon",
  },
];

export default function SelecTour() {
  const navigate = useNavigate();

  return (
    <div>
      <Navbar variant="solid" />

      <main className="mx-auto max-w-6xl px-4 ">
        {/* HEADER */}
        <header className="mb-16 text-center">
          <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-[#2B241D] sm:text-5xl lg:text-6xl">
            Our tours
          </h2>

          <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-emerald-900/70 sm:text-lg">
            Discover the magic of nature through our guided experiences, designed to create unforgettable memories.
          </p>

          <div className="mx-auto mt-6 h-1 w-20 rounded-full bg-emerald-900/20" />
        </header>

        {/* GRID */}
        <section className="grid gap-10 md:grid-cols-2">
          {TOURS.map((tour) => {
            const isDisabled = !tour.available;

            return (
              <article
                key={tour.id}
                className="overflow-hidden rounded-3xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.12)] ring-1 ring-black/5 transition-transform duration-300 hover:scale-[1.02]"
              >
                {/* IMAGE */}
                <div className="relative h-[320px]">
                  <img
                    src={tour.image}
                    alt={tour.title}
                    className={`h-full w-full object-cover ${tour.objectPosition} ${
                      isDisabled ? "grayscale" : ""
                    }`}
                    loading="lazy"
                  />

                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />

                  {/* Coming Soon badge */}
                  {tour.badge && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="rounded-2xl bg-amber-500 px-8 py-3 text-base font-semibold text-white shadow-lg">
                        {tour.badge}
                      </span>
                    </div>
                  )}

                  {/* Duration */}
                  <div className="absolute bottom-6 left-6 inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-slate-900 shadow">
                    <HiOutlineClock className="h-5 w-5 text-emerald-700" />
                    {tour.duration}
                  </div>

                  {/* Price */}
                  <div className="absolute bottom-6 right-6 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-emerald-700 shadow">
                    ${tour.price}{" "}
                    <span className="font-normal text-slate-500">
                      / persona
                    </span>
                  </div>
                </div>

                {/* DESCRIPTION */}
                <div className="px-6 pt-5 text-slate-600">
                  <p className="text-sm leading-6">{tour.description}</p>
                </div>

                {/* FOOTER */}
                <div className="flex items-center justify-between gap-4 px-6 pb-6 pt-5">
                  <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
                    {tour.title}
                  </h3>

                  <button
                    disabled={isDisabled}
                    onClick={() => {
                      if (isDisabled) return;
                      navigate(`/checkout?tourType=${tour.id}`);
                    }}
                    className={[
                      "rounded-full px-6 py-2 text-sm font-semibold transition",
                      isDisabled
                        ? "cursor-not-allowed bg-slate-200 text-slate-500"
                        : "bg-emerald-700 text-white hover:bg-emerald-800",
                    ].join(" ")}
                  >
                    {tour.cta}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}
