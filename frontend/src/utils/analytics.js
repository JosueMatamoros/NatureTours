// Eventos de Google Analytics 4 y Google Ads (gtag en index.html:
// G-KD2MG9FDHZ y AW-18019046305).
// - GA4 `purchase`: estadística en Analytics.
// - Google Ads `conversion` "Reserva pagada (web)": la conversión principal que
//   usan las campañas (con conversiones mejoradas: email del cliente, Google lo
//   cifra con SHA-256 antes de enviarlo).
const ADS_CONVERSION = "AW-18019046305/fU2uCL3clrgdEKGnk5BD";

function gtagSafe(...args) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return false;
  window.gtag(...args);
  return true;
}

// Reserva pagada (página /success). Valor = precio del tour (sin la comisión
// de PayPal), aunque el cliente solo haya pagado el depósito: es lo que vale
// la reserva. Se manda una sola vez por pago (GA4 además deduplica por
// transaction_id).
export function trackPurchase(paymentId, receipt) {
  if (!paymentId || !receipt) return;
  const key = `nt_ga_purchase_${paymentId}`;
  try {
    if (localStorage.getItem(key)) return;
  } catch { /* sin localStorage: GA4 deduplica igual */ }

  const value = Number(receipt.subtotal) || Number(receipt.amount) || 0;
  const people = Number(receipt.personas) || 1;
  const sent = gtagSafe("event", "purchase", {
    transaction_id: String(paymentId),
    value,
    currency: "USD",
    payment_type: receipt.mode === "deposit" ? "deposit" : "full",
    items: [
      {
        item_id: String(receipt.tour || "tour").toLowerCase().replace(/\s+/g, "-"),
        item_name: receipt.tour || "Tour",
        quantity: people,
        price: Math.round((value / people) * 100) / 100,
      },
    ],
  });
  // Google Ads: conversión con el mismo valor y el ID de pago (evita duplicados).
  if (receipt.customerEmail) {
    gtagSafe("set", "user_data", { email: String(receipt.customerEmail).trim().toLowerCase() });
  }
  gtagSafe("event", "conversion", {
    send_to: ADS_CONVERSION,
    value,
    currency: "USD",
    transaction_id: String(paymentId),
  });

  if (sent) {
    try { localStorage.setItem(key, "1"); } catch { /* nada */ }
  }
}
