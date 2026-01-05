import { FiClock, FiRefreshCw } from "react-icons/fi";

export default function TourOverviewCard() {
  const tour = {
    name: "Arenal Volcano Tour",
    duration: "2 hours",
    description:
      "Explore the impressive Arenal Volcano and its surrounding rainforest on a guided tour. Learn about the region’s geology, wildlife, and history while enjoying breathtaking views.",
    recommendations: [
      "Wear comfortable walking shoes",
      "Bring sunscreen and insect repellent",
      "Carry a reusable water bottle",
      "Light rain jacket is recommended",
    ],
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {tour.name}
          </h1>

          <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
            <FiClock className="h-4 w-4" />
            {tour.duration}
          </div>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
        >
          <FiRefreshCw className="h-4 w-4" />
          Change tour
        </button>
      </div>

      {/* Info */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-6">
        {/* General Information */}
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">
            General information
          </h2>

          <p className="text-sm leading-relaxed text-gray-700">
            {tour.description}
          </p>
        </section>

        {/* Recommendations */}
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">
            Recommendations
          </h2>

          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
            {tour.recommendations.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}
