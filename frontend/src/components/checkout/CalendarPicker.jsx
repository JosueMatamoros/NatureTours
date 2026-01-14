import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

function fromYMDLocal(ymd) {
  if (!ymd || typeof ymd !== "string") return undefined;
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

function toYMDLocal(date) {
  if (!date) return undefined;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function normalizeToNoon(d) {
  if (!d) return undefined;
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  return x;
}

export default function CalendarPicker({
  selected,
  onSelect,
  onMonthChange,
  disabledDaysSet, // Set("YYYY-MM-DD") con días full
}) {
  const selectedDate =
    typeof selected === "string"
      ? fromYMDLocal(selected)
      : normalizeToNoon(selected);

  return (
    <div className="rounded-xl border p-3 border-gray-400 max-w-xs mx-auto">
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={(d) => {
          const normalized = normalizeToNoon(d);
          onSelect?.(normalized ? toYMDLocal(normalized) : undefined);
        }}
        onMonthChange={(m) => {
          onMonthChange?.(normalizeToNoon(m));
        }}
        disabled={(d) => {
          // bloquear fechas pasadas
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const dd = new Date(d);
          dd.setHours(0, 0, 0, 0);
          if (dd < today) return true;

          // bloquear días full (si vienen del backend)
          const ymd = toYMDLocal(d);
          return disabledDaysSet?.has(ymd) ?? false;
        }}
        className="mx-auto"
        modifiersClassNames={{
          selected: "bg-emerald-600 text-white rounded-lg",
          today: "bg-amber-500 text-white font-semibold rounded-lg ",
        }}
        components={{
          Chevron: ({ orientation }) =>
            orientation === "left" ? (
              <FiChevronLeft className="h-8 w-8 text-gray-400" />
            ) : (
              <FiChevronRight className="h-8 w-8 text-gray-400" />
            ),
        }}
      />
    </div>
  );
}
