// components/tour/TourCard.jsx
import {
  HiCheckCircle,
  HiOutlineClock,
  HiOutlineUsers,
  HiOutlineMapPin,
  HiArrowRight,
} from "react-icons/hi2";

export default function TourCard({
  imageSrcMobile,
  imageSrcDesktop,
  imageAlt,
  title,
  description,
  stats,
  highlights,
  price,
  oldPrice,
  currency,
  per,
  onReserve,
  reverse = false,
}) {
  return (
    <article className="w-full overflow-hidden rounded-3xl bg-white shadow-[0_12px_40px_rgba(0,0,0,0.10)] ring-1 ring-black/5 transition-transform duration-300 hover:scale-101">
      <div
        className={`grid items-stretch grid-cols-1 ${
          // ✅ Cambié md -> lg (side-by-side empieza más tarde)
          reverse ? "lg:grid-cols-[1fr_420px]" : "lg:grid-cols-[420px_1fr]"
        } lg:min-h-[420px]`}
      >
        {/* IMAGE */}
        <div
          className={`relative ${reverse ? "lg:order-2" : "lg:order-1"}
          h-64 sm:h-72 md:h-80 lg:h-full`}
        >
          <picture>

            <source media="(min-width: 1024px)" srcSet={imageSrcDesktop} />

            <img
              src={imageSrcMobile}
              alt={imageAlt}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </picture>


          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/15 to-transparent lg:hidden" />
        </div>

        {/* CONTENT */}
        <div
          className={`flex h-full flex-col justify-between gap-6 p-6 lg:p-8 ${
            reverse ? "lg:order-1" : "lg:order-2"
          }`}
        >
          <div>
            <h3 className="text-3xl font-semibold tracking-tight text-emerald-700">
              {title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {description}
            </p>
          </div>

          {/* STATS (estilo EXACTO screenshot + responsive) */}
          <div className="flex gap-2">
            <Stat icon={HiOutlineClock} label="Duration" value={stats.duration} />
            <Stat icon={HiOutlineUsers} label="Group" value={stats.group} />
            <Stat
              icon={HiOutlineMapPin}
              label="Location"
              value={stats.location}
              allowWrap
            />
          </div>

          {/* HIGHLIGHTS (icono centrado con texto) */}
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {highlights.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-100">
                  <HiCheckCircle className="h-4.5 w-4.5 text-emerald-700" />
                </span>
                <span className="leading-5">{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-auto h-px w-full bg-slate-200" />

          {/* PRICE */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs text-slate-500">From</div>
              <div className="flex items-baseline gap-2">
                {oldPrice && (
                  <span className="text-lg text-slate-400 line-through">
                    {currency}
                    {oldPrice}
                  </span>
                )}

                <span className="text-3xl font-semibold text-emerald-600">
                  {currency}
                  {price}
                </span>
                <span className="text-sm text-slate-500">{per}</span>
              </div>
            </div>

            <button
              onClick={onReserve}
              className="inline-flex items-center gap-3 rounded-2xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 hover:bg-emerald-800"
            >
              Book Now
              <HiArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function Stat({ icon: Icon, label, value, allowWrap = false }) {
  const { first, rest, hasSplit } = splitValue(value);

  return (
    <div className="flex-1 min-w-0 rounded-[28px] bg-[#F5F5F0] p-2 lg:p-4 text-center">
      <div className="flex justify-center">
        <Icon className="h-7 w-7 text-emerald-700" />
      </div>

      <div className="mt-3 text-[15px] text-slate-500">{label}</div>

      {hasSplit ? (
        <div className="mt-2 font-semibold text-slate-900">
          <div className="flex flex-col items-center sm:hidden">
            <span className="text-md">{first}</span>
            <span className="text-md">{rest}</span>
          </div>

          <div className="hidden sm:block text-md">
            {first} {rest}
          </div>
        </div>
      ) : (
        <div
          className={[
            "mt-2 font-semibold text-slate-900 text-md",
            allowWrap
              ? "whitespace-normal leading-snug break-words line-clamp-2 [text-wrap:balance]"
              : "truncate",
          ].join(" ")}
          title={typeof value === "string" ? value : undefined}
        >
          {value}
        </div>
      )}
    </div>
  );
}


function splitValue(value) {
  const v = String(value ?? "").trim();
  if (!v) return { first: "", rest: "", hasSplit: false };

  const idx = v.indexOf(" ");
  if (idx === -1) {
    return { first: v, rest: "", hasSplit: false };
  }

  return {
    first: v.slice(0, idx),
    rest: v.slice(idx + 1),
    hasSplit: true,
  };
}
