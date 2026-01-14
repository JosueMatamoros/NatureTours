import { TOURS } from "../../data/tours"; // ajusta el alias si no usas "@/"
// por ejemplo: "../data/tours"

const WhatToBring = ({ tourId = 2 }) => {
  const tour = TOURS?.[tourId];
  if (!tour?.recommendations?.length) return null;

  const items = tour.recommendations;

  return (
    <section className="w-full">
      <div className="mx-auto max-w-6xl px-4 sm:py-14 py-2  sm:px-6 lg:px-8 ">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">
            BEFORE YOU GO
          </p>
          <h2 className=" text-4xl font-extrabold text-gray-900">
            What to Bring
          </h2>
          <p className="mt-2 max-w-3xl text-lg text-gray-600 leading-relaxed">
            We provide all necessary riding equipment. Here&apos;s what we
            recommend you bring for the best experience.
          </p>
        </div>

        {/* Grid */}
        <div className="my-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {items.map((it, idx) => {
            const Icon = it.icon;

            // Si hay número impar de items, el último ocupa 2 columnas en md+ (como en tu screenshot)
            const isLastOddFull =
              items.length % 2 === 1 && idx === items.length - 1;

            return (
              <div
                key={`${it.title}-${idx}`}
                className={[
                  "flex items-start gap-5 rounded-2xl border border-black/10 bg-white px-6 py-6",
                  isLastOddFull ? "md:col-span-2" : "",
                ].join(" ")}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
                  <Icon className="h-6 w-6 text-emerald-700" />
                </div>

                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-[#1B1B1B]">
                    {it.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#6B6B6B] sm:text-base">
                    {it.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhatToBring;
