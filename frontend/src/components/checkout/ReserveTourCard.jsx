import { useMemo, useState } from "react";
import { FiUsers, FiCalendar, FiClock, FiMinus, FiPlus } from "react-icons/fi";
import CalendarPicker from "./CalendarPicker";
import { useNavigate } from "react-router-dom";
import { createBooking } from "../../../services/bookings.api"; // tu ruta

// Tour 1: slots fijos PM
const fixedSlotsTour1 = [
  { id: 1, startHour: 18, label: "6:00 PM - 8:00 PM" },
  { id: 2, startHour: 20, label: "8:00 PM - 10:00 PM" },
];

function formatHourLabel(hour24) {
  if (hour24 === 12) return "12:00 MD"; // tu requisito
  const ampm = hour24 < 12 ? "AM" : "PM";
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  return `${hour12}:00 ${ampm}`;
}

function buildHourlySlots(startHour = 6, endHour = 18, durationHours = 2) {
  const slots = [];
  let id = 1;

  for (let h = startHour; h <= endHour; h++) {
    const end = h + durationHours;

    const startLabel = formatHourLabel(h);

    const endHourClamped = Math.min(end, 23);
    const endLabel = formatHourLabel(endHourClamped);

    slots.push({
      id: id++,
      startHour: h,
      startTime: `${String(h).padStart(2, "0")}:00`,
      label: `${startLabel} - ${endLabel}`,
    });
  }

  return slots;
}

export default function ReserveTourCard({ tour }) {
  const [slot, setSlot] = useState(null);
  const [guests, setGuests] = useState(1);
  const [selectedDate, setSelectedDate] = useState(undefined); // "YYYY-MM-DD"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // tourId viene del prop tour (NO de la URL)
  const tourId = Number(tour?.id);

  const total = useMemo(() => tour.price * guests, [tour.price, guests]);
  const isComplete = Boolean(selectedDate && slot);

  const timeSlots = useMemo(() => {
    if (tourId === 1) {
      // Tour 1: fijo PM
      return fixedSlotsTour1.map((s) => ({
        ...s,
        startTime: `${String(s.startHour).padStart(2, "0")}:00`,
      }));
    }

    if (tourId === 2) return buildHourlySlots(6, 18, 2);

    // fallback: usa los mismos PM
    return fixedSlotsTour1.map((s) => ({
      ...s,
      startTime: `${String(s.startHour).padStart(2, "0")}:00`,
    }));
  }, [tourId]);

  const selectedSlot = useMemo(
    () => timeSlots.find((t) => t.id === slot) || null,
    [timeSlots, slot]
  );

  const visibleSlots = useMemo(() => {
    if (!slot) return timeSlots;
    return selectedSlot ? [selectedSlot] : timeSlots;
  }, [slot, selectedSlot, timeSlots]);

  async function handleConfirm() {
    setError("");

    if (!tourId || Number.isNaN(tourId)) {
      setError("tourId inválido (tour.id no viene bien).");
      return;
    }
    if (!selectedDate || !selectedSlot?.startTime) return;

    const payload = {
      tourId,
      tourDate: selectedDate, // "YYYY-MM-DD"
      startTime: selectedSlot.startTime, // "HH:mm"
      guests,
    };

    try {
      setLoading(true);
      console.log("booking payload:", payload);

      const res = await createBooking(payload);

      // ajusta si tu API devuelve { booking: ... }
      const booking = res?.data;

      navigate("/payment", { state: { booking, payload } });
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          "No se pudo crear la reserva. "
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="w-full md:max-w-sm rounded-2xl border border-gray-200 bg-white shadow-sm h-fit">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 pt-5 pb-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Book Tour</h3>
        </div>

        <div className="text-right">
          <div className="flex items-baseline justify-end gap-1">
            <span className="text-2xl font-bold text-emerald-600">
              ${tour.price}
            </span>
            <span className="text-sm text-gray-500">/ person</span>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-6 py-6">
        {/* Date */}
        <section className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <FiCalendar className="h-4 w-4 text-emerald-600" />
            Select a date
          </label>

          <CalendarPicker
            selected={selectedDate}
            onSelect={(ymd) => {
              setSelectedDate(ymd); // "YYYY-MM-DD"
              setSlot(null);
            }}
          />
        </section>

        {/* Time slots */}
        {selectedDate && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <FiClock className="h-4 w-4 text-emerald-600" />
                Select a time
              </label>

              {slot ? (
                <button
                  type="button"
                  onClick={() => setSlot(null)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline underline-offset-2"
                >
                  Change time
                </button>
              ) : null}
            </div>

            <div className="grid gap-3">
              {visibleSlots.map((t) => {
                const active = slot === t.id;

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSlot(t.id)}
                    className={[
                      "group flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition",
                      "focus:outline-none focus:ring-2 focus:ring-emerald-600/30",
                      active
                        ? "border-emerald-600 bg-emerald-50"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    <span
                      className={
                        active ? "font-medium text-gray-900" : "text-gray-700"
                      }
                    >
                      {t.label}
                    </span>

                    <span
                      className={[
                        "grid h-5 w-5 place-items-center rounded-full border-2 transition-colors",
                        active
                          ? "border-emerald-600 bg-emerald-600"
                          : "border-gray-300 bg-white",
                      ].join(" ")}
                      aria-hidden="true"
                    >
                      {active && <span className="h-2 w-2 rounded-full bg-white" />}
                    </span>
                  </button>
                );
              })}
            </div>

            {slot ? (
              <p className="text-xs text-gray-500">
                Selected:{" "}
                <span className="font-semibold text-gray-700">
                  {selectedSlot?.label}
                </span>
              </p>
            ) : null}
          </section>
        )}

        {/* Guests */}
        <section className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <FiUsers className="h-4 w-4 text-emerald-600" />
            Number of guests
          </label>

          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
            <span className="text-sm text-gray-700">
              {guests} {guests === 1 ? "guest" : "guests"}
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setGuests((g) => Math.max(1, g - 1))}
                disabled={guests <= 1 || loading}
                className="grid h-9 w-9 place-items-center rounded-lg border border-gray-200 bg-white text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Decrease guests"
              >
                <FiMinus />
              </button>

              <span className="w-8 text-center text-base font-semibold text-gray-900">
                {guests}
              </span>

              <button
                type="button"
                onClick={() => setGuests((g) => Math.min(12, g + 1))}
                disabled={guests >= 12 || loading}
                className="grid h-9 w-9 place-items-center rounded-lg border border-gray-200 bg-white text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Increase guests"
              >
                <FiPlus />
              </button>
            </div>
          </div>
        </section>

        {/* Summary */}
        <section className="rounded-xl bg-gray-50 px-4 py-4 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>
              ${tour.price} x {guests} {guests === 1 ? "guest" : "guests"}
            </span>
            <span className="font-medium text-gray-900">${total}</span>
          </div>

          <div className="mt-3 border-t border-gray-200 pt-3">
            <div className="flex justify-between text-base font-semibold">
              <span className="text-gray-900">Total</span>
              <span className="text-emerald-600">${total}</span>
            </div>
          </div>
        </section>

        {/* CTA */}
        <button
          type="button"
          disabled={!isComplete || loading}
          onClick={handleConfirm}
          className={[
            "w-full rounded-xl py-3 text-sm font-semibold transition",
            "focus:outline-none focus:ring-2 focus:ring-emerald-600/30",
            isComplete && !loading
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "cursor-not-allowed bg-gray-200 text-gray-500",
          ].join(" ")}
        >
          {loading
            ? "Creating booking..."
            : isComplete
            ? "Confirm Booking"
            : "Select a date and time"}
        </button>

        {error ? (
          <p className="text-center text-xs text-red-600">{error}</p>
        ) : (
          <p className="text-center text-xs text-gray-400">
            You won&apos;t be charged yet
          </p>
        )}
      </div>
    </aside>
  );
}
