import React from "react";

export default function DogSection() {
  const photos = [
    { id: 1, src: "/dog/dog1.webp", alt: "Muñeca - photo 1", size: "sm", mobileAlign: "left" },
    { id: 2, src: "/dog/dog2.webp", alt: "Muñeca - photo 2", size: "lg", mobileAlign: "center" },
    { id: 3, src: "/dog/dog3.webp", alt: "Muñeca - photo 3", size: "sm", mobileAlign: "right" },
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      {/* Quote */}
      <p className="text-center text-lg italic text-slate-600 sm:text-xl">
        “Not a horse, but she always joins us on our adventures...”
      </p>

      {/* Name line */}
      <p className="mt-1 text-center text-base font-semibold text-slate-900 sm:text-lg">
        She’s <span className="italic">“Muñeca”</span> <span className="font-normal text-slate-500">(Doll)</span>
      </p>

      {/* Circles */}
      <div className="mt-6 grid  sm:flex sm:items-center sm:justify-center sm:gap-10">
        {photos.map((p) => (
          <CirclePhoto
            key={p.id}
            src={p.src}
            alt={p.alt}
            size={p.size}
            mobileAlign={p.mobileAlign}
          />
        ))}
      </div>

      {/* Paw prints */}
      <div className="mt-6 flex justify-center">
        <div className="flex items-center gap-3 opacity-50">
          <Paw />
          <Paw className="translate-y-2" />
          <Paw />
          <Paw className="translate-y-2" />
          <Paw />
        </div>
      </div>
    </section>
  );
}

function CirclePhoto({ src, alt, size = "sm", mobileAlign = "center" }) {
  const isLg = size === "lg";

  const mobileOffset =
    mobileAlign === "left"
      ? "justify-self-start"
      : mobileAlign === "right"
      ? "justify-self-end"
      : "justify-self-center";

  return (
    <div
      className={[
        "relative rounded-full bg-white",
        // ✅ mobile: izquierda / centro / derecha
        mobileOffset,
        // ✅ en sm+ vuelve al centro normal porque ya es fila
        "sm:justify-self-auto",
        // tamaño
        isLg
          ? "h-[260px] w-[260px] sm:h-[320px] sm:w-[320px]"
          : "h-[220px] w-[220px] sm:h-[250px] sm:w-[250px]",
        // marco blanco + sombra suave
        "p-[10px] shadow-[0_18px_45px_rgba(0,0,0,0.12)] ring-1 ring-black/5",
      ].join(" ")}
    >
      <div className="h-full w-full overflow-hidden rounded-full bg-slate-100">
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
    </div>
  );
}

function Paw({ className = "" }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={`h-6 w-6 text-slate-500 ${className}`}
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="18" cy="24" r="6" />
      <circle cx="32" cy="18" r="6" />
      <circle cx="46" cy="24" r="6" />
      <path d="M32 30c-10 0-18 8-18 16 0 7 7 12 18 12s18-5 18-12c0-8-8-16-18-16z" />
    </svg>
  );
}
