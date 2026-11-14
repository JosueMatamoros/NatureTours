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
    icon: "bg-sky-100 text-sky-700",
    title: "Pagos de Viator",
    hint: "Viator paga cada semana (los lunes).",
    accent: "text-sky-700",
    chip: "bg-sky-100 text-sky-700",
    ring: "focus:ring-sky-500/30 focus:border-sky-500",
    button: "bg-sky-600 hover:bg-sky-700",
  },
  gyg: {
    icon: "bg-rose-100 text-rose-700",
    title: "Pagos de GetYourGuide",
    hint: "GetYourGuide paga una vez al mes, a inicios del mes siguiente.",
    accent: "text-rose-700",
    chip: "bg-rose-100 text-rose-700",
    ring: "focus:ring-rose-500/30 focus:border-rose-500",
    button: "bg-rose-600 hover:bg-rose-700",
  },
};

const pad = (n) => String(n).padStart(2, "0");

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

function monthLabel(month) {
  const [y, m] = month.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

function dateLabel(ymd) {
  if (!ymd) return "Elegir fecha";
  const [y, m, d] = ymd.split("-").map(Number);
  return `${d} ${MONTHS_SHORT[m - 1]} ${y}`;
}

function money(n, currency = "USD") {
  const v = Number(n) || 0;
  const sym = currency === "CRC" ? "₡" : "$";
  return `${sym}${v.toLocaleString("en-US", {
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
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-20 cursor-default"
          />
          <div className="absolute left-0 top-full z-30 mt-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl">
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
        </>
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

// ─── Resumen del cierre (lo primero que se ve) ──────────────────────────────
function SummaryTile({ label, value, sub, tone }) {
  return (
    <div className={`rounded-2xl p-4 ring-1 ${tone}`}>
      <p className="text-[11px] font-bold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-black leading-none tabular-nums tracking-tight">{value}</p>
      {sub && <p className="mt-1.5 text-xs font-medium opacity-70">{sub}</p>}
    </div>
  );
}

function SummaryGrid({ data, month }) {
  const b = data.balances || {};
  const otas = (Number(data.received?.viator) || 0) + (Number(data.received?.gyg) || 0);
  const empty = "Sin anotar";
  return (
    <section aria-label="Resumen del cierre">
      <p className="mb-2 text-sm font-bold text-gray-700">
        Resumen de <span className="capitalize">{monthLabel(month)}</span>
      </p>
      <div className="grid grid-cols-2 gap-3">
        <SummaryTile
          label="Generado"
          value={money(data.generated?.total)}
          sub="Calculado por la app"
          tone="bg-emerald-50 text-emerald-900 ring-emerald-200"
        />
        <SummaryTile
          label="BAC San José"
          value={b.bac == null ? empty : money(b.bac, b.bacCurrency)}
          sub={b.bac == null ? "Anotalo abajo" : b.bacCurrency === "CRC" ? "Colones" : "Dólares"}
          tone={b.bac == null ? "bg-white text-gray-400 ring-gray-200" : "bg-red-50 text-red-900 ring-red-200"}
        />
        <SummaryTile
          label="PayPal"
          value={b.paypal == null ? empty : money(b.paypal)}
          sub={b.paypal == null ? "Anotalo abajo" : "Dólares"}
          tone={b.paypal == null ? "bg-white text-gray-400 ring-gray-200" : "bg-blue-50 text-blue-900 ring-blue-200"}
        />
        <SummaryTile
          label="Pagos OTAs"
          value={money(otas)}
          sub={`Viator ${money(data.received?.viator)} · GYG ${money(data.received?.gyg)}`}
          tone="bg-gray-900 text-white ring-gray-900"
        />
      </div>
    </section>
  );
}

// ─── Generado según la app ──────────────────────────────────────────────────
function GeneratedCard({ generated }) {
  const total = Number(generated?.total) || 0;
  const rows = SOURCES.filter((s) => generated?.bySource?.[s.key] != null)
    .map((s) => ({ ...s, amount: Number(generated.bySource[s.key]) || 0 }))
    .sort((a, b) => b.amount - a.amount);
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 p-5 text-white shadow-lg shadow-emerald-900/20 sm:p-6">
      <span aria-hidden className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
      <span aria-hidden className="pointer-events-none absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-teal-300/20 blur-2xl" />
      <div className="relative flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20">
          <FiDollarSign className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-100/90">
            De dónde vino lo generado
          </p>
          <p className="mt-0.5 text-4xl font-black leading-none tabular-nums tracking-tight">{money(total)}</p>
          <p className="mt-1 text-xs text-emerald-100/80">
            {generated?.bookings || 0} reserva{generated?.bookings === 1 ? "" : "s"} con tour en el mes
          </p>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="relative mt-5 space-y-3 rounded-2xl bg-black/15 p-4 ring-1 ring-white/10">
          {rows.map((r) => {
            const pct = total > 0 ? Math.round((r.amount / total) * 100) : 0;
            return (
              <div key={r.key}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="inline-flex min-w-0 items-center gap-2 font-semibold text-white/90">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${r.dot}`} />
                    <span className="truncate">{r.label}</span>
                  </span>
                  <span className="flex items-baseline gap-2 tabular-nums">
                    <span className="text-xs font-medium text-emerald-100/70">{pct}%</span>
                    <span className="font-bold">{money(r.amount)}</span>
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full rounded-full ${r.dot}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          {generated.missing > 0 && (
            <p className="flex items-center gap-1.5 border-t border-white/10 pt-3 text-xs font-medium text-emerald-50/80">
              <FiAlertCircle className="h-3.5 w-3.5 shrink-0" />
              {generated.missing} reserva{generated.missing === 1 ? "" : "s"} OTA sin precio (no se suma
              {generated.missing === 1 ? "" : "n"})
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Saldos del mes (BAC + PayPal) ──────────────────────────────────────────
function BalancesCard({ month, balances, onSaved }) {
  const [bac, setBac] = useState(toInput(balances?.bac));
  const [bacCurrency, setBacCurrency] = useState(balances?.bacCurrency || "USD");
  const [paypal, setPaypal] = useState(toInput(balances?.paypal));
  const [notes, setNotes] = useState(balances?.notes || "");
  const [state, setState] = useState("idle"); // idle | saving | saved | error
  const [error, setError] = useState("");

  async function handleSave() {
    const bacN = parseAmount(bac);
    const paypalN = parseAmount(paypal);
    if (Number.isNaN(bacN) || Number.isNaN(paypalN)) {
      setError("Revisá los montos: solo números (ej. 1250.50).");
      setState("error");
      return;
    }
    setState("saving");
    setError("");
    try {
      await saveFinanceMonth(month, { bac: bacN, bacCurrency, paypal: paypalN, notes });
      setState("saved");
      onSaved?.();
      setTimeout(() => setState((s) => (s === "saved" ? "idle" : s)), 2500);
    } catch (e) {
      setError(e.message || "No se pudo guardar.");
      setState("error");
    }
  }

  return (
    <SectionCard icon={FiCreditCard} title="Saldos del mes" hint="Lo que tenés en cada cuenta al cierre del mes.">
      <div className="space-y-4">
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label htmlFor="bac" className="text-sm font-bold text-gray-800">BAC San José</label>
            <div role="radiogroup" aria-label="Moneda BAC" className="inline-flex rounded-lg bg-gray-100 p-0.5">
              {[["USD", "Dólares"], ["CRC", "Colones"]].map(([c, l]) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={bacCurrency === c}
                  onClick={() => setBacCurrency(c)}
                  className={`rounded-md px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                    bacCurrency === c ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <MoneyInput id="bac" label="Saldo BAC San José" value={bac} onChange={setBac} symbol={bacCurrency === "CRC" ? "₡" : "$"} />
        </div>

        <div>
          <label htmlFor="paypal" className="mb-1.5 block text-sm font-bold text-gray-800">PayPal</label>
          <MoneyInput id="paypal" label="Saldo PayPal" value={paypal} onChange={setPaypal} />
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
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gray-900 text-sm font-bold text-white transition hover:bg-black disabled:opacity-50 cursor-pointer sm:w-auto sm:px-8"
        >
          {state === "saving" ? "Guardando…" : state === "saved" ? (<><FiCheck className="h-4 w-4" /> Guardado</>) : "Guardar saldos"}
        </button>
      </div>
    </SectionCard>
  );
}

// ─── Pagos recibidos (Viator / GYG) ─────────────────────────────────────────
function PaymentsCard({ provider, payments, received, month, onChanged }) {
  const cfg = PROVIDERS[provider];
  const list = payments.filter((p) => p.provider === provider);
  const defaultDate = todayYmd().startsWith(month) ? todayYmd() : `${month}-01`;
  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState(defaultDate);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => { setPaidAt(defaultDate); }, [defaultDate]);

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
    <SectionCard
      icon={FiDollarSign}
      iconClass={cfg.icon}
      title={cfg.title}
      hint={cfg.hint}
      right={
        <div className="text-right">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Recibido</p>
          <p className={`text-xl font-black tabular-nums ${cfg.accent}`}>{money(received?.[provider])}</p>
        </div>
      }
    >
      {list.length > 0 ? (
        <ul className="mb-4 divide-y divide-gray-100 rounded-2xl border border-gray-100">
          {list.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-bold ${cfg.chip}`}>
                <FiCalendar className="h-3.5 w-3.5" /> {dateLabel(p.paidAt)}
              </span>
              <span className="flex items-center gap-2">
                <span className="text-base font-bold tabular-nums text-gray-900">{money(p.amount)}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  aria-label={confirmId === p.id ? "Confirmar borrar pago" : "Borrar pago"}
                  className={`inline-flex h-11 min-w-11 items-center justify-center gap-1 rounded-xl px-2 text-xs font-bold transition cursor-pointer ${
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
        <p className="mb-4 rounded-2xl border border-dashed border-gray-200 py-5 text-center text-sm text-gray-400">
          Todavía no anotaste pagos este mes.
        </p>
      )}

      <form onSubmit={handleAdd} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <MoneyInput label={`Monto ${cfg.title}`} value={amount} onChange={setAmount} ringClass={cfg.ring} />
        <DateButton value={paidAt} onChange={setPaidAt} />
        <button
          type="submit"
          disabled={busy}
          className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white transition disabled:opacity-50 cursor-pointer ${cfg.button}`}
        >
          <FiPlus className="h-4 w-4" /> {busy ? "Guardando…" : "Agregar pago"}
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm font-medium text-red-600">
          <FiAlertCircle className="h-4 w-4 shrink-0" /> {error}
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

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black">Finanzas</h1>
            <p className="text-sm text-gray-500">Cierre del mes: lo generado, tus cuentas y los pagos de las OTAs.</p>
          </div>
          <div className="flex items-center gap-1 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-gray-200">
            <button
              type="button"
              onClick={() => setMonth((m) => shiftMonth(m, -1))}
              aria-label="Mes anterior"
              className="grid h-11 w-11 place-items-center rounded-xl text-gray-500 hover:bg-gray-100 cursor-pointer"
            >
              <FiChevronLeft className="h-5 w-5" />
            </button>
            <span className="min-w-36 text-center text-sm font-bold capitalize">{monthLabel(month)}</span>
            <button
              type="button"
              onClick={() => setMonth((m) => shiftMonth(m, 1))}
              aria-label="Mes siguiente"
              className="grid h-11 w-11 place-items-center rounded-xl text-gray-500 hover:bg-gray-100 cursor-pointer"
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
            <div className="h-48 animate-pulse rounded-3xl bg-emerald-100" />
            <div className="h-64 animate-pulse rounded-3xl bg-gray-100" />
          </div>
        ) : (
          <>
            <SummaryGrid data={data} month={month} />
            <GeneratedCard generated={data.generated} />
            <BalancesCard
              key={`bal-${month}`}
              month={month}
              balances={data.balances}
              onSaved={() => load(month, { quiet: true })}
            />
            {["viator", "gyg"].map((p) => (
              <PaymentsCard
                key={`${p}-${month}`}
                provider={p}
                month={month}
                payments={data.payments}
                received={data.received}
                onChanged={() => load(month, { quiet: true })}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
