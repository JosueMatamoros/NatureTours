import { useMemo, useState } from "react";
import Maps from "../components/maps/Maps";

const ORIGIN = { lat: 10.4711965, lng: -84.645415 };
const DESTINATION = { lat: 10.406555, lng: -84.580452 };

function toMiles(km) {
  const n = Number(km);
  if (!Number.isFinite(n)) return "";
  return (n * 0.621371).toFixed(1);
}

function buildGoogleMapsDirectionsUrl(destination) {
  const dest = `${destination.lat},${destination.lng}`;
  return `https://www.google.com/maps/dir/?api=1&origin=&destination=${encodeURIComponent(
    dest
  )}&travelmode=driving`;
}

export default function MapSection() {
  const [distanceText, setDistanceText] = useState("");
  const [distanceKm, setDistanceKm] = useState(null);
  const [errorText, setErrorText] = useState("");

  const miles = useMemo(
    () => (distanceKm != null ? toMiles(distanceKm) : ""),
    [distanceKm]
  );

  const directionsUrl = useMemo(
    () => buildGoogleMapsDirectionsUrl(DESTINATION),
    []
  );

  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-6 text-center text-4xl font-extrabold tracking-tight text-[#2B241D] sm:text-5xl lg:text-6xl">
            Our location
          </h2>

          <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-emerald-900/70 sm:text-lg">
            Nature Tours La Fortuna is located just a few minutes from downtown
            La Fortuna, San Carlos. From the central park, take Route 702 south
            toward Chachagua.
          </p>

          <div className="mx-auto mt-6 h-1 w-20 rounded-full bg-emerald-900/20" />
        </div>

        {/* Content */}
        <div className="mt-10 flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* MAP */}
          <div className="w-full lg:flex-1">
            <div className="relative overflow-hidden rounded-3xl border border-emerald-900/10 bg-white shadow-sm">
              <Maps
                origin={ORIGIN}
                destination={DESTINATION}
                zoom={15}
                onRouteInfo={({ distanceText, distanceKm }) => {
                  setDistanceText(distanceText);
                  setDistanceKm(distanceKm);
                }}
                onError={(msg) => setErrorText(msg)}
                className="h-[380px] w-full sm:h-[420px] lg:h-[460px]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-emerald-900/5 via-transparent to-transparent" />
            </div>

            {errorText ? (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorText}
              </p>
            ) : (
              <p className="mt-3 text-xs text-emerald-900/50">
                Distance calculated using the Directions API.
              </p>
            )}
          </div>

          {/* DISTANCE CARD */}
          <aside className="w-full lg:w-[360px]">
            <div className="overflow-hidden rounded-3xl bg-emerald-900 text-white shadow-sm">
              <div className="px-6 py-7">
                <p className="text-center text-sm font-medium tracking-[0.18em] text-white/80">
                  DISTANCE
                </p>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  {/* Kilometers */}
                  <div className="relative text-center">
                    <div className="absolute left-0 top-1/2 h-14 -translate-y-1/2" />
                    <div className="text-5xl font-semibold leading-none">
                      {distanceKm != null ? distanceKm.toFixed(1) : "…"}
                    </div>
                    <div className="mt-2 text-sm text-white/80">km</div>
                  </div>

                  {/* Miles */}
                  <div className="relative text-center">
                    <div className="absolute left-0 top-1/2 h-14 -translate-y-1/2 border-l border-white/20" />
                    <div className="text-5xl font-semibold leading-none">
                      {miles || "…"}
                    </div>
                    <div className="mt-2 text-sm text-white/80">miles</div>
                  </div>
                </div>

                <div className="mt-2 text-center">
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-4 text-emerald-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50 active:translate-y-0"
                  >
                    <span className="text-lg font-semibold">
                      Get directions
                    </span>
                    <svg
                      className="h-5 w-5 transition group-hover:translate-x-0.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M5 12h12" />
                      <path d="M13 6l6 6-6 6" />
                    </svg>
                  </a>

                  <div className="mt-2 text-xs text-white/75">
                    From your current location
                  </div>
                </div>
              </div>
            </div>

            <div className="mx-auto mt-4 max-w-4xl text-center text-sm ">
              If you prefer, you can also open your favorite browser and search
              for{" "}
              <span className="font-semibold text-emerald-900">
                Nature Tours La Fortuna
              </span>
              .
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
