import { Link } from "react-router-dom";
import { FiClock, FiDollarSign, FiMapPin, FiUsers, FiSun, FiCheck, FiArrowRight } from "react-icons/fi";
import { FAQS } from "../../sections/FAQSection";
import { PATHS, SITE_URL, absUrl, PAGES, NIGHT_WALK_LIVE } from "../../seo/seoData";

// Contenido de la página de la cabalgata, en secciones para intercalarlas con
// fotos (patrón "storytelling": intro → capítulos del recorrido → detalles →
// visita). Datos reales de la operación (horarios, precios, recorrido).

const BOOK_URL = "/checkout?tourType=2";

const eyebrow = "text-sm font-semibold uppercase tracking-widest text-emerald-600";
const h2 = "mt-1 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl";
const body = "text-lg leading-relaxed text-gray-600";
const section = "mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8";

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
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

// ── 1. Intro + datos clave ─────────────────────────────────────────────────
const FACTS = [
  { icon: FiClock, label: "Duration", value: "About 2 hours" },
  { icon: FiSun, label: "Departures", value: "8:00 am · 12:00 pm · 3:00 pm" },
  { icon: FiDollarSign, label: "Price", value: "Adults $50 · Kids $35" },
  { icon: FiUsers, label: "Level", value: "Beginners & kids welcome" },
];

export function HorsebackIntro() {
  return (
    <section className={section}>
      <JsonLd />
      <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-center">
        <div>
          <p className={eyebrow}>Horseback riding near Arenal Volcano</p>
          <h2 className={h2}>A relaxed ride through La Fortuna's forests and rivers</h2>
          <div className={`mt-5 space-y-4 ${body}`}>
            <p>
              Our horseback riding tour in La Fortuna is a two-hour ride run by a local family,
              just a few minutes from downtown and close to Arenal Volcano. You ride calm,
              well-trained horses along forest trails and local farms, stop by the rivers and,
              when conditions allow, cross them on horseback.
            </p>
            <p>
              It's made for everyone — first-time riders, families with kids and experienced
              riders who want a quieter, more authentic experience. You choose where to stop,
              so the ride is as calm or as adventurous as you like.
            </p>
          </div>
        </div>

        <div className="rounded-3xl bg-emerald-50 p-5 sm:p-6 ring-1 ring-emerald-100">
          <p className="text-sm font-bold uppercase tracking-wider text-emerald-800">The tour at a glance</p>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            {FACTS.map((f) => {
              const Ico = { C: f.icon };
              return (
                <div key={f.label} className="rounded-2xl bg-white p-4 shadow-sm">
                  <Ico.C className="h-5 w-5 text-emerald-600" aria-hidden />
                  <dt className="mt-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{f.label}</dt>
                  <dd className="mt-0.5 font-bold leading-snug text-gray-900">{f.value}</dd>
                </div>
              );
            })}
          </dl>
          <p className="mt-4 flex items-start gap-2 text-sm text-emerald-900">
            <FiMapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            A few minutes from downtown La Fortuna, on Route 702 toward Chachagua. Under 4 ride free with an adult.
          </p>
          <Link
            to={BOOK_URL}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Check availability <FiArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── 2. Capítulos del recorrido (zigzag foto / texto) ─────────────────────────
const CHAPTERS = [
  {
    img: "/tours/story/meet-your-horse.webp",
    alt: "Child feeding a horse before a horseback riding tour in La Fortuna",
    kicker: "Steps 1–2",
    title: "Arrive, taste local flavors and meet your horse",
    text: [
      "Before the ride we offer a light snack with fresh tropical fruit or local treats, plus natural juices or local liqueurs to taste, depending on availability.",
      "Your guide explains how to handle the horse — it's simple and easy to learn — and helps everyone get comfortable before setting off.",
    ],
  },
  {
    img: "/tours/story/forest-trail.webp",
    alt: "Riders on a forest trail during a horseback riding tour near Arenal Volcano",
    kicker: "Step 3",
    title: "Forest trails and local farms",
    text: [
      "The route combines wide gravel paths with narrower trails through the forest and passes local farms, where you may spot wildlife and see rural Costa Rica up close.",
    ],
  },
  {
    img: "/tours/story/river-crossing.webp",
    alt: "Couple crossing a river on horseback in La Fortuna, Costa Rica",
    kicker: "Steps 4–5",
    title: "Rivers and river crossings",
    text: [
      "We stop to enjoy the scenery and relax by the rivers. When conditions allow, the tour includes river crossings on horseback — one of our guests' favorite moments.",
      "You set the pace: the ride lasts about two hours, a little longer if you take more breaks and photo stops along the way.",
    ],
  },
];

export function HorsebackStory() {
  return (
    <section className="bg-stone-50">
      <div className={section}>
        <div className="max-w-2xl">
          <p className={eyebrow}>Your ride, step by step</p>
          <h2 className={h2}>What to expect on the tour</h2>
        </div>

        <div className="mt-10 space-y-12 sm:space-y-16">
          {CHAPTERS.map((c, i) => (
            <article key={c.title} className="grid items-center gap-6 md:grid-cols-2 md:gap-12">
              <div className={i % 2 === 1 ? "md:order-2" : ""}>
                <img
                  src={c.img}
                  alt={c.alt}
                  width="750"
                  height="1000"
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full rounded-3xl object-cover shadow-[0_20px_50px_rgba(0,0,0,0.12)] md:aspect-[4/5]"
                />
              </div>
              <div>
                <p className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
                  {c.kicker}
                </p>
                <h3 className="mt-3 text-2xl font-extrabold text-gray-900 sm:text-3xl">{c.title}</h3>
                <div className={`mt-3 space-y-3 ${body}`}>
                  {c.text.map((t) => <p key={t}>{t}</p>)}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── 3. Estilos de ruta + comparación con la catarata ────────────────────────
export function HorsebackRoutes() {
  return (
    <section className={section}>
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <p className={eyebrow}>Choose your style</p>
          <h2 className={h2}>Relaxed ride or a bit more adventure</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 p-5">
              <h3 className="text-lg font-extrabold text-gray-900">Relaxed route</h3>
              <p className="mt-2 leading-relaxed text-gray-600">
                Wide, easy trails at a calm pace — ideal for beginners, kids and anyone who wants
                to enjoy the rivers and the photos without rushing.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 p-5">
              <h3 className="text-lg font-extrabold text-gray-900">More adventure</h3>
              <p className="mt-2 leading-relaxed text-gray-600">
                Narrower forest trails with some muddy sections and, when the weather allows,
                extra trails and river crossings.
              </p>
            </div>
          </div>

          <h3 className="mt-10 text-2xl font-extrabold text-gray-900">River crossing ride or waterfall ride?</h3>
          <div className={`mt-3 space-y-3 ${body}`}>
            <p>
              Many horseback tours in La Fortuna ride to the La Fortuna Waterfall; those are usually
              longer half-day trips. Ours is about two hours on our own trails, with river stops and
              crossings, local farms and forest — no long transfer and no rush.
            </p>
            <p>
              It fits easily into a day in Arenal: ride in the morning and visit the waterfall, the
              hot springs or the hanging bridges in the afternoon.
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
        </div>
        <img
          src="/tours/story/river-ride.webp"
          alt="Rider crossing a river on horseback in La Fortuna, Costa Rica"
          width="1200"
          height="800"
          loading="lazy"
          decoding="async"
          className="aspect-[4/3] w-full rounded-3xl object-cover shadow-[0_20px_50px_rgba(0,0,0,0.12)]"
        />
      </div>
    </section>
  );
}

// ── 4. Niños y principiantes ─────────────────────────────────────────────────
export function HorsebackKids() {
  return (
    <section className="bg-emerald-50/60">
      <div className={section}>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <img
            src="/tours/story/kids-ride.webp"
            alt="Kids riding horses on a family horseback riding tour in La Fortuna"
            width="1200"
            height="800"
            loading="lazy"
            decoding="async"
            className="order-2 aspect-[4/3] w-full rounded-3xl object-cover shadow-[0_20px_50px_rgba(0,0,0,0.12)] lg:order-1"
          />
          <div className="order-1 lg:order-2">
            <p className={eyebrow}>Families welcome</p>
            <h2 className={h2}>Horseback riding with kids and beginners</h2>
            <ul className="mt-6 space-y-3 text-lg text-gray-700">
              {[
                "No previous riding experience needed — the guide teaches you before starting.",
                "Kids 4–12 ride their own horse for $35; babies under 4 ride with an adult for free.",
                "We recommend age 12 for kids to ride fully on their own; parents always decide.",
                "Calm, gentle horses and mostly easy trails, with a guide with you at all times.",
                "The tour runs in light rain too — riding the forest in the rain is a special experience.",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <FiCheck className="mt-1.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 5. Cómo llegar + FAQ + reserva ───────────────────────────────────────────
export function HorsebackVisit() {
  return (
    <section className={section}>
      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <p className={eyebrow}>Plan your visit</p>
          <h2 className={h2}>How to get here</h2>
          <p className={`mt-4 ${body}`}>
            We are a few minutes from downtown La Fortuna, San Carlos. From the central park, take
            Route 702 south toward Chachagua and look for the Nature Tours La Fortuna sign.
          </p>
          <Link to={PATHS.contact} className="mt-4 inline-flex items-center gap-2 font-semibold text-emerald-700 hover:text-emerald-800">
            Directions and map <FiArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Horseback riding in La Fortuna — FAQ</h2>
          <div className="mt-4 divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
            {FAQS.map((f) => (
              <details key={f.question} className="group px-5 py-4">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-semibold text-gray-900">
                  <h3 className="text-base">{f.question}</h3>
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-600 text-white transition-transform group-open:rotate-45" aria-hidden>+</span>
                </summary>
                <p className="mt-3 leading-relaxed text-gray-600">{f.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* Reserva final */}
      <div className="mt-14 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 to-emerald-900 p-8 text-center text-white sm:p-12">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Ready to ride in La Fortuna?</h2>
        <p className="mx-auto mt-3 max-w-xl text-emerald-100">
          Adults $50 · Kids $35 · Under 4 free. Departures at 8:00 am, 12:00 pm and 3:00 pm.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to={BOOK_URL} className="rounded-full bg-white px-7 py-3 text-sm font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-50">
            Book your ride
          </Link>
          <Link to={PATHS.about} className="rounded-full px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/40 transition hover:bg-white/10">
            Meet our family &amp; horses
          </Link>
        </div>
      </div>
    </section>
  );
}

export default HorsebackIntro;
