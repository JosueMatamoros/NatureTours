import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiPlus,
  FiTrash2,
  FiUsers,
  FiX,
  FiMail,
  FiPhone,
  FiCheckCircle,
  FiCompass,
} from "react-icons/fi";
import {
  getGuides,
  createGuide,
  updateGuide,
  deleteGuide,
} from "../../services/guides.api";

// Toggle reutilizable (activo / puede crear manual)
function Toggle({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-50 ${
        checked ? "bg-emerald-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

const EMPTY = { name: "", email: "", phone: "", canCreateManual: false };

function GuideModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) { setForm(EMPTY); setError(null); }
  }, [open]);

  if (!open) return null;

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await createGuide({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        canCreateManual: form.canCreateManual,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message || "No se pudo crear el guía");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-black text-gray-900">Nuevo guía</h3>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl text-gray-400 hover:bg-gray-100">
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-500">Nombre</span>
            <input
              type="text" value={form.name} onChange={(e) => set("name", e.target.value)}
              placeholder="Ej. Josué"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-500">Email (será su login a futuro)</span>
            <input
              type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
              placeholder="guia@ejemplo.com"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-500">Teléfono (opcional)</span>
            <input
              type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)}
              placeholder="8888-8888"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5">
            <span className="text-sm font-medium text-gray-700">Puede crear reservas manuales</span>
            <Toggle checked={form.canCreateManual} onChange={(v) => set("canCreateManual", v)} label="Puede crear manuales" />
          </div>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>}

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
            {saving ? "Guardando..." : "Crear guía"}
          </button>
        </div>
      </form>
    </div>
  );
}

function GuideCard({ g, onPatch, onDelete, busy }) {
  return (
    <div className={`rounded-2xl border p-4 ${g.active ? "border-gray-200 bg-white" : "border-gray-200 bg-gray-50 opacity-75"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-bold text-gray-900">{g.name}</p>
            {!g.active && <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-600">Inactivo</span>}
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
            <FiMail className="h-3.5 w-3.5" /> {g.email}
          </p>
          {g.phone && (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
              <FiPhone className="h-3.5 w-3.5" /> {g.phone}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDelete(g)}
          disabled={busy}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          title="Eliminar guía"
        >
          <FiTrash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 space-y-2 border-t border-gray-100 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Activo</span>
          <Toggle checked={g.active} onChange={(v) => onPatch(g, { active: v })} disabled={busy} label="Activo" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Puede crear reservas manuales</span>
          <Toggle checked={g.canCreateManual} onChange={(v) => onPatch(g, { canCreateManual: v })} disabled={busy} label="Puede crear manuales" />
        </div>
      </div>
    </div>
  );
}

export default function GuiasPage() {
  const navigate = useNavigate();
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    getGuides()
      .then((res) => setGuides(res.guides || []))
      .catch(() => setError("Error al cargar los guías"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function patchGuide(g, fields) {
    setBusyId(g.id);
    // Optimista
    setGuides((list) => list.map((x) => (x.id === g.id ? { ...x, ...fields } : x)));
    try {
      await updateGuide(g.id, fields);
    } catch {
      load(); // revertir con el estado real
    } finally {
      setBusyId(null);
    }
  }

  async function removeGuide(g) {
    if (!window.confirm(`¿Eliminar al guía "${g.name}"? Se quitarán sus asignaciones.`)) return;
    setBusyId(g.id);
    try {
      await deleteGuide(g.id);
      setGuides((list) => list.filter((x) => x.id !== g.id));
    } catch {
      load();
    } finally {
      setBusyId(null);
    }
  }

  const activeCount = useMemo(() => guides.filter((g) => g.active).length, [guides]);

  return (
    <div className="mx-auto w-full max-w-4xl p-4 sm:p-6">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate("/matamoros")}
          className="grid h-10 w-10 place-items-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
        >
          <FiArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="flex items-center gap-2 text-2xl font-black text-gray-900">
            <FiCompass className="h-6 w-6 text-orange-600" />
            Guías
          </h1>
          <p className="text-sm text-gray-500">
            {activeCount} activo{activeCount === 1 ? "" : "s"} de {guides.length}. Asigná un guía por horario desde Asistencia.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-teal-700"
        >
          <FiPlus className="h-4 w-4" /> <span className="hidden sm:inline">Nuevo guía</span>
        </button>
      </div>

      {loading && <p className="py-16 text-center text-sm text-gray-400">Cargando...</p>}
      {error && <p className="py-8 text-center font-semibold text-red-600">{error}</p>}

      {!loading && !error && guides.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 py-16 text-center">
          <FiCheckCircle className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-2 text-sm text-gray-400">Aún no hay guías. Creá el primero.</p>
        </div>
      )}

      {!loading && !error && guides.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {guides.map((g) => (
            <GuideCard key={g.id} g={g} onPatch={patchGuide} onDelete={removeGuide} busy={busyId === g.id} />
          ))}
        </div>
      )}

      <GuideModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={load} />
    </div>
  );
}
