// src/pages/CustomPaymentPage.jsx
// Pago personalizado: /custom-payment (no enlazado en el sitio, solo desde
// el panel de links). El cliente pone monto y descripción, confirma y paga
// con PayPal. Se registra sin reserva y llega un correo propio (no de tour).
// Acepta ?amount=…&description=… para mandar el link ya prellenado.
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import {
  FiLock,
  FiDollarSign,
  FiFileText,
  FiUser,
  FiMail,
  FiPhone,
  FiEdit2,
  FiCheckCircle,
  FiAlertTriangle,
} from "react-icons/fi";
import WhatsAppButton from "../components/ui/WhatsAppButton";
import { createCustomPayment } from "../../services/custom-payments.api";

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;
const MAX_AMOUNT = 10000;

const fmt = (n) =>
  `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const NAME_RE = /^[\p{L}\s'.-]{3,}$/u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9\s-]{8,20}$/;

function StepDots({ step }) {
  const steps = ["Details", "Confirm", "Done"];
  return (
    <ol className="mb-6 flex items-center justify-center gap-2 text-xs font-semibold">
      {steps.map((label, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={[
                "grid h-6 w-6 place-items-center rounded-full",
                done
                  ? "bg-emerald-600 text-white"
                  : active
                  ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-600"
                  : "bg-gray-100 text-gray-400",
              ].join(" ")}
            >
              {done ? "✓" : i + 1}
            </span>
            <span className={active || done ? "text-gray-800" : "text-gray-400"}>{label}</span>
            {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-gray-200" />}
          </li>
        );
      })}
    </ol>
  );
}

function Field({ icon, label, required, error, children }) {
  const Ico = { C: icon };
  return (
    <label className="block">
      <span className="text-sm font-semibold text-gray-800">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <div
        className={[
          "mt-2 flex items-start gap-3 rounded-xl border bg-white px-4 py-3 transition focus-within:ring-2",
          error
            ? "border-red-300 focus-within:ring-red-500/20"
            : "border-gray-200 focus-within:border-emerald-500 focus-within:ring-emerald-500/20",
        ].join(" ")}
      >
        <Ico.C className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
        {children}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </label>
  );
}

export default function CustomPaymentPage() {
  const [params] = useSearchParams();

  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState(() => params.get("amount") ?? "");
  const [description, setDescription] = useState(() => params.get("description") ?? "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);

  const [processing, setProcessing] = useState(false);
  const [payError, setPayError] = useState("");
  const [result, setResult] = useState(null); // { id, paypalCaptureId }

  // Página no pública: que no la indexen.
  useEffect(() => {
    document.title = "Secure Payment | Nature Tours La Fortuna";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  const amountNum = Math.round((Number(amount) || 0) * 100) / 100;

  const errors = useMemo(() => {
    const e = {};
    if (!(amountNum >= 1)) e.amount = "Enter an amount of at least $1.00";
    else if (amountNum > MAX_AMOUNT) e.amount = `Maximum ${fmt(MAX_AMOUNT)} per payment`;
    if (description.trim().length < 3) e.description = "Tell us what this payment is for";
    if (!NAME_RE.test(name.trim())) e.name = "Enter your full name";
    if (!EMAIL_RE.test(email.trim())) e.email = "Enter a valid email";
    if (phone.trim() && !PHONE_RE.test(phone.trim())) e.phone = "Enter a valid phone number";
    return e;
  }, [amountNum, description, name, email, phone]);

  const isValid = Object.keys(errors).length === 0;
  const err = (k) => (touched ? errors[k] : undefined);

  function goReview(e) {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;
    setPayError("");
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const paypalDescription = `Nature Tours – ${description.trim()}`.slice(0, 127);

  return (
    <main className="min-h-screen bg-linear-to-b from-emerald-50 via-white to-white">
      <header className="px-6 pt-10 pb-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">
          Nature Tours La Fortuna
        </p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">Secure Payment</h1>
        <p className="mt-2 flex items-center justify-center gap-2 text-sm text-gray-500">
          <FiLock className="h-4 w-4" />
          Processed securely by PayPal
        </p>
      </header>

      <section className="px-4 pb-16">
        <div className="mx-auto max-w-lg">
          <StepDots step={step} />

          {/* Paso 1: datos */}
          {step === 0 && (
            <form
              onSubmit={goReview}
              noValidate
              className="space-y-5 rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)] sm:p-8"
            >
              <div>
                <span className="text-sm font-semibold text-gray-800">
                  Amount (USD) <span className="text-red-500">*</span>
                </span>
                <div
                  className={[
                    "mt-2 flex items-center gap-2 rounded-2xl border-2 bg-emerald-50/40 px-5 py-4 transition focus-within:bg-white",
                    err("amount") ? "border-red-300" : "border-emerald-200 focus-within:border-emerald-500",
                  ].join(" ")}
                >
                  <span className="text-3xl font-bold text-emerald-600">$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="1"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-transparent text-3xl font-bold text-gray-900 outline-none placeholder:text-gray-300 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <span className="text-sm font-semibold text-gray-400">USD</span>
                </div>
                {err("amount") && <p className="mt-1.5 text-xs text-red-600">{err("amount")}</p>}
              </div>

              <Field icon={FiFileText} label="Description" required error={err("description")}>
                <textarea
                  rows={3}
                  maxLength={500}
                  placeholder="e.g. Balance for private horseback tour on Nov 4"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full resize-none bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                />
              </Field>

              <div className="border-t border-gray-100 pt-5">
                <p className="mb-4 text-sm text-gray-500">
                  Your details, to send you the payment confirmation.
                </p>
                <div className="space-y-4">
                  <Field icon={FiUser} label="Full name" required error={err("name")}>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      autoComplete="name"
                      className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                    />
                  </Field>
                  <Field icon={FiMail} label="Email" required error={err("email")}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                    />
                  </Field>
                  <Field icon={FiPhone} label="Phone (optional)" error={err("phone")}>
                    <input
                      value={phone}
                      onChange={(e) => {
                        if (/^[0-9+\s-]*$/.test(e.target.value)) setPhone(e.target.value);
                      }}
                      placeholder="+1 (415) 555-2671"
                      autoComplete="tel"
                      inputMode="tel"
                      className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                    />
                  </Field>
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-emerald-600 py-4 text-base font-semibold text-white shadow-[0_10px_25px_rgba(5,150,105,0.25)] transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/30"
              >
                Review payment
              </button>
            </form>
          )}

          {/* Paso 2: confirmación + PayPal */}
          {step === 1 && (
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
              <div className="bg-linear-to-br from-emerald-500 to-emerald-700 px-6 py-8 text-center text-white sm:px-8">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-50/80">
                  You are paying
                </p>
                <p className="mt-2 text-5xl font-black tracking-tight">{fmt(amountNum)}</p>
                <p className="mt-1 text-sm text-emerald-50/90">USD</p>
              </div>

              <div className="space-y-5 p-6 sm:p-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Description
                  </p>
                  <p className="mt-2 whitespace-pre-wrap rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-sm leading-relaxed text-gray-800">
                    {description.trim()}
                  </p>
                </div>

                <dl className="grid gap-3 rounded-2xl bg-gray-50 px-4 py-4 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">Name</dt>
                    <dd className="text-right font-medium text-gray-900">{name.trim()}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">Email</dt>
                    <dd className="break-all text-right font-medium text-gray-900">{email.trim()}</dd>
                  </div>
                  {phone.trim() && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-500">Phone</dt>
                      <dd className="text-right font-medium text-gray-900">{phone.trim()}</dd>
                    </div>
                  )}
                </dl>

                {!processing && (
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 underline-offset-2 hover:underline"
                  >
                    <FiEdit2 className="h-4 w-4" /> Edit details
                  </button>
                )}

                <div className="border-t border-gray-100 pt-5">
                  {!PAYPAL_CLIENT_ID ? (
                    <p className="text-sm text-red-600">Payment configuration error</p>
                  ) : (
                    <PayPalScriptProvider
                      options={{ clientId: PAYPAL_CLIENT_ID, currency: "USD", intent: "capture" }}
                    >
                      <PayPalButtons
                        style={{ layout: "vertical" }}
                        disabled={processing}
                        forceReRender={[amountNum, paypalDescription]}
                        createOrder={(_data, actions) =>
                          actions.order.create({
                            purchase_units: [
                              {
                                description: paypalDescription,
                                amount: { currency_code: "USD", value: amountNum.toFixed(2) },
                              },
                            ],
                          })
                        }
                        onApprove={async (_data, actions) => {
                          setProcessing(true);
                          setPayError("");
                          let capture = null;
                          let details = null;
                          try {
                            details = await actions.order.capture();
                            capture = details?.purchase_units?.[0]?.payments?.captures?.[0] ?? null;
                            const res = await createCustomPayment({
                              name: name.trim(),
                              email: email.trim(),
                              phone: phone.trim(),
                              description: description.trim(),
                              amount: capture?.amount?.value ? Number(capture.amount.value) : amountNum,
                              paypalOrderId: details?.id,
                              paypalCaptureId: capture?.id ?? null,
                              status: String(capture?.status ?? details?.status ?? "").toLowerCase(),
                            });
                            if (!res?.ok || !res?.id) throw new Error("Payment not saved");
                            setResult({ id: res.id, paypalCaptureId: capture?.id ?? null });
                            setStep(2);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          } catch (e) {
                            console.error("Custom payment error:", e);
                            setPayError(
                              details?.id
                                ? `Your payment went through but we couldn't confirm it automatically. Please contact us with this PayPal ID: ${capture?.id ?? details.id}`
                                : "The payment could not be completed. Please try again."
                            );
                          } finally {
                            setProcessing(false);
                          }
                        }}
                        onError={(e) => {
                          console.error("PayPal error:", e);
                          setPayError("The payment could not be completed. Please try again.");
                        }}
                      />
                    </PayPalScriptProvider>
                  )}

                  {processing && (
                    <p className="mt-3 text-center text-sm font-semibold text-gray-600">
                      Confirming your payment…
                    </p>
                  )}
                  {payError && (
                    <p className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                      <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      {payError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Paso 3: listo */}
          {step === 2 && result && (
            <div className="rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                <FiCheckCircle className="h-9 w-9" />
              </span>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">Payment received</h2>
              <p className="mt-1 text-sm text-gray-500">
                Thank you, {name.trim().split(" ")[0]}! A confirmation was sent to{" "}
                <span className="font-semibold text-gray-700">{email.trim()}</span>.
              </p>

              <div className="mt-6 space-y-3 rounded-2xl bg-gray-50 px-5 py-5 text-left text-sm">
                <div className="flex justify-between">
                  <span className="flex items-center gap-2 text-gray-500">
                    <FiDollarSign /> Amount paid
                  </span>
                  <span className="text-lg font-bold text-emerald-600">{fmt(amountNum)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Description</span>
                  <p className="mt-1 whitespace-pre-wrap text-gray-800">{description.trim()}</p>
                </div>
                <div className="flex justify-between gap-4 border-t border-gray-200 pt-3 text-xs">
                  <span className="text-gray-500">Payment ID</span>
                  <span className="break-all font-mono text-gray-700">{result.id}</span>
                </div>
                {result.paypalCaptureId && (
                  <div className="flex justify-between gap-4 text-xs">
                    <span className="text-gray-500">PayPal ID</span>
                    <span className="font-mono text-gray-700">{result.paypalCaptureId}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <WhatsAppButton message="Hello, I have a question about a payment." />
    </main>
  );
}
