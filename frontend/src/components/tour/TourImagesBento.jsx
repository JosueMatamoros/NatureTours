import { useEffect, useMemo, useState } from "react";

const TourImagesBento = ({ images }) => {
  if (!images || images.length < 6) return null;

  const imgClass = "h-full w-full object-cover rounded-2xl";

  // MOBILE state
  const [active, setActive] = useState(0);
  const [phase, setPhase] = useState("in"); // "in" | "out"
  const [pending, setPending] = useState(null);

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
    <section className="mx-auto max-w-6xl px-4 sm:py-14 py-2 sm:px-6 lg:px-8 space-y-6">
      <div className="text-center">
        <h2 className="mt-6 text-center text-4xl font-extrabold tracking-tight text-[#2B241D] sm:text-5xl lg:text-6xl">
          Rivers to enjoy and explore
        </h2>

        <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-emerald-900/70 sm:text-lg">
          Among the most enjoyed areas of the tour are the rivers. These spaces
          are perfect for taking family photos, taking a short break, and
          allowing children to explore freely, play, and connect with nature in
          a calm and safe environment.
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
                alt={`Imagen ${active + 1}`}
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
              =
              <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                Toca para ver otra ({active + 1}/6)
              </div>
            </div>
          </button>
        </div>

        {/* DESKTOP:*/}
        <div className="hidden md:block">
          <div className="grid grid-cols-12 gap-1">
            {/* Hero grande */}
            <div className="col-span-12 md:col-span-8 row-span-2">
              <img src={images[0]} alt="Hero" className={imgClass} />
            </div>

            {/* Top right */}
            <div className="col-span-12 md:col-span-4">
              <img src={images[1]} alt="Image 1" className={imgClass} />
            </div>

            {/* Bottom right */}
            <div className="col-span-12 md:col-span-4">
              <img src={images[2]} alt="Image 2" className={imgClass} />
            </div>

            {/* Bottom left small */}
            <div className="col-span-12 md:col-span-4">
              <img src={images[3]} alt="Image 3" className={imgClass} />
            </div>

            {/* Bottom center wide */}
            <div className="col-span-12 md:col-span-4">
              <img src={images[4]} alt="Image 4" className={imgClass} />
            </div>

            {/* Bottom right tall */}
            <div className="col-span-12 md:col-span-4">
              <img src={images[5]} alt="Image 5" className={imgClass} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TourImagesBento;
