import React, { useMemo, useState } from "react";
import {
  HiOutlineLocationMarker,
  HiOutlineUsers,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineExternalLink,
} from "react-icons/hi";

export default function StayCarouselCard({
  title,
  subtitle,
  locationLabel,
  capacity,
  highlight,
  airbnbUrl,
  images = [],
  amenities = [],
}) {
  const safeImages = useMemo(() => (images?.length ? images : [""]), [images]);
  const [index, setIndex] = useState(0);

  const prev = () =>
    setIndex((i) => (i - 1 + safeImages.length) % safeImages.length);
  const next = () => setIndex((i) => (i + 1) % safeImages.length);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-[0_18px_60px_-35px_rgba(0,0,0,0.35)] ring-1 ring-black/5">
      {/* Media */}
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <img
          src={safeImages[index]}
          alt={title}
          className="h-full w-full object-cover"
        />

        {/* Highlight chip */}
        {highlight && (
          <span className="absolute right-4 top-4 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-[#2B241D] shadow-sm ring-1 ring-black/5 backdrop-blur">
            {highlight}
          </span>
        )}

        {/* Bottom overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent px-4 pb-3 pt-10">
          <div className="flex justify-between text-sm font-medium text-white">
            <div className="flex items-center gap-2">
              <HiOutlineLocationMarker className="h-5 w-5" />
              {locationLabel}
            </div>
            <div className="flex items-center gap-2">
              <HiOutlineUsers className="h-5 w-5" />
              {capacity}
            </div>
          </div>
        </div>

        {/* Controls */}
        {safeImages.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 shadow ring-1 ring-black/5"
            >
              <HiOutlineChevronLeft />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 shadow ring-1 ring-black/5"
            >
              <HiOutlineChevronRight />
            </button>
          </>
        )}
      </div>

      {/* CONTENT (flex-1) */}
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <div className="flex-1">
          <h3 className="text-2xl font-extrabold tracking-tight text-[#2B241D]">
            {title}
          </h3>

          <p className="mt-2 text-sm leading-relaxed text-[#2B241D]/70 sm:text-base">
            {subtitle}
          </p>
        </div>

        {/* FOOTER (always bottom) */}
        <div className="pt-5">
          {/* Amenities */}
          {amenities?.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {amenities.map((a, i) => (
                <span
                  key={i}
                  className="rounded-full bg-[#F3EEE7] px-4 py-2 text-sm font-medium text-[#2B241D]/75 ring-1 ring-black/5"
                >
                  {a.label}
                </span>
              ))}
            </div>
          )}

          {/* Airbnb button */}
          <a
            href={airbnbUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-900 px-6 py-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            <HiOutlineExternalLink className="h-5 w-5" />
            Ver en Airbnb
          </a>
        </div>
      </div>
    </article>
  );
}
