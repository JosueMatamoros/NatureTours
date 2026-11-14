// Fuente única de SEO por página: la usan el sitio (useSEO), el prerender
// (scripts/prerender.mjs) y el sitemap. JS puro (sin JSX) para poder
// importarlo desde Node.

export const SITE_URL = "https://naturetourslafortuna.com";

// La caminata nocturna todavía no se vende ("Coming soon"). Mientras sea
// false, su página existe pero no se indexa ni va al sitemap/menú.
export const NIGHT_WALK_LIVE = false;

export const PATHS = {
  home: "/",
  horseback: "/horseback-riding-la-fortuna",
  nightWalk: "/night-walk-la-fortuna",
  tours: "/la-fortuna-tours",
  about: "/about",
  services: "/services",
  contact: "/contact",
};

// Rutas viejas → nuevas (301 en Cloudflare vía public/_redirects y
// redirección en el cliente).
export const LEGACY_REDIRECTS = {
  "/tours": PATHS.horseback,
  "/SelecTour": PATHS.tours,
};

export const PAGES = {
  home: {
    path: PATHS.home,
    title: "Horseback Riding in La Fortuna, Costa Rica | Nature Tours",
    description:
      "Family-owned horseback riding tours in La Fortuna near Arenal Volcano: forest trails, river crossings and fresh fruit. Rated 5.0 on Google. From $50 — book online.",
    image: "/og-image.webp",
    changefreq: "weekly",
    priority: "1.0",
  },
  horseback: {
    path: PATHS.horseback,
    title: "Horseback Riding La Fortuna – River Crossing Tour | From $50",
    description:
      "2-hour horseback riding tour in La Fortuna near Arenal Volcano: rainforest trails, local farms and river crossings. Beginners and kids welcome. Adults $50, kids $35.",
    image: "/tours/bento/image1.webp",
    changefreq: "weekly",
    priority: "0.9",
  },
  nightWalk: {
    path: PATHS.nightWalk,
    title: "Night Walk Tour in La Fortuna – Frogs & Wildlife | $45",
    description:
      "Guided 2-hour night walk in La Fortuna, Costa Rica: look for red-eyed tree frogs and nocturnal wildlife with a local bilingual guide. Flashlight included. 6pm and 8pm.",
    image: "/tours/AgalychnisCallidryas.webp",
    changefreq: "weekly",
    priority: "0.8",
  },
  tours: {
    path: PATHS.tours,
    title: "La Fortuna Tours – Horseback Riding near Arenal | Nature Tours",
    description:
      "Tours in La Fortuna, Costa Rica by a local family: horseback riding with river crossings near Arenal Volcano, plus partner tours to the volcano, waterfall and hanging bridges.",
    image: "/og-image.webp",
    changefreq: "weekly",
    priority: "0.8",
  },
  about: {
    path: PATHS.about,
    title: "About Us – Family-Owned Horse Tours in La Fortuna | Nature Tours",
    description:
      "Meet the family behind Nature Tours La Fortuna: local guides and well-cared-for horses near Arenal Volcano, sharing authentic Costa Rican experiences.",
    image: "/aboutUs/about-main.webp",
    changefreq: "monthly",
    priority: "0.7",
  },
  services: {
    path: PATHS.services,
    title: "Services & Accommodation near Arenal | Nature Tours La Fortuna",
    description:
      "Rural lodging, villas and houses near Arenal Volcano. Combine your horseback riding tour with a stay surrounded by nature in La Fortuna.",
    image: "/houses/villaAurora/villa1.webp",
    changefreq: "monthly",
    priority: "0.6",
  },
  contact: {
    path: PATHS.contact,
    title: "Contact & Directions | Nature Tours La Fortuna",
    description:
      "Book your horseback riding tour in La Fortuna. WhatsApp for quick answers and directions: a few minutes from downtown La Fortuna on Route 702.",
    image: "/og-image.webp",
    changefreq: "monthly",
    priority: "0.7",
  },
};

// Páginas que se prerenderizan (HTML completo para Google) y van al sitemap.
export const PRERENDERED_PAGES = [
  PAGES.home,
  PAGES.horseback,
  ...(NIGHT_WALK_LIVE ? [PAGES.nightWalk] : []),
  PAGES.tours,
  PAGES.about,
  PAGES.services,
  PAGES.contact,
];

export const PRERENDERED_PATHS = PRERENDERED_PAGES.map((p) => p.path);

export const absUrl = (p) => (p === "/" ? `${SITE_URL}/` : `${SITE_URL}${p}`);
