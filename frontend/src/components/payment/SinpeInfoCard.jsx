import sinpeMovilImg from "/resources/sinpemovil.jpeg";

export default function SinpeInfoCard({
  fmt,
  depositAmount,
  phone = "89893333",
  owner = "Mario Matamoros Muñoz",
}) {
  return (
    <div className="mt-4 rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
      <p className="text-sm font-semibold text-gray-900">
        You can also avoid the PayPal processing fee by paying with SINPE Móvil
      </p>

      <p className="mt-2 text-xs text-gray-600 leading-relaxed">
        You may pay a <span className="font-semibold">deposit</span>{" "}
        <span className="font-semibold">({fmt(depositAmount)})</span> or pay the{" "}
        <span className="font-semibold">full amount with no additional fees</span>{" "}
        <span className="font-semibold">(110)</span>.
      </p>

      <div className="mt-4 flex items-center gap-4 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4">
        <img
          src={sinpeMovilImg}
          alt="SINPE Móvil"
          className="h-10 w-10 rounded-lg object-cover"
          loading="lazy"
        />

        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-900">{phone}</div>
          <div className="mt-1 text-xs text-gray-500">
            <span className="font-medium text-gray-700">{owner}</span>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-500">
        <span className="font-semibold text-gray-700">Description:</span>{" "}
        You are coming on February 24 at 8:00 PM.
      </p>
    </div>
  );
}
