import { useEffect, useState } from "react";
import { FiInstagram, FiArrowRight } from "react-icons/fi";

const INSTAGRAM_HANDLE = "nature_tours_la_fortuna";
const INSTAGRAM_URL    = `https://www.instagram.com/${INSTAGRAM_HANDLE}/`;

const BEHOLD_WIDGET_ID = "NWyktedasPPj1n2HLcwE";

const STATIC_POSTS = [
  { src: "/instagram/post1.webp", alt: "Nature Tours La Fortuna adventure 1" },
  { src: "/instagram/post2.webp", alt: "Nature Tours La Fortuna adventure 2" },
  { src: "/instagram/post3.webp", alt: "Nature Tours La Fortuna adventure 3" },
];

function StaticInstagramGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {STATIC_POSTS.map((post, i) => (
        <a
          key={i}
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noreferrer"
          className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100 block"
        >
          <img
            src={post.src}
            alt={post.alt}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/40">
            <FiInstagram className="h-9 w-9 text-white opacity-0 drop-shadow transition-opacity duration-300 group-hover:opacity-100" />
          </div>
        </a>
      ))}
    </div>
  );
}

function BeholdFeed({ widgetId }) {
  useEffect(() => {
    if (!widgetId) return;
    if (document.querySelector('script[src="https://w.behold.so/widget.js"]')) return;
    const script = document.createElement("script");
    script.type = "module";
    script.src  = "https://w.behold.so/widget.js";
    document.head.appendChild(script);
  }, [widgetId]);

  return (
    <>
      <style>{`
        @media (max-width: 639px) {
          behold-widget,
          [data-behold-id] {
            --columns: 2 !important;
          }
          behold-widget .grid,
          behold-widget [style*="grid-template-columns"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
      <div data-behold-id={widgetId} className="w-full" />
    </>
  );
}

export default function InstagramSection() {
  // null = checking, true = reachable, false = 403/error
  const [beholdOk, setBeholdOk] = useState(null);

  useEffect(() => {
    if (!BEHOLD_WIDGET_ID) {
      setBeholdOk(false);
      return;
    }
    fetch(`https://feeds.behold.so/${BEHOLD_WIDGET_ID}`)
      .then((res) => setBeholdOk(res.ok))
      .catch(() => setBeholdOk(false));
  }, []);

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

        {/* Header — always visible */}
        <div className="mb-10 flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-gray-400 uppercase tracking-widest">
              <FiInstagram className="h-4 w-4" />
              Instagram
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Follow our adventures
            </h2>
            <p className="mt-2 text-gray-500">
              @{INSTAGRAM_HANDLE}
            </p>
          </div>

          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:scale-105"
          >
            <FiInstagram className="h-4 w-4" />
            Follow us
            <FiArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Feed */}
        {beholdOk === true && <BeholdFeed widgetId={BEHOLD_WIDGET_ID} />}
        {beholdOk === false && <StaticInstagramGrid />}
      </div>
    </section>
  );
}
