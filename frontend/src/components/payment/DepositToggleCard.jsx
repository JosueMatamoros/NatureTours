export default function DepositToggleCard({
  useDeposit,
  setUseDeposit,
  depositAmount,
  fmt,
}) {
  return (
    <label className="mt-6 flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
      <input
        type="checkbox"
        checked={useDeposit}
        onChange={(e) => setUseDeposit(e.target.checked)}
        className="h-4 w-4 accent-emerald-600"
      />

      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900">
          Pay a deposit (20%)
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Pay only <span className="font-semibold">{fmt(depositAmount)}</span>{" "}
          now and the remaining balance in cash on the day of the tour.
        </p>
      </div>

      <div className="text-right">
        <p className="text-sm font-bold text-emerald-600">
          {fmt(depositAmount)}
        </p>
      </div>
    </label>
  );
}
