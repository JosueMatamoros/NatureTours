import { useEffect } from "react";

/**
 * Hook to handle dynamic SEO per page
 * Updates title, meta description, canonical URL and Open Graph tags
 *
 * @param {Object} options - SEO configuration
 * @param {string} options.title - Page title
 * @param {string} options.description - SEO description
 * @param {string} options.keywords - Keywords separated by comma
 * @param {string} options.canonical - Canonical URL of the page
 * @param {string} options.image - Image for Open Graph
 * @param {string} options.type - Page type (website, article, product)
 */
export function useSEO({
  title = "Nature Tours La Fortuna",
  description = "Experience the best horseback riding tours in La Fortuna, Costa Rica with stunning Arenal Volcano views.",
  keywords = "horseback riding la fortuna, horse tours costa rica, arenal volcano tours",
  canonical = "https://naturetourslafortuna.com/",
  image = "https://naturetourslafortuna.com/og-image.webp",
  type = "website",
}) {
  useEffect(() => {
    // Actualizar título
    document.title = title;

    // Helper para actualizar o crear meta tags
    const updateMeta = (selector, attribute, content) => {
      let element = document.querySelector(selector);
      if (element) {
        element.setAttribute("content", content);
      } else {
        element = document.createElement("meta");
        const [attr, value] = Object.entries(
          selector.includes("property=")
            ? { property: selector.match(/property="([^"]+)"/)[1] }
            : { name: selector.match(/name="([^"]+)"/)[1] }
        )[0];
        element.setAttribute(attr, value);
        element.setAttribute("content", content);
        document.head.appendChild(element);
      }
    };

    // Meta tags básicos
    updateMeta('meta[name="description"]', "content", description);
    updateMeta('meta[name="keywords"]', "content", keywords);

    // Open Graph
    updateMeta('meta[property="og:title"]', "content", title);
    updateMeta('meta[property="og:description"]', "content", description);
    updateMeta('meta[property="og:url"]', "content", canonical);
    updateMeta('meta[property="og:image"]', "content", image);
    updateMeta('meta[property="og:type"]', "content", type);

    // Twitter
    updateMeta('meta[name="twitter:title"]', "content", title);
    updateMeta('meta[name="twitter:description"]', "content", description);
    updateMeta('meta[name="twitter:url"]', "content", canonical);
    updateMeta('meta[name="twitter:image"]', "content", image);

    // Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute("href", canonical);
    } else {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      canonicalLink.setAttribute("href", canonical);
      document.head.appendChild(canonicalLink);
    }
  }, [title, description, keywords, canonical, image, type]);
}

// SEO configurations per page
export const SEO_CONFIG = {
  home: {
    title: "Nature Tours La Fortuna | Horseback Riding Tours in Costa Rica",
    description:
      "Experience the best horseback riding tours in La Fortuna, Costa Rica. Explore stunning Arenal Volcano views, river crossings, and tropical rainforest trails. Book your adventure today!",
    keywords:
      "horseback riding la fortuna, horse tours costa rica, arenal volcano tours, la fortuna tours, things to do in la fortuna, la fortuna activities, best tours la fortuna, family tours costa rica, adventure tours la fortuna, sunset horseback riding costa rica",
    canonical: "https://naturetourslafortuna.com/",
    image: "https://naturetourslafortuna.com/og-image.webp",
  },
  tours: {
    title: "Horseback Riding Tours in La Fortuna | Nature Tours Costa Rica",
    description:
      "Explore La Fortuna on horseback with breathtaking Arenal Volcano views. Sunset rides, river crossings, mountain trails, and unforgettable experiences with well-trained horses. Perfect for families!",
    keywords:
      "horseback riding la fortuna, horse tours arenal, costa rica horseback tours, sunset horse ride la fortuna, horse riding tour costa rica, trail riding arenal volcano, family horse tours, private horseback tour",
    canonical: "https://naturetourslafortuna.com/tours",
    image: "https://naturetourslafortuna.com/tours/bento/image1.webp",
  },
  about: {
    title: "About Us | Nature Tours La Fortuna - Family Owned Horse Tours",
    description:
      "Meet the family behind Nature Tours La Fortuna. We are passionate about sharing authentic Costa Rican experiences with well-trained horses and personalized service near Arenal Volcano.",
    keywords:
      "nature tours la fortuna, family horse tours costa rica, about nature tours, la fortuna horses, local tour guides arenal, authentic costa rica experience",
    canonical: "https://naturetourslafortuna.com/about",
    image: "https://naturetourslafortuna.com/aboutUs/about-main.webp",
  },
  services: {
    title: "Services & Accommodation | Nature Tours La Fortuna Costa Rica",
    description:
      "Rural lodging, villas and houses near Arenal Volcano. Combine your horseback riding tour with an unforgettable stay surrounded by nature in La Fortuna.",
    keywords:
      "la fortuna accommodation, arenal villas, rural lodging costa rica, nature lodge la fortuna, eco accommodation arenal, vacation rental la fortuna",
    canonical: "https://naturetourslafortuna.com/services",
    image: "https://naturetourslafortuna.com/houses/villaAurora/villa1.webp",
  },
  contact: {
    title: "Contact Us | Nature Tours La Fortuna - Book Your Tour Today",
    description:
      "Contact us to book your horseback riding tour in La Fortuna. WhatsApp available for quick responses. We're here to help you plan your Costa Rica adventure!",
    keywords:
      "contact nature tours, book tour la fortuna, la fortuna tours booking, whatsapp tours costa rica, reserve horse tour arenal",
    canonical: "https://naturetourslafortuna.com/contact",
  },
  checkout: {
    title: "Book Your Horseback Tour | Nature Tours La Fortuna",
    description:
      "Book your horseback riding tour in La Fortuna online. Select your date, group size and confirm your adventure near Arenal Volcano. Instant confirmation!",
    keywords: "book tour la fortuna, arenal tours booking, horseback riding reservation, online booking costa rica tours",
    canonical: "https://naturetourslafortuna.com/checkout",
  },
};

export default useSEO;
