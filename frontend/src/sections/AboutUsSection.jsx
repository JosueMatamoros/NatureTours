import React from "react";
import { FaHeart } from "react-icons/fa";

export default function AboutUsSection() {
  return (
    <section className="w-full">
      <div className="mx-auto max-w-6xl px-4 sm:py-14 py-2  sm:px-6 lg:px-8">
        {/* Title */}
        <h2 className="mt-6  text-center text-4xl font-extrabold tracking-tight text-[#2B241D] sm:text-5xl lg:text-6xl">
          A dream born from the heart
        </h2>

        {/* Main content */}
        <div className="mt-6 sm:mt-12 grid gap-10 lg:grid-cols-2 lg:items-start">
          {/* Left: collage */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-5 ">
              {/* Big left image */}
              <div className="col-span-1 row-span-2">
                <figure className="overflow-hidden rounded-3xl shadow-sm ring-1 ring-black/5">
                  <img
                    src="/aboutUs/image3.webp"
                    alt="Family owned horse tours La Fortuna Costa Rica"
                    className="h-[440px] w-full object-cover sm:h-[520px] "
                    loading="lazy"
                  />
                </figure>
              </div>

              {/* Top right image */}
              <div className="col-span-1">
                <figure className="overflow-hidden rounded-3xl shadow-sm ring-1 ring-black/5">
                  <img
                    src="/aboutUs/image2.webp"
                    alt="Local guides horseback riding tours near Arenal Volcano"
                    className="h-62.5 w-full object-cover sm:h-70"
                    loading="lazy"
                  />
                </figure>
              </div>

              {/* Bottom right image */}
              <div className="col-span-1 space-y-5 relative">
                <figure className="overflow-hidden rounded-3xl shadow-sm ring-1 ring-black/5">
                  <img
                    src="/aboutUs/image1.webp"
                    alt="Nature Tours La Fortuna founder and horses"
                    className="h-62.5 w-full object-cover object-top sm:h-70 scale-110"
                    loading="lazy"
                  />
                </figure>
              </div>
            </div>

            {/* Since pill */}
            <div className="absolute bottom-4 ">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#1F5B2A] px-5 py-2 text-sm font-semibold text-white shadow-lg">
                <FaHeart className="h-4 w-4" />
                Since 2025
              </span>
            </div>
          </div>

          {/* Right: text */}
          <div className="lg:pt-2">
            <div className="space-y-6 text-[15px] leading-7 text-[#6A6259] sm:text-base">
              <p className="max-w-prose ">
                It all started with a{" "}
                <span className="font-semibold text-[#2B241D]">
                  life-changing decision.
                </span>{" "}
                After undergoing heart surgery, our father realized it was time
                to slow down and find a new way of living through nature.
              </p>

              <p className="max-w-prose">
                That moment gave birth to this family project: a place where we
                use the natural resources of our land to share meaningful
                experiences with those who visit us. We are not a commercial
                company, we are a family opening the doors of our home.
              </p>

              {/* Quote */}
              <div className="rounded-2xl bg-[#F3EDE3] p-6 shadow-sm ring-1 ring-black/5">
                <div className="flex gap-4">
                  <div className="w-1 shrink-0 rounded-full bg-[#7FA37B]" />
                  <p className="text-[#2B241D] font-caveat text-xl">
                    “Here you won’t find the luxury of a hotel, but you will feel
                    the warmth of being at home. That’s what makes us special.”
                  </p>
                </div>
              </div>

              <p className="max-w-prose">
                At the beginning of 2026, we take our first steps into the
                digital world. Come and be part of our journey, and enjoy the{" "}
                <span className="font-semibold text-[#251d2b]">
                  simplicity and humility
                </span>{" "}
                that only a family-run business can offer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

