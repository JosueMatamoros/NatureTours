import { HiOutlineSparkles } from "react-icons/hi2";
import { HiChevronDown } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section
      className="
    relative h-dvh overflow-hidden
    bg-[url('/hero/ranaTica.webp')] bg-cover bg-[80%_center]
    md:bg-linear-to-br md:from-[#06140d] md:via-[#0b1f15] md:to-[#050b08]
  "
    >
      {/* TABLET: 2 columnas */}
      <div className="hidden md:flex lg:hidden h-full overflow-hidden">
        {/* COLUMNA 1 */}
        <div className="w-1/2 h-full p-2">
          <div className="h-full rounded-2xl overflow-hidden">
            <img
              src="/hero/ranaTica.webp"
              alt="Red-eyed tree frog Costa Rica wildlife tour"
              className="block w-full h-full object-cover object-[80%_center] brightness-90 contrast-105"
            />
          </div>
        </div>

        {/* COLUMNA 2 */}
        <div className="w-1/2 h-full flex flex-col p-2 gap-2">
          <div className="h-1/2 rounded-2xl overflow-hidden">
            <img
              src="/hero/serpienteTercioPelo.webp"
              alt="Fer-de-lance snake wildlife observation La Fortuna"
              className="block w-full h-full object-cover object-center brightness-90 contrast-105"
            />
          </div>

          <div className="h-1/2 rounded-2xl overflow-hidden">
            <img
              src="/hero/ranaFresa.webp"
              alt="Strawberry poison dart frog Costa Rica nature tour"
              className="block w-full h-full object-cover object-center brightness-90 contrast-105"
            />
          </div>
        </div>
      </div>

      {/* DESKTOP: 3 columnas (lg+) */}
      <div className="hidden lg:flex h-full overflow-hidden">
        {/* COLUMNA 1 */}
        <div className="w-1/3 h-full p-2">
          <div className="h-full rounded-2xl overflow-hidden">
            <img
              src="/hero/ranaTica.webp"
              alt="Red-eyed tree frog Costa Rica wildlife tour"
              className="block w-full h-full object-cover object-center brightness-90 contrast-105"
            />
          </div>
        </div>

        {/* COLUMNA 2 */}
        <div className="w-1/3 h-full flex flex-col p-2 gap-2">
          <div className="h-1/2 rounded-2xl overflow-hidden">
            <img
              src="/hero/serpienteTercioPelo.webp"
              alt="Fer-de-lance snake wildlife observation La Fortuna"
              className="block w-full h-full object-cover object-center brightness-90 contrast-105"
            />
          </div>

          <div className="h-1/2 rounded-2xl overflow-hidden">
            <img
              src="/hero/ranaFresa.webp"
              alt="Strawberry poison dart frog Costa Rica nature tour"
              className="block w-full h-full object-cover object-center brightness-90 contrast-105"
            />
          </div>
        </div>

        {/* COLUMNA 3 */}
        <div className="w-1/3 h-full flex flex-col p-2 gap-2">
          <div className="h-1/3 rounded-2xl overflow-hidden">
            <img
              src="/hero/ranaLeche.webp"
              alt="Amazon milk frog wildlife La Fortuna Costa Rica"
              className="block w-full h-full object-cover object-center brightness-90 contrast-105"
            />
          </div>

          <div className="h-1/3 rounded-2xl overflow-hidden">
            <img
              src="/hero/serpienteCoral.webp"
              alt="Coral snake wildlife observation Costa Rica tour"
              className="block w-full h-full object-cover object-center brightness-90 contrast-105"
            />
          </div>

          <div className="h-1/3 rounded-2xl overflow-hidden">
            <img
              src="/hero/ranaDorada.webp"
              alt="Golden poison frog eco tour La Fortuna"
              className="block w-full h-full object-cover object-center brightness-90 contrast-105"
            />
          </div>
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center ">
        <div className="text-center max-w-3xl px-4">
          <p
            className="
  inline-flex items-center gap-2
  rounded-full
  bg-white/10
  px-5 py-2
  text-xs font-medium tracking-wide text-white/90
  backdrop-blur-md
  border border-white/20
  shadow-[0_4px_20px_rgba(0,0,0,0.35)] mb-4 mt-8
"
          >
            <HiOutlineSparkles className="h-4 w-4 " />
            Eco tours • Wildlife • Adventure
          </p>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white tracking-tight">
            <span className="block bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent drop-shadow-2xl">
              Nature Tours
            </span>
            <span className="block mt-2 bg-gradient-to-r from-green-300 via-emerald-400 to-green-500 bg-clip-text text-transparent">
              La Fortuna
            </span>
          </h1>

          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              className="rounded-full bg-gradient-to-r from-green-400 to-emerald-500 px-8 py-3.5 text-sm font-bold text-black shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all hover:scale-105"
              onClick={() => navigate("/SelecTour")}
            >
              Book Now
            </button>
            <button
              className="rounded-full bg-white/10 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-md
  border border-white/20
  shadow-[0_4px_20px_rgba(0,0,0,0.35)] transition-all hover:scale-105 hover:bg-white/20"
              onClick={() => navigate("/tours")}
            >
              View Tours
            </button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
        <HiChevronDown className="h-8 w-8 text-white/80 animate-[bounce_2s_ease-in-out_infinite]" />
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }
      `}</style>
    </section>
  );
}
