// components/tour/TourCard.jsx
import {
  HiCheckCircle,
  HiOutlineClock,
  HiOutlineUsers,
  HiOutlineMapPin,
  HiArrowRight,
} from "react-icons/hi2";

export default function TourCard({
  imageSrc,
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
    <article className="w-full overflow-hidden rounded-3xl bg-white shadow-[0_12px_40px_rgba(0,0,0,0.10)] ring-1 ring-black/5 hover:scale-101 transition-transform transition-duration-300">
      <div
        className={`grid items-stretch grid-cols-1 ${
          reverse ? "md:grid-cols-[1fr_420px]" : "md:grid-cols-[420px_1fr]"
        } md:min-h-[420px]`}
      >
        {/* IMAGE */}
        <div
          className={`relative h-full ${reverse ? "md:order-2" : "md:order-1"}`}
        >
          <img
            src={imageSrc}
            alt={imageAlt}
            className="h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/15 to-transparent md:hidden" />
        </div>

        {/* CONTENT */}
        <div
          className={`flex h-full flex-col justify-between gap-6 p-6 md:p-8 ${
            reverse ? "md:order-1" : "md:order-2"
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

          {/* STATS */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat
              icon={HiOutlineClock}
              label="Duration"
              value={stats.duration}
            />
            <Stat icon={HiOutlineUsers} label="Group" value={stats.group} />
            <Stat
              icon={HiOutlineMapPin}
              label="Location"
              value={stats.location}
            />
          </div>

          {/* HIGHLIGHTS */}
          <ul className="space-y-2">
            {highlights.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-slate-600"
              >
                <HiCheckCircle className="mt-0.5 h-5 w-5 text-emerald-600" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-auto h-px w-full bg-slate-200" />

          {/* PRICE */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs text-slate-500">From</div>
              <div className="flex items-baseline gap-2">
                {oldPrice ? (
                  <span className="text-lg text-slate-400 line-through">
                    {currency}
                    {oldPrice}
                  </span>
                ) : null}

                <span className="text-3xl font-semibold text-emerald-600">
                  {currency}
                  {price}
                </span>
                <span className="text-sm text-slate-500">{per}</span>
              </div>
            </div>

            <button
              onClick={onReserve}
              className="inline-flex items-center gap-3 rounded-2xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-800 hover:scale-105 transition-duration-300"
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

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
      <div className="flex justify-center">
        <Icon className="h-6 w-6 text-emerald-700" />
      </div>
      <div className="mt-2 text-center text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-center text-sm font-semibold text-slate-900">
        {value}
      </div>
    </div>
  );
}
