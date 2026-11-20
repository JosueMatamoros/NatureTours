// Saber cuándo un cliente llegó por un anuncio de Google y escribió por WhatsApp.
//
// 1) Al entrar con ?gclid= (o gbraid/wbraid, iPhone) se guarda en este
//    navegador "vino del anuncio" por 30 días.
// 2) Cualquier clic en un enlace de WhatsApp (wa.me) del sitio:
//    - si vino del anuncio, al mensaje se le agrega " (G)" al final → en el
//      WhatsApp del negocio se ve qué chats llegaron por Google;
//    - se manda el evento "whatsapp_click" a Analytics (con from_ad) y, si ya
//      existe la conversión en Google Ads, se cuenta ahí también.
const KEY = "nt_from_ad";
const DAYS = 30;
const AD_PARAMS = ["gclid", "gbraid", "wbraid"];
export const AD_TAG = " (G)";

// Etiqueta de la conversión "Contacto por WhatsApp" en Google Ads
// (secundaria: se cuenta pero no guía las ofertas). Vacía = solo Analytics.
const ADS_WHATSAPP = "";

function remember() {
  try {
    const q = new URLSearchParams(location.search);
    if (AD_PARAMS.some((p) => q.get(p))) localStorage.setItem(KEY, String(Date.now()));
  } catch { /* sin localStorage */ }
}

export function cameFromAd() {
  try {
    const t = Number(localStorage.getItem(KEY));
    return Boolean(t) && Date.now() - t < DAYS * 864e5;
  } catch {
    return false;
  }
}

// Se arma a mano con encodeURIComponent (espacios = %20): con "+" WhatsApp
// podría mostrar los signos en el mensaje.
function tagUrl(href) {
  const u = new URL(href);
  const text = u.searchParams.get("text") || "";
  if (text.endsWith(AD_TAG)) return href;
  return `${u.origin}${u.pathname}?text=${encodeURIComponent(text + AD_TAG)}`;
}

function onClick(e) {
  const a = e.target.closest?.('a[href^="https://wa.me/"]');
  if (!a) return;
  const fromAd = cameFromAd();
  if (fromAd) a.href = tagUrl(a.href);
  if (typeof window.gtag === "function") {
    window.gtag("event", "whatsapp_click", { from_ad: fromAd, page_path: location.pathname });
    if (ADS_WHATSAPP) window.gtag("event", "conversion", { send_to: ADS_WHATSAPP });
  }
}

export function initAdTracking() {
  if (typeof window === "undefined") return;
  remember();
  document.addEventListener("click", onClick, true);
}
