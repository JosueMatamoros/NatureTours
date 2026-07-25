// src/data/partnerTours.js
// Tours operados por Canoa Aventura, nuestro socio en La Fortuna.
// No se reservan en nuestro checkout: cada tarjeta abre su portal de reservas
// con nuestro código de socio incluido en la URL.
//
// `image`: ruta en /public. Si queda null, la tarjeta usa el ícono sobre
// gradiente como respaldo.
import {
  TbWaveSine,
  TbBuildingBridge2,
  TbDroplet,
  TbRipple,
  TbSailboat,
  TbBinoculars,
  TbSunset,
  TbBath,
  TbMountain,
  TbTrekking,
  TbMap2,
  TbTrees,
  TbBuildingBridge,
  TbCompass,
  TbMoonStars,
  TbPaw,
  TbMoon,
  TbSunLow,
} from "react-icons/tb";

const AFFILIATE =
  "gDwbGfcPGVZaOCObBBuWnfrLagOWggNNjKoppRFvneWCfjdgkYDZDukebyBIeOVOYKEPbI?at=tsUNuOuNQfLrSTbtlKPTXiWTBGttwIzrBUFvizJyeUqxnSrYcIszqPTqVNkSVkKWFPSnPb";

// Portal general del socio; respaldo para tours sin id conocido todavía.
export const PARTNER_BOOKING_URL = `https://alma-verde.canoa-aventura.com/main/${AFFILIATE}`;

const tourUrl = (slug, id) =>
  id == null
    ? PARTNER_BOOKING_URL
    : `https://alma-verde.canoa-aventura.com/tour/la-fortuna/${slug}/${id}/${AFFILIATE}`;

// Filtros de la sección. "combo" no es una categoría de contenido: filtra por
// el flag `combo` de cada tour en vez de por `categories`.
export const PARTNER_CATEGORIES = [
  { id: "river", label: "River tours" },
  { id: "adrenaline", label: "Adrenaline" },
  { id: "hiking", label: "Hiking" },
  { id: "bridges", label: "Hanging bridges" },
  { id: "waterfall", label: "Waterfall" },
  { id: "volcano", label: "Volcano" },
  { id: "hotsprings", label: "Hot springs" },
  { id: "combo", label: "Combos" },
];

export const PARTNER_TOURS = [
  {
    id: "rafting-sarapiqui",
    categories: ["river", "adrenaline"],
    name: "White Water Rafting — Sarapiquí River",
    description:
      "Class II–III rapids through the rainforest, with the chance to spot toucans, monkeys, and iguanas along the way. The most adrenaline-packed adventure near Arenal.",
    duration: "7 hours",
    minAge: "Ages 7+",
    priceFrom: 105.87,
    image: "/tours/partners/rafting-sarapiqui.webp",
    icon: TbWaveSine,
    url: tourUrl("white-water-rafting-sarapiqui-river", 3),
  },
  {
    id: "rio-celeste",
    categories: ["hiking"],
    name: "Rio Celeste Guided Tour",
    description:
      "Hike Tenorio Volcano National Park to the 30-meter turquoise waterfall and Los Teñideros, where two rivers meet and turn a striking blue.",
    duration: "5–6 hours",
    minAge: "Ages 5+ · 5–11: 25% off",
    priceFrom: 140,
    image: "/tours/partners/rio-celeste.webp",
    icon: TbDroplet,
    url: tourUrl("rio-celeste-guided-tour-from-la-fortuna", 7),
  },
  {
    id: "hanging-bridges-waterfall",
    categories: ["bridges", "waterfall"],
    name: "Hanging Bridges & La Fortuna Waterfall",
    description:
      "Walk the rainforest canopy on suspended bridges with panoramic views of the volcano, then cool off in the natural pools at the base of the waterfall.",
    duration: "7 hours",
    minAge: "Kids 0–3 free · 4–11 half price",
    priceFrom: 159.33,
    combo: true,
    image: "/tours/partners/hanging-bridges-waterfall.webp",
    icon: TbBuildingBridge2,
    url: tourUrl("hanging-bridges-and-la-fortuna-waterfall", 11),
  },
];

// Grupos temáticos que se muestran bajo los destacados.
export const TOUR_GROUPS = [
  {
    id: "rivers",
    title: "Down the river",
    subtitle: "The calmest way to get close to the wildlife around La Fortuna.",
    tours: [
      {
        id: "safari-float-river",
        categories: ["river"],
        name: "Safari Float River Tour",
        description:
          "A safe, calm-water ride down the Peñas Blancas River spotting monkeys, crocodiles and birds — all the thrill of the river without the intense rapids.",
        duration: "4.5 hours",
        minAge: "Kids 3–11: 40% off",
        priceFrom: 83.06,
        image: "/tours/partners/safari-float-river.webp",
        icon: TbRipple,
        url: tourUrl("safari-float-river-tour-from-la-fortuna", 1),
      },
      {
        id: "safari-float-kayak",
        categories: ["river"],
        name: "Safari Float in Kayak",
        description:
          "Paddle your own kayak down the calm waters of the Peñas Blancas River, taking in the native flora and fauna with a stop at a garden to learn about coffee, chocolate and sugar cane.",
        duration: "4.5 hours",
        minAge: "Ages 5+",
        priceFrom: 88.71,
        image: "/tours/partners/safari-float-kayak.webp",
        icon: TbSailboat,
        url: tourUrl("safari-float-in-kayak-from-la-fortuna", 2),
      },
      {
        id: "cano-negro",
        categories: ["river"],
        name: "Wildlife Boat Trip Caño Negro",
        description:
          "A boat trip along the Rio Frio through the Caño Negro wetlands, home to over 300 bird species, monkeys and caimans, with a visit to the local community and its traditional cuisine.",
        duration: "7 hours",
        minAge: "Kids 0–3 free · 4–11: 30% off",
        priceFrom: 96.05,
        image: "/tours/partners/cano-negro.webp",
        icon: TbBinoculars,
        url: tourUrl("wildlife-boat-trip-cano-negro", 6),
      },
    ],
  },
  {
    id: "hiking-hot-springs",
    title: "Hiking & hot springs",
    subtitle: "Hike the 1968 lava trails, then soak in volcanic hot springs.",
    tours: [
      {
        id: "bridges-waterfall-hiking-baldi-dinner",
        categories: ["bridges", "waterfall", "volcano", "hiking", "hotsprings"],
        name: "Hanging Bridges, Waterfall, Volcano Hiking & Baldi",
        description:
          "The full La Fortuna day: Mistico hanging bridges, the 230-foot waterfall, the volcano lava trails and Baldi hot springs, with lunch and a traditional dinner.",
        duration: "13 hours",
        minAge: "Kids 0–3 free · 4–11 half price",
        priceFrom: 278.15,
        combo: true,
        image: "/tours/partners/bridges-waterfall-hiking-baldi.webp",
        icon: TbSunset,
        url: tourUrl(
          "hanging-bridges-la-fortuna-waterfall-volcano-hiking-with-baldi-and-dinner",
          18,
        ),
      },
      {
        id: "volcano-hiking-baldi",
        categories: ["volcano", "hiking", "hotsprings"],
        name: "Volcano Hiking & Baldi Hot Springs",
        description:
          "Hike the primary forest and the 1968 lava fields, then unwind at Baldi — over 25 pools and waterfalls at different temperatures.",
        duration: "6 hours",
        minAge: "Kids 0–3 free · 4–11 half price",
        priceFrom: 170.63,
        combo: true,
        image: "/tours/partners/volcano-hiking-baldi.webp",
        icon: TbBath,
        url: tourUrl("volcano-hiking-with-baldi-hot-springs", 22),
      },
      {
        id: "volcano-hiking-paradise",
        categories: ["volcano", "hiking", "hotsprings"],
        name: "Volcano Hiking & Paradise Hot Springs",
        description:
          "A two-hour guided hike with viewpoints over the cone and Lake Arenal, ending at the quieter thermal pools of Paradise.",
        duration: "7 hours",
        minAge: "Kids 0–3 free · 4–11 half price",
        priceFrom: 166.89,
        combo: true,
        image: "/tours/partners/volcano-hiking-paradise.webp",
        icon: TbMountain,
        url: tourUrl("volcano-hiking-with-paradise-hot-springs", 25),
      },
    ],
  },
  {
    id: "hiking-trails",
    title: "Hiking & trails",
    subtitle: "Guided walks through lava fields, park trails and old-growth jungle.",
    tours: [
      {
        id: "arenal-volcano-hiking-trails",
        categories: ["hiking", "volcano"],
        name: "Arenal Volcano Hiking Trails",
        description:
          "A two-hour hike over the 1968 lava flows of the 1,633-meter volcano, watching the rainforest grow back and taking in Lake Arenal.",
        duration: "4 hours",
        minAge: "Kids 0–3 free · 4–11 half price",
        priceFrom: 77.99,
        image: "/tours/partners/arenal-volcano-hiking-trails.webp",
        icon: TbTrekking,
        url: tourUrl("arenal-volcano-hiking-trails-from-la-fortuna", 15),
      },
      {
        id: "arenal-national-park-trails",
        categories: ["hiking", "volcano"],
        name: "Arenal Volcano National Park Trails",
        description:
          "From ancient lava fields to dense rainforest, with certified guides sharing the area's natural history and geology on well-marked trails for every fitness level.",
        minAge: "Ages 3+ · Kids 11 & under: 40% off",
        priceFrom: 102.83,
        image: "/tours/partners/arenal-national-park-trails.webp",
        icon: TbMap2,
        url: tourUrl("arenal-volcano-national-park-hiking-trails", 16),
      },
      {
        id: "jungle-trekking-culture",
        categories: ["hiking"],
        name: "Jungle Trekking & Culture Experience",
        description:
          "About 7 km through old-growth forest near the Children's Eternal Rainforest, a swim in a natural pool and a wood-fired lunch of empanadas and beans.",
        duration: "5.5 hours",
        minAge: "Ages 3+ · 3–11: 40% off",
        priceFrom: 110,
        combo: true,
        image: "/tours/partners/jungle-trekking-culture.webp",
        icon: TbTrees,
        url: tourUrl("jungle-trekking-and-culture-experience-from-la-fortuna", 82),
      },
    ],
    // Segundo bloque del mismo grupo, con su propio divisor.
    sections: [
      {
        label: "Hanging bridges included",
        tours: [
          {
            id: "hanging-bridges-guided",
        categories: ["bridges"],
            name: "La Fortuna Hanging Bridges Guided Tour",
            description:
              "A 2-mile walk through primary rainforest crossing 6 hanging bridges and 10 metal frame bridges, with views of Arenal Volcano and a chance to spot mammals, birds, insects and more along the way.",
            duration: "4 hours",
            minAge: "Kids 0–3 free · 4–11 half price",
            priceFrom: 85.88,
            image: "/tours/partners/hanging-bridges-guided.webp",
            icon: TbBuildingBridge,
            url: tourUrl("la-fortuna-hanging-bridges-guided-tour", 8),
          },
          {
            id: "lava-trails-waterfall-bridges",
        categories: ["volcano", "hiking", "waterfall", "bridges"],
            name: "Lava Trails, Waterfall & Hanging Bridges",
            description:
              "Hike the volcanic lava trails with Arenal Volcano views, swim at La Fortuna Waterfall and cross the Mistico hanging bridges — transportation, guide and a traditional lunch included. Optionally end the day at the hot springs of your choice.",
            duration: "9.5 hours",
            minAge: "Kids 0–3 free · 4–11 half price",
            priceFrom: 191.23,
            combo: true,
            image: "/tours/partners/lava-trails-waterfall-bridges.webp",
            icon: TbCompass,
            url: tourUrl(
              "lava-flow-trails-la-fortuna-waterfall-and-hanging-bridges",
              14,
            ),
          },
          {
            id: "bridges-waterfall-hiking-paradise-dinner",
        categories: ["bridges", "waterfall", "volcano", "hiking", "hotsprings"],
            name: "Hanging Bridges, Waterfall, Volcano Hiking & Paradise",
            description:
              "The full day with Paradise hot springs: Mistico bridges, the 70-meter waterfall, the lava trails and thermal pools, with lunch and a traditional dinner.",
            duration: "13 hours",
            minAge: "Kids 0–3 free · 4–11 half price",
            priceFrom: 296.06,
            combo: true,
            image: "/tours/partners/bridges-waterfall-hiking-paradise.webp",
            icon: TbMoonStars,
            url: tourUrl(
              "hanging-bridges-la-fortuna-waterfall-volcano-hiking-with-paradise-and-dinner",
              20,
            ),
          },
        ],
      },
    ],
  },
  {
    id: "wildlife-night",
    title: "Wildlife & night walks",
    subtitle: "Sloths at golden hour and the rainforest after dark, with a naturalist.",
    tours: [
      {
        id: "sloth-encounter",
        categories: ["wildlife"],
        name: "Sloth Encounter",
        description:
          "An easy 800-meter trail through a reforested sanctuary to see two-toed and three-toed sloths, with telescope, binoculars and a homemade snack.",
        duration: "1.5 hours",
        minAge: "Ages 5+ · Kids up to 11: 40% off",
        priceFrom: 79.1,
        image: "/tours/partners/sloth-encounter.webp",
        icon: TbPaw,
        url: tourUrl(
          "sloth-encounter-a-costa-rican-wildlife-adventure-in-la-fortuna",
          83,
        ),
      },
      {
        id: "night-walk",
        categories: ["wildlife"],
        name: "Nocturnal Wonders Night Walk",
        description:
          "An 800-meter trail after sunset to find red-eyed tree frogs, caimans, reptiles, glowing insects and nocturnal birds, with a snack of fresh tropical fruits, pastries and natural juices before setting out. Flashlight included.",
        duration: "2 hours",
        minAge: "Ages 5+ · Kids up to 11: 40% off",
        priceFrom: 79.1,
        image: "/tours/partners/night-walk.webp",
        icon: TbMoon,
        url: tourUrl(
          "la-fortuna-s-nocturnal-wonders-a-guided-night-walk-adventure",
          84,
        ),
      },
      {
        id: "twilight-expedition",
        categories: ["wildlife"],
        name: "Twilight Expedition: Sloths & Frogs",
        description:
          "A scenic hike at golden hour to spot sloths, a snack of tropical fruits and natural juices, then a guided night hike with flashlights to find frogs, insects and reptiles after dark. Small groups of up to 12.",
        duration: "4 hours",
        minAge: "Ages 5+",
        priceFrom: 142,
        image: "/tours/partners/twilight-expedition.webp",
        icon: TbSunLow,
        url: tourUrl(
          "twilight-expedition-sloths-frogs-rainforest-secrets-in-la-fortuna",
          85,
        ),
      },
    ],
  },
];
