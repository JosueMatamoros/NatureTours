import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiDollarSign,
  FiCreditCard,
  FiCalendar,
  FiPlus,
  FiTrash2,
  FiCheck,
  FiAlertCircle,
} from "react-icons/fi";
import CalendarPicker from "../components/checkout/CalendarPicker";
import {
  getFinanceMonth,
  saveFinanceMonth,
  addFinancePayment,
  deleteFinancePayment,
} from "../../services/finance.api";

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"];

const SOURCES = [
  { key: "direct", label: "Directo", dot: "bg-emerald-300" },
  { key: "viator", label: "Viator", dot: "bg-sky-300" },
  { key: "gyg", label: "GetYourGuide", dot: "bg-rose-300" },
  { key: "localbird", label: "Localbird", dot: "bg-amber-300" },
];

const PROVIDERS = {
  viator: {
    name: "Viator",
    short: "Viator",
    when: "Paga cada lunes la semana anterior",
    accent: "text-sky-700",
    panel: "bg-sky-50/60 ring-sky-100",
    chip: "bg-sky-100 text-sky-700",
    selected: "bg-sky-600 text-white shadow-sm",
    ring: "focus:ring-sky-500/30 focus:border-sky-500",
    button: "bg-sky-600 hover:bg-sky-700",
  },
  gyg: {
    name: "GetYourGuide",
    short: "GYG",
    when: "Paga a inicio del mes siguiente",
    accent: "text-rose-700",
    panel: "bg-rose-50/60 ring-rose-100",
    chip: "bg-rose-100 text-rose-700",
    selected: "bg-rose-600 text-white shadow-sm",
    ring: "focus:ring-rose-500/30 focus:border-rose-500",
    button: "bg-rose-600 hover:bg-rose-700",
  },
};

const pad = (n) => String(n).padStart(2, "0");

// Saldos: desde el cierre de octubre 2026 (punto de partida). Pagos de las
// OTAs: desde noviembre 2026. Antes de eso solo se muestra lo generado.
const CONTROL_START = "2026-10";
const PAYMENTS_START = "2026-11";

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function shiftMonth(month, delta) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

// "2026-11-16" → "lun 16 nov"
function weekdayLabel(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  const wd = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"][new Date(y, m - 1, d).getDay()];
  return `${wd} ${d} ${MONTHS_SHORT[m - 1]}`;
}

// "2026-11-09" → "9 nov"
function shortDay(ymd) {
  const [, m, d] = ymd.split("-").map(Number);
  return `${d} ${MONTHS_SHORT[m - 1]}`;
}

function dateLabel(ymd) {
  if (!ymd) return "Elegir fecha";
  const [y, m, d] = ymd.split("-").map(Number);
  return `${d} ${MONTHS_SHORT[m - 1]} ${y}`;
}

function money(n) {
  const v = Number(n) || 0;
  return `$${v.toLocaleString("en-US", {
    minimumFractionDigits: v % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

// "1,250.50" / "1250,5" → número; "" → null
function parseAmount(s) {
  const raw = String(s ?? "").trim();
  if (!raw) return null;
  let t = raw.replace(/[^\d.,]/g, "");
  const lc = t.lastIndexOf(",");
  const ld = t.lastIndexOf(".");
  // coma como decimal solo si va al final con 1-2 dígitos (ej. "1250,5")
  if (lc > ld && t.length - lc - 1 <= 2) t = t.replace(/\./g, "").replace(",", ".");
  else t = t.replace(/,/g, "");
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

// 2450000 → "2,450,000" ; 812.4 → "812.40"
function toInput(n) {
  if (n == null || n === "") return "";
  const v = Number(n);
  if (!Number.isFinite(v)) return String(n);
  return v.toLocaleString("en-US", { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 });
}

function prettify(s) {
  const n = parseAmount(s);
  return n == null || Number.isNaN(n) ? s : toInput(n);
}

// ─── Piezas ─────────────────────────────────────────────────────────────────
function MoneyInput({ value, onChange, symbol = "$", placeholder = "0.00", ringClass, id, label }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-0 grid w-10 place-items-center text-base font-bold text-gray-400">
        {symbol}
      </span>
      <input
        id={id}
        aria-label={label}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => onChange(prettify(value))}
        placeholder={placeholder}
        className={`h-12 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-base font-semibold tabular-nums text-gray-900 placeholder:font-normal placeholder:text-gray-300 focus:outline-none focus:ring-4 ${
          ringClass || "focus:border-emerald-500 focus:ring-emerald-500/20"
        }`}
      />
    </div>
  );
}

function DateButton({ value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex h-12 w-full items-center justify-between gap-2 rounded-xl border px-4 text-left text-sm transition cursor-pointer ${
          open ? "border-gray-900 bg-gray-50" : "border-gray-200 bg-white hover:bg-gray-50"
        }`}
      >
        <span className="inline-flex items-center gap-2 font-semibold text-gray-900">
          <FiCalendar className="h-4 w-4 text-gray-400" />
          {dateLabel(value)}
        </span>
        <FiChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        // Centrado sobre la pantalla (no debajo del campo): en el celular no se corta.
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Elegir fecha del pago"
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-center justify-between px-2 pt-1">
              <p className="text-sm font-bold text-gray-800">Fecha del pago</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-11 rounded-xl px-3 text-sm font-semibold text-gray-500 hover:bg-gray-100 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
            <CalendarPicker
              selected={value || undefined}
              bare
              allowPast
              onSelect={(ymd) => {
                if (ymd) {
                  onChange(ymd);
                  setOpen(false);
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SectionCard({ icon, iconClass, title, hint, right, children }) {
  const Ico = { C: icon };
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${iconClass || "bg-gray-100 text-gray-700"}`}>
            <Ico.C className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-black leading-tight text-gray-900">{title}</h2>
            {hint && <p className="mt-0.5 text-sm text-gray-500">{hint}</p>}
          </div>
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

// ─── 1. Resumen: lo generado y dónde está ───────────────────────────────────
const WHERE = [
  { key: "paypal", label: "PayPal Directo", hint: "Pagos en línea desde la web", dot: "bg-sky-300" },
  { key: "cash", label: "Cobrado en efectivo", hint: "Saldo de reservas directas, se cobra al llegar", dot: "bg-amber-300" },
  { key: "otas", label: "OTA's", hint: "Viator, GetYourGuide y Localbird", dot: "bg-white/80" },
];
const OTA_KEYS = ["viator", "gyg", "localbird"];

function GeneratedCard({ generated, month }) {
  const [showOtas, setShowOtas] = useState(false);
  const total = Number(generated?.total) || 0;
  const where = generated?.where || {};
  const pct = (v, base = total) => (base > 0 ? Math.round(((Number(v) || 0) / base) * 100) : 0);
  const otaTotal = Number(where.otas) || 0;
  const otas = SOURCES.filter((s) => OTA_KEYS.includes(s.key) && generated?.bySource?.[s.key] != null)
    .map((s) => ({ ...s, amount: Number(generated.bySource[s.key]) || 0 }))
    .sort((a, b) => b.amount - a.amount);

  const Row = ({ w }) => (
    <>
      <span className="flex min-w-0 items-start gap-2.5">
        <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${w.dot}`} />
        <span className="min-w-0">
          <span className="flex items-center gap-1.5 text-sm font-bold">
            {w.label}
            {w.key === "otas" && otas.length > 0 && (
              <FiChevronDown className={`h-4 w-4 transition-transform duration-300 ${showOtas ? "rotate-180" : ""}`} />
            )}
          </span>
          <span className="block text-xs text-emerald-100/75">{w.hint}</span>
        </span>
      </span>
      <span className="shrink-0 text-right tabular-nums">
        <span className="block text-base font-black">{money(where[w.key])}</span>
        <span className="block text-xs font-medium text-emerald-100/70">{pct(where[w.key])}%</span>
      </span>
    </>
  );

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 p-5 text-white shadow-lg shadow-emerald-900/20 sm:p-6">
      <span aria-hidden className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
      <span aria-hidden className="pointer-events-none absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-teal-300/20 blur-2xl" />

      <div className="relative">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-100/90">
          Generado en {MONTHS[Number(month.split("-")[1]) - 1]}
        </p>
        <p className="mt-1 text-4xl font-black leading-none tabular-nums tracking-tight">{money(total)}</p>
        <p className="mt-1.5 text-xs text-emerald-100/80">
          {generated?.bookings || 0} reserva{generated?.bookings === 1 ? "" : "s"} · calculado por la app
        </p>

        {/* Barra: dónde está la plata */}
        <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-white/10" aria-hidden>
          {WHERE.map((w) => (
            <div key={w.key} className={`h-full ${w.dot}`} style={{ width: `${pct(where[w.key])}%` }} />
          ))}
        </div>

        <ul className="mt-4 space-y-1">
          {WHERE.map((w) =>
            w.key === "otas" && otas.length > 0 ? (
              <li key={w.key}>
                <button
                  type="button"
                  onClick={() => setShowOtas((o) => !o)}
                  aria-expanded={showOtas}
                  className="-mx-2 flex min-h-11 w-[calc(100%+1rem)] items-center justify-between gap-3 rounded-xl px-2 py-1.5 text-left transition hover:bg-white/10 cursor-pointer"
                >
                  <Row w={w} />
                </button>
                <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${showOtas ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <div className="overflow-hidden">
                    <div className="mb-1 mt-1 space-y-3 rounded-2xl bg-black/15 p-4 ring-1 ring-white/10">
                      {otas.map((r) => (
                        <div key={r.key}>
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="inline-flex items-center gap-2 font-semibold text-white/90">
                              <span className={`h-2.5 w-2.5 rounded-full ${r.dot}`} />
                              {r.label}
                            </span>
                            <span className="flex items-baseline gap-2 tabular-nums">
                              <span className="text-xs text-emerald-100/70">{pct(r.amount, otaTotal)}%</span>
                              <span className="font-bold">{money(r.amount)}</span>
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div className={`h-full rounded-full ${r.dot}`} style={{ width: `${pct(r.amount, otaTotal)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </li>
            ) : (
              <li key={w.key} className="flex min-h-11 items-center justify-between gap-3 py-1.5">
                <Row w={w} />
              </li>
            ),
          )}
        </ul>

        {generated?.missing > 0 && (
          <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-50/80">
            <FiAlertCircle className="h-3.5 w-3.5 shrink-0" />
            {generated.missing} reserva{generated.missing === 1 ? "" : "s"} OTA sin precio (no se suma
            {generated.missing === 1 ? "" : "n"})
          </p>
        )}
      </div>
    </div>
  );
}

function BalanceTile({ label, value, tone, emptyTone }) {
  const empty = value == null;
  return (
    <div className={`rounded-2xl p-4 ring-1 ${empty ? emptyTone : tone}`}>
      <p className="text-[11px] font-bold uppercase tracking-wide opacity-70">{label}</p>
      <p className={`mt-1 font-black leading-none tabular-nums tracking-tight ${empty ? "text-lg" : "text-2xl"}`}>
        {empty ? "Sin anotar" : money(value)}
      </p>
      <p className="mt-1.5 text-xs font-medium opacity-70">{empty ? "Anotalo abajo" : "Saldo al cierre"}</p>
    </div>
  );
}

function TotalTile({ balances }) {
  const vals = [balances?.paypal, balances?.bac, balances?.pettyCash];
  const anotados = vals.filter((v) => v != null);
  const total = anotados.reduce((t, v) => t + Number(v), 0);
  return (
    <div className="rounded-2xl bg-gray-900 p-4 text-white ring-1 ring-gray-900">
      <p className="text-[11px] font-bold uppercase tracking-wide text-white/70">Total en cuentas</p>
      <p className={`mt-1 font-black leading-none tabular-nums tracking-tight ${anotados.length ? "text-2xl" : "text-lg text-white/50"}`}>
        {anotados.length ? money(total) : "Sin anotar"}
      </p>
      <p className="mt-1.5 text-xs font-medium text-white/70">
        {anotados.length === 3 ? "PayPal + BAC + caja chica" : anotados.length ? `Faltan ${3 - anotados.length} por anotar` : "Anotalos abajo"}
      </p>
    </div>
  );
}

// ─── 2. Saldos al cierre (BAC + PayPal, siempre en dólares) ─────────────────
function BalancesCard({ month, balances, onSaved }) {
  const [bac, setBac] = useState(toInput(balances?.bac));
  const [paypal, setPaypal] = useState(toInput(balances?.paypal));
  const [petty, setPetty] = useState(toInput(balances?.pettyCash));
  const [notes, setNotes] = useState(balances?.notes || "");
  const [state, setState] = useState("idle"); // idle | saving | saved | error
  const [error, setError] = useState("");

  async function handleSave() {
    const bacN = parseAmount(bac);
    const paypalN = parseAmount(paypal);
    const pettyN = parseAmount(petty);
    if (Number.isNaN(bacN) || Number.isNaN(paypalN) || Number.isNaN(pettyN)) {
      setError("Revisá los montos: solo números (ej. 1,250.50).");
      setState("error");
      return;
    }
    setState("saving");
    setError("");
    try {
      await saveFinanceMonth(month, { bac: bacN, paypal: paypalN, pettyCash: pettyN, notes });
      setState("saved");
      onSaved?.();
      setTimeout(() => setState((s) => (s === "saved" ? "idle" : s)), 2500);
    } catch (e) {
      setError(e.message || "No se pudo guardar.");
      setState("error");
    }
  }

  return (
    <SectionCard icon={FiCreditCard} title="Saldos al cierre" hint="Cuánto tenés en cada cuenta a final de mes (en dólares).">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="bac" className="mb-1.5 block text-sm font-bold text-gray-800">BAC San José</label>
            <MoneyInput id="bac" label="Saldo BAC San José en dólares" value={bac} onChange={setBac} />
          </div>
          <div>
            <label htmlFor="paypal" className="mb-1.5 block text-sm font-bold text-gray-800">PayPal</label>
            <MoneyInput id="paypal" label="Saldo PayPal en dólares" value={paypal} onChange={setPaypal} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="petty" className="mb-1.5 block text-sm font-bold text-gray-800">Caja chica</label>
            <MoneyInput id="petty" label="Saldo de caja chica en dólares" value={petty} onChange={setPetty} />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="mb-1.5 block text-sm font-bold text-gray-800">
            Notas <span className="font-normal text-gray-400">(opcional)</span>
          </label>
          <textarea
            id="notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Algo para recordar de este mes…"
            className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-300 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
          />
        </div>

        {state === "error" && (
          <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-red-600">
            <FiAlertCircle className="h-4 w-4 shrink-0" /> {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={state === "saving"}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gray-900 text-sm font-bold text-white transition hover:bg-black disabled:opacity-50 cursor-pointer"
        >
          {state === "saving" ? "Guardando…" : state === "saved" ? (<><FiCheck className="h-4 w-4" /> Guardado</>) : "Guardar saldos"}
        </button>
      </div>
    </SectionCard>
  );
}

// ─── 3. Registro de pagos de las OTAs ───────────────────────────────────────
function OtaPaymentsCard({ month, generated, payments, received, viatorNext, onChanged }) {
  const defaultDate = todayYmd().startsWith(month) ? todayYmd() : `${month}-01`;
  const [provider, setProvider] = useState("viator");
  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState(defaultDate);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const cfg = PROVIDERS[provider];
  const list = [...payments].sort((a, b) => (a.paidAt < b.paidAt ? 1 : -1));

  async function handleAdd(e) {
    e.preventDefault();
    const n = parseAmount(amount);
    if (!n || Number.isNaN(n) || n <= 0) {
      setError("Escribí el monto que llegó.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await addFinancePayment({ provider, amount: n, paidAt });
      setAmount("");
      await onChanged();
    } catch (err) {
      setError(err.message || "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    if (confirmId !== id) {
      setConfirmId(id);
      setTimeout(() => setConfirmId((c) => (c === id ? null : c)), 3000);
      return;
    }
    setConfirmId(null);
    try {
      await deleteFinancePayment(id);
      await onChanged();
    } catch (err) {
      setError(err.message || "No se pudo borrar.");
    }
  }

  return (
    <SectionCard icon={FiCalendar} title="Pagos de las OTAs" hint="Anotá cada pago que llega y su fecha, para saber cuándo pagan.">
      {/* Estado por OTA */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        {["viator", "gyg"].map((p) => (
          <div key={p} className={`rounded-2xl p-4 ring-1 ${PROVIDERS[p].panel}`}>
            <div className="flex items-center justify-between gap-2">
              <span className={`text-sm font-black ${PROVIDERS[p].accent}`}>{PROVIDERS[p].name}</span>
              <span className="text-[11px] font-semibold text-gray-500">{PROVIDERS[p].when}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Recibido en el mes</p>
                <p className={`text-xl font-black tabular-nums ${PROVIDERS[p].accent}`}>{money(received?.[p])}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Generado en el mes</p>
                <p className="text-xl font-black tabular-nums text-gray-700">{money(generated?.bySource?.[p])}</p>
              </div>
            </div>
            {p === "viator" && viatorNext && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-white/80 px-3 py-2.5 ring-1 ring-sky-100">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-sky-700/80">
                    Próximo pago · {weekdayLabel(viatorNext.payDate)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {viatorNext.bookings
                      ? `${viatorNext.bookings} reserva${viatorNext.bookings === 1 ? "" : "s"} del ${shortDay(viatorNext.from)} al ${shortDay(viatorNext.to)}`
                      : `Sin tours del ${shortDay(viatorNext.from)} al ${shortDay(viatorNext.to)}`}
                  </p>
                </div>
                <p className="shrink-0 text-lg font-black tabular-nums text-sky-700">≈ {money(viatorNext.amount)}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Agregar pago */}
      <form onSubmit={handleAdd} className="rounded-2xl bg-gray-50 p-3 ring-1 ring-gray-100 sm:p-4">
        <p className="mb-2 text-sm font-bold text-gray-800">Anotar un pago</p>
        <div role="radiogroup" aria-label="¿Quién pagó?" className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-white p-1 ring-1 ring-gray-200">
          {["viator", "gyg"].map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={provider === p}
              onClick={() => setProvider(p)}
              className={`min-h-11 rounded-lg text-sm font-bold transition cursor-pointer ${
                provider === p ? PROVIDERS[p].selected : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {PROVIDERS[p].name}
            </button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <MoneyInput label={`Monto del pago de ${cfg.name}`} value={amount} onChange={setAmount} ringClass={cfg.ring} />
          <DateButton value={paidAt} onChange={setPaidAt} />
        </div>
        <button
          type="submit"
          disabled={busy}
          className={`mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition disabled:opacity-50 cursor-pointer ${cfg.button}`}
        >
          <FiPlus className="h-4 w-4" /> {busy ? "Guardando…" : `Agregar pago de ${cfg.name}`}
        </button>
        {error && (
          <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm font-medium text-red-600">
            <FiAlertCircle className="h-4 w-4 shrink-0" /> {error}
          </p>
        )}
      </form>

      {/* Historial del mes */}
      <p className="mb-2 mt-5 text-sm font-bold text-gray-800">Pagos recibidos este mes</p>
      {list.length > 0 ? (
        <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-100">
          {list.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className="flex min-w-0 items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${PROVIDERS[p.provider].chip}`}>
                  {PROVIDERS[p.provider].short}
                </span>
                <span className="text-sm font-semibold text-gray-600">{dateLabel(p.paidAt)}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="text-base font-bold tabular-nums text-gray-900">{money(p.amount)}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  aria-label={confirmId === p.id ? "Confirmar borrar pago" : "Borrar pago"}
                  className={`inline-flex h-11 min-w-11 items-center justify-center rounded-xl px-2 text-xs font-bold transition cursor-pointer ${
                    confirmId === p.id ? "bg-red-600 text-white" : "text-gray-400 hover:bg-red-50 hover:text-red-600"
                  }`}
                >
                  {confirmId === p.id ? "¿Borrar?" : <FiTrash2 className="h-4 w-4" />}
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-gray-200 py-5 text-center text-sm text-gray-400">
          Todavía no anotaste pagos este mes.
        </p>
      )}
    </SectionCard>
  );
}

// ─── Página ─────────────────────────────────────────────────────────────────
export default function FinanzasPage() {
  const navigate = useNavigate();
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (m, { quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    setError("");
    try {
      setData(await getFinanceMonth(m));
    } catch (e) {
      setError(e.message || "No se pudo cargar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(month); }, [load, month]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 text-gray-900">
      <div className="mx-auto max-w-3xl space-y-5">
        <button
          type="button"
          onClick={() => navigate("/matamoros")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 cursor-pointer"
        >
          <FiArrowLeft /> Volver
        </button>

        {/* Título + filtro del mes (arriba a la derecha) */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-black leading-tight">Finanzas</h1>
            <p className="text-sm text-gray-500">Control de fin de mes.</p>
          </div>
          <div className="flex shrink-0 items-center rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
            <button
              type="button"
              onClick={() => setMonth((m) => shiftMonth(m, -1))}
              aria-label="Mes anterior"
              className="grid h-11 w-10 place-items-center rounded-l-2xl text-gray-500 hover:bg-gray-100 cursor-pointer"
            >
              <FiChevronLeft className="h-5 w-5" />
            </button>
            <span className="min-w-[4.75rem] text-center text-sm font-bold capitalize tabular-nums">
              {MONTHS_SHORT[Number(month.split("-")[1]) - 1]} {month.split("-")[0]}
            </span>
            <button
              type="button"
              onClick={() => setMonth((m) => shiftMonth(m, 1))}
              aria-label="Mes siguiente"
              className="grid h-11 w-10 place-items-center rounded-r-2xl text-gray-500 hover:bg-gray-100 cursor-pointer"
            >
              <FiChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <FiAlertCircle className="h-4 w-4 shrink-0" /> {error}
          </p>
        )}

        {loading || !data ? (
          <div className="space-y-4">
            <div className="h-72 animate-pulse rounded-3xl bg-emerald-100" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
              <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
            </div>
          </div>
        ) : (
          <>
            {/* 1. Resumen */}
            <section aria-label="Resumen del mes" className="space-y-3">
              <GeneratedCard generated={data.generated} month={month} />
              {month >= CONTROL_START && (
              <div className="grid grid-cols-2 gap-3">
                <BalanceTile
                  label="PayPal"
                  value={data.balances?.paypal}
                  tone="bg-blue-50 text-blue-900 ring-blue-200"
                  emptyTone="bg-white text-gray-400 ring-gray-200"
                />
                <BalanceTile
                  label="BAC San José"
                  value={data.balances?.bac}
                  tone="bg-red-50 text-red-900 ring-red-200"
                  emptyTone="bg-white text-gray-400 ring-gray-200"
                />
                <BalanceTile
                  label="Caja chica"
                  value={data.balances?.pettyCash}
                  tone="bg-amber-50 text-amber-900 ring-amber-200"
                  emptyTone="bg-white text-gray-400 ring-gray-200"
                />
                <TotalTile balances={data.balances} />
              </div>
              )}
            </section>

            {month < CONTROL_START ? (
              <p className="rounded-2xl bg-white px-4 py-3 text-sm text-gray-500 ring-1 ring-gray-200">
                El control de saldos empieza con el <strong className="text-gray-700">cierre de octubre 2026</strong>. De los meses anteriores solo se muestra lo generado por el sistema.
              </p>
            ) : (<>
            {/* 2. Saldos */}
            <BalancesCard
              key={`bal-${month}`}
              month={month}
              balances={data.balances}
              onSaved={() => load(month, { quiet: true })}
            />

            {month >= PAYMENTS_START && (<>
            {/* 3. Pagos OTAs */}
            <OtaPaymentsCard
              key={`ota-${month}`}
              month={month}
              generated={data.generated}
              payments={data.payments}
              received={data.received}
              viatorNext={data.viatorNext}
              onChanged={() => load(month, { quiet: true })}
            />
            </>)}
            </>)}
          </>
        )}
      </div>
    </div>
  );
}
