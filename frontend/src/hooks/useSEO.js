import { useEffect } from "react";
import { PAGES, SITE_URL, absUrl, NIGHT_WALK_LIVE } from "../seo/seoData";

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
  description = "Experience the best horseback riding tours in La Fortuna, Costa Rica through lush rainforest and beautiful nature trails.",
  keywords = "horseback riding la fortuna, horse tours costa rica, arenal volcano tours",
  canonical = "https://naturetourslafortuna.com/",
  image = "https://naturetourslafortuna.com/og-image.webp",
  type = "website",
  robots = "index, follow",
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
    updateMeta('meta[name="robots"]', "content", robots);
    updateMeta('meta[name="googlebot"]', "content", robots);

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
  }, [title, description, keywords, canonical, image, type, robots]);
}

// SEO por página: sale de src/seo/seoData.js (misma fuente que el prerender
// y el sitemap).
function fromPage(page) {
  return {
    title: page.title,
    description: page.description,
    canonical: absUrl(page.path),
    image: `${SITE_URL}${page.image}`,
  };
}

export const SEO_CONFIG = {
  home: fromPage(PAGES.home),
  horseback: fromPage(PAGES.horseback),
  tours: fromPage(PAGES.tours),
  nightWalk: { ...fromPage(PAGES.nightWalk), robots: NIGHT_WALK_LIVE ? "index, follow" : "noindex, follow" },
  about: fromPage(PAGES.about),
  services: fromPage(PAGES.services),
  contact: fromPage(PAGES.contact),
  // Páginas de reserva: no se indexan (son pasos del pago, no contenido).
  checkout: {
    title: "Book Your Tour | Nature Tours La Fortuna",
    description: "Select your date and group size to book your tour in La Fortuna.",
    canonical: `${SITE_URL}/checkout`,
    robots: "noindex, follow",
  },
};

export default useSEO;
