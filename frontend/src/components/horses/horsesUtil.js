// Utilidades de Caballos (fechas, estado de herraduras, fotos).
// ─── Fechas ─────────────────────────────────────────────────────────────────
export const pad = (n) => String(n).padStart(2, "0");
export const toYmd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromYmd = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
export const shiftYmd = (s, n) => { const d = fromYmd(s); d.setDate(d.getDate() + n); return toYmd(d); };
export const dayLabel = (s) => fromYmd(s).toLocaleDateString("es-CR", { weekday: "long", day: "numeric", month: "long" });
export const shortDay = (s) => fromYmd(s).toLocaleDateString("es-CR", { weekday: "short", day: "numeric", month: "short" });
export function clock(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${pad(m)} ${h < 12 ? "AM" : "PM"}`;
}

// Cada cuánto se hierra: aviso amarillo a las 6 semanas, rojo a las 8.
export const HERRAR_PRONTO = 42;
export const HERRAR_YA = 56;
export const HOOF_NAME = { mi: "Mano izquierda", md: "Mano derecha", pi: "Pata izquierda", pd: "Pata derecha" };

export function shoeSummary(s) {
  const front = s.mi && s.md, back = s.pi && s.pd, n = ["mi", "md", "pi", "pd"].filter((k) => s[k]).length;
  if (n === 4) return "Herrado de las 4";
  if (n === 0) return "Sin herraduras";
  if (front && !s.pi && !s.pd) return "Solo las manos";
  if (back && !s.mi && !s.md) return "Solo las patas";
  return `${n} herradura${n === 1 ? "" : "s"}`;
}
export const missingShoe = (s) => s.mi !== s.md || s.pi !== s.pd;
export const maxDays = (h) => Math.max(h.daysFront ?? -1, h.daysBack ?? -1);

// Estado general de un caballo: { tone, label }
export function statusOf(h) {
  if (!h.active) return { tone: "gray", label: "Ya no trabaja" };
  if (h.resting) return { tone: "red", label: h.restUntil >= "2999" ? "No disponible" : `Descansa hasta ${shortDay(h.restUntil)}` };
  if (missingShoe(h.shoes)) return { tone: "amber", label: "Le falta una herradura" };
  const d = maxDays(h);
  if (d >= HERRAR_YA) return { tone: "red", label: `Toca herrar (${d} días)` };
  if (d >= HERRAR_PRONTO) return { tone: "amber", label: `Herrar pronto (${d} días)` };
  return { tone: "green", label: "" }; // bien: no se muestra nada
}
export const TONE = {
  green: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  amber: "bg-amber-100 text-amber-800 ring-amber-200",
  red: "bg-red-100 text-red-700 ring-red-200",
  gray: "bg-slate-100 text-slate-500 ring-slate-200",
  blue: "bg-sky-100 text-sky-800 ring-sky-200",
};

// Achica la foto en el teléfono (cuadrada, 360 px) antes de mandarla.
export function photoToDataUrl(file, size = 360) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const c = document.createElement("canvas");
      c.width = size; c.height = size;
      c.getContext("2d").drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("No se pudo leer la foto")); };
    img.src = url;
  });
}

// Sin foto: cada caballo con su color (siempre el mismo) para reconocerlo rápido.
export const AVATAR_COLORS = [
  "bg-amber-200 text-amber-900", "bg-orange-200 text-orange-900", "bg-rose-200 text-rose-900", "bg-lime-200 text-lime-900",
  "bg-sky-200 text-sky-900", "bg-violet-200 text-violet-900", "bg-teal-200 text-teal-900", "bg-yellow-200 text-yellow-900",
  "bg-stone-300 text-stone-900", "bg-pink-200 text-pink-900", "bg-emerald-200 text-emerald-900", "bg-indigo-200 text-indigo-900",
];
export function avatarColor(name) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

// ─── Asientos de un tour ────────────────────────────────────────────────────
// Orden: encargado de caballos (Marlon) → guía → cada grupo (adultos y niños)
// → extras. Sin nombres de clientes: solo cuántos son y si vienen niños.
export function seatLabel(slot, seat) {
  if (seat.startsWith("m:")) return slot.wranglers?.find((w) => `m:${w.id}` === seat)?.name || "Encargado";
  if (seat.startsWith("g:")) {
    const g = slot.guides.find((x) => `g:${x.id}` === seat);
    return g ? `Guía · ${g.name}` : "Guía";
  }
  if (seat.startsWith("x:")) return "Extra";
  const [, bid, n] = seat.split(":");
  const i = slot.groups.findIndex((x) => x.bookingId === bid);
  const grp = slot.groups[i];
  if (!grp) return "Cliente";
  return `Grupo ${i + 1} · ${Number(n) > grp.adults ? "Niño" : "Adulto"}`;
}

export function slotSeats(slot, extraCount = 0) {
  const wr = (slot.wranglers || []).map((w) => `m:${w.id}`);
  const gd = slot.guides.length ? slot.guides.map((g) => `g:${g.id}`) : ["g:0"];
  const cl = slot.groups.flatMap((g) => g.seats);
  const ex = Array.from({ length: extraCount }, (_, i) => `x:${i + 1}`);
  return { wr, gd, cl, ex };
}

export function slotProgress(slot) {
  const { wr, gd, cl } = slotSeats(slot);
  const need = [...wr, ...gd, ...cl];
  return { done: need.filter((s) => slot.assigned[s]).length, need: need.length };
}

