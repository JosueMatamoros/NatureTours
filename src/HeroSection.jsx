export default function HeroSection() {
  return (
    <section className="relative h-dvh overflow-hidden bg-gradient-to-br from-[#06140d] via-[#0b1f15] to-[#050b08]">

      <div className="h-full flex overflow-hidden">

        {/* COLUMNA 1 */}
        <div className="w-1/3 h-full p-2">
          <div className="h-full rounded-2xl bg-white/5 border border-white/10 ring-1 ring-green-400/10 shadow-[0_15px_50px_rgba(0,0,0,0.5)] backdrop-blur-sm overflow-hidden">
            <img
              src="./ranaTica.png"
              alt="Rana Tica"
              className="block w-full h-full object-cover object-center brightness-90 contrast-105"
            />
          </div>
        </div>

        {/* COLUMNA 2 */}
        <div className="w-1/3 h-full flex flex-col p-2 gap-2">
          <div className="h-1/2 rounded-2xl bg-white/5 border border-white/10 ring-1 ring-green-400/10 shadow-[0_15px_50px_rgba(0,0,0,0.5)] backdrop-blur-sm overflow-hidden">
            <img
              src="./serpienteTercioPelo.png"
              alt="Serpiente Tercio Pelo"
              className="block w-full h-full object-cover object-center brightness-90 contrast-105"
            />
          </div>

          <div className="h-1/2 rounded-2xl bg-white/5 border border-white/10 ring-1 ring-green-400/10 shadow-[0_15px_50px_rgba(0,0,0,0.5)] backdrop-blur-sm overflow-hidden">
            <img
              src="./ranaFresa.png"
              alt="Rana Fresa"
              className="block w-full h-full object-cover object-center brightness-90 contrast-105"
            />
          </div>
        </div>

        {/* COLUMNA 3 */}
        <div className="w-1/3 h-full flex flex-col p-2 gap-2">
          <div className="h-1/3 rounded-2xl bg-white/5 border border-white/10 ring-1 ring-green-400/10 shadow-[0_15px_50px_rgba(0,0,0,0.5)] backdrop-blur-sm overflow-hidden">
            <img
              src="./ranaLeche.png"
              alt="Rana Leche"
              className="block w-full h-full object-cover object-center brightness-90 contrast-105"
            />
          </div>

          <div className="h-1/3 rounded-2xl bg-white/5 border border-white/10 ring-1 ring-green-400/10 shadow-[0_15px_50px_rgba(0,0,0,0.5)] backdrop-blur-sm overflow-hidden">
            <img
              src="./serpienteCoral.png"
              alt="Serpiente Coral"
              className="block w-full h-full object-cover object-center brightness-90 contrast-105"
            />
          </div>

          <div className="h-1/3 rounded-2xl bg-white/5 border border-white/10 ring-1 ring-green-400/10 shadow-[0_15px_50px_rgba(0,0,0,0.5)] backdrop-blur-sm overflow-hidden">
            <img
              src="./ranaDorada.png"
              alt="Rana Dorada"
              className="block w-full h-full object-cover object-center brightness-90 contrast-105"
            />
          </div>
        </div>
      </div>

      <div className="absolute inset-0 bg-[#07140e]/30" />

      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div className="text-center max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-black/40 px-4 py-2 text-xs tracking-wide text-white/90 backdrop-blur">
            Eco tours • Wildlife • Adventure
          </p>

          <h1 className="mt-6 text-4xl sm:text-6xl font-semibold text-white">
            Where Nature
            <span className="block text-green-400">Meets Wonder</span>
          </h1>


          <div className="mt-8 flex items-center justify-center gap-3">
            <button className="rounded-full bg-green-500 px-6 py-3 text-sm font-semibold text-black shadow-lg hover:bg-green-400 transition">
              Book Now
            </button>
            <button className="rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/15 transition">
              View Tours
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
