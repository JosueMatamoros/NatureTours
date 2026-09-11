import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiEdit2,
  FiRepeat,
  FiX,
  FiCheck,
  FiClock,
} from "react-icons/fi";
import CalendarPicker from "../components/checkout/CalendarPicker";
import SourceChip from "../components/SourceChip";
import {
  listReservations,
  createReservation,
  editReservation,
  cancelReservation,
  moveReservation,
} from "../../services/reservations.api";

const TOUR = { id: 2, name: "Horseback Riding", capacity: 16 };
const SLOTS = ["08:00", "12:00", "15:00"];

const WEEKDAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"];

function todayYmd() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}
function shiftYmd(ymd, days) {
  const d = new Date(`${ymd}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function navLabel(ymd) {
  const d = new Date(`${ymd}T00:00:00`);
  const mon = MONTHS[d.getMonth()];
  return `${WEEKDAYS_SHORT[d.getDay()]}, ${d.getDate()} ${mon.charAt(0).toUpperCase()}${mon.slice(1)} ${d.getFullYear()}`;
}
function shortDate(ymd) {
  const d = new Date(`${ymd}T00:00:00`);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
function paxLine(r) {
  const parts = [];
  if (r.adults) parts.push(`${r.adults} adulto${r.adults === 1 ? "" : "s"}`);
  if (r.children) parts.push(`${r.children} niño${r.children === 1 ? "" : "s"}`);
  if (r.babies) parts.push(`${r.babies} bebé${r.babies === 1 ? "" : "s"}`);
  return parts.join(" · ") || "—";
}


// ─── Toast ──────────────────────────────────────────────────────────────────
function Toast({ toast, onClose }) {
  if (!toast) return null;
  const style = toast.type === "success"
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-red-200 bg-red-50 text-red-800";
  return (
    <div className="fixed top-4 right-4 z-50" role="status" aria-live="polite">
      <div className={`w-80 max-w-[calc(100vw-2rem)] border rounded-xl shadow-lg p-4 ${style}`}>
        <div className="flex items-start gap-3">
          <p className="flex-1 text-sm font-medium">{toast.message}</p>
          <button onClick={onClose} className="opacity-60 hover:opacity-100 text-xs cursor-pointer">✕</button>
        </div>
      </div>
    </div>
  );
}

// ─── Stepper ──────────────────────────────────────────────────────────────────
function Stepper({ label, value, onChange, min = 0, max = 25 }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <div className="inline-flex items-center rounded-lg border border-slate-200 overflow-hidden">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
          className="grid h-9 w-9 place-items-center text-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer">−</button>
        <span className="w-9 text-center text-sm font-semibold tabular-nums">{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}
          className="grid h-9 w-9 place-items-center text-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer">+</button>
      </div>
    </div>
  );
}

// ─── Modal shell ──────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900">{title}</h3>
          <button onClick={onClose} aria-label="Cerrar" className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer">
            <FiX className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-base outline-none focus:border-emerald-400";

// ─── Modal crear ──────────────────────────────────────────────────────────────
function CreateModal({ date, slot, onClose, onDone, showToast }) {
  const [form, setForm] = useState({
    startTime: slot || "08:00", name: "", phone: "", adults: 2, children: 0, babies: 0, paid: 0,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return showToast("error", "Poné un nombre");
    setSaving(true);
    try {
      await createReservation({
        tourId: TOUR.id, tourDate: date, startTime: form.startTime,
        name: form.name.trim(), phone: form.phone.trim(),
        adults: form.adults, children: form.children, babies: form.babies,
        paid: Number(form.paid) || 0,
      });
      showToast("success", "Reserva creada");
      onDone();
    } catch (err) {
      showToast("error", err.message);
    } finally { setSaving(false); }
  }

  return (
    <Modal title="Nueva reserva" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <p className="text-sm text-slate-500">{TOUR.name} · {shortDate(date)}</p>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Horario</label>
          <select value={form.startTime} onChange={(e) => set("startTime", e.target.value)} className={inputCls}>
            {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <input className={inputCls} placeholder="Nombre del cliente" value={form.name} onChange={(e) => set("name", e.target.value)} />
        <input className={inputCls} placeholder="Teléfono (opcional)" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        <div className="space-y-2 rounded-xl bg-slate-50 p-3">
          <Stepper label="Adultos" value={form.adults} onChange={(v) => set("adults", v)} min={1} />
          <Stepper label="Niños" value={form.children} onChange={(v) => set("children", v)} />
          <Stepper label="Bebés" value={form.babies} onChange={(v) => set("babies", v)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Pagado (USD)</label>
          <input type="number" inputMode="decimal" className={inputCls} value={form.paid} onChange={(e) => set("paid", e.target.value)} />
        </div>
        <button type="submit" disabled={saving} className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60 cursor-pointer">
          {saving ? "Guardando…" : "Crear reserva"}
        </button>
      </form>
    </Modal>
  );
}

// ─── Modal editar ─────────────────────────────────────────────────────────────
function EditModal({ r, onClose, onDone, showToast }) {
  const [form, setForm] = useState({
    name: r.customer?.name || "", phone: r.customer?.phone || "",
    adults: r.adults, children: r.children, babies: r.babies,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await editReservation(r.id, {
        adults: form.adults, children: form.children, babies: form.babies,
        phone: form.phone.trim(), name: form.name.trim(),
      });
      showToast("success", "Reserva actualizada");
      onDone();
    } catch (err) {
      showToast("error", err.message);
    } finally { setSaving(false); }
  }

  return (
    <Modal title="Editar reserva" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <input className={inputCls} placeholder="Nombre" value={form.name} onChange={(e) => set("name", e.target.value)} />
        <input className={inputCls} placeholder="Teléfono" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        <div className="space-y-2 rounded-xl bg-slate-50 p-3">
          <Stepper label="Adultos" value={form.adults} onChange={(v) => set("adults", v)} min={1} />
          <Stepper label="Niños" value={form.children} onChange={(v) => set("children", v)} />
          <Stepper label="Bebés" value={form.babies} onChange={(v) => set("babies", v)} />
        </div>
        <button type="submit" disabled={saving} className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60 cursor-pointer">
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>
    </Modal>
  );
}

// ─── Modal mover ──────────────────────────────────────────────────────────────
function MoveModal({ r, onClose, onDone, showToast }) {
  const [dstDate, setDstDate] = useState(r.tourDate);
  const [dstSlot, setDstSlot] = useState(r.startTime);
  const [calOpen, setCalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (dstDate === r.tourDate && dstSlot === r.startTime) return showToast("error", "Elegí un destino distinto");
    setSaving(true);
    try {
      await moveReservation(r.id, dstDate, dstSlot);
      showToast("success", "Reserva movida");
      onDone();
    } catch (err) {
      showToast("error", err.message);
    } finally { setSaving(false); }
  }

  return (
    <Modal title="Mover reserva" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <p className="text-sm text-slate-500">
          {r.customer?.name || "Reserva"} · actualmente {r.startTime}, {shortDate(r.tourDate)}
        </p>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Nuevo día</label>
          <button type="button" onClick={() => setCalOpen((o) => !o)} className={`${inputCls} flex items-center justify-between text-left cursor-pointer`}>
            <span>{navLabel(dstDate)}</span>
            <FiCalendar className="h-4 w-4 text-slate-400" />
          </button>
          {calOpen && (
            <div className="mt-2 rounded-xl border border-slate-200 p-2">
              <CalendarPicker selected={dstDate} bare onSelect={(ymd) => { if (ymd) { setDstDate(ymd); setCalOpen(false); } }} />
            </div>
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Nuevo horario</label>
          <select value={dstSlot} onChange={(e) => setDstSlot(e.target.value)} className={inputCls}>
            {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button type="submit" disabled={saving} className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60 cursor-pointer">
          {saving ? "Moviendo…" : "Mover reserva"}
        </button>
      </form>
    </Modal>
  );
}

// ─── Card de reserva ──────────────────────────────────────────────────────────
function ReservationCard({ r, date, onEdit, onMove, onCancel, busy }) {
  // Fantasma: la reserva se movió DESDE este horario a otro.
  if (r.ghost) {
    const to = r.movedTo;
    const where = to.date === date ? `${to.time}` : `${to.time}, ${shortDate(to.date)}`;
    return (
      <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/50 p-3">
        <div className="flex items-center gap-2">
          <FiRepeat className="h-4 w-4 shrink-0 text-blue-500" />
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">{r.customer?.name || "Reserva"}</span> se movió a{" "}
            <span className="font-semibold text-blue-700">{where}</span>
          </p>
        </div>
      </div>
    );
  }

  const movedFromTxt = r.movedFrom
    ? (r.movedFrom.date === date ? r.movedFrom.time : `${r.movedFrom.time}, ${shortDate(r.movedFrom.date)}`)
    : null;

  return (
    <div className={`rounded-xl border p-3 ${r.cancelled ? "border-slate-200 bg-slate-50 opacity-75" : "border-slate-200 bg-white"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className={`font-bold ${r.cancelled ? "text-slate-500 line-through" : "text-slate-900"}`}>
              {r.customer?.name || "Sin nombre"}
            </p>
            <SourceChip source={r.source} />
          </div>
          <p className="text-sm text-slate-500">{paxLine(r)}</p>
          {r.customer?.phone && (
            <a href={`tel:${r.customer.phone}`} className="text-sm font-medium text-blue-600">{r.customer.phone}</a>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {r.cancelled ? (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-600">Cancelada</span>
          ) : r.owes ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700 tabular-nums">Debe ${r.balanceDue}</span>
          ) : (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">Pagado</span>
          )}
          {r.arrived && !r.cancelled && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white"><FiCheck className="h-3 w-3" />Llegó</span>
          )}
          {movedFromTxt && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700"><FiRepeat className="h-3 w-3" />desde {movedFromTxt}</span>
          )}
        </div>
      </div>

      {!r.cancelled && (
        <div className="mt-3 flex gap-2">
          <button onClick={() => onEdit(r)} disabled={busy}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer">
            <FiEdit2 className="h-3.5 w-3.5" /> Editar
          </button>
          <button onClick={() => onMove(r)} disabled={busy}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-blue-200 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50 cursor-pointer">
            <FiRepeat className="h-3.5 w-3.5" /> Mover
          </button>
          <button onClick={() => onCancel(r)} disabled={busy}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 cursor-pointer">
            <FiX className="h-3.5 w-3.5" /> Cancelar
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function ReservacionesPage() {
  const navigate = useNavigate();
  const [date, setDate] = useState(() => todayYmd());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [modal, setModal] = useState(null); // {type:'create'|'edit'|'move', slot?, r?}

  function showToast(type, message) {
    setToast({ type, message });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 3000);
  }

  const load = useCallback(async (d) => {
    setLoading(true);
    try {
      const res = await listReservations(d);
      setEntries(res.entries || []);
    } catch (e) {
      showToast("error", "Error cargando reservas: " + e.message);
      setEntries([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(date); }, [load, date]);

  const bySlot = useMemo(() => {
    const m = new Map(SLOTS.map((s) => [s, []]));
    for (const e of entries) {
      if (!m.has(e.displaySlot)) m.set(e.displaySlot, []);
      m.get(e.displaySlot).push(e);
    }
    return m;
  }, [entries]);

  const activeCount = entries.filter((e) => !e.ghost && !e.cancelled).length;
  const totalGuests = entries
    .filter((e) => !e.ghost && !e.cancelled)
    .reduce((s, e) => s + e.guests, 0);

  async function handleCancel(r) {
    if (!window.confirm(`¿Cancelar la reserva de ${r.customer?.name || "este cliente"}? Queda marcada como cancelada (no se borra) y libera el cupo.`)) return;
    setBusyId(r.id);
    try {
      await cancelReservation(r.id);
      showToast("success", "Reserva cancelada");
      await load(date);
    } catch (e) {
      showToast("error", e.message);
    } finally { setBusyId(null); }
  }

  function afterModal() {
    setModal(null);
    load(date);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        {/* Header */}
        <div className="mb-5 flex items-center gap-3">
          <button onClick={() => navigate("/matamoros")} aria-label="Volver"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 cursor-pointer">
            <FiArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900">
              <FiCalendar className="h-6 w-6 text-emerald-600" /> Reservaciones
            </h1>
            <p className="text-sm text-slate-500">Crear, editar, mover y cancelar reservas.</p>
          </div>
          <button onClick={() => setModal({ type: "create" })}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 cursor-pointer">
            <FiPlus className="h-4 w-4" /> <span className="hidden sm:inline">Nueva</span>
          </button>
        </div>

        {/* Nav fecha */}
        <div className="relative mb-4 flex items-center gap-2">
          <button type="button" onClick={() => setCalendarOpen((o) => !o)} aria-label="Elegir fecha"
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl shadow-sm transition cursor-pointer ${calendarOpen ? "bg-emerald-600 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200"}`}>
            <FiCalendar className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-0.5 rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200">
            <button onClick={() => setDate((d) => shiftYmd(d, -1))} aria-label="Anterior" className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"><FiChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => setDate((d) => shiftYmd(d, 1))} aria-label="Siguiente" className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"><FiChevronRight className="h-4 w-4" /></button>
          </div>
          <span className="whitespace-nowrap text-base font-bold capitalize text-slate-800">{navLabel(date)}</span>

          {calendarOpen && (
            <>
              <button type="button" aria-hidden tabIndex={-1} onClick={() => setCalendarOpen(false)} className="fixed inset-0 z-20 cursor-default" />
              <div className="absolute left-0 top-full z-30 mt-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                <CalendarPicker selected={date} bare onSelect={(ymd) => { if (ymd) { setDate(ymd); setCalendarOpen(false); } }} />
              </div>
            </>
          )}
        </div>

        {/* Resumen */}
        {!loading && (
          <p className="mb-4 text-sm text-slate-500">
            <span className="font-semibold text-slate-800">{activeCount}</span> reserva{activeCount === 1 ? "" : "s"} · <span className="font-semibold text-slate-800">{totalGuests}</span> persona{totalGuests === 1 ? "" : "s"}
          </p>
        )}

        {/* Slots */}
        {loading ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />)}</div>
        ) : (
          <div className="space-y-5">
            {SLOTS.map((slot) => {
              const items = bySlot.get(slot) || [];
              return (
                <div key={slot}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600 text-white"><FiClock className="h-4 w-4" /></span>
                    <h3 className="text-lg font-black text-slate-900 tabular-nums">{slot}</h3>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      {items.filter((e) => !e.ghost && !e.cancelled).length} grupo{items.filter((e) => !e.ghost && !e.cancelled).length === 1 ? "" : "s"}
                    </span>
                    <button onClick={() => setModal({ type: "create", slot })}
                      className="ml-auto inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 cursor-pointer">
                      <FiPlus className="h-3.5 w-3.5" /> Agregar
                    </button>
                  </div>
                  {items.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-200 bg-white py-4 text-center text-sm text-slate-400">Sin reservas</p>
                  ) : (
                    <div className="space-y-2">
                      {items.map((r) => (
                        <ReservationCard
                          key={r.id + (r.ghost ? "-g" : "")}
                          r={r}
                          date={date}
                          busy={busyId === r.id}
                          onEdit={(x) => setModal({ type: "edit", r: x })}
                          onMove={(x) => setModal({ type: "move", r: x })}
                          onCancel={handleCancel}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modal?.type === "create" && (
        <CreateModal date={date} slot={modal.slot} onClose={() => setModal(null)} onDone={afterModal} showToast={showToast} />
      )}
      {modal?.type === "edit" && (
        <EditModal r={modal.r} onClose={() => setModal(null)} onDone={afterModal} showToast={showToast} />
      )}
      {modal?.type === "move" && (
        <MoveModal r={modal.r} onClose={() => setModal(null)} onDone={afterModal} showToast={showToast} />
      )}
    </div>
  );
}
