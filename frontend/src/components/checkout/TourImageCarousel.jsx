import { useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

export default function TourImageCarousel({ images = [] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    setCurrent(0);
  }, [images]);

  const prev = () =>
    setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));

  const next = () =>
    setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));

  if (!images.length) return null;

  return (
    <section className="space-y-4">
      <div className="group relative overflow-hidden rounded-2xl">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`Horseback riding tour La Fortuna photo ${i + 1}`}
              className="h-125 w-full shrink-0 object-cover"
            />
          ))}
        </div>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-black/0 to-black/0" />

        <ArrowButton side="left" onClick={prev} icon={FiChevronLeft} />
        <ArrowButton side="right" onClick={next} icon={FiChevronRight} />

        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={[
                "h-2.5 w-2.5 rounded-full transition-all duration-300",
                i === current ? "scale-125 bg-white" : "bg-white/50 hover:scale-110 hover:bg-white",
              ].join(" ")}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={[
              "relative overflow-hidden rounded-lg transition-all duration-300",
              i === current ? "ring-2 ring-emerald-600" : "opacity-80 hover:opacity-100",
            ].join(" ")}
          >
            <img
              src={img}
              alt={`Thumbnail ${i + 1}`}
              className="h-20 w-28 object-cover transition-transform duration-300 hover:scale-105"
            />
            {i === current && <span className="absolute inset-0 bg-emerald-600/10" />}
          </button>
        ))}
      </div>
    </section>
  );
}

function ArrowButton({ side, onClick, icon: Icon }) {
  const position = side === "left" ? "left-4" : "right-4";

  return (
    <button
      onClick={onClick}
      aria-label={`${side} arrow`}
      className={[
        "absolute top-1/2 z-10 -translate-y-1/2",
        position,
        "group/arrow flex h-11 w-11 items-center justify-center rounded-full",
        "bg-white/70 backdrop-blur-md shadow-md",
        "transition-all duration-300",
        "hover:scale-110 hover:bg-white",
        "active:scale-95",
      ].join(" ")}
    >
      <Icon className="h-5 w-5 text-gray-900 transition-transform duration-300 group-hover/arrow:scale-110" />
    </button>
  );
}
