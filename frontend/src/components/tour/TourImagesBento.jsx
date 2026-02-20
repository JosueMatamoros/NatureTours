import { useEffect, useMemo, useState } from "react";
import { PiHandTap } from "react-icons/pi";

const TourImagesBento = ({ images }) => {
  if (!images || images.length < 6) return null;

  const imgClass = "h-full w-full object-cover rounded-2xl";

  // MOBILE state
  const [active, setActive] = useState(0);
  const [phase, setPhase] = useState("in"); // "in" | "out"
  const [pending, setPending] = useState(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  const mobilePoses = useMemo(
    () => [
      { r: -3, x: -4, y: 2 },
      { r: 2, x: 3, y: 1 },
      { r: -1, x: 2, y: -1 },
      { r: 3, x: -2, y: 2 },
      { r: -2, x: 4, y: 0 },
      { r: 1, x: -3, y: -1 },
    ],
    []
  );

  const onNext = () => {
    if (phase === "out") return; // evita spam taps durante salida

    setHasInteracted(true);
    const next = (active + 1) % 6;
    setPending(next);
    setPhase("out");
  };

  useEffect(() => {
    if (phase !== "out") return;

    const t = setTimeout(() => {
      setActive(pending ?? 0);
      setPhase("in");
      setPending(null);
    }, 220); // duración salida

    return () => clearTimeout(t);
  }, [phase, pending]);

  const pose = mobilePoses[active % mobilePoses.length];

  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:py-10 sm:px-6 lg:px-8 space-y-6">
      <div className="text-center">
        <h2 className="mt-0 text-center text-4xl font-extrabold tracking-tight text-[#2B241D] sm:text-5xl lg:text-6xl">
          River crossings on horseback
        </h2>

        <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-emerald-900/70 sm:text-lg">
          One of the highlights of our horseback riding tour is crossing beautiful rivers in La Fortuna. These spots
          are perfect for family photos, short breaks, and letting children explore nature
          in a calm and safe environment.
        </p>

        <div className="mx-auto mt-6 h-1 w-20 rounded-full bg-emerald-900/20" />
      </div>

      <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl p-1">
        {/* MOBILE:*/}
        <div className="md:hidden  p-6">
          <button
            type="button"
            onClick={onNext}
            className="relative w-full"
            aria-label="Cambiar imagen"
          >
            <div className="relative aspect-[4/5] w-full">
              <img
                src={images[active]}
                alt={`Horseback riding adventure La Fortuna photo ${active + 1}`}
                className={`${imgClass} absolute inset-0 shadow-lg ring-1 ring-black/10 transition-all duration-300 ease-out`}
                style={{
                  transform:
                    phase === "in"
                      ? `translate(${pose.x}px, ${pose.y}px) rotate(${pose.r}deg) scale(1)`
                      : `translate(${pose.x + 18}px, ${pose.y + 10}px) rotate(${
                          pose.r + 6
                        }deg) scale(0.96)`,
                  opacity: phase === "in" ? 1 : 0,
                }}
                draggable={false}
              />

              {/* Touch indicator - disappears after first tap */}
              {!hasInteracted && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <PiHandTap className="h-14 w-14 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] animate-[tap_1.2s_ease-in-out_infinite]" />
                      {/* Ripple effect */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white/80 animate-[ripple_1.2s_ease-out_infinite]" />
                    </div>
                    <span className="rounded-full bg-black/50 backdrop-blur-sm px-4 py-1.5 text-sm text-white font-medium shadow-lg">
                      Tap to explore
                    </span>
                  </div>
                </div>
              )}

              <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                {active + 1} / 6
              </div>
            </div>
          </button>
        </div>

        {/* DESKTOP:*/}
        <div className="hidden md:block">

          <style>{`
            @keyframes tap {
              0%, 100% { transform: translateY(0) scale(1); }
              50% { transform: translateY(8px) scale(0.95); }
            }
            @keyframes ripple {
              0% { transform: translate(-50%, 0) scale(0); opacity: 1; }
              50% { transform: translate(-50%, 0) scale(2); opacity: 0.5; }
              100% { transform: translate(-50%, 0) scale(3); opacity: 0; }
            }
          `}</style>
          <div className="grid grid-cols-12 gap-1">
            {/* Hero grande */}
            <div className="col-span-12 md:col-span-8 row-span-2">
              <img src={images[0]} alt="Horseback riding through river in La Fortuna Costa Rica" className={imgClass} />
            </div>

            {/* Top right */}
            <div className="col-span-12 md:col-span-4">
              <img src={images[1]} alt="Horse tour crossing tropical river Costa Rica" className={imgClass} />
            </div>

            {/* Bottom right */}
            <div className="col-span-12 md:col-span-4">
              <img src={images[2]} alt="Family enjoying horseback riding near Arenal Volcano" className={imgClass} />
            </div>

            {/* Bottom left small */}
            <div className="col-span-12 md:col-span-4">
              <img src={images[3]} alt="Scenic horse trail through rainforest La Fortuna" className={imgClass} />
            </div>

            {/* Bottom center wide */}
            <div className="col-span-12 md:col-span-4">
              <img src={images[4]} alt="Guided horseback adventure in Costa Rica" className={imgClass} />
            </div>

            {/* Bottom right tall */}
            <div className="col-span-12 md:col-span-4">
              <img src={images[5]} alt="River crossing on horseback tour La Fortuna" className={imgClass} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TourImagesBento;
