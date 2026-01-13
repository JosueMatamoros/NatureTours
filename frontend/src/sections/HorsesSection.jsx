import HorseCard from "../components/aboutUs/HorseCard";
import { FiHeart, FiUsers } from "react-icons/fi";
import { GiPawPrint } from "react-icons/gi";

const HORSES = [
  {
    id: 1,
    name: "Careta",
    image: "/horses/caballo1.JPG",
    greeting: "Hey there! I'm Careta, named after my little face.",
    centerX: 50,
  },
  {
    id: 2,
    name: "Lucero",
    image: "/horses/caballo2.JPG",
    greeting: "Hi! I'm Lucero, and I have a little mark on my forehead.",
    centerX: 50,
  },
  {
    id: 3,
    name: "Mamona",
    image: "/horses/caballo5.JPG",
    greeting: "Hi, I'm Mamona, and I'm always feeling sleepy.",
    centerX: 50,
  },
  {
    id: 4,
    name: "Rojita",
    image: "/horses/caballo13.JPG",
    greeting: "Hello! I'm Rojita, and I'm a little bit crazy.",
    centerX: 50,
  },
  {
    id: 5,
    name: "Mora",
    image: "/horses/caballo6.JPG",
    greeting: "Hey! I'm Mora. I'm also white, but with black hair.",
    centerX: 50,
  },
  {
    id: 6,
    name: "Canela",
    image: "/horses/caballo7.JPG",
    greeting: "Hi there! I'm Canela, and I love to eat.",
    centerX: 50,
  },
  {
    id: 7,
    name: "Colita",
    image: "/horses/caballo10.JPG",
    greeting: "Hello! I'm Colita, and I have black spots all over my body.",
    centerX: 50,
  },
  {
    id: 8,
    name: "Cola Larga",
    image: "/horses/caballo14.JPG",
    greeting: "Hi! I'm Cola Larga, and I'm great with kids.",
    centerX: 20,
  },
  {
    id: 9,
    name: "Josefina",
    image: "/horses/caballo9.JPG",
    greeting: "Greetings! I'm Josefina, the youngest in the family.",
    centerX: 50,
  },
  {
    id: 10,
    name: "Vaya",
    image: "/horses/caballo3.JPG",
    greeting: "Hey! I'm Vaya. I have a black stripe on my tail.",
    centerX: 50,
  },
  {
    id: 11,
    name: "India",
    image: "/horses/caballo11.JPG",
    greeting: "Hey there! I'm India. I love adventure.",
    centerX: 50,
  },
  {
    id: 12,
    name: "Peresoza",
    image: "/horses/caballo8.JPG",
    greeting: "Hi! I'm Peresoza, and I don't like to rush.",
    centerX: 30,
  },
  {
    id: 13,
    name: "Quebrada",
    image: "/horses/caballo12.JPG",
    greeting: "Hello! I'm Quebrada, and I love the water.",
    centerX: 50,
  },
  {
    id: 14,
    name: "Abuela",
    image: "/horses/caballo4.JPG",
    greeting: "Hello! I'm Abuela, the oldest in the family.",
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
