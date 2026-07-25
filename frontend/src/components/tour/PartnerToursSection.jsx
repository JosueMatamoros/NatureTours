// src/components/tour/PartnerToursSection.jsx
// Tours operados por nuestro socio. Cada tarjeta abre su portal de reservas
// con nuestro código de socio; no pasan por nuestro checkout.
import { useMemo, useState } from "react";
import { TbBus, TbArrowRight, TbClock, TbMoodKid } from "react-icons/tb";
import {
  PARTNER_TOURS,
  TOUR_GROUPS,
  PARTNER_CATEGORIES,
} from "../../data/partnerTours";

const CATEGORY_LABEL = Object.fromEntries(
  PARTNER_CATEGORIES.map((c) => [c.id, c.label]),
);

// "combo" filtra por el flag `combo`, no por `categories`.
function matchesFilter(tour, filter) {
  if (!filter) return true;
  if (filter === "combo") return Boolean(tour.combo);
  return tour.categories?.includes(filter);
}

function TourCard({ tour }) {
  const Icon = tour.icon;
  // Etiquetas de categoría: solo en combos, para mostrar todo lo que incluyen.
  const comboTags = tour.combo
    ? tour.categories?.map((c) => CATEGORY_LABEL[c]).filter(Boolean)
    : null;

  return (
    <a
      href={tour.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.12)] ring-1 ring-emerald-200 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_rgba(0,0,0,0.16)]"
    >
      {/* Cabecera: foto si existe, si no ícono sobre gradiente.
          El nombre va aquí encima para que la altura del título no desalinee
          el contenido de las tarjetas entre sí. */}
      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-emerald-700 to-emerald-900">
        {tour.image ? (
          <img
            src={tour.image}
            alt={tour.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center pb-10">
            <Icon className="h-14 w-14 text-white/90 transition duration-300 group-hover:scale-110" />
          </div>
        )}

        {/* Velo inferior para que el nombre se lea sobre cualquier foto */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {tour.combo && (
          <span className="absolute left-4 top-4 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-950 shadow-sm">
            Combo
          </span>
        )}

        <h3 className="absolute inset-x-0 bottom-0 p-5 text-lg font-bold leading-snug text-white drop-shadow-sm">
          {tour.name}
        </h3>
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col p-6">
        {/* Duración y edad (solo si el tour los tiene) */}
        {(tour.duration || tour.minAge) && (
          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
            {tour.duration && (
              <span className="inline-flex items-center gap-1.5">
                <TbClock className="h-4 w-4 text-emerald-600" />
                {tour.duration}
              </span>
            )}
            {tour.minAge && (
              <span className="inline-flex items-center gap-1.5">
                <TbMoodKid className="h-4 w-4 text-emerald-600" />
                {tour.minAge}
              </span>
            )}
          </div>
        )}

        {/* Un combo incluye varias categorías: se listan todas aquí */}
        {comboTags?.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {comboTags.map((label) => (
              <span
                key={label}
                className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200"
              >
                {label}
              </span>
            ))}
          </div>
        )}

        <p className="text-sm leading-relaxed text-slate-600">
          {tour.description}
        </p>

        {/* Precio y CTA — mt-auto los fija al fondo de la tarjeta */}
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-gray-100 pt-4">
          <div className="min-w-0">
            {tour.priceFrom ? (
              <>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                  From
                </p>
                <p className="text-xl font-black text-emerald-700">
                  ${tour.priceFrom.toFixed(2)}
                  <span className="ml-1 text-xs font-medium text-slate-500">
                    / person
                  </span>
                </p>
              </>
            ) : (
              <p className="text-sm font-semibold text-slate-500">
                See live pricing
              </p>
            )}
          </div>

          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-emerald-800">
            Book
            <TbArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </a>
  );
}

// Todos los tours en un solo arreglo plano (destacados + grupos + sub-bloques).
const ALL_TOURS = [
  ...PARTNER_TOURS,
  ...TOUR_GROUPS.flatMap((g) => [
    ...g.tours,
    ...(g.sections?.flatMap((s) => s.tours) ?? []),
  ]),
];

export default function PartnerToursSection() {
  const [filter, setFilter] = useState(null);

  // Sin filtro ("All tours"): vista agrupada con títulos y subtítulos.
  const featured = useMemo(
    () => (filter ? [] : PARTNER_TOURS),
    [filter],
  );
  const groups = useMemo(
    () => (filter ? [] : TOUR_GROUPS),
    [filter],
  );

  // Con un filtro activo: una sola cuadrícula plana, sin agrupar por texto,
  // ordenada por precio (los sin precio conocido van al final).
  const flatResults = useMemo(() => {
    if (!filter) return [];
    return ALL_TOURS.filter((t) => matchesFilter(t, filter)).sort(
      (a, b) => (a.priceFrom ?? Infinity) - (b.priceFrom ?? Infinity),
    );
  }, [filter]);

  const noResults = filter
    ? flatResults.length === 0
    : featured.length === 0 && groups.length === 0;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16">
      <header className="mb-8 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-[#2B241D] sm:text-4xl lg:text-5xl">
          Tours by our partners
        </h2>

        <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-emerald-900/70 sm:text-lg">
          Beyond our own horseback riding tour, we work with trusted local
          operators so you can plan your whole Arenal adventure with us. Ask us
          about any of these experiences and we&apos;ll help you arrange it.
        </p>

        <div className="mx-auto mt-6 h-1 w-20 rounded-full bg-emerald-900/20" />
      </header>

      {/* Transporte incluido */}
      <div className="mx-auto mb-10 flex max-w-2xl items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
          <TbBus className="h-6 w-6" />
        </div>
        <p className="text-sm leading-relaxed text-emerald-900 sm:text-base">
          <span className="font-bold">Transportation included.</span> Every
          partner tour includes round-trip transportation from La Fortuna — no
          need to rent a car or arrange a ride.
        </p>
      </div>

      {/* Filtros por categoría */}
      <div className="mb-10 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => setFilter(null)}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            filter === null
              ? "bg-emerald-700 text-white shadow-sm"
              : "bg-white text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-50"
          }`}
        >
          All tours
        </button>
        {PARTNER_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setFilter((f) => (f === cat.id ? null : cat.id))}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              filter === cat.id
                ? "bg-emerald-700 text-white shadow-sm"
                : "bg-white text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-50"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {noResults && (
        <p className="py-10 text-center text-sm text-slate-400">
          No tours match this filter yet.
        </p>
      )}

      {/* Con un filtro activo: todo en una sola cuadrícula, sin agrupar */}
      {filter && flatResults.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {flatResults.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      )}

      {featured.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      )}

      {/* Grupos temáticos (solo en "All tours") */}
      {groups.map((group) => (
        <div key={group.id} className="mt-14">
          <div className="mb-6">
            <h3 className="text-2xl font-bold tracking-tight text-[#2B241D] sm:text-3xl">
              {group.title}
            </h3>
            <p className="mt-1.5 text-sm text-emerald-900/60 sm:text-base">
              {group.subtitle}
            </p>
          </div>

          {group.tours.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {group.tours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          )}

          {/* Bloques dentro del mismo grupo, separados por su etiqueta */}
          {group.sections?.map((section) => (
            <div key={section.label} className="mt-10">
              <div className="mb-5 flex items-center gap-3">
                <h4 className="shrink-0 text-base font-bold text-emerald-800 sm:text-lg">
                  {section.label}
                </h4>
                <span className="h-px flex-1 bg-emerald-900/10" />
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {section.tours.map((tour) => (
                  <TourCard key={tour.id} tour={tour} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}
