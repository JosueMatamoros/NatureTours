// Parser de correos de OTAs (GetYourGuide y Viator) → estructura de reserva.
// Devuelve null si el correo no es una reserva/cancelación reconocible
// (reviews, cambios de términos, etc. se ignoran).

const MONTHS_EN = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};
const MONTHS_ES = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10,
  noviembre: 11, diciembre: 12,
};

const pad = (n) => String(n).padStart(2, "0");

function normTime(h, m) {
  return `${pad(Number(h))}:${pad(Number(m))}`;
}

function tourIdFromName(name = "") {
  const n = name.toLowerCase();
  if (n.includes("night") || n.includes("walk") || n.includes("nocturn")) return 1;
  return 2; // Horseback / caballo (por defecto)
}

// "2 Adults", "2 x Adults (Edad...)", "1 x Children", "1 Infant"...
function parseParticipants(text) {
  let adults = 0, children = 0, babies = 0;
  const re = /(\d+)\s*(?:x\s*)?(adults?|adultos?|children|child|ni[nñ]os?|infants?|beb[eé]s?)/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const n = Number(m[1]);
    const type = m[2].toLowerCase();
    if (/adult|adulto/.test(type)) adults += n;
    else if (/child|ni[nñ]o/.test(type)) children += n;
    else babies += n;
  }
  return { adults, children, babies };
}

function cleanPhone(raw) {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d+]/g, "");
  return cleaned.length >= 6 ? cleaned : null;
}

export function detectProvider(from = "") {
  const f = from.toLowerCase();
  if (f.includes("getyourguide")) return "gyg";
  if (f.includes("viator")) return "viator";
  return null;
}

// ─── Viator ─────────────────────────────────────────────────────────────────
function parseViator({ from, subject, body }) {
  const text = body || "";
  const isCancel = /chargebacks@viator\.com/i.test(from) || /cancellation|cancelled/i.test(subject);

  const ref =
    (text.match(/Booking Reference:\s*(BR-\d+)/i) || [])[1] ||
    (subject.match(/(BR-\d+)/i) || [])[1] ||
    null;
  if (!ref) return null;

  if (isCancel) {
    return { provider: "viator", kind: "cancellation", externalRef: ref };
  }

  const dateM = text.match(/Travel Date:\s*[A-Za-z]{3,},?\s*([A-Za-z]{3,})\s+(\d{1,2}),?\s*(\d{4})/i);
  const timeM =
    text.match(/Tour Grade Code:\s*TG\d+~(\d{1,2}:\d{2})/i) ||
    text.match(/Tour Grade:[^\n|]*?(\d{1,2}:\d{2})/i);
  const nameM = text.match(/Lead Traveler Name:\s*([^\n|]+)/i);
  const travM = text.match(/Travelers?:\s*([^\n|]+)/i);
  const phoneM = text.match(/Phone:\s*([^\n|]+)/i);
  const tourM = text.match(/Tour Name:\s*([^\n|]+)/i);

  if (!dateM || !timeM) return null;
  const month = MONTHS_EN[dateM[1].slice(0, 3).toLowerCase()];
  if (!month) return null;
  const date = `${dateM[3]}-${pad(month)}-${pad(dateM[2])}`;
  const [h, m] = timeM[1].split(":");
  const pax = parseParticipants(travM ? travM[1] : "");
  if (pax.adults + pax.children < 1) pax.adults = 1;

  return {
    provider: "viator",
    kind: "confirmation",
    externalRef: ref,
    tourName: tourM ? tourM[1].trim() : "Viator",
    tourId: tourIdFromName(tourM ? tourM[1] : ""),
    date,
    time: normTime(h, m),
    name: nameM ? nameM[1].trim() : "Cliente Viator",
    phone: cleanPhone(phoneM ? phoneM[1] : ""),
    ...pax,
  };
}

// ─── GetYourGuide ────────────────────────────────────────────────────────────
function parseGyg({ subject, body }) {
  const text = body || "";
  const isCancel = /cancelaci[oó]n|cancelad|cancelled|cancellation/i.test(subject);

  const ref =
    (text.match(/N[uú]mero de referencia\s*(GYG[A-Z0-9]+)/i) || [])[1] ||
    (subject.match(/(GYG[A-Z0-9]+)/i) || [])[1] ||
    null;
  if (!ref) return null;

  if (isCancel) {
    return { provider: "gyg", kind: "cancellation", externalRef: ref };
  }

  // "Fecha 11 de septiembre de 2026, 8:00"
  const dateM = text.match(/Fecha\s*(\d{1,2})\s+de\s+([A-Za-zé]+)\s+de\s+(\d{4}),?\s*(\d{1,2}):(\d{2})/i);
  if (!dateM) return null;
  const month = MONTHS_ES[dateM[2].toLowerCase()];
  if (!month) return null;
  const date = `${dateM[3]}-${pad(month)}-${pad(dateM[1])}`;
  const time = normTime(dateM[4], dateM[5]);

  const partM = text.match(/N[uú]mero de participantes\s*([^\n|]*(?:\n[^\n|]*x\s*[A-Za-z][^\n|]*)*)/i);
  const pax = parseParticipants(partM ? partM[1] : text);
  if (pax.adults + pax.children < 1) pax.adults = 1;

  const nameM = text.match(/Cliente principal\s*(.+?)\s+(?:customer-|[\w.+-]+@)/is);
  const phoneM = text.match(/Tel[eé]fono:\s*(\+?[\d\s()-]+)/i);
  const tourM = text.match(/reserva de última hora:\s*([^\n|]+)|Se ha reservado tu producto\s*([^\n|]+)/i);
  const tourName = tourM ? (tourM[1] || tourM[2] || "").trim() : "GetYourGuide";

  return {
    provider: "gyg",
    kind: "confirmation",
    externalRef: ref,
    tourName,
    tourId: tourIdFromName(tourName),
    date,
    time,
    name: nameM ? nameM[1].trim() : "Cliente GetYourGuide",
    phone: cleanPhone(phoneM ? phoneM[1] : ""),
    ...pax,
  };
}

export function parseOtaEmail({ from = "", subject = "", body = "" }) {
  const provider = detectProvider(from);
  try {
    if (provider === "viator") return parseViator({ from, subject, body });
    if (provider === "gyg") return parseGyg({ subject, body });
  } catch {
    return null;
  }
  return null;
}
