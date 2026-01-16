import { HiOutlineSparkles } from "react-icons/hi2";
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
              alt="Rana Tica"
              className="block w-full h-full object-cover object-[80%_center] brightness-90 contrast-105"
            />
          </div>
        </div>

        {/* COLUMNA 2 */}
        <div className="w-1/2 h-full flex flex-col p-2 gap-2">
          <div className="h-1/2 rounded-2xl overflow-hidden">
            <img
              src="/hero/serpienteTercioPelo.webp"
              alt="Serpiente Tercio Pelo"
              className="block w-full h-full object-cover object-center brightness-90 contrast-105"
            />
          </div>

          <div className="h-1/2 rounded-2xl overflow-hidden">
            <img
              src="/hero/ranaFresa.webp"
              alt="Rana Fresa"
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
              alt="Rana Tica"
              className="block w-full h-full object-cover object-center brightness-90 contrast-105"
            />
          </div>
        </div>

        {/* COLUMNA 2 */}
        <div className="w-1/3 h-full flex flex-col p-2 gap-2">
          <div className="h-1/2 rounded-2xl overflow-hidden">
            <img
              src="/hero/serpienteTercioPelo.webp"
              alt="Serpiente Tercio Pelo"
              className="block w-full h-full object-cover object-center brightness-90 contrast-105"
            />
          </div>

          <div className="h-1/2 rounded-2xl overflow-hidden">
            <img
              src="/hero/ranaFresa.webp"
              alt="Rana Fresa"
              className="block w-full h-full object-cover object-center brightness-90 contrast-105"
            />
          </div>
        </div>

        {/* COLUMNA 3 */}
        <div className="w-1/3 h-full flex flex-col p-2 gap-2">
          <div className="h-1/3 rounded-2xl overflow-hidden">
            <img
              src="/hero/ranaLeche.webp"
              alt="Rana Leche"
              className="block w-full h-full object-cover object-center brightness-90 contrast-105"
            />
          </div>

          <div className="h-1/3 rounded-2xl overflow-hidden">
            <img
              src="/hero/serpienteCoral.webp"
              alt="Serpiente Coral"
              className="block w-full h-full object-cover object-center brightness-90 contrast-105"
            />
          </div>

          <div className="h-1/3 rounded-2xl overflow-hidden">
            <img
              src="/hero/ranaDorada.webp"
              alt="Rana Dorada"
              className="block w-full h-full object-cover object-center brightness-90 contrast-105"
            />
          </div>
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center ">
        <div className="text-center max-w-2xl">
          <p
            className="
  inline-flex items-center gap-2
  rounded-full
  bg-white/10
  px-5 py-2
  text-xs font-medium tracking-wide text-white/90
  backdrop-blur-md
  border border-white/20
  shadow-[0_4px_20px_rgba(0,0,0,0.35)] mb-2 mt-8
"
          >
            <HiOutlineSparkles className="h-4 w-4 " />
            Eco tours • Wildlife • Adventure
          </p>

          <h1 className=" text-4xl sm:text-6xl font-semibold text-white">
            Where Nature
            <span className="block text-green-400">Meets Wonder</span>
          </h1>

          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              className="rounded-full bg-green-500 px-6 py-3 text-sm font-semibold text-black shadow-lg hover:bg-green-600 transition-all hover:scale-105"
              onClick={() => navigate("/SelecTour")}
            >
              Book Now
            </button>
            <button
              className="rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md
  border border-white/20
  shadow-[0_4px_20px_rgba(0,0,0,0.35)] transition-all hover:scale-105"
            >
              View Tours
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
