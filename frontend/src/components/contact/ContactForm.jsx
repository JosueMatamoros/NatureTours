import { useMemo, useState, useEffect } from "react";
import CalendarPicker from "./CalendarPicker";
import GuestsInput from "./GuestsInput";

export default function ContactForm({ onSubmit, initialMessage = "" }) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    date: "",
    people: 1,
    message: initialMessage,
  });

  // Update message if initialMessage changes
  useEffect(() => {
    if (initialMessage) {
      setForm((s) => ({ ...s, message: initialMessage }));
    }
  }, [initialMessage]);

  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(form);
  };

  return (
    <section className="h-full rounded-2xl border border-gray-200 bg-white p-5 md:p-6 pb-3 shadow-sm">
      <h2 className="text-2xl font-extrabold text-gray-900">Contact Us</h2>
      <p className="mt-1 text-sm text-gray-600">
        Book your nature adventure
      </p>

      <form onSubmit={handleSubmit} className="mt-3 space-y-4">
        <div>
          <label className="text-sm font-semibold text-gray-900">
            Full Name
          </label>
          <input
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            placeholder="Your full name"
            className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
            required
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-900">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@gmail.com"
            className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
            required
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-900">
            Phone Number
          </label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="+ 415 555-2671"
            className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Date with calendar */}
          <div>
            <label className="text-sm font-semibold text-gray-900">Date</label>

            <button
              type="button"
              onClick={() => setCalendarOpen((v) => !v)}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-left hover:bg-gray-50"
            >
              {form.date ? form.date : "Select date"}
            </button>

            {calendarOpen && (
              <div className="mt-3">
                <CalendarPicker
                  selected={form.date}
                  onSelect={(ymd) => {
                    setForm((s) => ({ ...s, date: ymd || "" }));
                    setCalendarOpen(false);
                  }}
                />
              </div>
            )}
          </div>

          {/* People */}
          <div>
            <label className="text-sm font-semibold text-gray-900 ">
              People
            </label>
            <GuestsInput
              value={form.people}
              onChange={(val) => setForm((s) => ({ ...s, people: val }))}
              min={1}
              max={40}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-900">
            Comments or Reason
          </label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="Tell us about your ideal experience, questions, or special requests..."
            rows={5}
            className="mt-2 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
          />
        </div>

        <button
          type="submit"
          className=" mt-2 inline-flex w-full items-center justify-center rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 hover:bg-emerald-800"

        >
          Send Request
        </button>

        <p className="text-center text-xs text-gray-500">
          We will get back to you within 24 hours
        </p>
      </form>
    </section>
  );
}
