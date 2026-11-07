
import React from "react";
import { useNavigate } from "react-router-dom";
import InstallAppCard from "../components/ui/InstallAppCard";
import NotificationsCard from "../components/ui/NotificationsCard";
import { FiCalendar, FiSliders, FiUsers, FiUserCheck, FiCompass, FiLink, FiArrowLeft } from "react-icons/fi";

const CARDS = [
  {
    to: "/matamoros/reservaciones",
    eyebrow: "Gestión diaria",
    title: "Reservaciones",
    desc: "Ver hoy, mañana y futuras reservas con el teléfono del cliente.",
    icon: FiCalendar,
    card: "border-emerald-300/20 bg-linear-to-br from-emerald-500 to-emerald-700 shadow-[0_18px_40px_rgba(16,185,129,0.25)] hover:shadow-[0_24px_60px_rgba(16,185,129,0.35)] focus:ring-emerald-300/30",
    eyebrowColor: "text-emerald-50/80",
    descColor: "text-emerald-50/90",
  },
  {
    to: "/matamoros/slots",
    eyebrow: "Slots",
    title: "Disponibilidad",
    desc: "Bloquear días o ajustar espacios por horario.",
    icon: FiSliders,
    card: "border-blue-300/20 bg-linear-to-br from-sky-500 to-blue-700 shadow-[0_18px_40px_rgba(37,99,235,0.25)] hover:shadow-[0_24px_60px_rgba(37,99,235,0.35)] focus:ring-blue-300/30",
    eyebrowColor: "text-sky-50/80",
    descColor: "text-sky-50/90",
  },
  {
    to: "/matamoros/resellers",
    eyebrow: "Comisiones",
    title: "Resellers",
    desc: "Administrar resellers, comisiones y saldos pendientes.",
    icon: FiUsers,
    card: "border-violet-300/20 bg-linear-to-br from-violet-500 to-purple-700 shadow-[0_18px_40px_rgba(139,92,246,0.25)] hover:shadow-[0_24px_60px_rgba(139,92,246,0.35)] focus:ring-violet-300/30",
    eyebrowColor: "text-violet-50/80",
    descColor: "text-violet-50/90",
  },
  {
    to: "/matamoros/guias",
    eyebrow: "Equipo",
    title: "Guías",
    desc: "Crear y editar guías. Asignar un guía a cada horario.",
    icon: FiCompass,
    card: "border-amber-300/20 bg-linear-to-br from-amber-500 to-orange-600 shadow-[0_18px_40px_rgba(249,115,22,0.25)] hover:shadow-[0_24px_60px_rgba(249,115,22,0.35)] focus:ring-amber-300/30",
    eyebrowColor: "text-amber-50/80",
    descColor: "text-amber-50/90",
  },
  {
    to: "/matamoros/asistencia",
    eyebrow: "Operación del día",
    title: "Asistencia",
    desc: "Marcar llegadas y ver quién debe dinero. Alta manual de reservas.",
    icon: FiUserCheck,
    card: "border-rose-300/20 bg-linear-to-br from-rose-500 to-red-700 shadow-[0_18px_40px_rgba(244,63,94,0.25)] hover:shadow-[0_24px_60px_rgba(244,63,94,0.35)] focus:ring-rose-300/30",
    eyebrowColor: "text-rose-50/80",
    descColor: "text-rose-50/90",
  },
  {
    to: "/matamoros/links",
    eyebrow: "Ventas directas",
    title: "Links especiales",
    desc: "Link de pago con fecha, horario, pasajeros o monto fijo.",
    icon: FiLink,
    card: "border-teal-300/20 bg-linear-to-br from-teal-500 to-cyan-700 shadow-[0_18px_40px_rgba(20,184,166,0.25)] hover:shadow-[0_24px_60px_rgba(20,184,166,0.35)] focus:ring-teal-300/30",
    eyebrowColor: "text-teal-50/80",
    descColor: "text-teal-50/90",
  },
];

export default function AdminPage() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-12 text-black">
      <div className="mb-4 w-full max-w-4xl">
        <button
          type="button"
          onClick={() => navigate("/asistencia")}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm ring-1 ring-emerald-200 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        >
          <FiArrowLeft className="h-4 w-4" />
          Volver a asistencia
        </button>
        <NotificationsCard isAdmin className="mt-3" />
      </div>
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
          {CARDS.map((c) => (
            <button
              key={c.to}
              onClick={() => navigate(c.to)}
              className={`group flex items-center gap-4 rounded-3xl border px-6 py-6 text-left text-white transition-all duration-300 hover:-translate-y-1 focus:outline-none focus:ring-4 ${c.card}`}
            >
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 text-white transition-transform duration-300 group-hover:scale-105">
                <c.icon className="h-7 w-7" />
              </span>
              <span className="flex-1">
                <span className={`block text-sm uppercase tracking-[0.22em] ${c.eyebrowColor}`}>
                  {c.eyebrow}
                </span>
                <span className="mt-1 block text-2xl font-bold">{c.title}</span>
                <span className={`mt-2 block text-sm ${c.descColor}`}>{c.desc}</span>
              </span>
            </button>
          ))}
        </div>

        <InstallAppCard />
      </div>
    </div>
  );
}
