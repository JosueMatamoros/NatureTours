// src/pages/SpecialLinksAdminPage.jsx
// Crear links especiales de pago: tour + fecha + horario + pasajeros fijos y,
// opcionalmente, un monto personalizado. El cliente abre /link/:id y paga.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCopy, FiCheck, FiLink } from "react-icons/fi";
import { TOURS } from "../data/tours";
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

function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function linkUrl(id) {
  return `${window.location.origin}/link/${id}`;
}

function slotLabel(tourId, hm) {
  return SLOTS[tourId]?.find((s) => s.value === hm)?.label ?? hm;
}

function CopyButton({ text }) {
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
      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
    >
      {copied ? <FiCheck className="h-3.5 w-3.5 text-emerald-600" /> : <FiCopy className="h-3.5 w-3.5" />}
      {copied ? "Copiado" : "Copiar link"}
    </button>
  );
}

function Counter({ label, value, onChange, min = 0 }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-gray-600">{label}</span>
      <input
        type="number"
        min={min}
        max={25}
        value={value}
        onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
      />
    </label>
  );
}

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
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="text-xs font-semibold text-gray-600">Tour</span>
              <select
                value={tourId}
                onChange={(e) => {
                  setTourId(Number(e.target.value));
                  setStartTime("");
                }}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              >
                <option value={2}>Horseback Riding</option>
                <option value={1}>Night Walk</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-gray-600">Fecha</span>
              <input
                type="date"
                min={todayYmd()}
                value={tourDate}
                onChange={(e) => setTourDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-gray-600">Horario</span>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">Elegir…</option>
                {SLOTS[tourId].map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Counter label="Adultos" value={adults} onChange={setAdults} min={1} />
            <Counter label="Niños (4–12)" value={children} onChange={setChildren} />
            <Counter label="Bebés (<4)" value={babies} onChange={setBabies} />
          </div>

          <div className="rounded-xl border border-gray-200 p-3">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={useCustom}
                onChange={(e) => setUseCustom(e.target.checked)}
              />
              Monto personalizado
            </label>
            {useCustom ? (
              <input
                type="number"
                min="1"
                step="0.01"
                placeholder="Monto del tour en USD (sin el fee de PayPal)"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              />
            ) : (
              <p className="mt-1 text-xs text-gray-500">
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
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
          </label>

          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm">
            <span className="text-gray-600">
              Tour {fmt(subtotal)} + fee 5.4% → el cliente paga
            </span>
            <span className="text-lg font-bold text-emerald-600">{fmt(total)}</span>
          </div>

          {babies > adults && (
            <p className="text-xs text-red-600">Cada bebé debe ir con un adulto.</p>
          )}
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

        <div className="space-y-3">
          <h2 className="text-lg font-bold">Links creados</h2>
          {links.length === 0 && <p className="text-sm text-gray-500">Todavía no hay links.</p>}
          {links.map((l) => (
            <div
              key={l.id}
              className={`rounded-2xl border bg-white p-4 shadow-sm ${l.active ? "border-gray-200" : "border-gray-100 opacity-60"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <FiLink className="text-emerald-600" />
                    {l.tourName} · {l.tourDate} · {slotLabel(l.tourId, l.startTime)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {l.adults} adulto{l.adults === 1 ? "" : "s"}
                    {l.children > 0 ? ` · ${l.children} niño${l.children === 1 ? "" : "s"}` : ""}
                    {l.babies > 0 ? ` · ${l.babies} bebé${l.babies === 1 ? "" : "s"}` : ""}
                    {" · "}
                    {l.customSubtotal != null ? "monto personalizado " : ""}
                    {fmt(l.subtotal)} → paga {fmt(l.total)}
                  </p>
                  {l.note && <p className="mt-1 text-xs text-gray-700">{l.note}</p>}
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    l.used
                      ? "bg-emerald-100 text-emerald-700"
                      : l.active
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {l.used ? "Pagado" : l.active ? "Sin pagar" : "Desactivado"}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <CopyButton text={linkUrl(l.id)} />
                <button
                  type="button"
                  onClick={() => toggleActive(l)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  {l.active ? "Desactivar" : "Activar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
