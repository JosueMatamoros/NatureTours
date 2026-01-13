export default function GuestsInput({ value = 1, onChange, min = 1, max = 40 }) {
  const decrease = () => {
    if (value > min) onChange(value - 1);
  };

  const increase = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <div className="rounded-2xl border border-gray-200 p-1 flex items-center  mt-2">
      {/* Texto */}

      {/* Controls */}
      <div className="flex items-center gap-1  w-full justify-center space-x-4">
        <button
          type="button"
          onClick={decrease}
          disabled={value <= min}
          className="h-10 w-10 rounded-xl border border-gray-200 flex items-center justify-center text-lg disabled:opacity-40 hover:bg-gray-50"
        >
          −
        </button>

        <span className="w-6 text-center font-semibold text-gray-900">
          {value}
        </span>

        <button
          type="button"
          onClick={increase}
          disabled={value >= max}
          className="h-10 w-10 rounded-xl border border-gray-200 flex items-center justify-center text-lg disabled:opacity-40 hover:bg-gray-50"
        >
          +
        </button>
      </div>
    </div>
  );
}
