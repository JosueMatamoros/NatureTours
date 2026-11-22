// Piezas visuales de Caballos (compartidas por la página de Caballos y el portal).
import { useEffect, useMemo, useState } from "react";
import { FiAlertTriangle, FiCheck, FiPlus, FiX, FiUser, FiUsers } from "react-icons/fi";
import { GiHorseHead, GiHorseshoe } from "react-icons/gi";
import { HOOF_NAME, TONE, avatarColor, clock, dayLabel, seatLabel, slotProgress, slotSeats, statusOf } from "./horsesUtil";

export function HorseAvatar({ horse, size = "h-16 w-16", text = "text-2xl", dim = false }) {
  if (horse?.photo) {
    return <img src={horse.photo} alt={horse.name} className={`${size} shrink-0 rounded-2xl object-cover ${dim ? "grayscale opacity-60" : ""}`} />;
  }
  return (
    <span className={`${size} ${text} grid shrink-0 place-items-center rounded-2xl font-black ${horse ? avatarColor(horse.name) : "bg-amber-100 text-amber-800"} ${dim ? "opacity-50" : ""}`}>
      {horse ? horse.name.slice(0, 1).toUpperCase() : <GiHorseHead className="h-1/2 w-1/2" />}
    </span>
  );
}

export function Chip({ tone, children, className = "" }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${TONE[tone]} ${className}`}>{children}</span>;
}

// Los 4 cascos vistos desde arriba: manos adelante, patas atrás.
// Cascos. Afuera (tarjeta y detalle): verde = tiene herradura, gris = no tiene.
// En "Se herró" / "Se le cayó" (con `selected`): lo que se toca sale amarillo
// (el cambio), lo que ya tenía herradura sale verde claro y lo demás gris.
export function HoofGrid({ shoes, onTap, enabled, selected, big = false }) {
  const marking = Array.isArray(selected);
  const cell = (k) => {
    const on = shoes[k];
    const sel = marking && selected.includes(k);
    const can = onTap && (!enabled || enabled.includes(k));
    const circle = sel
      ? "bg-amber-400 text-white shadow-md shadow-amber-400/40 ring-4 ring-amber-200"
      : on && marking
        ? "bg-emerald-100 text-emerald-600 ring-2 ring-emerald-300"
        : on
          ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
          : "border-4 border-dashed border-slate-300 bg-white text-slate-300";
    return (
      <button
        key={k}
        type="button"
        disabled={!can}
        onClick={() => can && onTap(k)}
        className={`flex flex-col items-center gap-1 rounded-2xl p-2 transition ${can ? "cursor-pointer active:scale-95" : "cursor-default"} ${
          onTap && !can ? "opacity-35" : ""
        }`}
      >
        <span className={`grid ${big ? "h-20 w-20" : "h-11 w-11"} place-items-center rounded-full transition ${circle}`}>
          <GiHorseshoe className={big ? "h-10 w-10" : "h-6 w-6"} />
        </span>
        {big && <span className={`text-xs font-bold ${sel ? "text-amber-700" : "text-slate-600"}`}>{HOOF_NAME[k]}</span>}
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

// Leyenda para las hojas de marcar cascos.
export function HoofLegend({ changeLabel }) {
  const dot = (cls) => <span className={`inline-block h-3.5 w-3.5 rounded-full ${cls}`} />;
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs font-bold text-slate-500">
      <span className="flex items-center gap-1.5">{dot("bg-amber-400")} {changeLabel}</span>
      <span className="flex items-center gap-1.5">{dot("bg-emerald-100 ring-2 ring-emerald-300")} Ya tenía</span>
      <span className="flex items-center gap-1.5">{dot("border-2 border-dashed border-slate-300 bg-white")} Sin herradura</span>
    </div>
  );
}

export function Sheet({ title, onClose, children, footer }) {
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

export function BigButton({ color = "emerald", icon: Icon, children, onClick, disabled, className = "" }) {
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

export function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className={`fixed inset-x-4 bottom-6 z-[60] mx-auto max-w-md rounded-2xl px-4 py-3 text-center text-base font-bold text-white shadow-xl ${msg.bad ? "bg-red-600" : "bg-slate-900"}`}>
      {msg.text}
    </div>
  );
}


// ─── Asignar caballos a un tour ─────────────────────────────────────────────
// Orden: encargado de caballos (Marlon) → guía → cada grupo (adultos y niños)
// → extras. Sin nombres de clientes: solo cuántos son y si vienen niños.
const SEAT_STYLE = {
  sky: { empty: "border-2 border-dashed border-sky-300 bg-sky-50", icon: "text-sky-500" },
  gold: { empty: "border-2 border-dashed border-yellow-500 bg-linear-to-br from-yellow-50 to-amber-100", icon: "text-yellow-600" },
  amber: { empty: "border-2 border-dashed border-amber-400 bg-amber-50", icon: "text-amber-500" },
  pink: { empty: "border-2 border-dashed border-pink-300 bg-pink-50", icon: "text-pink-500" },
  slate: { empty: "border-2 border-dashed border-slate-300 bg-slate-50", icon: "text-slate-400" },
};

// Con caballo puesto: encargado y guía en dorado, niño en rosado, adulto/extra en verde.
const ASSIGNED = {
  gold: "bg-yellow-50 ring-yellow-500",
  amber: "bg-yellow-50 ring-yellow-500",
  pink: "bg-pink-50 ring-pink-400",
  slate: "bg-emerald-50 ring-emerald-500",
};

function SeatTile({ label, horse, tone = "slate", onClick, onRemove, big = false }) {
  const st = horse ? statusOf(horse) : null;
  const sty = SEAT_STYLE[tone];
  const tile = (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full flex-col items-center gap-1 rounded-2xl text-center transition active:scale-95 cursor-pointer ${big ? "p-1.5" : "p-1"} ${
        horse ? `shadow-sm ring-2 ${ASSIGNED[tone] || ASSIGNED.slate}` : sty.empty
      }`}
    >
      {horse ? (
        <span className="relative block w-full">
          <HorseAvatar horse={horse} size="aspect-square w-full" text={big ? "text-5xl" : "text-3xl"} />
          {st.tone !== "green" && (
            <span className={`absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full ring-2 ring-white ${st.tone === "red" ? "bg-red-600" : "bg-amber-500"} text-white`}>
              <FiAlertTriangle className="h-3.5 w-3.5" />
            </span>
          )}
        </span>
      ) : (
        <span className={`grid aspect-square w-full place-items-center rounded-2xl ${sty.icon}`}>
          <FiPlus className="h-9 w-9" />
        </span>
      )}
      <span className={`w-full truncate font-black leading-tight text-slate-900 ${big ? "text-sm" : "text-xs"}`}>{horse ? horse.name : "Escoger"}</span>
      <span className="-mt-0.5 w-full truncate text-[10px] font-semibold leading-tight text-slate-500">{label}</span>
    </button>
  );
  if (horse || !onRemove) return tile;
  // Espacio extra vacío: se puede quitar con la ×.
  return (
    <div className="relative">
      {tile}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Quitar este espacio"
        className="absolute -right-1.5 -top-1.5 grid h-8 w-8 place-items-center rounded-full bg-slate-700 text-white shadow ring-2 ring-white cursor-pointer active:scale-90"
      >
        <FiX className="h-4 w-4" />
      </button>
    </div>
  );
}

function SectionTitle({ icon: Icon, color, children, right }) {
  return (
    <p className="mb-2 flex items-center justify-between gap-2 px-1">
      <span className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider ${color}`}>
        {Icon && <Icon className="h-4 w-4" />} {children}
      </span>
      {right}
    </p>
  );
}

export function TourCard({ slot, horsesById, onPick, bare = false }) {
  // Extras: los que tienen caballo + los que se agregaron aquí y siguen vacíos
  // (esos no se guardan: si se recarga o se tocan con la ×, desaparecen).
  const [added, setAdded] = useState([]);
  const assignedEx = Object.keys(slot.assigned).filter((s) => s.startsWith("x:"));
  const ex = [...new Set([...assignedEx, ...added])].sort((a, b) => Number(a.slice(2)) - Number(b.slice(2)));
  const addExtra = () => {
    let n = 1;
    while (ex.includes(`x:${n}`)) n += 1;
    setAdded((a) => [...a, `x:${n}`]);
  };
  const removeExtra = (s) => setAdded((a) => a.filter((x) => x !== s));
  const { wr, gd } = slotSeats(slot);
  const { done, need } = slotProgress(slot);
  const horseAt = (s) => horsesById[slot.assigned[s]] || null;
  const totalPeople = slot.groups.reduce((n, g) => n + g.riders, 0);

  return (
    <div className={bare ? "" : "overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"}>
      {!bare && (
        <div className="flex items-center justify-between gap-3 bg-slate-900 px-4 py-3 text-white">
          <div className="min-w-0">
            <p className="text-2xl font-black leading-none">{clock(slot.startTime)}</p>
            <p className="mt-1 truncate text-xs font-semibold text-slate-300">{slot.tourName} · {totalPeople} persona{totalPeople === 1 ? "" : "s"}</p>
          </div>
          <div className={`rounded-2xl px-3 py-2 text-center ${done >= need ? "bg-emerald-500" : "bg-white/15"}`}>
            <p className="text-xl font-black leading-none">{done}/{need}</p>
            <p className="text-[10px] font-bold uppercase tracking-wide">caballos</p>
          </div>
        </div>
      )}

      <div className={`space-y-4 ${bare ? "" : "p-3"}`}>
        <div className="grid grid-cols-2 gap-3">
          {wr.map((s) => (
            <div key={s}>
              <SectionTitle color="text-yellow-700">{seatLabel(slot, s)}</SectionTitle>
              <SeatTile big label={seatLabel(slot, s)} tone="gold" horse={horseAt(s)} onClick={() => onPick(slot, s)} />
            </div>
          ))}
          {gd.map((s) => (
            <div key={s}>
              <SectionTitle icon={FiUser} color="text-yellow-700">Guía</SectionTitle>
              <SeatTile big label={seatLabel(slot, s).replace("Guía · ", "")} tone="gold" horse={horseAt(s)} onClick={() => onPick(slot, s)} />
            </div>
          ))}
        </div>

        {slot.groups.map((g, i) => (
          <div key={g.bookingId} className={`rounded-2xl p-2 ${g.kids ? "bg-pink-50/70 ring-1 ring-pink-200" : "bg-slate-50 ring-1 ring-slate-100"}`}>
            <SectionTitle
              icon={FiUsers}
              color={g.kids ? "text-pink-700" : "text-slate-600"}
              right={
                <span className="flex items-center gap-1.5">
                  {g.adults > 0 && <span className="rounded-full bg-white px-2 py-0.5 text-xs font-black text-slate-700 ring-1 ring-slate-200">{g.adults} adulto{g.adults === 1 ? "" : "s"}</span>}
                  {g.kids > 0 && <span className="rounded-full bg-pink-500 px-2 py-0.5 text-xs font-black text-white">{g.kids} niño{g.kids === 1 ? "" : "s"}</span>}
                  {g.arrived && <FiCheck className="h-4 w-4 text-emerald-600" title="Llegó" />}
                </span>
              }
            >
              Grupo {i + 1}
            </SectionTitle>
            <div className="grid grid-cols-3 gap-2">
              {g.seats.map((s, k) => {
                const kid = k + 1 > g.adults;
                return <SeatTile key={s} label={kid ? "Niño" : "Adulto"} tone={kid ? "pink" : "slate"} horse={horseAt(s)} onClick={() => onPick(slot, s)} />;
              })}
            </div>
          </div>
        ))}

        {ex.length > 0 && (
          <div>
            <SectionTitle color="text-slate-500">Extra</SectionTitle>
            <div className="grid grid-cols-3 gap-2">
              {ex.map((s) => <SeatTile key={s} label="Extra" horse={horseAt(s)} onClick={() => onPick(slot, s)} onRemove={() => removeExtra(s)} />)}
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={addExtra}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 text-base font-black text-slate-600 transition hover:bg-slate-200 active:scale-[0.99] cursor-pointer"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-slate-700 shadow-sm"><FiPlus className="h-5 w-5" /></span>
          Agregar otro caballo
        </button>
      </div>
    </div>
  );
}

export function HorsePicker({ slot, seat, horses, onClose, onChoose }) {
  const [confirm, setConfirm] = useState(null);
  const current = slot.assigned[seat] || null;
  const inSlot = useMemo(() => {
    const m = {};
    for (const [s, h] of Object.entries(slot.assigned)) m[h] = s;
    return m;
  }, [slot]);

  const list = useMemo(() => {
    const rank = (h) => (h.id === current ? -1 : h.resting ? 4 : inSlot[h.id] ? 3 : 0);
    return horses.filter((h) => h.active).sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
  }, [horses, inSlot, current]);

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
          <p className="text-xl font-black text-slate-900">{confirm.name} no está disponible</p>
          {confirm.restUntil < "2999" && <p className="text-base font-semibold text-red-600">Hasta {dayLabel(confirm.restUntil)}</p>}
          <BigButton color="white" onClick={() => setConfirm(null)}>No, escoger otro</BigButton>
          <BigButton color="red" onClick={() => onChoose(confirm.id, true)}>Usarlo igual</BigButton>
        </div>
      ) : list.length === 0 ? (
        <div className="py-10 text-center">
          <GiHorseHead className="mx-auto h-14 w-14 text-slate-300" />
          <p className="mt-3 text-lg font-bold text-slate-700">Todavía no hay caballos</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {list.map((h) => {
            const here = inSlot[h.id] && h.id !== current;
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => tap(h)}
                className={`relative flex flex-col items-center gap-2 rounded-3xl p-3 text-center transition active:scale-95 cursor-pointer ${
                  h.id === current ? "bg-emerald-50 ring-4 ring-emerald-500" : h.resting ? "bg-slate-100 ring-2 ring-red-500" : here ? "bg-white ring-2 ring-sky-300" : "bg-white ring-1 ring-slate-200"
                }`}
              >
                <HorseAvatar horse={h} size="aspect-square w-full" text="text-6xl" dim={h.resting} />
                <span className={`w-full truncate text-lg font-black ${h.resting ? "text-slate-400" : "text-slate-900"}`}>{h.name}</span>
                {h.id === current && (
                  <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-emerald-600 text-white ring-2 ring-white"><FiCheck className="h-5 w-5" /></span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </Sheet>
  );
}

