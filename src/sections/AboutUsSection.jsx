import React from "react";
import { FaHeart } from "react-icons/fa";

export default function AboutUsSection() {
  return (
    <section className="w-full">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        {/* Top badge */}
        <div className="flex justify-center">
          <span
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm
            font-medium tracking-wide backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.35)]
            border border-white/20 text-emerald-700"
          >
            Nuestra Historia
          </span>
        </div>

        {/* Title */}
        <h2 className="mt-6 text-center text-4xl font-extrabold tracking-tight text-[#2B241D] sm:text-5xl lg:text-6xl">
          Un sueño que nació del corazón
        </h2>

        {/* Main content */}
        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:items-start">
          {/* Left: collage */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-5 ">
              {/* Big left image */}
              <div className="col-span-1 row-span-2">
                <figure className="overflow-hidden rounded-3xl shadow-sm ring-1 ring-black/5">
                  <img
                    src="/aboutUs/image3.JPG"
                    alt="Atardecer en el campo"
                    className="h-[440px] w-full object-cover sm:h-[520px]"
                    loading="lazy"
                  />
                </figure>
              </div>

              {/* Top right image */}
              <div className="col-span-1">
                <figure className="overflow-hidden rounded-3xl shadow-sm ring-1 ring-black/5">
                  <img
                    src="/aboutUs/image2.jpeg"
                    alt="Caminata nocturna con luces"
                    className="h-62.5 w-full object-cover sm:h-70"
                    loading="lazy"
                  />
                </figure>
              </div>

              {/* Bottom right image */}
              <div className="col-span-1 space-y-5">
                <figure className="overflow-hidden rounded-3xl shadow-sm ring-1 ring-black/5">
                  <img
                    src="/aboutUs/image1.png"
                    alt="Cabaña cálida en la montaña"
                    className="h-62.5 w-full object-cover object-top sm:h-70"
                    loading="lazy"
                  />
                </figure>
              </div>
            </div>

            {/* Since pill pegado abajo del collage */}
            <div className="absolute bottom-4 ">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#1F5B2A] px-5 py-2 text-sm font-semibold text-white shadow-lg">
                <FaHeart className="h-4 w-4" />
                Desde 2025
              </span>
            </div>
          </div>

          {/* Right: text */}
          <div className="lg:pt-2">
            <div className="space-y-6 text-[15px] leading-7 text-[#6A6259] sm:text-base">
              <p className="max-w-prose">
                Todo comenzó con una{" "}
                <span className="font-semibold text-[#2B241D]">
                  decisión de vida.
                </span>{" "}
                Tras una operación del corazón, nuestro padre decidió que era
                momento de cambiar el ritmo y encontrar en la naturaleza una
                nueva forma de vivir.
              </p>

              <p className="max-w-prose">
                Así nació este emprendimiento familiar: un espacio donde
                aprovechamos los recursos naturales de nuestra tierra para
                compartir experiencias únicas con quienes nos visitan. No somos
                una empresa comercial, somos una familia que abre las puertas de
                su hogar.
              </p>

              {/* Quote */}
              <div className="rounded-2xl bg-[#F3EDE3] p-6 shadow-sm ring-1 ring-black/5">
                <div className="flex gap-4">
                  <div className="w-1 shrink-0 rounded-full bg-[#7FA37B]" />
                  <p className="italic text-[#2B241D]">
                    “Aquí no encontrarás el lujo de un hotel, pero sí la calidez
                    de sentirte en casa. Eso es lo que nos hace especiales.”
                  </p>
                </div>
              </div>

              <p className="max-w-prose">
                En este inicio de 2026, damos nuestros primeros pasos en el mundo
                digital. Ven y sé parte de nuestro crecimiento, disfruta de la{" "}
                <span className="font-semibold text-[#251d2b]">
                  sencillez y humildad
                </span>{" "}
                que solo un negocio familiar puede ofrecer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
