function pad(value) {
  return String(value).padStart(2, "0");
}

export default function HoldSpotCountdown({ secondsLeft = 0 }) {
  const safeSeconds = Math.max(0, Number(secondsLeft) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return (
    <div className="flex h-10 min-w-0 items-center">
      <p className="truncate text-sm font-semibold text-slate-700 sm:text-base">
        Spot on hold
        <span className="text-red-600">{` ${pad(minutes)}:${pad(seconds)}`}</span>
        .
      </p>
    </div>
  );
}
