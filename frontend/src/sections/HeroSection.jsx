import { HiOutlineSparkles } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section
      className="
        relative h-dvh overflow-hidden
        bg-[url('/hero/rioHorse.webp')] bg-cover bg-[center_15%]
        md:bg-[url('/hero/tourGroup.webp')] md:bg-cover md:bg-[center_20%]
      "
    >
      {/* Mobile overlay: stronger at top for navbar + title contrast */}
      <div className="absolute inset-0 md:hidden z-10" style={{
        background: "linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.25) 35%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.65) 100%)"
      }} />

      {/* Desktop cinematic overlay */}
      <div className="hidden md:block absolute inset-0 z-10" style={{
        background: "linear-gradient(to bottom, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.12) 38%, rgba(0,0,0,0.12) 62%, rgba(0,0,0,0.72) 100%)"
      }} />
      <div className="hidden md:block absolute inset-0 z-10" style={{
        background: "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.45) 100%)"
      }} />

      {/* Desktop grid columns hidden — using bg photo */}
      <div className="hidden h-full overflow-hidden" />

      {/* MOBILE layout: title top, center free, buttons near bottom */}
      <div className="md:hidden absolute inset-0 z-20 flex flex-col px-6 pt-24 pb-28">
        <div className="text-center">
          <h1 className="text-5xl font-black tracking-tight" style={{ filter: "drop-shadow(0 2px 20px rgba(0,0,0,0.85))" }}>
            <span className="block text-white">Nature Tours</span>
            <span className="block mt-1 bg-gradient-to-r from-green-300 via-emerald-400 to-green-500 bg-clip-text text-transparent">
              La Fortuna
            </span>
          </h1>
        </div>

        <div className="flex-1" />

        <div className="flex items-center justify-center gap-3">
          <button
            className="rounded-full bg-gradient-to-r from-green-400 to-emerald-500 px-8 py-3.5 text-sm font-bold text-black shadow-lg shadow-green-500/30 transition-all hover:scale-105"
            onClick={() => navigate("/SelecTour")}
          >
            Book Now
          </button>
          <button
            className="rounded-full bg-black/40 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-md border border-white/25 transition-all hover:scale-105 hover:bg-black/50"
            onClick={() => navigate("/tours")}
          >
            View Tours
          </button>
        </div>
      </div>

      {/* TABLET / DESKTOP layout: title top, buttons bottom */}
      <div className="hidden md:flex absolute inset-0 flex-col z-20 px-8 pt-28 pb-28">
        <div className="text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-xs font-medium tracking-wide text-white/90 backdrop-blur-md border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.35)] mb-4">
            <HiOutlineSparkles className="h-4 w-4" />
            Eco tours • Wildlife • Adventure
          </p>
          <h1 className="text-7xl lg:text-8xl font-black tracking-tight" style={{ filter: "drop-shadow(0 2px 20px rgba(0,0,0,0.85))" }}>
            <span className="block text-white">
              Nature Tours
            </span>
            <span className="block mt-2 bg-gradient-to-r from-green-300 via-emerald-400 to-green-500 bg-clip-text text-transparent">
              La Fortuna
            </span>
          </h1>
        </div>

        <div className="flex-1" />

        <div className="flex items-center justify-center gap-3">
          <button
            className="rounded-full bg-gradient-to-r from-green-400 to-emerald-500 px-8 py-3.5 text-sm font-bold text-black shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all hover:scale-105"
            onClick={() => navigate("/SelecTour")}
          >
            Book Now
          </button>
          <button
            className="rounded-full bg-white/10 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-md border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.35)] transition-all hover:scale-105 hover:bg-white/20"
            onClick={() => navigate("/tours")}
          >
            View Tours
          </button>
        </div>
      </div>

      {/* Scroll indicator — mouse icon */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
        <svg width="24" height="38" viewBox="0 0 24 38" fill="none" className="opacity-60">
          <rect x="1" y="1" width="22" height="36" rx="11" stroke="white" strokeWidth="1.5"/>
          <circle cx="12" cy="10" r="3" fill="white" className="animate-[mouseDot_2s_ease-in-out_infinite]"/>
        </svg>
        <span className="text-[9px] font-medium tracking-[0.3em] uppercase text-white/50">Scroll</span>
      </div>

      <style>{`
        @keyframes mouseDot {
          0%, 100% { transform: translateY(0); opacity: 1; }
          60% { transform: translateY(14px); opacity: 0.3; }
        }
      `}</style>
    </section>
  );
}
