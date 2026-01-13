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

export default function CalendarPicker({ selected, onSelect }) {
  const selectedDate =
    typeof selected === "string"
      ? fromYMDLocal(selected)
      : normalizeToNoon(selected);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="w-min rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={(d) => {
          const normalized = normalizeToNoon(d);
          onSelect?.(normalized ? toYMDLocal(normalized) : "");
        }}
        disabled={{ before: today }}
        className="mx-auto"
        classNames={{
          months: "flex flex-col",
          month: "space-y-3",
          caption: "flex items-center justify-between px-2",
          caption_label: "text-sm font-semibold text-gray-900",
          nav: "flex items-center gap-2",
          nav_button:
            "h-9 w-9 inline-flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50",
          table: "w-full border-collapse",
          head_row: "flex",
          head_cell: "w-10 text-xs font-semibold text-gray-500 text-center",
          row: "flex w-full mt-1",
          cell: "w-10 h-10 text-center",
          day: "w-10 h-10 rounded-xl hover:bg-gray-100 transition text-sm",
          day_today: "border border-amber-400",
          day_selected: "bg-emerald-600 text-white hover:bg-emerald-700",
          day_disabled: "text-gray-300",
        }}
        components={{
          Chevron: ({ orientation }) =>
            orientation === "left" ? (
              <FiChevronLeft className="h-5 w-5 text-gray-600" />
            ) : (
              <FiChevronRight className="h-5 w-5 text-gray-600" />
            ),
        }}
      />
      <p className="mt-3 text-xs text-gray-500">
        Seleccione una fecha disponible .
      </p>
    </div>
  );
}
