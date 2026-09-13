import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiPlus,
  FiTrash2,
  FiX,
  FiMail,
  FiPhone,
  FiCheckCircle,
  FiCompass,
  FiEdit2,
  FiCreditCard,
  FiEye,
  FiEyeOff,
  FiAlertTriangle,
} from "react-icons/fi";
import {
  getGuides,
  createGuide,
  updateGuide,
  deleteGuide,
} from "../../services/guides.api";

// Toggle reutilizable
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

const EMPTY = {
  name: "", email: "", phone: "", cedula: "", password: "",
  canCreateManual: false, isAdmin: false, isSupervisor: false, isGuide: true,
};

function GuideModal({ guide, onClose, onSaved }) {
  const editing = !!guide;
  const [form, setForm] = useState(EMPTY);
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
    setShowPass(false);
    if (guide) {
      setForm({
        name: guide.name || "", email: guide.email || "", phone: guide.phone || "",
        cedula: guide.cedula || "", password: "",
        canCreateManual: !!guide.canCreateManual, isAdmin: !!guide.isAdmin, isSupervisor: !!guide.isSupervisor,
        isGuide: guide.isGuide !== false,
      });
    } else {
      setForm(EMPTY);
    }
  }, [guide]);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        cedula: form.cedula.replace(/\D/g, "") || null,
        password: form.password,
        canCreateManual: form.canCreateManual,
        isAdmin: form.isAdmin,
        isSupervisor: form.isSupervisor,
        isGuide: form.isGuide,
      };
      if (editing) await updateGuide(guide.id, payload);
      else await createGuide(payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || "No se pudo guardar el guía");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full rounded-xl border border-gray-200 px-3 py-2 text-base focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-0 sm:items-center sm:px-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-black text-gray-900">{editing ? "Editar guía" : "Nuevo guía"}</h3>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl text-gray-400 hover:bg-gray-100">
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-500">Nombre</span>
            <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ej. Josué" className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-500">Email</span>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="guia@ejemplo.com" className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-500">Teléfono (opcional)</span>
            <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="8888-8888" className={inputCls} />
          </label>

          <div className="rounded-xl border border-dashed border-gray-200 p-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Acceso (login del guía)</p>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-gray-500">Cédula</span>
              <input inputMode="numeric" value={form.cedula} onChange={(e) => set("cedula", e.target.value.replace(/\D/g, "").slice(0, 9))} placeholder="0 0000 0000" className={inputCls} />
            </label>
            <label className="mt-3 block">
              <span className="mb-1 block text-xs font-semibold text-gray-500">
                Contraseña {editing && <span className="font-normal text-gray-400">(dejar en blanco para no cambiar)</span>}
              </span>
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 focus-within:border-emerald-400">
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder={editing ? "••••••••" : "Contraseña"}
                  autoComplete="new-password"
                  className="w-full bg-transparent py-2 text-base outline-none"
                />
                <button type="button" onClick={() => setShowPass((v) => !v)} className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 hover:bg-gray-100" aria-label="Mostrar contraseña">
                  {showPass ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
            </label>
          </div>

          <div className="space-y-2 rounded-xl bg-gray-50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Guía asignable <span className="text-gray-400">(aparece para asignar a horarios)</span></span>
              <Toggle checked={form.isGuide} onChange={(v) => set("isGuide", v)} label="Guía asignable" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Administrador <span className="text-gray-400">(entra al panel)</span></span>
              <Toggle checked={form.isAdmin} onChange={(v) => set("isAdmin", v)} label="Administrador" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Supervisor <span className="text-gray-400">(ve todos los tours)</span></span>
              <Toggle checked={form.isSupervisor} onChange={(v) => set("isSupervisor", v)} label="Supervisor" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Puede crear reservas manuales</span>
              <Toggle checked={form.canCreateManual} onChange={(v) => set("canCreateManual", v)} label="Puede crear manuales" />
            </div>
          </div>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>}

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
            {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear guía"}
          </button>
        </div>
      </form>
    </div>
  );
}

function GuideCard({ g, onEdit, onToggleActive, onDelete, busy }) {
  return (
    <div className={`rounded-2xl border p-4 ${g.active ? "border-gray-200 bg-white" : "border-gray-200 bg-gray-50 opacity-75"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate font-bold text-gray-900">{g.name}</p>
            {g.isAdmin && <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">Admin</span>}
            {g.isSupervisor && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">Supervisor</span>}
            {!g.active && <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-600">Inactivo</span>}
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500"><FiMail className="h-3.5 w-3.5" /> {g.email}</p>
          {g.phone && <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500"><FiPhone className="h-3.5 w-3.5" /> {g.phone}</p>}
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
            <FiCreditCard className="h-3.5 w-3.5" /> {g.cedula || <span className="text-gray-400">sin cédula</span>}
          </p>
          {g.cedula && !g.hasPassword && (
            <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-amber-600">
              <FiAlertTriangle className="h-3.5 w-3.5" /> sin contraseña (no puede entrar)
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" onClick={() => onEdit(g)} disabled={busy} className="grid h-9 w-9 place-items-center rounded-xl text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50" title="Editar guía">
            <FiEdit2 className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => onDelete(g)} disabled={busy} className="grid h-9 w-9 place-items-center rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50" title="Eliminar guía">
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="text-sm text-gray-600">Activo</span>
        <Toggle checked={g.active} onChange={(v) => onToggleActive(g, v)} disabled={busy} label="Activo" />
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
  const [modal, setModal] = useState(null); // null=cerrado, {guide:null}=nuevo, {guide}=editar

  function load() {
    setLoading(true);
    setError(null);
    getGuides()
      .then((res) => setGuides(res.guides || []))
      .catch(() => setError("Error al cargar los guías"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function toggleActive(g, active) {
    setBusyId(g.id);
    setGuides((list) => list.map((x) => (x.id === g.id ? { ...x, active } : x)));
    try {
      await updateGuide(g.id, { active });
    } catch {
      load();
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
        <button onClick={() => navigate("/matamoros")} className="grid h-10 w-10 place-items-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-100">
          <FiArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="flex items-center gap-2 text-2xl font-black text-gray-900">
            <FiCompass className="h-6 w-6 text-orange-600" /> Guías
          </h1>
          <p className="text-sm text-gray-500">
            {activeCount} activo{activeCount === 1 ? "" : "s"} de {guides.length}. Editá cédula, contraseña y roles.
          </p>
        </div>
        <button onClick={() => setModal({ guide: null })} className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-teal-700">
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
            <GuideCard key={g.id} g={g} onEdit={(x) => setModal({ guide: x })} onToggleActive={toggleActive} onDelete={removeGuide} busy={busyId === g.id} />
          ))}
        </div>
      )}

      {modal && (
        <GuideModal guide={modal.guide} onClose={() => setModal(null)} onSaved={load} />
      )}
    </div>
  );
}
