// Elegir caballo para un asiento: guarda al instante (optimista) y recarga.
import { useState } from "react";
import { HorsePicker } from "./HorsesUI";
import { assignHorse } from "../../../services/horses.api";

// Asignación completa de un día: guarda optimista y recarga. `onError(msg)`.
export function useHorseAssign(day, setDay, reload, onError) {
  const [pick, setPick] = useState(null); // { tourId, startTime, seat }
  const slot = pick && day ? day.slots.find((s) => s.tourId === pick.tourId && s.startTime === pick.startTime) : null;

  async function choose(horseId, force) {
    const { tourId, startTime, seat } = pick;
    setPick(null);
    setDay((d) => ({
      ...d,
      slots: d.slots.map((s) => {
        if (s.tourId !== tourId || s.startTime !== startTime) return s;
        const assigned = { ...s.assigned };
        for (const [k, v] of Object.entries(assigned)) if (v === horseId) delete assigned[k];
        if (horseId) assigned[seat] = horseId; else delete assigned[seat];
        return { ...s, assigned };
      }),
    }));
    try {
      await assignHorse({ tourId, date: day.date, startTime, seat, horseId, force });
    } catch (e) {
      onError?.(e.message);
    }
    reload();
  }

  const picker = slot ? (
    <HorsePicker slot={slot} seat={pick.seat} horses={day.horses} onClose={() => setPick(null)} onChoose={choose} />
  ) : null;
  return { openPick: (s, seat) => setPick({ tourId: s.tourId, startTime: s.startTime, seat }), picker };
}
