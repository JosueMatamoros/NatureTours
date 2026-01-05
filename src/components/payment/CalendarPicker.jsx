import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

function fromYMDLocal(ymd) {
  if (!ymd || typeof ymd !== "string") return undefined;
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

function normalizeToNoon(d) {
  if (!d) return undefined;
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  return x;
}

export default function CalendarPicker({ selected, onSelect }) {
  const selectedDate =
    typeof selected === "string"
      ? fromYMDLocal(selected)
      : normalizeToNoon(selected);

  return (
    <div className="rounded-xl border p-3">
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={(d) => onSelect?.(normalizeToNoon(d))}
        disabled={{ before: new Date() }}
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
