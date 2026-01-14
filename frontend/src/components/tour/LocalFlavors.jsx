import { FaLeaf, FaCoffee } from "react-icons/fa";

export default function LocalFlavors() {
  return (
    <section className="w-full">
      <div className="mx-auto max-w-6xl px-4 sm:py-14 py-2  sm:px-6 lg:px-8 ">
        {/* Header */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">
            Refreshments
          </p>
          <h2 className=" text-4xl font-extrabold text-gray-900">
            Local Flavors
          </h2>
          <p className="mt-2 max-w-3xl text-lg text-gray-600 leading-relaxed">
            Depending on availability, we offer a selection of local
            refreshments to enhance your experience. Enjoy the authentic taste
            of Costa Rica during your adventure.
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-stretch gap-6 my-6">
          {/* Texto */}
          <div className="space-y-4 flex-1">
            <div className="flex items-start gap-4 rounded-2xl border border-gray-200 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <FaLeaf size={20} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">
                  Fresh Tropical Fruits
                </h3>
                <p className="mt-1 text-gray-600">
                  Seasonal fruits harvested locally, including mango, papaya,
                  and pineapple.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-gray-200 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <FaCoffee size={20} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">
                  Beverages
                </h3>
                <p className="mt-1 text-gray-600">
                  Water, milkshakes, coconut water, or traditional Costa Rican coffee.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-5 text-sm text-emerald-900">
              <span className="font-semibold">Note:</span> Refreshments are
              offered based on availability and are not guaranteed. Please bring
              water if you prefer.
            </div>
          </div>

          {/* Imagen */}
          <div className="flex-1">
            <img
              src="/resources/fruits.JPG"
              alt="Fresh tropical fruits from Costa Rica"
              className="h-full w-full object-cover rounded-3xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
