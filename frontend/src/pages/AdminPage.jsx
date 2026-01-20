
import React from "react";
import { useNavigate } from "react-router-dom";

export default function AdminPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 bg-gray-50 py-16">
      <h1 className="text-3xl font-bold text-emerald-800 mb-8">Panel de Administración</h1>
      <div className="flex flex-col sm:flex-row gap-6">
        <button
          className="px-8 py-4 rounded-xl bg-emerald-600 text-white text-xl font-semibold shadow-lg hover:bg-emerald-700 transition border-2 border-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200"
          onClick={() => navigate("/matamoros/reservaciones")}
        >
          Reservaciones
        </button>
        <button
          className="px-8 py-4 rounded-xl bg-yellow-500 text-white text-xl font-semibold shadow-lg hover:bg-yellow-600 transition border-2 border-yellow-600 focus:outline-none focus:ring-4 focus:ring-yellow-200"
          onClick={() => navigate("/matamoros/cabalgatas")}
        >
          Cabalgatas
        </button>
      </div>
    </div>
  );
}
