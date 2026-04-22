import { useEffect } from "react";
import { FiInstagram, FiArrowRight } from "react-icons/fi";

const INSTAGRAM_HANDLE = "nature_tours_la_fortuna";
const INSTAGRAM_URL    = `https://www.instagram.com/${INSTAGRAM_HANDLE}/`;

const BEHOLD_WIDGET_ID = "NWyktedasPPj1n2HLcwE";

// Placeholder posts shown before Behold is configured
const PLACEHOLDER_IMAGES = [
  "/horses/caballo1.webp",
  "/horses/caballo3.webp",
  "/horses/caballo5.webp",
  "/horses/caballo7.webp",
  "/horses/caballo9.webp",
  "/horses/caballo11.webp",
];

function PlaceholderFeed() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
      {PLACEHOLDER_IMAGES.map((src, i) => (
        <a
          key={i}
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noreferrer"
          className="group relative aspect-square overflow-hidden rounded-2xl bg-gray-100"
        >
          <img
            src={src}
            alt={`Nature Tours La Fortuna Instagram post ${i + 1}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {/* hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/30">
            <FiInstagram className="h-8 w-8 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
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
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
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
        {BEHOLD_WIDGET_ID
          ? <BeholdFeed widgetId={BEHOLD_WIDGET_ID} />
          : <PlaceholderFeed />
        }

        {/* Footer note when using placeholder */}
        {!BEHOLD_WIDGET_ID && (
          <p className="mt-6 text-center text-xs text-gray-400">
            Preview using local photos — connect your Instagram at{" "}
            <a href="https://behold.so" target="_blank" rel="noreferrer" className="underline hover:text-gray-600">
              behold.so
            </a>{" "}
            to show your real feed.
          </p>
        )}
      </div>
    </section>
  );
}
