import { FaTripadvisor, FaGoogle, FaStar } from "react-icons/fa";
import { FiArrowUpRight } from "react-icons/fi";

// ── Reseñas por plataforma ───────────────────────────────────────────────────
// Datos reales confirmados (ago 2026). Actualizá aquí cuando cambien.
const PLATFORMS = [
  {
    id: "getyourguide",
    label: "GetYourGuide",
    rating: 5.0,
    reviews: 114,
    url: "https://www.getyourguide.com/es-es/san-ramon-costa-rica-l269637/la-fortuna-paseo-a-caballo-con-cruce-del-rio-t1246580/",
  },
  {
    id: "tripadvisor",
    label: "Tripadvisor",
    rating: 5.0,
    reviews: 51,
    url: "https://www.tripadvisor.com/AttractionProductReview-g17484635-d34402371-Horseback_Riding_Adventure_in_La_Fortuna_with_River_Crossings-La_Fortuna_La_Fort.html",
  },
  {
    id: "google",
    label: "Google",
    rating: 5.0,
    reviews: 184,
    url: "https://maps.app.goo.gl/4tou36QDncguSgq96",
  },
];

function Stars({ className = "h-5 w-5" }) {
  return (
    <div className="flex items-center gap-1" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <FaStar key={i} className={`${className} text-amber-400`} />
      ))}
    </div>
  );
}

// Logo/marca de cada plataforma en su color oficial.
function PlatformBrand({ id, label }) {
  if (id === "tripadvisor") {
    return (
      <span className="inline-flex items-center gap-2">
        <FaTripadvisor className="h-6 w-6 text-[#00AA6C]" aria-hidden="true" />
        <span className="text-lg font-bold text-gray-800">{label}</span>
      </span>
    );
  }
  if (id === "google") {
    return (
      <span className="inline-flex items-center gap-2">
        <FaGoogle className="h-5 w-5 text-[#4285F4]" aria-hidden="true" />
        <span className="text-lg font-bold text-gray-800">{label}</span>
      </span>
    );
  }
  return (
    <span className="text-lg font-extrabold tracking-tight text-[#FF5533]">
      GetYour<span className="text-gray-800">Guide</span>
    </span>
  );
}

function RatingCard({ platform }) {
  const { url, rating, reviews } = platform;

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col items-center gap-4 rounded-3xl border border-emerald-100 bg-white px-6 py-8 text-center shadow-[0_12px_35px_rgba(6,78,59,0.07)] transition duration-300 hover:-translate-y-1.5 hover:border-emerald-200 hover:shadow-[0_24px_50px_rgba(6,78,59,0.14)] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
      aria-label={`${platform.label}: ${rating.toFixed(1)} out of 5 stars from ${reviews} reviews`}
    >
      <div className="flex h-8 items-center">
        <PlatformBrand id={platform.id} label={platform.label} />
      </div>

      <Stars />

      <div>
        <p className="text-4xl font-black text-emerald-800">{rating.toFixed(1)}</p>
        <p className="mt-0.5 text-sm text-gray-500">{reviews} reviews</p>
      </div>

      <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 transition group-hover:gap-1.5">
        Read reviews
        <FiArrowUpRight className="h-4 w-4" />
      </span>
    </a>
  );
}

export default function RatingsSection() {
  return (
    <section className="py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <header className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">
            Traveler reviews
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#2B241D] sm:text-4xl lg:text-5xl">
            A perfect 5-star rating
          </h2>
          <p className="mx-auto mt-4 text-base leading-relaxed text-emerald-900/70 sm:text-lg">
            Hundreds of travelers give us top marks on GetYourGuide, Tripadvisor
            and Google. See what they say before you book your ride.
          </p>
        </header>

        <div className="grid gap-5 sm:grid-cols-3">
          {PLATFORMS.map((platform) => (
            <RatingCard key={platform.id} platform={platform} />
          ))}
        </div>
      </div>
    </section>
  );
}
