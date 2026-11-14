import { Link } from "react-router-dom";
import { FiClock, FiDollarSign, FiMapPin, FiUsers, FiSun, FiCheck } from "react-icons/fi";
import { FAQS } from "../../sections/FAQSection";
import { PATHS, SITE_URL, absUrl, PAGES, NIGHT_WALK_LIVE } from "../../seo/seoData";

// Contenido de la página de la cabalgata pensado para quien busca
// "horseback riding La Fortuna" / "Arenal horseback riding". Todos los datos
// salen de la operación real (horarios, precios, recorrido, qué incluye).

const FACTS = [
  { icon: FiClock, label: "Duration", value: "About 2 hours, at a relaxed pace" },
  { icon: FiSun, label: "Departures", value: "Daily at 8:00 am, 12:00 pm and 3:00 pm" },
  { icon: FiDollarSign, label: "Price", value: "Adults (13+) $50 · Kids 4–12 $35 · Under 4 free with an adult" },
  { icon: FiUsers, label: "Level", value: "Beginners, families and kids welcome — no experience needed" },
  { icon: FiMapPin, label: "Location", value: "A few minutes from downtown La Fortuna, Route 702 toward Chachagua" },
];

const STEPS = [
  {
    title: "Welcome and local refreshments",
    text: "Before the ride we offer a light snack with fresh tropical fruit or local treats, plus natural juices or local liqueurs to taste, depending on availability.",
  },
  {
    title: "Meet your horse and a quick briefing",
    text: "Your guide explains how to handle the horse — it is simple and easy to learn — and helps everyone get comfortable before setting off.",
  },
  {
    title: "Forest trails and local farms",
    text: "The route combines wide gravel paths with narrower trails through the forest and passes local farms, where you may spot wildlife and see rural Costa Rica up close.",
  },
  {
    title: "Rivers and river crossings",
    text: "We stop to enjoy the scenery and relax by the rivers. When conditions allow, the tour includes river crossings on horseback — one of our guests' favorite moments.",
  },
  {
    title: "Back at the farm",
    text: "You set the pace: the ride lasts about two hours, a little longer if you take more breaks and photo stops along the way.",
  },
];

function JsonLd() {
  const page = PAGES.horseback;
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "TouristTrip",
      name: "Horseback Riding Tour in La Fortuna with River Crossings",
      description: page.description,
      url: absUrl(page.path),
      image: `${SITE_URL}${page.image}`,
      touristType: ["Families", "Beginners", "Nature lovers"],
      provider: { "@type": "LocalBusiness", name: "Nature Tours La Fortuna", url: `${SITE_URL}/` },
      offers: [
        { "@type": "Offer", name: "Adult (13+)", price: "50", priceCurrency: "USD", url: absUrl(page.path), availability: "https://schema.org/InStock" },
        { "@type": "Offer", name: "Child (4–12)", price: "35", priceCurrency: "USD", url: absUrl(page.path), availability: "https://schema.org/InStock" },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "La Fortuna Tours", item: absUrl(PATHS.tours) },
        { "@type": "ListItem", position: 3, name: "Horseback Riding in La Fortuna", item: absUrl(page.path) },
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

export default function HorsebackGuide() {
  return (
    <section className="w-full">
      <JsonLd />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Intro */}
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">
          Horseback riding near Arenal Volcano
        </p>
        <h2 className="mt-1 text-3xl font-extrabold text-gray-900 sm:text-4xl">
          A relaxed horseback ride through La Fortuna's forests and rivers
        </h2>
        <div className="mt-4 max-w-3xl space-y-4 text-lg leading-relaxed text-gray-600">
          <p>
            Our horseback riding tour in La Fortuna is a two-hour ride run by a local family,
            just a few minutes from downtown and close to Arenal Volcano. You ride calm,
            well-trained horses along forest trails and local farms, stop by the rivers and,
            when conditions allow, cross them on horseback.
          </p>
          <p>
            It is designed for everyone: first-time riders, families with kids and
            experienced riders who want a quieter, more authentic experience with a local
            family. Guests choose where to stop, so the ride is as calm or as
            adventurous as you like.
          </p>
        </div>

        {/* At a glance */}
        <h2 className="mt-10 text-2xl font-extrabold text-gray-900 sm:text-3xl">The tour at a glance</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

        {/* Step by step */}
        <h2 className="mt-12 text-2xl font-extrabold text-gray-900 sm:text-3xl">What to expect, step by step</h2>
        <ol className="mt-5 space-y-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                {i + 1}
              </span>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{s.title}</h3>
                <p className="mt-1 leading-relaxed text-gray-600">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* Routes */}
        <h2 className="mt-12 text-2xl font-extrabold text-gray-900 sm:text-3xl">Choose your style of ride</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 p-6">
            <h3 className="text-xl font-extrabold text-gray-900">Relaxed route</h3>
            <p className="mt-2 leading-relaxed text-gray-600">
              Wide, easy trails at a calm pace — ideal for beginners, kids and anyone who wants
              to enjoy the landscape, the rivers and the photos without rushing.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 p-6">
            <h3 className="text-xl font-extrabold text-gray-900">A bit more adventure</h3>
            <p className="mt-2 leading-relaxed text-gray-600">
              Narrower forest trails with some muddy sections and, when the weather allows,
              extra trails and river crossings. Your guide recommends the best option for the
              day's conditions.
            </p>
          </div>
        </div>

        {/* Comparison */}
        <h2 className="mt-12 text-2xl font-extrabold text-gray-900 sm:text-3xl">
          River crossing ride or waterfall ride?
        </h2>
        <div className="mt-4 max-w-3xl space-y-4 text-lg leading-relaxed text-gray-600">
          <p>
            Many horseback tours in La Fortuna ride to the La Fortuna Waterfall; those are
            usually longer half-day trips. Our ride is different: about two hours on our own
            trails, with river stops and crossings, local farms and forest — no long transfer
            and no rush.
          </p>
          <p>
            It fits easily into a day with other activities in Arenal: ride in the morning and
            visit the waterfall, the hot springs or the hanging bridges in the afternoon.
            {NIGHT_WALK_LIVE && (
              <>
                {" "}Want something different at night? Try our{" "}
                <Link to={PATHS.nightWalk} className="font-semibold text-emerald-700 underline underline-offset-2">
                  night walk in La Fortuna
                </Link>
                .
              </>
            )}
          </p>
        </div>

        {/* Kids */}
        <h2 className="mt-12 text-2xl font-extrabold text-gray-900 sm:text-3xl">
          Horseback riding with kids and beginners
        </h2>
        <ul className="mt-4 max-w-3xl space-y-2 text-lg text-gray-600">
          {[
            "No previous riding experience needed — the guide teaches you before starting.",
            "Children from 4 to 12 ride their own horse for $35; babies under 4 ride with an adult for free.",
            "We recommend age 12 for kids to ride fully on their own; parents always decide.",
            "Calm, gentle horses and mostly easy trails, with a guide with you at all times.",
            "The tour runs in light rain too — riding through the forest in the rain is a special experience.",
          ].map((t) => (
            <li key={t} className="flex gap-3">
              <FiCheck className="mt-1.5 h-5 w-5 shrink-0 text-emerald-600" />
              <span>{t}</span>
            </li>
          ))}
        </ul>

        {/* How to get here */}
        <h2 className="mt-12 text-2xl font-extrabold text-gray-900 sm:text-3xl">How to get here</h2>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-gray-600">
          We are a few minutes from downtown La Fortuna, San Carlos. From the central park, take
          Route 702 south toward Chachagua and look for the Nature Tours La Fortuna sign.
          Directions and a map are on our{" "}
          <Link to={PATHS.contact} className="font-semibold text-emerald-700 underline underline-offset-2">
            contact page
          </Link>
          .
        </p>

        {/* FAQ */}
        <h2 className="mt-12 text-2xl font-extrabold text-gray-900 sm:text-3xl">
          Horseback riding in La Fortuna — FAQ
        </h2>
        <div className="mt-4 divide-y divide-gray-200 rounded-2xl border border-gray-200">
          {FAQS.map((f) => (
            <details key={f.question} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-gray-900">
                <h3 className="text-base">{f.question}</h3>
                <span className="text-emerald-600 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 leading-relaxed text-gray-600">{f.answer}</p>
            </details>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            to="/checkout?tourType=2"
            className="rounded-full bg-emerald-600 px-7 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Book your horseback ride — from $50
          </Link>
          <Link to={PATHS.about} className="text-sm font-semibold text-emerald-700 underline underline-offset-2">
            Meet our family and horses
          </Link>
        </div>
      </div>
    </section>
  );
}
