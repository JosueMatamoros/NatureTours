// Chip que indica de dónde viene la reserva: Viator, GetYourGuide, Localbird o Directo
// (web propia o alta manual = "Directo"). Se usa en todas las vistas de reservas.
const MAP = {
  viator: { label: "Viator", cls: "bg-blue-100 text-blue-700" },
  gyg: { label: "GetYourGuide", cls: "bg-red-100 text-red-700" },
  localbird: { label: "Localbird", cls: "bg-yellow-100 text-yellow-800" },
  web: { label: "Directo", cls: "bg-emerald-100 text-emerald-700" },
  manual: { label: "Directo", cls: "bg-emerald-100 text-emerald-700" },
};

export default function SourceChip({ source, className = "" }) {
  const s = MAP[source] || MAP.manual;
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${s.cls} ${className}`}>
      {s.label}
    </span>
  );
}
