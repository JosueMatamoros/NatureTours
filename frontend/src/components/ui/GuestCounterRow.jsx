import { FiMinus, FiPlus } from "react-icons/fi";

// Fila de contador +/− (adultos, niños, bebés). Usada en el checkout y en el admin.
export default function GuestCounterRow({
  label,
  sublabel,
  value,
  onDecrease,
  onIncrease,
  decreaseDisabled,
  increaseDisabled,
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-500">{sublabel}</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDecrease}
          disabled={decreaseDisabled}
          className="grid h-9 w-9 place-items-center rounded-lg border border-gray-200 bg-white text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Decrease ${label.toLowerCase()}`}
        >
          <FiMinus />
        </button>

        <span className="w-8 text-center text-base font-semibold text-gray-900">
          {value}
        </span>

        <button
          type="button"
          onClick={onIncrease}
          disabled={increaseDisabled}
          className="grid h-9 w-9 place-items-center rounded-lg border border-gray-200 bg-white text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Increase ${label.toLowerCase()}`}
        >
          <FiPlus />
        </button>
      </div>
    </div>
  );
}
