// Caballos dentro de cada tour del portal: una barra "Caballos 3/6" al pie de
// la tarjeta; al tocarla se abren los asientos (Marlon, guía, grupos).
import { FiChevronRight } from "react-icons/fi";
import { GiHorseHead } from "react-icons/gi";
import { Sheet, TourCard } from "./HorsesUI";
import { clock, slotProgress } from "./horsesUtil";

export function HorsesBar({ slot, onOpen }) {
  const { done, need } = slotProgress(slot);
  const full = done >= need;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex w-full items-center gap-3 border-t px-4 py-3 text-left transition cursor-pointer ${
        full ? "border-emerald-100 bg-emerald-50 hover:bg-emerald-100" : "border-amber-100 bg-amber-50 hover:bg-amber-100"
      }`}
    >
      <span className={`grid h-9 w-9 place-items-center rounded-xl text-white ${full ? "bg-emerald-600" : "bg-amber-600"}`}>
        <GiHorseHead className="h-5 w-5" />
      </span>
      <span className="flex-1 text-sm font-black text-slate-800">Caballos</span>
      <span className={`rounded-full px-2.5 py-1 text-sm font-black tabular-nums ${full ? "bg-emerald-600 text-white" : "bg-white text-amber-700 ring-1 ring-amber-200"}`}>
        {done}/{need}
      </span>
      <FiChevronRight className="h-5 w-5 text-slate-400" />
    </button>
  );
}

export function SlotHorsesSheet({ slot, horses, onPick, onClose }) {
  const horsesById = Object.fromEntries(horses.map((h) => [h.id, h]));
  const { done, need } = slotProgress(slot);
  return (
    <Sheet
      title={
        <span className="flex items-center gap-2">
          Caballos · {clock(slot.startTime)}
          <span className={`rounded-full px-2.5 py-0.5 text-sm ${done >= need ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>{done}/{need}</span>
        </span>
      }
      onClose={onClose}
    >
      <TourCard slot={slot} horsesById={horsesById} onPick={onPick} bare />
    </Sheet>
  );
}
