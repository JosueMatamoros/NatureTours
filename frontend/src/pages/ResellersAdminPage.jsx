// src/pages/ResellersAdminPage.jsx
// Panel admin de resellers: crear/editar, ver saldos pendientes por reseller
// y marcar cada comisión como pagada o no-show (apartados).
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiPlus,
  FiEdit2,
  FiLink,
  FiChevronDown,
  FiUsers,
  FiX,
  FiPhone,
  FiMail,
  FiSearch,
} from "react-icons/fi";
import {
  getAllResellers,
  createReseller,
  updateReseller,
  getResellerCommissions,
  updateCommissionStatus,
} from "../../services/resellers.api";

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"];

function fmtMoney(n) {
  return `$${Number(n ?? 0).toFixed(2)}`;
}

function fmtDate(raw) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function fmtDateTime(raw) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function guestsText(b) {
  const parts = [`${b.adults} adulto${b.adults === 1 ? "" : "s"}`];
  if (b.children > 0) parts.push(`${b.children} niño${b.children === 1 ? "" : "s"}`);
  if (b.babies > 0) parts.push(`${b.babies} bebé${b.babies === 1 ? "" : "s"}`);
  return parts.join(" · ");
}

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ toast, onClose }) {
  if (!toast) return null;
  const style =
    toast.type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-red-200 bg-red-50 text-red-800";
  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`w-80 border rounded-xl shadow p-4 ${style}`}>
        <div className="flex items-start gap-3">
          <p className="flex-1 text-sm font-medium">{toast.message}</p>
          <button onClick={onClose} className="opacity-60 hover:opacity-100 text-xs">✕</button>
        </div>
      </div>
    </div>
  );
}

// ─── Chip de estado de comisión ──────────────────────────────────────────────
function StatusChip({ status }) {
  const map = {
    pending: { label: "Pendiente", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
    paid: { label: "Pagada", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
    no_show: { label: "No llegaron", cls: "bg-red-50 text-red-700 ring-red-200" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${s.cls}`}>
      {s.label}
    </span>
  );
}

// ─── Modal crear/editar reseller ─────────────────────────────────────────────
function ResellerModal({ open, initial, onClose, onSaved, showToast }) {
  const isEdit = Boolean(initial?.id);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [commission, setCommission] = useState(20);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setEmail(initial?.email ?? "");
    setPhone(initial?.phone ?? "");
    setCommission(initial?.commission ?? 20);
    setActive(initial?.active ?? true);
  }, [open, initial]);

  if (!open) return null;

  const discount = Math.max(30 - Number(commission || 0), 0);
  const nameOk = name.trim().length >= 2;
  const commissionOk = Number.isInteger(Number(commission)) && commission >= 0 && commission <= 30;

  async function handleSave() {
    if (!nameOk || !commissionOk) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        commission: Number(commission),
      };

      if (isEdit) {
        await updateReseller(initial.id, { ...payload, active });
      } else {
        await createReseller(payload);
      }

      showToast("success", isEdit ? "Reseller actualizado" : "Reseller creado");
      onSaved();
      onClose();
    } catch (e) {
      console.error("save reseller error:", e);
      showToast("error", e?.message || "No se pudo guardar el reseller");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">
            {isEdit ? "Editar reseller" : "Nuevo reseller"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700">Nombre</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              placeholder="Nombre del reseller"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">Correo</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              placeholder="correo@ejemplo.com (recibe copia de cada venta)"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">Teléfono</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              placeholder="88888888"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">
              Comisión (%)
            </label>
            <input
              type="number"
              min={0}
              max={30}
              value={commission}
              onChange={(e) => setCommission(e.target.value === "" ? "" : Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
            <p className="mt-1 text-xs text-gray-500">
              De 0 a 30. El cliente recibe el resto como descuento:{" "}
              <span className="font-semibold text-violet-700">{discount}% de descuento</span>.
            </p>
            {isEdit && (
              <p className="mt-1 text-xs text-amber-600">
                El cambio aplica solo a ventas nuevas; las comisiones ya registradas no se mueven.
              </p>
            )}
          </div>

          {isEdit && (
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
              />
              Activo (su página funciona)
            </label>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!nameOk || !commissionOk || saving}
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear reseller"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Fila de comisión ────────────────────────────────────────────────────────
function CommissionRow({ c, onUpdateStatus, updating }) {
  const isDeposit = c.mode === "deposit";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-gray-900">
              {c.customer?.name ?? "Cliente sin registrar"}
            </p>
            <StatusChip status={c.commissionStatus} />
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                isDeposit ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {isDeposit ? "Apartado 20%" : "Pago completo"}
            </span>
          </div>

          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            {c.customer?.phone && (
              <span className="inline-flex items-center gap-1.5">
                <FiPhone className="h-3.5 w-3.5 text-gray-400" />
                {c.customer.phone}
              </span>
            )}
            {c.customer?.email && (
              <span className="inline-flex items-center gap-1.5">
                <FiMail className="h-3.5 w-3.5 text-gray-400" />
                {c.customer.email}
              </span>
            )}
            {!c.customer?.phone && !c.customer?.email && "Sin datos de contacto"}
          </p>

          <p className="mt-2 text-xs text-gray-600">
            <span className="font-semibold">Reserva:</span> {c.booking.tourName} ·{" "}
            {fmtDate(c.booking.tourDate)} · {String(c.booking.startTime).slice(0, 5)} ·{" "}
            {guestsText(c.booking)}
          </p>
          <p className="text-xs text-gray-500">
            Vendida el {fmtDateTime(c.soldAt)} · Pagado en línea: {fmtMoney(c.amountPaid)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Comisión
          </p>
          <p
            className={`text-xl font-black ${
              c.commissionStatus === "no_show"
                ? "text-gray-400 line-through"
                : c.commissionStatus === "paid"
                ? "text-emerald-600"
                : "text-violet-700"
            }`}
          >
            {fmtMoney(c.commissionAmount)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-3">
        {c.commissionStatus === "pending" && (
          <>
            <button
              onClick={() => onUpdateStatus(c.paymentId, "paid")}
              disabled={updating}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Marcar pagada
            </button>
            {isDeposit && (
              <button
                onClick={() => onUpdateStatus(c.paymentId, "no_show")}
                disabled={updating}
                className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-100 disabled:opacity-50"
              >
                No llegaron
              </button>
            )}
          </>
        )}

        {c.commissionStatus !== "pending" && (
          <button
            onClick={() => onUpdateStatus(c.paymentId, "pending")}
            disabled={updating}
            className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100 disabled:opacity-50"
          >
            Volver a pendiente
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Panel de saldos de un reseller ──────────────────────────────────────────
function BalancesPanel({ reseller, showToast, onTotalsChange }) {
  const [commissions, setCommissions] = useState([]);
  const [totals, setTotals] = useState({ pending: 0, paid: 0 });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getResellerCommissions(reseller.id);
      setCommissions(data?.commissions ?? []);
      setTotals(data?.totals ?? { pending: 0, paid: 0 });
    } catch (e) {
      console.error("load commissions error:", e);
      showToast("error", "No se pudieron cargar los saldos");
    } finally {
      setLoading(false);
    }
  }, [reseller.id, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUpdateStatus(paymentId, status) {
    setUpdating(true);
    try {
      await updateCommissionStatus(paymentId, status);
      await load();
      onTotalsChange?.();
      showToast(
        "success",
        status === "paid"
          ? "Comisión marcada como pagada"
          : status === "no_show"
          ? "Marcada como no llegaron (no se paga)"
          : "Comisión de vuelta a pendiente",
      );
    } catch (e) {
      console.error("update commission error:", e);
      showToast("error", "No se pudo actualizar la comisión");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return <p className="py-6 text-center text-sm text-gray-400">Cargando saldos...</p>;
  }

  if (commissions.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-gray-400">
        Este reseller todavía no tiene ventas.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 rounded-xl bg-violet-50 px-4 py-3 ring-1 ring-violet-100">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-500">
            Pendiente de pagar
          </p>
          <p className="text-2xl font-black text-violet-700">{fmtMoney(totals.pending)}</p>
        </div>
        <div className="flex-1 rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-500">
            Ya pagado
          </p>
          <p className="text-2xl font-black text-emerald-700">{fmtMoney(totals.paid)}</p>
        </div>
      </div>

      {commissions.map((c) => (
        <CommissionRow
          key={c.paymentId}
          c={c}
          updating={updating}
          onUpdateStatus={handleUpdateStatus}
        />
      ))}
    </div>
  );
}

// ─── Página ──────────────────────────────────────────────────────────────────
export default function ResellersAdminPage() {
  const navigate = useNavigate();
  const [resellers, setResellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState("");

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await getAllResellers();
      setResellers(data?.resellers ?? []);
    } catch (e) {
      console.error("load resellers error:", e);
      showToast("error", "No se pudieron cargar los resellers");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPending = useMemo(
    () => resellers.reduce((acc, r) => acc + (r.pendingTotal ?? 0), 0),
    [resellers],
  );

  // Filtro por nombre, correo o teléfono (sin acentos, case-insensitive).
  const normalize = (s) =>
    String(s ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const filteredResellers = useMemo(() => {
    const q = normalize(search.trim());
    if (!q) return resellers;
    return resellers.filter((r) =>
      [r.name, r.email, r.phone].some((f) => normalize(f).includes(q)),
    );
  }, [resellers, search]);

  async function copyLink(reseller) {
    const url = `${window.location.origin}/reseller/${reseller.id}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("success", `Link de ${reseller.name} copiado`);
    } catch {
      showToast("error", url);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <ResellerModal
        open={modalOpen}
        initial={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSaved={load}
        showToast={showToast}
      />

      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/matamoros")}
              className="grid h-10 w-10 place-items-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
            >
              <FiArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-black text-gray-900">
                <FiUsers className="h-6 w-6 text-violet-600" />
                Resellers
              </h1>
              <p className="text-sm text-gray-500">
                Comisiones, links de venta y saldos pendientes.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
          >
            <FiPlus className="h-4 w-4" />
            Nuevo reseller
          </button>
        </div>

        {/* Buscador */}
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-violet-500/30">
          <FiSearch className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, correo o teléfono..."
            className="w-full bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-xs font-semibold text-gray-400 hover:text-gray-600"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Total pendiente global */}
        {totalPending > 0 && (
          <div className="mb-6 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4">
            <p className="text-sm text-violet-700">
              Total pendiente de pagar a resellers:{" "}
              <span className="text-lg font-black">{fmtMoney(totalPending)}</span>
            </p>
          </div>
        )}

        {loading ? (
          <p className="py-16 text-center text-sm text-gray-400">Cargando resellers...</p>
        ) : filteredResellers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
            <p className="text-sm text-gray-500">
              {search
                ? `Sin resultados para "${search}".`
                : "Todavía no hay resellers. Creá el primero con el botón de arriba."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredResellers.map((r) => {
              const expanded = expandedId === r.id;
              return (
                <div
                  key={r.id}
                  className={`rounded-2xl border bg-white shadow-sm transition ${
                    expanded ? "border-violet-300 ring-2 ring-violet-100" : "border-gray-200"
                  }`}
                >
                  {/* Fila principal */}
                  <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-base font-bold text-gray-900">{r.name}</p>
                        {!r.active && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
                            Inactivo
                          </span>
                        )}
                        <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700 ring-1 ring-violet-200">
                          Comisión {r.commission}%
                        </span>
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                          Desc. cliente {r.discount}%
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {[r.phone, r.email].filter(Boolean).join(" · ") || "Sin contacto"}
                        {" · "}
                        {r.salesCount} venta{r.salesCount === 1 ? "" : "s"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="mr-2 text-right">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                          Pendiente
                        </p>
                        <p
                          className={`text-lg font-black ${
                            r.pendingTotal > 0 ? "text-violet-700" : "text-gray-300"
                          }`}
                        >
                          {fmtMoney(r.pendingTotal)}
                        </p>
                      </div>

                      <button
                        onClick={() => copyLink(r)}
                        title="Copiar link de venta"
                        className="grid h-9 w-9 place-items-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                      >
                        <FiLink className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditing(r);
                          setModalOpen(true);
                        }}
                        title="Editar"
                        className="grid h-9 w-9 place-items-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                      >
                        <FiEdit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setExpandedId(expanded ? null : r.id)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                          expanded
                            ? "bg-violet-600 text-white"
                            : "bg-violet-50 text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100"
                        }`}
                      >
                        Ver saldos
                        <FiChevronDown
                          className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Saldos */}
                  {expanded && (
                    <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-4 rounded-b-2xl">
                      <BalancesPanel
                        reseller={r}
                        showToast={showToast}
                        onTotalsChange={load}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
