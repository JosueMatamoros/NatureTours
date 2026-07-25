// src/components/tour/StickyBookingBar.jsx
// Barra flotante de reserva para las páginas informativas del tour.
// Aparece recién después de que el visitante hizo scroll (para no interrumpir
// la primera pantalla), se puede cerrar, y se esconde al llegar al footer
// para no tapar el contenido final.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { TbHorse, TbClock, TbArrowRight, TbX } from "react-icons/tb";
import { TOURS } from "../../data/tours";

const SHOW_AFTER_PX = 480;

export default function StickyBookingBar({ tourId = 2 }) {
  const tour = TOURS[tourId];
  const [visible, setVisible] = useState(false);
  const dismissed = useRef(false);

  useEffect(() => {
    function onScroll() {
      if (dismissed.current) return;

      const y = window.scrollY;
      const nearBottom =
        y + window.innerHeight >= document.documentElement.scrollHeight - 260;

      setVisible(y > SHOW_AFTER_PX && !nearBottom);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!tour) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 px-3 pb-3 transition-all duration-300 sm:px-4 sm:pb-5 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-6 opacity-0"
      }`}
    >
      <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-2xl border border-emerald-100 bg-white/95 px-4 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.18)] backdrop-blur sm:gap-4 sm:px-5">
        <div className="hidden h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 sm:grid">
          <TbHorse className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900 sm:text-base">
            {tour.name}
          </p>
          <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 sm:text-sm">
            <span className="font-semibold text-emerald-700">
              From ${tour.price}
            </span>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1">
              <TbClock className="h-3.5 w-3.5" />
              {tour.duration}
            </span>
          </p>
        </div>

        <Link
          to={`/checkout?tourType=${tourId}`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 sm:px-5"
        >
          Book now
          <TbArrowRight className="h-4 w-4" />
        </Link>

        <button
          type="button"
          onClick={() => {
            dismissed.current = true;
            setVisible(false);
          }}
          aria-label="Hide booking bar"
          className="shrink-0 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <TbX className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
