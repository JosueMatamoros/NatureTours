// src/pages/SpecialLinksAdminPage.jsx
// Crear links especiales de pago: tour + fecha + horario + pasajeros fijos y,
// opcionalmente, un monto personalizado. El cliente abre /link/:id y paga.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiCopy,
  FiCheck,
  FiLink,
  FiCalendar,
  FiClock,
  FiUsers,
  FiCreditCard,
  FiChevronDown,
  FiPower,
  FiCheckCircle,
} from "react-icons/fi";
import { TOURS } from "../data/tours";
import CalendarPicker from "../components/checkout/CalendarPicker";
import GuestCounterRow from "../components/ui/GuestCounterRow";
import {
  getAllSpecialLinks,
  createSpecialLink,
  setSpecialLinkActive,
} from "../../services/special-links.api";

const SLOTS = {
  1: [
    { value: "18:00", label: "6:00 PM" },
    { value: "20:00", label: "8:00 PM" },
  ],
  2: [
    { value: "08:00", label: "8:00 AM" },
    { value: "12:00", label: "12:00 MD" },
    { value: "15:00", label: "3:00 PM" },
  ],
};

const FEE = 0.054;
const round2 = (n) => Math.round(n * 100) / 100;
const fmt = (n) => `$${Number(n ?? 0).toFixed(2)}`;

function linkUrl(id) {
  return `${window.location.origin}/link/${id}`;
}

function slotLabel(tourId, hm) {
  return SLOTS[tourId]?.find((s) => s.value === hm)?.label ?? hm;
}

function CopyButton({ text, primary = false, className = "" }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* sin permiso de portapapeles */
        }
      }}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-500/30",
        copied
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          : primary
          ? "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
          : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50",
        className,
      ].join(" ")}
    >
      {copied ? <FiCheck className="h-4 w-4" /> : <FiCopy className="h-4 w-4" />}
      {copied ? "¡Copiado!" : "Copiar link"}
    </button>
  );
}

function shortDate(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  const txt = new Date(y, m - 1, d, 12).toLocaleDateString("es-CR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return txt.charAt(0).toUpperCase() + txt.slice(1).replace(/\./g, "");
}

function guestsLabel(l) {
  const parts = [`${l.adults} adulto${l.adults === 1 ? "" : "s"}`];
  if (l.children > 0) parts.push(`${l.children} niño${l.children === 1 ? "" : "s"}`);
  if (l.babies > 0) parts.push(`${l.babies} bebé${l.babies === 1 ? "" : "s"}`);
  return parts.join(" · ");
}

const STATUS = {
  paid: { label: "Pagado", chip: "bg-emerald-100 text-emerald-700", card: "border-emerald-200", bar: "bg-emerald-500" },
  open: { label: "Sin pagar", chip: "bg-amber-100 text-amber-700", card: "border-gray-200", bar: "bg-amber-400" },
  off: { label: "Desactivado", chip: "bg-gray-100 text-gray-500", card: "border-gray-200", bar: "bg-gray-300" },
};

function LinkCard({ link: l, onToggle }) {
  const status = l.used ? "paid" : l.active ? "open" : "off";
  const st = STATUS[status];
  return (
    <article className={`relative overflow-hidden rounded-2xl border bg-white shadow-sm ${st.card}`}>
      <span className={`absolute inset-y-0 left-0 w-1 ${st.bar}`} aria-hidden="true" />
      <div className={`p-4 pl-5 sm:p-5 sm:pl-6 ${status === "off" ? "opacity-70" : ""}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-gray-900">{l.tourName}</p>
            {l.note && <p className="mt-0.5 truncate text-sm text-gray-500">{l.note}</p>}
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${st.chip}`}>
            {st.label}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-gray-700">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1.5 ring-1 ring-gray-100">
            <FiCalendar className="h-3.5 w-3.5 text-emerald-600" /> {shortDate(l.tourDate)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1.5 ring-1 ring-gray-100">
            <FiClock className="h-3.5 w-3.5 text-emerald-600" /> {slotLabel(l.tourId, l.startTime)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1.5 ring-1 ring-gray-100">
            <FiUsers className="h-3.5 w-3.5 text-emerald-600" /> {guestsLabel(l)}
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-500">
            {l.customSubtotal != null ? "Monto personalizado" : "Precio normal"} {fmt(l.subtotal)}
            <br />+ fee PayPal {fmt(l.fee)}
          </p>
          <p className="text-right">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              {status === "paid" ? "Cobrado" : "Total"}
            </span>
            <span className={`text-xl font-black ${status === "paid" ? "text-emerald-600" : "text-gray-900"}`}>
              {fmt(l.total)}
            </span>
          </p>
        </div>

        {status === "paid" ? (
          <p className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-700">
            <FiCheckCircle className="h-4 w-4" /> Pagado · el link ya no se puede usar
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {status === "open" ? (
              <CopyButton text={linkUrl(l.id)} primary className="w-full" />
            ) : (
              <span className="inline-flex items-center justify-center rounded-xl bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-400">
                Link inactivo
              </span>
            )}
            <button
              type="button"
              onClick={() => onToggle(l)}
              className={[
                "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ring-1 transition",
                status === "open"
                  ? "bg-white text-red-600 ring-red-200 hover:bg-red-50"
                  : "bg-white text-emerald-700 ring-emerald-200 hover:bg-emerald-50",
              ].join(" ")}
            >
              <FiPower className="h-4 w-4" />
              {status === "open" ? "Desactivar" : "Activar"}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

function dateLabel(ymd) {
  if (!ymd) return "Elegir fecha";
  const [y, m, d] = ymd.split("-").map(Number);
  const txt = new Date(y, m - 1, d, 12).toLocaleDateString("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

function SectionLabel({ icon, children }) {
  const Ico = { C: icon };
  return (
    <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800">
      <Ico.C className="h-4 w-4 text-emerald-600" />
      {children}
    </p>
  );
}

// Opción seleccionable tipo tarjeta (reemplaza los <select> nativos).
function ChoiceButton({ active, onClick, children, sub }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition",
        "focus:outline-none focus:ring-2 focus:ring-emerald-600/30",
        active
          ? "border-emerald-600 bg-emerald-50"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
      ].join(" ")}
    >
      <span>
        <span className={active ? "font-semibold text-gray-900" : "text-gray-700"}>{children}</span>
        {sub && <span className="block text-xs text-gray-500">{sub}</span>}
      </span>
      <span
        className={[
          "grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
          active ? "border-emerald-600 bg-emerald-600" : "border-gray-300 bg-white",
        ].join(" ")}
        aria-hidden="true"
      >
        {active && <span className="h-2 w-2 rounded-full bg-white" />}
      </span>
    </button>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 text-sm font-semibold text-gray-800"
    >
      <span
        className={[
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
          checked ? "bg-emerald-600" : "bg-gray-300",
        ].join(" ")}
      >
        <span
          className={[
            "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5",
          ].join(" ")}
        />
      </span>
      {label}
    </button>
  );
}

const NO_SPIN =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

export default function SpecialLinksAdminPage() {
  const navigate = useNavigate();

  const [tourId, setTourId] = useState(2);
  const [tourDate, setTourDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [babies, setBabies] = useState(0);
  const [useCustom, setUseCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [note, setNote] = useState("");
  const [calOpen, setCalOpen] = useState(false);

  const [links, setLinks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await getAllSpecialLinks();
      setLinks(data?.links ?? []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const tour = TOURS[tourId];
  const normalSubtotal = round2(
    adults * Number(tour?.price ?? 0) + children * Number(tour?.childPrice ?? tour?.price ?? 0)
  );
  const subtotal = useCustom ? round2(Number(customAmount) || 0) : normalSubtotal;
  const total = round2(subtotal + round2(subtotal * FEE));

  const canSave = useMemo(
    () =>
      tourDate &&
      startTime &&
      adults >= 1 &&
      babies <= adults &&
      (!useCustom || Number(customAmount) > 0),
    [tourDate, startTime, adults, babies, useCustom, customAmount]
  );

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setCreated(null);
    try {
      setSaving(true);
      const data = await createSpecialLink({
        tourId,
        tourDate,
        startTime,
        adults,
        children,
        babies,
        customSubtotal: useCustom ? round2(Number(customAmount)) : null,
        note: note.trim() || null,
      });
      setCreated(data.link);
      setNote("");
      load();
    } catch (err) {
      setError(err?.message || "No se pudo crear el link");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(link) {
    try {
      await setSpecialLinkActive(link.id, !link.active);
      load();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 text-gray-900">
      <div className="mx-auto max-w-3xl space-y-6">
        <button
          type="button"
          onClick={() => navigate("/matamoros")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
        >
          <FiArrowLeft /> Volver
        </button>

        <div>
          <h1 className="text-2xl font-black">Links especiales</h1>
          <p className="text-sm text-gray-500">
            Fecha, horario, pasajeros y monto fijos. El cliente solo abre el link y paga.
          </p>
        </div>

        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <section>
            <SectionLabel icon={FiLink}>Tour</SectionLabel>
            <div className="grid gap-3 sm:grid-cols-2">
              {[2, 1].map((id) => (
                <ChoiceButton
                  key={id}
                  active={tourId === id}
                  sub={`$${TOURS[id].price} adulto${TOURS[id].childPrice ? ` · $${TOURS[id].childPrice} niño` : ""}`}
                  onClick={() => {
                    setTourId(id);
                    setStartTime("");
                  }}
                >
                  {TOURS[id].name}
                </ChoiceButton>
              ))}
            </div>
          </section>

          <section className="relative">
            <SectionLabel icon={FiCalendar}>Fecha</SectionLabel>
            <button
              type="button"
              onClick={() => setCalOpen((o) => !o)}
              className={[
                "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition",
                calOpen || tourDate ? "border-emerald-600 bg-emerald-50" : "border-gray-200 bg-white hover:bg-gray-50",
              ].join(" ")}
            >
              <span className={tourDate ? "font-semibold text-gray-900" : "text-gray-500"}>
                {dateLabel(tourDate)}
              </span>
              <FiChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${calOpen ? "rotate-180" : ""}`} />
            </button>
            {calOpen && (
              <>
                <button
                  type="button"
                  aria-hidden
                  tabIndex={-1}
                  onClick={() => setCalOpen(false)}
                  className="fixed inset-0 z-20 cursor-default"
                />
                <div className="absolute left-0 top-full z-30 mt-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl">
                  <CalendarPicker
                    selected={tourDate || undefined}
                    bare
                    onSelect={(ymd) => {
                      if (ymd) {
                        setTourDate(ymd);
                        setCalOpen(false);
                      }
                    }}
                  />
                </div>
              </>
            )}
          </section>

          <section>
            <SectionLabel icon={FiClock}>Horario</SectionLabel>
            <div className="grid gap-3 sm:grid-cols-3">
              {SLOTS[tourId].map((sl) => (
                <ChoiceButton
                  key={sl.value}
                  active={startTime === sl.value}
                  onClick={() => setStartTime(sl.value)}
                >
                  {sl.label}
                </ChoiceButton>
              ))}
            </div>
          </section>

          <section>
            <SectionLabel icon={FiUsers}>Pasajeros</SectionLabel>
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
              <GuestCounterRow
                label="Adultos"
                sublabel={`13+ · $${tour?.price}`}
                value={adults}
                onDecrease={() => setAdults((a) => Math.max(1, a - 1))}
                onIncrease={() => setAdults((a) => Math.min(25, a + 1))}
                decreaseDisabled={adults <= 1}
                increaseDisabled={adults + children >= 25}
              />
              <GuestCounterRow
                label="Niños"
                sublabel={`4–12 · $${tour?.childPrice ?? tour?.price}`}
                value={children}
                onDecrease={() => setChildren((c) => Math.max(0, c - 1))}
                onIncrease={() => setChildren((c) => c + 1)}
                decreaseDisabled={children <= 0}
                increaseDisabled={adults + children >= 25}
              />
              <GuestCounterRow
                label="Bebés"
                sublabel="Menos de 4 · gratis, van con un adulto"
                value={babies}
                onDecrease={() => setBabies((b) => Math.max(0, b - 1))}
                onIncrease={() => setBabies((b) => Math.min(adults, b + 1))}
                decreaseDisabled={babies <= 0}
                increaseDisabled={babies >= adults}
              />
            </div>
          </section>

          <div className="rounded-xl border border-gray-200 p-4">
            <Toggle checked={useCustom} onChange={setUseCustom} label="Monto personalizado" />
            {useCustom ? (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20">
                <span className="text-lg font-bold text-emerald-600">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="1"
                  step="0.01"
                  placeholder="Monto del tour (sin el fee de PayPal)"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className={`w-full bg-transparent text-sm outline-none ${NO_SPIN}`}
                />
              </div>
            ) : (
              <p className="mt-2 text-xs text-gray-500">
                Precio normal: {fmt(normalSubtotal)} ({adults} × {fmt(tour?.price)}
                {children > 0 ? ` + ${children} × ${fmt(tour?.childPrice ?? tour?.price)}` : ""})
              </p>
            )}
          </div>

          <label className="block">
            <span className="text-xs font-semibold text-gray-600">Nota interna (opcional)</span>
            <input
              type="text"
              maxLength={200}
              placeholder="Ej: nombre del cliente"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>

          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm">
            <span className="text-gray-600">
              Tour {fmt(subtotal)} + fee 5.4% → el cliente paga
            </span>
            <span className="text-lg font-bold text-emerald-600">{fmt(total)}</span>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={!canSave || saving}
            className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
          >
            {saving ? "Creando…" : "Crear link"}
          </button>

          {created && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs font-semibold text-emerald-700">Link creado</p>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 truncate text-xs">{linkUrl(created.id)}</code>
                <CopyButton text={linkUrl(created.id)} />
              </div>
            </div>
          )}
        </form>

        <section className="rounded-2xl border border-indigo-200 bg-linear-to-br from-indigo-50 to-white p-5 shadow-sm">
          <p className="flex items-center gap-2 text-base font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-100 text-indigo-600">
              <FiCreditCard className="h-4 w-4" />
            </span>
            Pago personalizado
          </p>
          <p className="mt-2 text-sm text-gray-600">
            El cliente pone el monto y la descripción, confirma y paga con PayPal.
            Le llega un correo de pago (no de reserva) a él y a ustedes.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 truncate rounded-xl bg-white px-3 py-2.5 text-xs text-gray-700 ring-1 ring-indigo-100">
              {`${window.location.origin}/custom-payment`}
            </code>
            <CopyButton text={`${window.location.origin}/custom-payment`} primary className="w-full sm:w-auto" />
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-bold">Links creados</h2>
            {links.length > 0 && (
              <span className="text-xs text-gray-500">
                {links.filter((l) => !l.used && l.active).length} sin pagar ·{" "}
                {links.filter((l) => l.used).length} pagado
                {links.filter((l) => l.used).length === 1 ? "" : "s"}
              </span>
            )}
          </div>
          {links.length === 0 && (
            <p className="rounded-2xl border border-dashed border-gray-200 bg-white py-8 text-center text-sm text-gray-500">
              Todavía no hay links.
            </p>
          )}
          {links.map((l) => (
            <LinkCard key={l.id} link={l} onToggle={toggleActive} />
          ))}
        </section>
      </div>
    </div>
  );
}
