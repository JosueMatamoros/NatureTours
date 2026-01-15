import React from "react";
import {
  HiOutlineShieldCheck,
  HiOutlineTruck,
  HiOutlineLocationMarker,
  HiOutlinePhone,
  HiOutlineHome,
} from "react-icons/hi";
import { FiCoffee, FiStar } from "react-icons/fi";
import StaysCarouselGrid from "../components/services/StaysCarouselGrid";

export default function ServicesPage() {
  return (
    <section className="relative overflow-hidden bg-[#FBFAF8] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Top badge */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-900/15 bg-white/70 px-4 py-2 text-sm font-medium text-emerald-900 shadow-sm">
            <HiOutlineShieldCheck className="h-4 w-4" />
            Services from our partners
          </span>
        </div>

        {/* Title */}
        <div className="text-center">
          <h2 className="mt-4 text-center text-4xl font-extrabold tracking-tight text-[#2B241D] sm:text-5xl lg:text-6xl">
            Additional Services
          </h2>

          <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-emerald-900/70 sm:text-lg">
            While we don&apos;t offer these services directly, we work with{" "}
            <span className="font-semibold text-[#2B241D]">
              trusted partners and family-owned businesses
            </span>{" "}
            who can help complete your travel experience.
          </p>

          <div className="mx-auto mt-6 h-1 w-20 rounded-full bg-emerald-900/20" />
        </div>

        {/* Cards */}
        <div className="mt-10 grid gap-6 lg:mt-14 lg:grid-cols-2">
          {/* Card 1 */}
          <article className="relative overflow-hidden rounded-3xl border border-emerald-900/10 bg-emerald-50/55 p-6 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.35)] sm:p-8">
            {/* soft glow */}
            <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-emerald-200/30 blur-3xl" />

            <div className="relative">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-200/60">
                      <HiOutlineTruck className="h-7 w-7 text-emerald-800" />
                    </div>
                    <h3 className="text-2xl font-extrabold tracking-tight text-[#2B241D] sm:text-3xl">
                      Transportation
                    </h3>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-emerald-900/70 sm:text-base">
                    We can connect you with private transportation options to
                    take you from the airport or your home to your destination.
                    Comfortable vehicles and trusted drivers.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-900/80 ring-1 ring-emerald-900/10">
                      <HiOutlineLocationMarker className="h-4 w-4" />
                      Airport transfers
                    </span>

                    {/* UPDATED label + icon */}
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-900/80 ring-1 ring-emerald-900/10">
                      <HiOutlineHome className="h-4 w-4" />
                      Hotel & airbnb pickups
                    </span>
                  </div>

                  <button
                    type="button"
                    className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-900/15 bg-white/70 px-5 py-3 text-sm font-semibold text-emerald-900 shadow-sm transition hover:bg-white"
                  >
                    <HiOutlinePhone className="h-5 w-5" />
                    Ask us and we&apos;ll connect you
                  </button>
                </div>
              </div>
            </div>
          </article>

          {/* Card 2 */}
          <article className="relative overflow-hidden rounded-3xl border border-orange-900/10 bg-orange-50/55 p-6 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.35)] sm:p-8">
            {/* soft glow */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-orange-200/30 blur-3xl" />

            <div className="relative">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-orange-200/60">
                      <FiCoffee className="h-7 w-7 text-orange-700" />
                    </div>
                    <h3 className="text-2xl font-extrabold tracking-tight text-[#2B241D] sm:text-3xl">
                      Restaurants & Food
                    </h3>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-emerald-900/70 sm:text-base">
                    We partner with local restaurants and family-owned
                    businesses that offer delicious traditional food. We can
                    help coordinate your lunches or dinners during your stay.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm font-medium text-orange-900/80 ring-1 ring-orange-900/10">
                      <FiStar className="h-4 w-4" />
                      Local traditional food
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm font-medium text-orange-900/80 ring-1 ring-orange-900/10">
                      <HiOutlineShieldCheck className="h-4 w-4" />
                      Family-owned businesses
                    </span>
                  </div>

                  <button
                    type="button"
                    className="mt-6 inline-flex items-center gap-2 rounded-full border border-orange-900/15 bg-white/70 px-5 py-3 text-sm font-semibold text-orange-800 shadow-sm transition hover:bg-white"
                  >
                    <HiOutlinePhone className="h-5 w-5" />
                    Ask us and we&apos;ll connect you
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
      {/* Title */}
      <div className="text-center mt-16">
        <h2 className="text-center text-4xl font-extrabold tracking-tight text-[#2B241D] sm:text-5xl lg:text-6xl">
          Featured Stays
        </h2>

        <div className="mx-auto mt-6 h-1 w-20 rounded-full bg-emerald-900/20" />
      </div>

      <StaysCarouselGrid />
    </section>
  );
}
