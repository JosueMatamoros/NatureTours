import { useEffect, useMemo, useState } from "react";
import { FiUsers, FiCalendar, FiClock, FiMinus, FiPlus } from "react-icons/fi";
import CalendarPicker from "./CalendarPicker";
import { useNavigate } from "react-router-dom";
import { createBooking } from "../../../services/bookings.api";
import { getAvailabilityBlocked } from "../../../services/availability.api";

// Tour 1: slots fijos PM
const fixedSlotsTour1 = [
  { id: 1, startHour: 18, label: "6:00 PM - 8:00 PM" },
  { id: 2, startHour: 20, label: "8:00 PM - 10:00 PM" },
];

function formatHourLabel(hour24) {
  if (hour24 === 12) return "12:00 MD";
  const ampm = hour24 < 12 ? "AM" : "PM";
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  return `${hour12}:00 ${ampm}`;
}

function buildHourlySlots(startHour = 6, endHour = 16, durationHours = 2) {
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

function monthRangeYMD(dateObj) {
  const y = dateObj.getFullYear();
  const m = dateObj.getMonth(); // 0-based

  const first = new Date(y, m, 1, 12, 0, 0, 0);
  const last = new Date(y, m + 1, 0, 12, 0, 0, 0);

  const toYMD = (d) => {
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  };

  return { from: toYMD(first), to: toYMD(last) };
}

export default function ReserveTourCard({ tour }) {
  const [slot, setSlot] = useState(null);
  const [guests, setGuests] = useState(1);
  const [selectedDate, setSelectedDate] = useState(undefined); // "YYYY-MM-DD"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [blockedByDay, setBlockedByDay] = useState(() => new Map()); // Map(date -> ["13:00",...])
  const [fullDays, setFullDays] = useState(() => new Set());         // Set(date)
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  });

  const navigate = useNavigate();

  const tourId = Number(tour?.id);

  const total = useMemo(() => tour.price * guests, [tour.price, guests]);

  const timeSlots = useMemo(() => {
    if (tourId === 1) {
      return fixedSlotsTour1.map((s) => ({
        ...s,
        startTime: `${String(s.startHour).padStart(2, "0")}:00`,
      }));
    }

    if (tourId === 2) return buildHourlySlots(6, 18, 2);

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

  const blockedSlotsForSelectedDay = useMemo(() => {
    if (!selectedDate) return new Set();
    const arr = blockedByDay.get(String(selectedDate).trim()) ?? [];
    return new Set(arr.map((s) => String(s).trim()));
  }, [blockedByDay, selectedDate]);

  async function loadMonthAvailability(monthDate) {
    if (!tourId) return;

    const { from, to } = monthRangeYMD(monthDate);

    try {
      const data = await getAvailabilityBlocked({ tourId, from, to });

      const map = new Map();
      const set = new Set();

      for (const day of data?.days ?? []) {
        const date = String(day.date).trim();
        const blocked = (day.blocked ?? []).map((s) => String(s).trim());

        if (blocked.length > 0) map.set(date, blocked);
        if (day.isFull) set.add(date);
      }

      setBlockedByDay(map);
      setFullDays(set);
    } catch (e) {
      console.error("availability error:", e);
    }
  }

  useEffect(() => {
    if (!tourId) return;
    loadMonthAvailability(visibleMonth);
  }, [tourId]);


  const isSelectedBlocked = selectedSlot?.startTime
    ? blockedSlotsForSelectedDay.has(selectedSlot.startTime)
    : false;

  const isComplete = Boolean(selectedDate && slot && !isSelectedBlocked);

  async function handleConfirm() {
    setError("");

    if (!tourId || Number.isNaN(tourId)) {
      setError("tourId inválido (tour.id no viene bien).");
      return;
    }
    if (!selectedDate || !selectedSlot?.startTime) return;

    // Si alguien hackea el botón, igual no lo dejamos
    if (blockedSlotsForSelectedDay.has(selectedSlot.startTime)) {
      setError("Ese horario ya está ocupado. Elegí otro.");
      return;
    }

    const payload = {
      tourId,
      tourDate: selectedDate,
      startTime: selectedSlot.startTime,
      guests,
    };

    try {
      setLoading(true);

      const response = await createBooking(payload);

      const data = response?.data ?? response;
      const newBookingId = data?.id;

      if (!newBookingId) {
        console.error("Respuesta real del backend (data):", data);
        throw new Error("Respuesta sin booking id");
      }

      navigate(`/payment/${newBookingId}`);
    } catch (e) {
      console.error("Booking error:", e);
      console.error("status:", e?.response?.status);
      console.error("data:", e?.response?.data);

      const backendMsg =
        e?.response?.data?.message || e?.response?.data?.error?.message || null;

      setError(backendMsg || e?.message || "No se pudo crear la reserva.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="w-full md:max-w-sm rounded-2xl border border-gray-200 bg-white shadow-sm h-fit mt-4 md:mt-0">
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
        <section className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <FiCalendar className="h-4 w-4 text-emerald-600" />
            Select a date
          </label>

          <div className="-mx-6">
            <CalendarPicker
              selected={selectedDate}
              disabledDaysSet={fullDays}
              onMonthChange={(m) => {
                setVisibleMonth(m);
                loadMonthAvailability(m);
              }}
              onSelect={(ymd) => {
                setSelectedDate(ymd);
                setSlot(null);
              }}
            />
          </div>
        </section>

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
                const isBlocked = blockedSlotsForSelectedDay.has(t.startTime);

                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={isBlocked}
                    onClick={() => setSlot(t.id)}
                    className={[
                      "group flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition",
                      "focus:outline-none focus:ring-2 focus:ring-emerald-600/30",
                      isBlocked
                        ? "cursor-not-allowed opacity-40 border-gray-200 bg-gray-50"
                        : active
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
                {isSelectedBlocked ? (
                  <span className="ml-2 font-semibold text-red-600">
                    (Not available)
                  </span>
                ) : null}
              </p>
            ) : null}
          </section>
        )}

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
