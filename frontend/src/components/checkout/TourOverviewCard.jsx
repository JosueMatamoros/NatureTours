import {
  FiClock,
  FiInfo,
  FiMap,
  FiCheckCircle,
  FiChevronDown,
} from "react-icons/fi";
import TourImageCarousel from "./TourImageCarousel";
import { useEffect, useState } from "react";

export default function TourOverviewCard({ tour }) {
  return (
    <section className="space-y-4 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">{tour.name}</h1>
        <span className="flex items-center gap-1 text-sm text-gray-500 mt-1 md:mt-0 md:ml-4">
          <FiClock className="h-4 w-4" />
          {tour.duration}
        </span>
      </div>

      {/* Image carousel */}
      <TourImageCarousel images={tour.images} />

      {/* Cards */}
      <div className="space-y-4">
        <AccordionCard title="About the Tour" icon={FiInfo}>
          <div className="space-y-4 text-sm leading-relaxed text-gray-700">
            {tour.about.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>
        </AccordionCard>

        <AccordionCard
          title="Routes and Experience"
          icon={FiMap}
          footer={
            <div className="flex flex-wrap gap-2 pt-2">
              {tour.highlights.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100"
                >
                  {tag}
                </span>
              ))}
            </div>
          }
        >
          <div className="space-y-4 text-sm leading-relaxed text-gray-700">
            {tour.routes.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>
        </AccordionCard>

        <AccordionCard title="Recommendations" icon={FiCheckCircle}>
          <ul className="grid gap-3 sm:grid-cols-2">
            {tour.recommendations.map((rec) => {
              const Icon = rec.icon;
              return (
                <li
                  key={rec.title}
                  className="flex gap-3 rounded-xl border border-gray-100 bg-white p-3"
                >
                  <span
                    className="
            shrink-0
            grid h-10 w-10 place-items-center
            rounded-xl bg-emerald-50 text-emerald-700
            ring-1 ring-emerald-100
          "
                  >
                    <Icon className="h-5 w-5" />
                  </span>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {rec.title}
                    </p>
                    <p className="text-sm text-gray-600">{rec.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </AccordionCard>
      </div>
    </section>
  );
}

function AccordionCard({ title, icon: Icon, children, footer }) {
  const [isLgUp, setIsLgUp] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // lg en Tailwind = min-width: 1024px
    const mq = window.matchMedia("(min-width: 1024px)");

    const apply = () => {
      const lg = mq.matches;
      setIsLgUp(lg);
      setOpen(lg); // lg: abierto, <lg: cerrado
    };

    apply();

    // Soporte moderno + fallback
    if (mq.addEventListener) mq.addEventListener("change", apply);
    else mq.addListener(apply);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", apply);
      else mq.removeListener(apply);
    };
  }, []);

  const isAccordion = !isLgUp; // md y abajo se comporta como acordeón
  const toggle = () => {
    if (isAccordion) setOpen((v) => !v);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header clickable en md y abajo */}
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center gap-3 border-b border-gray-100 px-5 py-4 text-left"
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
          <Icon className="h-5 w-5" />
        </span>

        <h2 className="flex-1 text-base font-semibold text-gray-900">
          {title}
        </h2>

        {/* Flecha solo en md y abajo */}
        <span className="lg:hidden">
          <FiChevronDown
            className={`h-5 w-5 text-gray-500 transition-transform ${
              open ? "rotate-180" : "rotate-0"
            }`}
          />
        </span>
      </button>

      {/* Body: en lg siempre visible; en <lg colapsable */}
      <div
        className={[
          "px-5",
          "lg:py-4", // en lg siempre con padding vertical
          isAccordion
            ? "grid transition-[grid-template-rows] duration-200 ease-out"
            : "",
          isAccordion ? (open ? "grid-rows-[1fr]" : "grid-rows-[0fr]") : "",
        ].join(" ")}
      >
        <div className={isAccordion ? "overflow-hidden" : ""}>
          {/* En <lg damos padding adentro solo cuando está abierto */}
          <div className={isAccordion ? (open ? "py-4" : "py-0") : ""}>
            {children}
            {footer ? <div className="mt-4">{footer}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
