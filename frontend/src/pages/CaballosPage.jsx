// Caballos: asignar caballos a cada tour y llevar herraduras y salud.
// Lo usa sobre todo el encargado de caballos desde el teléfono, así que todo
// es visual: fotos grandes, colores, botones grandes y poco texto.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft, FiCamera, FiCheck, FiChevronLeft, FiChevronRight, FiEdit2, FiPlus, FiX, FiClock, FiUser, FiAlertTriangle, FiFileText,
} from "react-icons/fi";
import { GiHorseHead, GiHorseshoe, GiHammerNails, GiStickingPlaster } from "react-icons/gi";
import {
  horsesMe, listHorses, createHorse, updateHorse, addHorseEvent, horseHistory, horsesDay, assignHorse,
} from "../../services/horses.api";

// ─── Fechas ─────────────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, "0");
const toYmd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromYmd = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const shiftYmd = (s, n) => { const d = fromYmd(s); d.setDate(d.getDate() + n); return toYmd(d); };
const dayLabel = (s) => fromYmd(s).toLocaleDateString("es-CR", { weekday: "long", day: "numeric", month: "long" });
const shortDay = (s) => fromYmd(s).toLocaleDateString("es-CR", { weekday: "short", day: "numeric", month: "short" });
function clock(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${pad(m)} ${h < 12 ? "AM" : "PM"}`;
}

// Cada cuánto se hierra: aviso amarillo a las 6 semanas, rojo a las 8.
const HERRAR_PRONTO = 42;
const HERRAR_YA = 56;
const HOOF_NAME = { mi: "Mano izquierda", md: "Mano derecha", pi: "Pata izquierda", pd: "Pata derecha" };

function shoeSummary(s) {
  const front = s.mi && s.md, back = s.pi && s.pd, n = ["mi", "md", "pi", "pd"].filter((k) => s[k]).length;
  if (n === 4) return "Herrado de las 4";
  if (n === 0) return "Sin herraduras";
  if (front && !s.pi && !s.pd) return "Solo las manos";
  if (back && !s.mi && !s.md) return "Solo las patas";
  return `${n} herradura${n === 1 ? "" : "s"}`;
}
const missingShoe = (s) => s.mi !== s.md || s.pi !== s.pd;
const maxDays = (h) => Math.max(h.daysFront ?? -1, h.daysBack ?? -1);

// Estado general de un caballo: { tone, label }
function statusOf(h) {
  if (!h.active) return { tone: "gray", label: "Ya no trabaja" };
  if (h.resting) return { tone: "red", label: `Descansa hasta ${shortDay(h.restUntil)}` };
  if (missingShoe(h.shoes)) return { tone: "amber", label: "Le falta una herradura" };
  const d = maxDays(h);
  if (d >= HERRAR_YA) return { tone: "red", label: `Toca herrar (${d} días)` };
  if (d >= HERRAR_PRONTO) return { tone: "amber", label: `Herrar pronto (${d} días)` };
  return { tone: "green", label: "Listo" };
}
const TONE = {
  green: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  amber: "bg-amber-100 text-amber-800 ring-amber-200",
  red: "bg-red-100 text-red-700 ring-red-200",
  gray: "bg-slate-100 text-slate-500 ring-slate-200",
  blue: "bg-sky-100 text-sky-800 ring-sky-200",
};

// Achica la foto en el teléfono (cuadrada, 360 px) antes de mandarla.
function photoToDataUrl(file, size = 360) {
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

// ─── Piezas visuales ────────────────────────────────────────────────────────
// Sin foto: cada caballo con su color (siempre el mismo) para reconocerlo rápido.
const AVATAR_COLORS = [
  "bg-amber-200 text-amber-900", "bg-orange-200 text-orange-900", "bg-rose-200 text-rose-900", "bg-lime-200 text-lime-900",
  "bg-sky-200 text-sky-900", "bg-violet-200 text-violet-900", "bg-teal-200 text-teal-900", "bg-yellow-200 text-yellow-900",
  "bg-stone-300 text-stone-900", "bg-pink-200 text-pink-900", "bg-emerald-200 text-emerald-900", "bg-indigo-200 text-indigo-900",
];
function avatarColor(name) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function HorseAvatar({ horse, size = "h-16 w-16", text = "text-2xl", dim = false }) {
  if (horse?.photo) {
    return <img src={horse.photo} alt={horse.name} className={`${size} shrink-0 rounded-2xl object-cover ${dim ? "grayscale opacity-60" : ""}`} />;
  }
  return (
    <span className={`${size} ${text} grid shrink-0 place-items-center rounded-2xl font-black ${horse ? avatarColor(horse.name) : "bg-amber-100 text-amber-800"} ${dim ? "opacity-50" : ""}`}>
      {horse ? horse.name.slice(0, 1).toUpperCase() : <GiHorseHead className="h-1/2 w-1/2" />}
    </span>
  );
}

function Chip({ tone, children, className = "" }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${TONE[tone]} ${className}`}>{children}</span>;
}

// Los 4 cascos vistos desde arriba: manos adelante, patas atrás.
function HoofGrid({ shoes, onTap, enabled, selected, big = false }) {
  const cell = (k) => {
    const on = shoes[k];
    const sel = selected?.includes(k);
    const can = onTap && (!enabled || enabled.includes(k));
    return (
      <button
        key={k}
        type="button"
        disabled={!can}
        onClick={() => can && onTap(k)}
        className={`flex flex-col items-center gap-1 rounded-2xl p-2 transition ${can ? "cursor-pointer active:scale-95" : "cursor-default"} ${
          sel ? "bg-sky-100 ring-4 ring-sky-400" : ""
        } ${onTap && !can ? "opacity-35" : ""}`}
      >
        <span className={`grid ${big ? "h-20 w-20" : "h-11 w-11"} place-items-center rounded-full ${
          on ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30" : "border-4 border-dashed border-slate-300 bg-white text-slate-300"
        }`}>
          <GiHorseshoe className={big ? "h-10 w-10" : "h-6 w-6"} />
        </span>
        {big && <span className="text-xs font-bold text-slate-600">{HOOF_NAME[k]}</span>}
      </button>
    );
  };
  return (
    <div className={`inline-grid ${big ? "gap-x-6 gap-y-1" : "gap-x-1"}`}>
      {big && <p className="text-center text-[11px] font-black uppercase tracking-widest text-slate-400">Manos · adelante</p>}
      <div className="flex justify-center gap-3">{cell("mi")}{cell("md")}</div>
      <div className="flex justify-center gap-3">{cell("pi")}{cell("pd")}</div>
      {big && <p className="text-center text-[11px] font-black uppercase tracking-widest text-slate-400">Patas · atrás</p>}
    </div>
  );
}

function Sheet({ title, onClose, children, footer }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center" onClick={onClose}>
      <div
        className="flex max-h-[94vh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0 text-lg font-black text-slate-900">{title}</div>
          <button onClick={onClose} aria-label="Cerrar" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600 cursor-pointer">
            <FiX className="h-6 w-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-slate-100 px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}

function BigButton({ color = "emerald", icon: Icon, children, onClick, disabled, className = "" }) {
  const c = {
    emerald: "bg-emerald-600 text-white shadow-emerald-600/30",
    amber: "bg-amber-500 text-white shadow-amber-500/30",
    red: "bg-red-600 text-white shadow-red-600/30",
    sky: "bg-sky-600 text-white shadow-sky-600/30",
    white: "bg-white text-slate-700 ring-2 ring-slate-200 shadow-none",
  }[color];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl px-4 py-3 text-lg font-black shadow-lg transition active:scale-[0.98] disabled:opacity-40 cursor-pointer ${c} ${className}`}
    >
      {Icon && <Icon className="h-7 w-7 shrink-0" />}
      <span>{children}</span>
    </button>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className={`fixed inset-x-4 bottom-6 z-[60] mx-auto max-w-md rounded-2xl px-4 py-3 text-center text-base font-bold text-white shadow-xl ${msg.bad ? "bg-red-600" : "bg-slate-900"}`}>
      {msg.text}
    </div>
  );
}

// ─── Tours: asignar caballos ────────────────────────────────────────────────
function seatLabel(slot, seat) {
  if (seat.startsWith("g:")) {
    const g = slot.guides.find((x) => `g:${x.id}` === seat);
    return g ? `Guía · ${g.name}` : "Guía";
  }
  if (seat.startsWith("x:")) return "Caballo extra";
  const [, bid, n] = seat.split(":");
  const grp = slot.groups.find((x) => x.bookingId === bid);
  return grp ? `${grp.name} · ${n} de ${grp.riders}` : "Cliente";
}

function SeatTile({ label, horse, tone = "slate", onClick }) {
  const st = horse ? statusOf(horse) : null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 rounded-2xl p-2 text-center transition active:scale-95 cursor-pointer ${
        horse ? "bg-white ring-2 ring-emerald-500 shadow-sm" : tone === "amber" ? "border-2 border-dashed border-amber-400 bg-amber-50" : "border-2 border-dashed border-slate-300 bg-slate-50"
      }`}
    >
      {horse ? (
        <span className="relative">
          <HorseAvatar horse={horse} size="h-16 w-16" />
          {st.tone !== "green" && (
            <span className={`absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full ring-2 ring-white ${st.tone === "red" ? "bg-red-600" : "bg-amber-500"} text-white`}>
              <FiAlertTriangle className="h-3.5 w-3.5" />
            </span>
          )}
        </span>
      ) : (
        <span className={`grid h-16 w-16 place-items-center rounded-2xl ${tone === "amber" ? "text-amber-500" : "text-slate-400"}`}>
          <FiPlus className="h-9 w-9" />
        </span>
      )}
      <span className="w-full truncate text-sm font-black text-slate-900">{horse ? horse.name : "Escoger"}</span>
      <span className="w-full truncate text-[11px] font-semibold text-slate-500">{label}</span>
    </button>
  );
}

function TourCard({ slot, horsesById, onPick }) {
  const [extras, setExtras] = useState(0);
  const guideSeats = slot.guides.length ? slot.guides.map((g) => `g:${g.id}`) : ["g:0"];
  const assignedExtras = Object.keys(slot.assigned).filter((s) => s.startsWith("x:")).map((s) => Number(s.slice(2)));
  const extraCount = Math.max(extras, assignedExtras.length ? Math.max(...assignedExtras) : 0);
  const extraSeats = Array.from({ length: extraCount }, (_, i) => `x:${i + 1}`);
  const clientSeats = slot.groups.flatMap((g) => g.seats);
  const all = [...guideSeats, ...clientSeats, ...extraSeats];
  const done = all.filter((s) => slot.assigned[s]).length;
  const need = guideSeats.length + clientSeats.length;
  const horseAt = (s) => horsesById[slot.assigned[s]] || null;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 bg-slate-900 px-4 py-3 text-white">
        <div className="min-w-0">
          <p className="text-2xl font-black leading-none">{clock(slot.startTime)}</p>
          <p className="mt-1 truncate text-xs font-semibold text-slate-300">{slot.tourName}</p>
        </div>
        <div className={`rounded-2xl px-3 py-2 text-center ${done >= need ? "bg-emerald-500" : "bg-white/15"}`}>
          <p className="text-xl font-black leading-none">{done}/{need}</p>
          <p className="text-[10px] font-bold uppercase tracking-wide">caballos</p>
        </div>
      </div>

      <div className="space-y-4 p-3">
        <div>
          <p className="mb-2 flex items-center gap-1.5 px-1 text-xs font-black uppercase tracking-wider text-amber-700">
            <FiUser className="h-4 w-4" /> Guía
          </p>
          <div className="grid grid-cols-3 gap-2">
            {guideSeats.map((s) => (
              <SeatTile key={s} label={seatLabel(slot, s)} tone="amber" horse={horseAt(s)} onClick={() => onPick(slot, s)} />
            ))}
          </div>
        </div>

        {slot.groups.map((g) => (
          <div key={g.bookingId}>
            <p className="mb-2 flex items-center justify-between gap-2 px-1">
              <span className="truncate text-sm font-black text-slate-800">{g.name}</span>
              <span className="shrink-0 text-xs font-bold text-slate-500">
                {g.riders} caballo{g.riders === 1 ? "" : "s"}{g.arrived ? " · llegó ✓" : ""}
              </span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              {g.seats.map((s) => (
                <SeatTile key={s} label={seatLabel(slot, s)} horse={horseAt(s)} onClick={() => onPick(slot, s)} />
              ))}
            </div>
          </div>
        ))}

        <div className="grid grid-cols-3 gap-2">
          {extraSeats.map((s) => (
            <SeatTile key={s} label="Extra" horse={horseAt(s)} onClick={() => onPick(slot, s)} />
          ))}
          <button
            type="button"
            onClick={() => setExtras(extraCount + 1)}
            className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl text-slate-400 ring-1 ring-slate-200 cursor-pointer active:scale-95"
          >
            <FiPlus className="h-6 w-6" />
            <span className="text-[11px] font-bold">Otro caballo</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function HorsePicker({ slot, seat, day, onClose, onChoose }) {
  const [confirm, setConfirm] = useState(null);
  const current = slot.assigned[seat] || null;
  const inSlot = useMemo(() => {
    const m = {};
    for (const [s, h] of Object.entries(slot.assigned)) m[h] = s;
    return m;
  }, [slot]);

  const list = useMemo(() => {
    const rank = (h) => {
      if (h.id === current) return -1;
      if (h.resting) return 4;
      if (inSlot[h.id]) return 3;
      const other = (day.usage[h.id] || []).filter((t) => t !== slot.startTime);
      return other.length ? 1 : 0;
    };
    return day.horses.filter((h) => h.active).sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
  }, [day, slot, inSlot, current]);

  function tap(h) {
    if (h.id === current) return onClose();
    if (h.resting) return setConfirm(h);
    onChoose(h.id, false);
  }

  return (
    <Sheet
      title={<span>Caballo para <span className="text-emerald-700">{seatLabel(slot, seat)}</span></span>}
      onClose={onClose}
      footer={current ? <BigButton color="white" icon={FiX} onClick={() => onChoose(null)}>Quitar caballo</BigButton> : null}
    >
      {confirm ? (
        <div className="space-y-4 py-4 text-center">
          <HorseAvatar horse={confirm} size="mx-auto h-28 w-28" />
          <p className="text-xl font-black text-slate-900">{confirm.name} está descansando</p>
          <p className="text-base font-semibold text-red-600">Hasta {dayLabel(confirm.restUntil)}{confirm.restReason ? ` · ${confirm.restReason}` : ""}</p>
          <BigButton color="white" onClick={() => setConfirm(null)}>No, escoger otro</BigButton>
          <BigButton color="red" onClick={() => onChoose(confirm.id, true)}>Usarlo igual</BigButton>
        </div>
      ) : list.length === 0 ? (
        <div className="py-10 text-center">
          <GiHorseHead className="mx-auto h-14 w-14 text-slate-300" />
          <p className="mt-3 text-lg font-bold text-slate-700">Todavía no hay caballos</p>
          <p className="text-sm text-slate-500">Agregalos en la pestaña “Caballos”.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {list.map((h) => {
            const st = statusOf(h);
            const here = inSlot[h.id] && h.id !== current;
            const other = (day.usage[h.id] || []).filter((t) => t !== slot.startTime);
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => tap(h)}
                className={`relative flex flex-col items-center gap-1 rounded-2xl p-2 text-center transition active:scale-95 cursor-pointer ${
                  h.id === current ? "bg-emerald-50 ring-4 ring-emerald-500" : h.resting ? "bg-red-50" : "bg-white ring-1 ring-slate-200"
                }`}
              >
                <HorseAvatar horse={h} size="h-20 w-20" text="text-3xl" dim={h.resting} />
                <span className="w-full truncate text-sm font-black text-slate-900">{h.name}</span>
                {h.id === current ? (
                  <Chip tone="green"><FiCheck className="h-3 w-3" /> Este</Chip>
                ) : h.resting ? (
                  <Chip tone="red">Descansa</Chip>
                ) : here ? (
                  <Chip tone="blue">Ya en este tour</Chip>
                ) : other.length ? (
                  <Chip tone="gray"><FiClock className="h-3 w-3" /> {clock(other[0])}</Chip>
                ) : st.tone !== "green" ? (
                  <Chip tone={st.tone}><GiHorseshoe className="h-3 w-3" /> Revisar</Chip>
                ) : (
                  <Chip tone="green">Libre</Chip>
                )}
              </button>
            );
          })}
        </div>
      )}
    </Sheet>
  );
}

function ToursTab({ date, setDate, today, toast }) {
  const [day, setDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pick, setPick] = useState(null); // { slot, seat }

  const load = useCallback(async (d, quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      setDay(await horsesDay(d));
    } catch (e) {
      toast(e.message, true);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(date); }, [date, load]);

  const horsesById = useMemo(() => Object.fromEntries((day?.horses || []).map((h) => [h.id, h])), [day]);

  async function choose(horseId, force) {
    const { slot, seat } = pick;
    setPick(null);
    // Optimista: se ve al instante; si falla, se recarga.
    setDay((d) => ({
      ...d,
      slots: d.slots.map((s) => {
        if (s.tourId !== slot.tourId || s.startTime !== slot.startTime) return s;
        const assigned = { ...s.assigned };
        for (const [k, v] of Object.entries(assigned)) if (v === horseId) delete assigned[k];
        if (horseId) assigned[seat] = horseId; else delete assigned[seat];
        return { ...s, assigned };
      }),
    }));
    try {
      await assignHorse({ tourId: slot.tourId, date, startTime: slot.startTime, seat, horseId, force });
      load(date, true);
    } catch (e) {
      toast(e.message, true);
      load(date, true);
    }
  }

  const tomorrow = shiftYmd(today, 1);
  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <button onClick={() => setDate(shiftYmd(date, -1))} aria-label="Día anterior" className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-slate-600 ring-1 ring-slate-200 cursor-pointer">
          <FiChevronLeft className="h-6 w-6" />
        </button>
        <button onClick={() => setDate(today)} className={`h-12 flex-1 rounded-2xl text-base font-black cursor-pointer ${date === today ? "bg-emerald-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}>Hoy</button>
        <button onClick={() => setDate(tomorrow)} className={`h-12 flex-1 rounded-2xl text-base font-black cursor-pointer ${date === tomorrow ? "bg-orange-500 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}>Mañana</button>
        <button onClick={() => setDate(shiftYmd(date, 1))} aria-label="Día siguiente" className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-slate-600 ring-1 ring-slate-200 cursor-pointer">
          <FiChevronRight className="h-6 w-6" />
        </button>
      </div>
      <p className="mb-3 px-1 text-lg font-black capitalize text-slate-800">{dayLabel(date)}</p>

      {loading ? (
        <div className="space-y-3">{[0, 1].map((i) => <div key={i} className="h-56 animate-pulse rounded-3xl bg-slate-200/70" />)}</div>
      ) : !day?.slots.length ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white py-14 text-center">
          <GiHorseHead className="mx-auto h-14 w-14 text-slate-300" />
          <p className="mt-3 text-lg font-bold text-slate-700">No hay tours a caballo</p>
        </div>
      ) : (
        <div className="space-y-4">
          {day.slots.map((s) => (
            <TourCard key={`${s.tourId}-${s.startTime}`} slot={s} horsesById={horsesById} onPick={(slot, seat) => setPick({ slot, seat })} />
          ))}
        </div>
      )}

      {pick && day && (
        <HorsePicker
          slot={day.slots.find((s) => s.tourId === pick.slot.tourId && s.startTime === pick.slot.startTime) || pick.slot}
          seat={pick.seat}
          day={day}
          onClose={() => setPick(null)}
          onChoose={choose}
        />
      )}
    </>
  );
}

// ─── Caballos: herraduras y salud ───────────────────────────────────────────
const EVENT_INFO = {
  herrado: { icon: GiHammerNails, color: "bg-emerald-100 text-emerald-700", text: (e) => `Se herró: ${e.hooves.map((k) => HOOF_NAME[k].toLowerCase()).join(", ")}` },
  herradura_caida: { icon: GiHorseshoe, color: "bg-amber-100 text-amber-700", text: (e) => `Se le cayó: ${e.hooves.map((k) => HOOF_NAME[k].toLowerCase()).join(", ")}` },
  lastimado: { icon: GiStickingPlaster, color: "bg-red-100 text-red-700", text: (e) => `${e.detail || "Lastimado"} · descansa ${e.restDays} día${e.restDays === 1 ? "" : "s"}` },
  recuperado: { icon: FiCheck, color: "bg-emerald-100 text-emerald-700", text: () => "Ya está bien" },
  nota: { icon: FiFileText, color: "bg-slate-100 text-slate-600", text: (e) => e.detail },
};

function PhotoButton({ photo, onPhoto, horse }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button type="button" onClick={() => ref.current?.click()} className="relative mx-auto block cursor-pointer">
        {photo ? (
          <img src={photo} alt="" className="h-32 w-32 rounded-3xl object-cover" />
        ) : (
          <span className="grid h-32 w-32 place-items-center rounded-3xl border-4 border-dashed border-amber-300 bg-amber-50 text-amber-500">
            {horse ? <span className="text-5xl font-black">{horse.name.slice(0, 1)}</span> : <FiCamera className="h-12 w-12" />}
          </span>
        )}
        <span className="absolute -bottom-2 -right-2 grid h-11 w-11 place-items-center rounded-full bg-slate-900 text-white ring-4 ring-white">
          {busy ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <FiCamera className="h-5 w-5" />}
        </span>
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setBusy(true);
          try { onPhoto(await photoToDataUrl(f)); } finally { setBusy(false); }
        }}
      />
    </>
  );
}

function HorseForm({ horse, onClose, onSaved, toast }) {
  const [name, setName] = useState(horse?.name || "");
  const [photo, setPhoto] = useState(horse?.photo || null);
  const [color, setColor] = useState(horse?.color || "");
  const [notes, setNotes] = useState(horse?.notes || "");
  const [shoes, setShoes] = useState(horse?.shoes || { mi: false, md: false, pi: false, pd: false });
  const [shodAt, setShodAt] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) return toast("Falta el nombre", true);
    setSaving(true);
    try {
      let h;
      if (horse) {
        h = (await updateHorse(horse.id, { name: name.trim(), photo, color, notes })).horse;
      } else {
        const hooves = Object.keys(shoes).filter((k) => shoes[k]);
        h = (await createHorse({ name: name.trim(), photo, color, notes, shoes })).horse;
        if (hooves.length && shodAt) h = (await addHorseEvent(h.id, { kind: "herrado", hooves, date: shodAt })).horse;
      }
      onSaved(h);
    } catch (e) {
      toast(e.message, true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      title={horse ? "Editar caballo" : "Nuevo caballo"}
      onClose={onClose}
      footer={<BigButton icon={FiCheck} onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</BigButton>}
    >
      <div className="space-y-5">
        <PhotoButton photo={photo} onPhoto={setPhoto} horse={horse} />
        <label className="block">
          <span className="mb-1 block text-sm font-bold text-slate-600">Nombre</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="h-14 w-full rounded-2xl border-2 border-slate-200 px-4 text-xl font-bold outline-none focus:border-emerald-500" placeholder="Ej: Canela" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-bold text-slate-600">Color <span className="font-normal text-slate-400">(opcional)</span></span>
          <input value={color} onChange={(e) => setColor(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-slate-200 px-4 text-base outline-none focus:border-emerald-500" placeholder="Ej: alazán, blanco con manchas" />
        </label>
        {!horse && (
          <div className="rounded-2xl bg-slate-50 p-4 text-center">
            <p className="mb-2 text-base font-black text-slate-700">¿Qué cascos tienen herradura?</p>
            <HoofGrid shoes={shoes} big onTap={(k) => setShoes((s) => ({ ...s, [k]: !s[k] }))} />
            {Object.values(shoes).some(Boolean) && (
              <label className="mt-3 block text-left">
                <span className="mb-1 block text-sm font-bold text-slate-600">¿Cuándo se herró? <span className="font-normal text-slate-400">(si se sabe)</span></span>
                <input type="date" value={shodAt} max={toYmd(new Date())} onChange={(e) => setShodAt(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 text-base" />
              </label>
            )}
          </div>
        )}
        <label className="block">
          <span className="mb-1 block text-sm font-bold text-slate-600">Notas <span className="font-normal text-slate-400">(opcional)</span></span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3 text-base outline-none focus:border-emerald-500" placeholder="Ej: manso, bueno para niños" />
        </label>
        {horse && (
          <button
            type="button"
            onClick={async () => {
              try { onSaved((await updateHorse(horse.id, { active: !horse.active })).horse); } catch (e) { toast(e.message, true); }
            }}
            className="w-full rounded-2xl py-3 text-sm font-bold text-slate-500 ring-1 ring-slate-200 cursor-pointer"
          >
            {horse.active ? "Ya no trabaja (ocultar de los tours)" : "Volver a ponerlo a trabajar"}
          </button>
        )}
      </div>
    </Sheet>
  );
}

// Acción guiada: herrar / se cayó / lastimado / nota.
function ActionSheet({ horse, kind, onClose, onDone, toast, today }) {
  const [hooves, setHooves] = useState(kind === "herrado" ? ["mi", "md", "pi", "pd"] : []);
  const [when, setWhen] = useState(today);
  const [days, setDays] = useState(null);
  const [reason, setReason] = useState(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const toggle = (k) => setHooves((h) => (h.includes(k) ? h.filter((x) => x !== k) : [...h, k]));

  const ok = kind === "herrado" || kind === "herradura_caida" ? hooves.length > 0 : kind === "lastimado" ? !!days : kind === "nota" ? note.trim().length > 0 : true;

  async function save() {
    setSaving(true);
    try {
      const body = { kind };
      if (kind === "herrado") Object.assign(body, { hooves, date: when });
      if (kind === "herradura_caida") Object.assign(body, { hooves });
      if (kind === "lastimado") Object.assign(body, { restDays: days, detail: [reason, note.trim()].filter(Boolean).join(" · ") || undefined });
      if (kind === "nota") body.detail = note.trim();
      onDone((await addHorseEvent(horse.id, body)).horse);
    } catch (e) {
      toast(e.message, true);
    } finally {
      setSaving(false);
    }
  }

  const title = { herrado: "Se herró", herradura_caida: "Se le cayó una herradura", lastimado: "Renco o lastimado", nota: "Nota" }[kind];
  const shod = ["mi", "md", "pi", "pd"].filter((k) => horse.shoes[k]);

  return (
    <Sheet
      title={<span className="flex items-center gap-3"><HorseAvatar horse={horse} size="h-10 w-10" text="text-lg" /> {title}</span>}
      onClose={onClose}
      footer={<BigButton icon={FiCheck} onClick={save} disabled={!ok || saving}>{saving ? "Guardando…" : "Listo"}</BigButton>}
    >
      {kind === "herrado" && (
        <div className="space-y-5 text-center">
          <div className="grid grid-cols-3 gap-2">
            {[["Las 4", ["mi", "md", "pi", "pd"]], ["Manos", ["mi", "md"]], ["Patas", ["pi", "pd"]]].map(([l, v]) => {
              const on = v.length === hooves.length && v.every((k) => hooves.includes(k));
              return (
                <button key={l} type="button" onClick={() => setHooves(v)} className={`h-14 rounded-2xl text-base font-black cursor-pointer ${on ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"}`}>{l}</button>
              );
            })}
          </div>
          <p className="text-sm font-semibold text-slate-500">o tocá cada casco</p>
          <HoofGrid shoes={{ mi: hooves.includes("mi"), md: hooves.includes("md"), pi: hooves.includes("pi"), pd: hooves.includes("pd") }} big onTap={toggle} />
          <div>
            <p className="mb-2 text-base font-black text-slate-700">¿Cuándo?</p>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => setWhen(today)} className={`h-14 rounded-2xl text-base font-black cursor-pointer ${when === today ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-700"}`}>Hoy</button>
              <button type="button" onClick={() => setWhen(shiftYmd(today, -1))} className={`h-14 rounded-2xl text-base font-black cursor-pointer ${when === shiftYmd(today, -1) ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-700"}`}>Ayer</button>
              <input type="date" value={when} max={today} onChange={(e) => e.target.value && setWhen(e.target.value)} className={`h-14 rounded-2xl px-2 text-sm font-bold ${when < shiftYmd(today, -1) ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-700"}`} />
            </div>
          </div>
        </div>
      )}

      {kind === "herradura_caida" && (
        <div className="space-y-4 text-center">
          <p className="text-lg font-black text-slate-700">Tocá el casco que perdió la herradura</p>
          {shod.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-4 text-slate-500">Este caballo no tiene herraduras puestas.</p>
          ) : (
            <HoofGrid shoes={horse.shoes} big enabled={shod} selected={hooves} onTap={toggle} />
          )}
        </div>
      )}

      {kind === "lastimado" && (
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-base font-black text-slate-700">¿Qué le pasó?</p>
            <div className="grid grid-cols-2 gap-2">
              {["Renco", "Golpe o herida", "Cansado", "Otra cosa"].map((r) => (
                <button key={r} type="button" onClick={() => setReason(reason === r ? null : r)} className={`h-14 rounded-2xl text-base font-black cursor-pointer ${reason === r ? "bg-red-600 text-white" : "bg-slate-100 text-slate-700"}`}>{r}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-base font-black text-slate-700">¿Cuántos días descansa?</p>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 5, 7, 15].map((d) => (
                <button key={d} type="button" onClick={() => setDays(d)} className={`flex h-16 flex-col items-center justify-center rounded-2xl cursor-pointer ${days === d ? "bg-red-600 text-white" : "bg-slate-100 text-slate-700"}`}>
                  <span className="text-2xl font-black leading-none">{d}</span>
                  <span className="text-[11px] font-bold">hasta {shortDay(shiftYmd(today, d))}</span>
                </button>
              ))}
            </div>
          </div>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Detalle (opcional)" className="h-12 w-full rounded-2xl border-2 border-slate-200 px-4 text-base outline-none focus:border-red-400" />
        </div>
      )}

      {kind === "nota" && (
        <textarea autoFocus value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="Escribí lo que pasó" className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3 text-lg outline-none focus:border-emerald-500" />
      )}
    </Sheet>
  );
}

function HorseDetail({ horse, onClose, onChanged, toast, today }) {
  const [action, setAction] = useState(null);
  const [editing, setEditing] = useState(false);
  const [hist, setHist] = useState(null);

  useEffect(() => {
    let alive = true;
    horseHistory(horse.id).then((r) => alive && setHist(r)).catch(() => alive && setHist({ events: [], tours: [] }));
    return () => { alive = false; };
  }, [horse.id, horse.shoes, horse.restUntil]);

  const st = statusOf(horse);
  const ago = (d) => (d == null ? "sin fecha" : d === 0 ? "hoy" : d === 1 ? "ayer" : `hace ${d} días`);

  async function recovered() {
    try { onChanged((await addHorseEvent(horse.id, { kind: "recuperado" })).horse); } catch (e) { toast(e.message, true); }
  }

  return (
    <>
      <Sheet
        title={
          <span className="flex items-center gap-2">
            {horse.name}
            <button type="button" onClick={() => setEditing(true)} aria-label="Editar" className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500 cursor-pointer">
              <FiEdit2 className="h-4 w-4" />
            </button>
          </span>
        }
        onClose={onClose}
      >
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <HorseAvatar horse={horse} size="h-28 w-28" text="text-5xl" />
            <div className="min-w-0 space-y-2">
              <Chip tone={st.tone} className="text-sm">{st.label}</Chip>
              {horse.color && <p className="text-sm text-slate-500">{horse.color}</p>}
              {horse.notes && <p className="text-sm text-slate-600">{horse.notes}</p>}
            </div>
          </div>

          {horse.resting && (
            <div className="rounded-2xl bg-red-50 p-4 ring-1 ring-red-200">
              <p className="text-base font-black text-red-700">Descansando hasta {dayLabel(horse.restUntil)}</p>
              {horse.restReason && <p className="text-sm font-semibold text-red-600">{horse.restReason}</p>}
              <BigButton color="emerald" icon={FiCheck} onClick={recovered} className="mt-3">Ya está bien</BigButton>
            </div>
          )}

          <div className="rounded-3xl bg-slate-50 p-4 text-center">
            <p className="mb-2 text-base font-black text-slate-800">{shoeSummary(horse.shoes)}</p>
            <HoofGrid shoes={horse.shoes} big />
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className={`rounded-xl p-2 ${horse.daysFront >= HERRAR_YA ? "bg-red-100 text-red-700" : horse.daysFront >= HERRAR_PRONTO ? "bg-amber-100 text-amber-800" : "bg-white text-slate-600"}`}>
                <p className="font-black">Manos</p><p>{ago(horse.daysFront)}</p>
              </div>
              <div className={`rounded-xl p-2 ${horse.daysBack >= HERRAR_YA ? "bg-red-100 text-red-700" : horse.daysBack >= HERRAR_PRONTO ? "bg-amber-100 text-amber-800" : "bg-white text-slate-600"}`}>
                <p className="font-black">Patas</p><p>{ago(horse.daysBack)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <BigButton color="emerald" icon={GiHammerNails} onClick={() => setAction("herrado")}>Se herró</BigButton>
            <BigButton color="amber" icon={GiHorseshoe} onClick={() => setAction("herradura_caida")}>Se le cayó una herradura</BigButton>
            <BigButton color="red" icon={GiStickingPlaster} onClick={() => setAction("lastimado")}>Está renco o lastimado</BigButton>
            <BigButton color="white" icon={FiFileText} onClick={() => setAction("nota")}>Anotar algo</BigButton>
          </div>

          <div>
            <p className="mb-2 text-sm font-black uppercase tracking-wider text-slate-400">Historial</p>
            {!hist ? (
              <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            ) : hist.events.length === 0 ? (
              <p className="text-sm text-slate-400">Todavía no hay nada reportado.</p>
            ) : (
              <ul className="space-y-2">
                {hist.events.map((e) => {
                  const info = EVENT_INFO[e.kind] || EVENT_INFO.nota;
                  return (
                    <li key={e.id} className="flex items-start gap-3 rounded-2xl bg-white p-2 ring-1 ring-slate-100">
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${info.color}`}><info.icon className="h-5 w-5" /></span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800">{info.text(e)}</p>
                        <p className="text-xs text-slate-400">{shortDay(e.date)}{e.by ? ` · ${e.by}` : ""}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {hist?.tours?.length > 0 && (
              <p className="mt-3 text-xs text-slate-500">
                Últimos tours: {hist.tours.slice(0, 5).map((t) => `${shortDay(t.date)} ${clock(t.startTime)}`).join(" · ")}
              </p>
            )}
          </div>
        </div>
      </Sheet>

      {action && (
        <ActionSheet
          horse={horse}
          kind={action}
          today={today}
          toast={toast}
          onClose={() => setAction(null)}
          onDone={(h) => { setAction(null); onChanged(h); toast("Guardado ✓"); }}
        />
      )}
      {editing && (
        <HorseForm horse={horse} toast={toast} onClose={() => setEditing(false)} onSaved={(h) => { setEditing(false); onChanged(h); toast("Guardado ✓"); }} />
      )}
    </>
  );
}

function HorsesTab({ today, toast }) {
  const [horses, setHorses] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    listHorses().then((r) => setHorses(r.horses)).catch((e) => { setHorses([]); toast(e.message, true); });
  }, [toast]);

  const upsert = (h) => setHorses((list) => (list.some((x) => x.id === h.id) ? list.map((x) => (x.id === h.id ? h : x)) : [...list, h].sort((a, b) => a.name.localeCompare(b.name))));

  if (!horses) return <div className="grid grid-cols-2 gap-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-44 animate-pulse rounded-3xl bg-slate-200/70" />)}</div>;

  const active = horses.filter((h) => h.active);
  const counts = {
    green: active.filter((h) => statusOf(h).tone === "green").length,
    red: active.filter((h) => h.resting).length,
    shoe: active.filter((h) => !h.resting && statusOf(h).tone !== "green").length,
  };
  const shown = horses.filter((h) => {
    if (filter === "all") return true;
    if (!h.active) return false;
    const t = statusOf(h).tone;
    return filter === "green" ? t === "green" : filter === "red" ? h.resting : !h.resting && t !== "green";
  });
  const open = horses.find((h) => h.id === openId);

  const filterBtn = (id, tone, n, label) => (
    <button key={id} type="button" onClick={() => setFilter(filter === id ? "all" : id)} className={`flex flex-col items-center rounded-2xl py-2 ring-2 cursor-pointer ${filter === id ? "ring-slate-900" : "ring-transparent"} ${TONE[tone]}`}>
      <span className="text-2xl font-black leading-none">{n}</span>
      <span className="text-[11px] font-bold">{label}</span>
    </button>
  );

  return (
    <>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {filterBtn("green", "green", counts.green, "Listos")}
        {filterBtn("shoe", "amber", counts.shoe, "Herraduras")}
        {filterBtn("red", "red", counts.red, "Descansando")}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => setAdding(true)} className="flex min-h-44 flex-col items-center justify-center gap-2 rounded-3xl border-4 border-dashed border-emerald-300 bg-emerald-50 text-emerald-700 cursor-pointer active:scale-95">
          <FiPlus className="h-10 w-10" />
          <span className="text-base font-black">Agregar caballo</span>
        </button>
        {shown.map((h) => {
          const st = statusOf(h);
          return (
            <button
              key={h.id}
              type="button"
              onClick={() => setOpenId(h.id)}
              className={`flex flex-col items-center gap-2 rounded-3xl p-3 text-center transition active:scale-95 cursor-pointer ${
                st.tone === "red" ? "bg-red-50 ring-2 ring-red-300" : st.tone === "amber" ? "bg-amber-50 ring-2 ring-amber-300" : "bg-white ring-1 ring-slate-200"
              } ${h.active ? "" : "opacity-50"}`}
            >
              <HorseAvatar horse={h} size="h-24 w-24" text="text-4xl" dim={h.resting} />
              <span className="w-full truncate text-lg font-black text-slate-900">{h.name}</span>
              <HoofGrid shoes={h.shoes} />
              <span className={`w-full truncate rounded-full px-2 py-1 text-xs font-bold ring-1 ${TONE[st.tone]}`}>{st.label}</span>
            </button>
          );
        })}
      </div>
      {shown.length === 0 && filter !== "all" && <p className="mt-4 text-center text-sm text-slate-400">Ninguno en este grupo.</p>}

      {open && <HorseDetail horse={open} today={today} toast={toast} onClose={() => setOpenId(null)} onChanged={upsert} />}
      {adding && <HorseForm toast={toast} onClose={() => setAdding(false)} onSaved={(h) => { setAdding(false); upsert(h); toast(`${h.name} agregado ✓`); }} />}
    </>
  );
}

// ─── Página ─────────────────────────────────────────────────────────────────
export default function CaballosPage() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState(() => { try { return sessionStorage.getItem("nt_caballos_tab") || "tours"; } catch { return "tours"; } });
  const [date, setDate] = useState(null);
  const [msg, setMsg] = useState(null);
  const timer = useRef(null);

  const toast = useCallback((text, bad = false) => {
    setMsg({ text, bad });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2600);
  }, []);

  useEffect(() => {
    horsesMe()
      .then((r) => { setMe(r); setDate(r.today); })
      .catch(() => navigate("/asistencia", { replace: true }));
  }, [navigate]);

  useEffect(() => { try { sessionStorage.setItem("nt_caballos_tab", tab); } catch { /* nada */ } }, [tab]);

  if (!me) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
      </div>
    );
  }

  const tabBtn = (id, Icon, label) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={`flex h-16 flex-1 items-center justify-center gap-2 rounded-2xl text-lg font-black transition cursor-pointer ${tab === id ? "bg-slate-900 text-white shadow-lg" : "text-slate-500"}`}
    >
      <Icon className="h-7 w-7" /> {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="mx-auto max-w-2xl px-4 pt-5">
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={() => navigate(me.user.isAdmin && document.referrer.includes("/matamoros") ? "/matamoros" : "/asistencia")}
            aria-label="Volver"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-slate-600 ring-1 ring-slate-200 cursor-pointer"
          >
            <FiArrowLeft className="h-6 w-6" />
          </button>
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-600 text-white shadow-sm shadow-amber-600/30">
            <GiHorseHead className="h-7 w-7" />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-black leading-tight text-slate-900">Caballos</h1>
            <p className="truncate text-xs font-semibold text-slate-400">{me.user.name}</p>
          </div>
        </div>

        <div className="mb-5 flex gap-1 rounded-3xl bg-white p-1.5 ring-1 ring-slate-200">
          {tabBtn("tours", FiClock, "Tours")}
          {tabBtn("horses", GiHorseshoe, "Caballos")}
        </div>

        {tab === "tours" ? (
          <ToursTab date={date} setDate={setDate} today={me.today} toast={toast} />
        ) : (
          <HorsesTab today={me.today} toast={toast} />
        )}
      </div>
      <Toast msg={msg} />
    </div>
  );
}
