
import React from "react";
import { useNavigate } from "react-router-dom";
import { FiCalendar, FiMapPin, FiSliders } from "react-icons/fi";

export default function AdminPage() {
  const navigate = useNavigate();
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-white px-4 py-12 text-black">
      <div className="w-full max-w-4xl rounded-4xl border border-gray-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] sm:p-10">
        <div className="mb-8 text-center">
          <p className="mb-3 inline-flex rounded-full border border-gray-300 bg-gray-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-gray-700">
            Panel de Administración
          </p>
          <h1 className="text-3xl font-black tracking-tight text-black sm:text-5xl">
            Accesos rápidos
          </h1>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          <button
            className="group flex items-center gap-4 rounded-3xl border border-emerald-300/20 bg-linear-to-br from-emerald-500 to-emerald-700 px-6 py-6 text-left text-white shadow-[0_18px_40px_rgba(16,185,129,0.25)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(16,185,129,0.35)] focus:outline-none focus:ring-4 focus:ring-emerald-300/30"
            onClick={() => navigate("/matamoros/reservaciones")}
          >
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 text-white transition-transform duration-300 group-hover:scale-105">
              <FiCalendar className="h-7 w-7" />
            </span>
            <span className="flex-1">
              <span className="block text-sm uppercase tracking-[0.22em] text-emerald-50/80">
                Gestión diaria
              </span>
              <span className="mt-1 block text-2xl font-bold">Reservaciones</span>
              <span className="mt-2 block text-sm text-emerald-50/90">
                Ver hoy, mañana y futuras reservas con el teléfono del cliente.
              </span>
            </span>
          </button>
          <button
            className="group flex items-center gap-4 rounded-3xl border border-amber-200/20 bg-linear-to-br from-amber-400 to-orange-600 px-6 py-6 text-left text-slate-950 shadow-[0_18px_40px_rgba(251,191,36,0.22)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(251,191,36,0.3)] focus:outline-none focus:ring-4 focus:ring-amber-300/30"
            onClick={() => navigate("/matamoros/cabalgatas")}
          >
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/25 text-slate-950 transition-transform duration-300 group-hover:scale-105">
              <FiMapPin className="h-7 w-7" />
            </span>
            <span className="flex-1">
              <span className="block text-sm uppercase tracking-[0.22em] text-slate-950/70">
                Disponibilidad
              </span>
              <span className="mt-1 block text-2xl font-bold">Cabalgatas</span>
              <span className="mt-2 block text-sm text-slate-950/80">
                Administrar bloqueos y días no disponibles.
              </span>
            </span>
          </button>
          <button
            className="group flex items-center gap-4 rounded-3xl border border-sky-300/20 bg-linear-to-br from-sky-500 to-blue-700 px-6 py-6 text-left text-white shadow-[0_18px_40px_rgba(14,165,233,0.25)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(14,165,233,0.35)] focus:outline-none focus:ring-4 focus:ring-sky-300/30"
            onClick={() => navigate("/matamoros/slots")}
          >
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 text-white transition-transform duration-300 group-hover:scale-105">
              <FiSliders className="h-7 w-7" />
            </span>
            <span className="flex-1">
              <span className="block text-sm uppercase tracking-[0.22em] text-sky-50/80">
                Slots
              </span>
              <span className="mt-1 block text-2xl font-bold">Disponibilidad</span>
              <span className="mt-2 block text-sm text-sky-50/90">
                Bloquear días o ajustar espacios por horario.
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
