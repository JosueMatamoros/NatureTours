import HorseCard from "../components/aboutUs/HorseCard";
import { FiHeart, FiUsers } from "react-icons/fi";
import { GiPawPrint } from "react-icons/gi";

const HORSES = [
  {
    id: 1,
    name: "Caballo",
    image: "/horses/caballo1.JPG",
    greeting: "¡Qué onda! Soy Caballo.",
    centerX: 50,
  },
  {
    id: 2,
    name: "Caballo",
    image: "/horses/caballo2.JPG",
    greeting: "Hola, soy Caballo. Mucho gusto.",
    centerX: 50,
  },
  {
    id: 5,
    name: "Caballo",
    image: "/horses/caballo5.JPG",
    greeting: "Hola, soy Caballo. ¿Cómo vas?",
    centerX: 50,
  },
  {
    id: 13,
    name: "Caballo",
    image: "/horses/caballo13.JPG",
    greeting: "Buenas, soy Caballo. ¿Listo para conocerme?",
    centerX: 50,
  },
  {
    id: 6,
    name: "Caballo",
    image: "/horses/caballo6.JPG",
    greeting: "Ey, soy Caballo. Encantado de verte.",
    centerX: 50,
  },
  {
    id: 7,
    name: "Caballo",
    image: "/horses/caballo7.JPG",
    greeting: "Hola, soy Caballo. Gracias por venir.",
    centerX: 50,
  },
  {
    id: 10,
    name: "Caballo",
    image: "/horses/caballo10.JPG",
    greeting: "Hola, soy Caballo. Qué bueno verte por aquí.",
    centerX: 50,
  },
  {
    id: 14,
    name: "Caballo",
    image: "/horses/caballo14.JPG",
    greeting: "Hola, soy Caballo. Mucho gusto en saludarte.",
    centerX: 20,
  },

  {
    id: 9,
    name: "Caballo",
    image: "/horses/caballo9.JPG",
    greeting: "Saludos, soy Caballo. Vamos con calma.",
    centerX: 50,
  },
  {
    id: 3,
    name: "Caballo",
    image: "/horses/caballo3.JPG",
    greeting: "Hey, soy Caballo. Bienvenido.",
    centerX: 50,
  },
  {
    id: 11,
    name: "Caballo",
    image: "/horses/caballo11.JPG",
    greeting: "Hey, soy Caballo. Me gusta la aventura.",
    centerX: 50,
  },
  {
    id: 8,
    name: "Caballo",
    image: "/horses/caballo8.JPG",
    greeting: "¡Hola! Soy Caballo. Aquí ando tranquilo.",
    centerX: 30,
  },
  {
    id: 12,
    name: "Caballo",
    image: "/horses/caballo12.JPG",
    greeting: "Hola, soy Caballo. Espero que te guste el lugar.",
    centerX: 50,
  },

  {
    id: 4,
    name: "Caballo",
    image: "/horses/caballo4.JPG",
    greeting: "Buenas, soy Caballo. Pasa a conocerme.",
    centerX: 25,
  },
];

const normalHorses = HORSES.slice(0, -2);
const lastTwoHorses = HORSES.slice(-2);

const CardWrap = ({ children }) => (
  <div className="w-full lg:w-[340px] xl:w-[360px]">{children}</div>
);

export default function HorsesSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 mt-4 sm:mt-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
          They’re part of our family too
        </h2>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {/* 15 hearts */}
          <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 ring-1 ring-rose-100">
            <FiHeart className="h-4 w-4" />
            15 hearts
          </span>

          {/* dot */}
          <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-slate-300" />

          {/* 60 paws */}
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 ring-1 ring-amber-100">
            <GiPawPrint className="h-4 w-4" />
            60 paws
          </span>

          {/* dot */}
          <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-slate-300" />

          {/* one family */}
          <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 ring-1 ring-sky-100">
            <FiUsers className="h-4 w-4" />
            one family
          </span>
        </div>

        {/* Divider */}
        <div className="mx-auto mt-6 h-1 w-20 rounded-full bg-slate-200" />
      </div>

      {/* Main grid */}
      <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 justify-items-center">
        {normalHorses.map((horse) => (
          <CardWrap key={horse.id}>
            <HorseCard horse={horse} />
          </CardWrap>
        ))}
      </div>


      <div className="mt-8 flex justify-center">
        <div className="grid gap-8 sm:flex sm:gap-8 sm:justify-center">
          {lastTwoHorses.map((horse) => (
            <CardWrap key={horse.id}>
              <HorseCard horse={horse} />
            </CardWrap>
          ))}
        </div>
      </div>
    </section>
  );
}
