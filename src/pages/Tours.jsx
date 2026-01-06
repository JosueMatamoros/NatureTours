import { HiOutlineClock } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";

const TOURS = [
  {
    id: 1,
    title: "Night Walk Tour",
    description:
      "Caminata nocturna guiada para observar fauna que solo aparece de noche.",
    image: "/tours/AgalychnisCallidryas.png",
    duration: "2 horas",
    price: 45,
    objectPosition: "object-top",
  },
  {
    id: 2,
    title: "Horseback Riding Tour",
    description:
      "Este tour a caballo tiene una duración aproximada de 2 horas, aunque puede variar según el ritmo del grupo.",
    image: "/tours/horseback.png",
    duration: "2 horas",
    price: 25,
    objectPosition: "object-center",
  },
];

export default function Tours() {
  const navigate = useNavigate();

  return (
    <main className="mx-auto w-[min(1200px,92%)] py-20">
      {/* HEADER */}
      <header className="mb-14 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
          Tours
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-slate-600">
          Descubre la magia de la naturaleza con nuestras experiencias guiadas
          diseñadas para crear memorias inolvidables.
        </p>
      </header>

      {/* GRID */}
      <section className="grid gap-10 md:grid-cols-2">
        {TOURS.map((tour) => (
          <article
            key={tour.id}
            className="overflow-hidden rounded-3xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.12)] transition-transform duration-300 hover:scale-[1.02]"
          >
            {/* IMAGE */}
            <div className="relative h-[320px]">
              <img
                src={tour.image}
                alt={tour.title}
                className={`h-full w-full object-cover ${tour.objectPosition}`}
              />

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

              {/* Duration */}
              <div className="absolute bottom-20 left-4 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow">
                <HiOutlineClock className="h-5 w-5 text-emerald-700" />
                {tour.duration}
              </div>

              {/* Price */}
              <div className="absolute bottom-20 right-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow">
                ${tour.price}{" "}
                <span className="font-normal text-slate-500">/ persona</span>
              </div>

              {/* Description text */}
              <p className="absolute bottom-4 left-6 right-6 text-sm text-white">
                {tour.description}
              </p>
            </div>

            {/* CONTENT */}
            <div className="flex items-center justify-between gap-4 p-6">
              <h3 className="text-xl font-semibold text-slate-900">
                {tour.title}
              </h3>

              <button
                onClick={() =>
                  navigate(`/checkout?tourType=${tour.id}`)
                }
                className="rounded-full bg-emerald-700 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                Seleccionar fecha
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
