import { Link } from "react-router-dom";
import { FiClock, FiDollarSign, FiMapPin, FiMoon, FiCheck } from "react-icons/fi";
import Navbar from "../components/home/Navbar";
import Footer from "../components/home/Footer";
import WhatsAppButton from "../components/ui/WhatsAppButton";
import { useSEO, SEO_CONFIG } from "../hooks/useSEO";
import { PAGES, PATHS, SITE_URL, absUrl, NIGHT_WALK_LIVE } from "../seo/seoData";
import { TOURS } from "../data/tours";

// Página de la caminata nocturna — para búsquedas tipo "night walk La Fortuna",
// "night tour Arenal". Datos reales: 2 h, 6:00 pm y 8:00 pm, $45, guía
// bilingüe, linterna incluida.

const NIGHT = TOURS[1];

const FACTS = [
  { icon: FiClock, label: "Duration", value: "About 2 hours" },
  { icon: FiMoon, label: "Departures", value: "6:00 pm and 8:00 pm" },
  { icon: FiDollarSign, label: "Price", value: `$${NIGHT.price} per person` },
  { icon: FiMapPin, label: "Location", value: "A few minutes from downtown La Fortuna, Route 702" },
];

function JsonLd() {
  const page = PAGES.nightWalk;
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "TouristTrip",
      name: "Night Walk Tour in La Fortuna",
      description: page.description,
      url: absUrl(page.path),
      image: `${SITE_URL}${page.image}`,
      provider: { "@type": "LocalBusiness", name: "Nature Tours La Fortuna", url: `${SITE_URL}/` },
      offers: {
        "@type": "Offer",
        price: String(NIGHT.price),
        priceCurrency: "USD",
        url: absUrl(page.path),
        availability: "https://schema.org/InStock",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "La Fortuna Tours", item: absUrl(PATHS.tours) },
        { "@type": "ListItem", position: 3, name: "Night Walk in La Fortuna", item: absUrl(page.path) },
      ],
    },
  ];
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function NightWalkPage() {
  useSEO(SEO_CONFIG.nightWalk);

  return (
    <div className="min-h-dvh w-full overflow-x-hidden">
      <JsonLd />
      <Navbar variant="solid" />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">
          Arenal Volcano · Costa Rica
        </p>
        <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-[#2B241D] sm:text-5xl lg:text-6xl">
          Night Walk Tour in La Fortuna
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-gray-600">
          When the sun goes down, the rainforest in La Fortuna comes alive. On this guided
          night walk you explore tropical forest trails with a local bilingual guide, stopping
          to look for the frogs, insects and other wildlife that only appear after dark.
        </p>

        <div className="mt-8 overflow-hidden rounded-3xl border border-gray-200 shadow-sm">
          <img
            src={PAGES.nightWalk.image}
            alt="Red-eyed tree frog on a leaf during a night walk in La Fortuna, Costa Rica"
            width="1600"
            height="1600"
            className="h-72 w-full object-cover sm:h-96"
          />
        </div>

        <h2 className="mt-12 text-2xl font-extrabold text-gray-900 sm:text-3xl">The night walk at a glance</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {FACTS.map((f) => {
            const Ico = { C: f.icon };
            return (
              <div key={f.label} className="flex items-start gap-3 rounded-2xl border border-gray-200 p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <Ico.C className="h-5 w-5" />
                </span>
                <div>
                  <dt className="text-sm font-semibold uppercase tracking-wide text-gray-500">{f.label}</dt>
                  <dd className="mt-0.5 font-semibold text-gray-900">{f.value}</dd>
                </div>
              </div>
            );
          })}
        </dl>

        <h2 className="mt-12 text-2xl font-extrabold text-gray-900 sm:text-3xl">What you'll experience</h2>
        <div className="mt-4 max-w-3xl space-y-4 text-lg leading-relaxed text-gray-600">
          {NIGHT.about.map((t) => <p key={t}>{t}</p>)}
          {NIGHT.routes.map((t) => <p key={t}>{t}</p>)}
          <p>
            Wildlife is wild, so every night is different — part of the magic is finding what
            the forest shows you that evening. Your guide knows where to look and shares the
            stories of the local flora and fauna along the way.
          </p>
        </div>

        <h2 className="mt-12 text-2xl font-extrabold text-gray-900 sm:text-3xl">What's included</h2>
        <ul className="mt-4 space-y-2 text-lg text-gray-600">
          {NIGHT.highlights.map((h) => (
            <li key={h} className="flex gap-3">
              <FiCheck className="mt-1.5 h-5 w-5 shrink-0 text-emerald-600" />
              <span>{h}</span>
            </li>
          ))}
        </ul>

        <h2 className="mt-12 text-2xl font-extrabold text-gray-900 sm:text-3xl">What to bring</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {NIGHT.recommendations.map((r) => (
            <div key={r.title} className="rounded-2xl border border-gray-200 p-4">
              <h3 className="font-bold text-gray-900">{r.title}</h3>
              <p className="mt-1 text-gray-600">{r.text}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-2xl font-extrabold text-gray-900 sm:text-3xl">
          Combine it with a horseback ride
        </h2>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-gray-600">
          Many guests ride with us during the day and come back for the night walk. Discover
          our{" "}
          <Link to={PATHS.horseback} className="font-semibold text-emerald-700 underline underline-offset-2">
            horseback riding tour in La Fortuna
          </Link>{" "}
          with river crossings near Arenal Volcano, or see{" "}
          <Link to={PATHS.tours} className="font-semibold text-emerald-700 underline underline-offset-2">
            all our La Fortuna tours
          </Link>
          .
        </p>

        <div className="mt-10">
          {NIGHT_WALK_LIVE ? (
            <Link
              to="/checkout?tourType=1"
              className="inline-flex rounded-full bg-emerald-600 px-7 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Book the night walk — ${NIGHT.price}
            </Link>
          ) : (
            <p className="inline-flex rounded-full bg-amber-100 px-6 py-3 text-sm font-bold text-amber-800">
              Coming soon — message us on WhatsApp to be the first to join
            </p>
          )}
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
