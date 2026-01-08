// src/pages/PaymentPage.jsx
import { useMemo, useState } from "react";
import { FiLock, FiDollarSign } from "react-icons/fi";

import ContactForm from "../components/payment/ContactForm";
import OrderSummaryBox from "../components/payment/OrderSummaryBox";
import DepositToggleCard from "../components/payment/DepositToggleCard";
import SinpeInfoCard from "../components/payment/SinpeInfoCard";
import PaymentPanel from "../components/payment/PaymentPanel";
import Collapse from "../components/ui/Collapse";

export default function PaymentPage() {
  const booking = {
    subtotal: 110.0,
    currency: "USD",
  };

  const PAYPAL_FEE_RATE = 0.054;
  const DEPOSIT_RATE = 0.2;

  const descriptionText =
    "Día del tour - Horario: 6-8 o 8-10 | Apartado o pago completo";

  const paypalFee = useMemo(() => {
    const fee = booking.subtotal * PAYPAL_FEE_RATE;
    return Math.round(fee * 100) / 100;
  }, [booking.subtotal]);

  const total = useMemo(() => {
    const t = booking.subtotal + paypalFee;
    return Math.round(t * 100) / 100;
  }, [booking.subtotal, paypalFee]);

  const depositAmount = useMemo(() => {
    const d = booking.subtotal * DEPOSIT_RATE;
    return Math.round(d * 100) / 100;
  }, [booking.subtotal]);

  const [useDeposit, setUseDeposit] = useState(false);
  const [showPaypalFeeInfo, setShowPaypalFeeInfo] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [touched, setTouched] = useState({
    fullName: false,
    phone: false,
    email: false,
  });

  // Validators
  const nameOk = (v) =>
    /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/.test(v.trim()) &&
    v.trim().length >= 3;

  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

  const normalizePhone = (v) => v.replace(/[^\d]/g, "");
  const phoneOk = (v) => {
    if (!v.trim()) return true;
    const digits = normalizePhone(v);
    return digits.length >= 8 && digits.length <= 15;
  };

  const fullNameValid = nameOk(fullName);
  const emailValid = emailOk(email);
  const phoneValid = phoneOk(phone);

  const isFormValid = fullNameValid && emailValid && phoneValid;

  const fmt = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: booking.currency,
      minimumFractionDigits: 2,
    }).format(n);

  const showError = (field) => touched[field];

  const inputClass = (ok, show) =>
    [
      "mt-2 flex items-center gap-3 rounded-xl border bg-white px-4 py-3",
      "focus-within:ring-2 focus-within:ring-emerald-600/20",
      show && !ok ? "border-red-300 ring-1 ring-red-200" : "border-gray-200",
    ].join(" ");

  const feePercentText = `${(PAYPAL_FEE_RATE * 100).toFixed(1)}%`;

  return (
    <main className="min-h-screen bg-white">
      <header className="px-6 pt-10 pb-6">
        <div className="mx-auto max-w-6xl text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Completar Reserva
          </h1>
          <p className="mt-2 flex items-center justify-center gap-2 text-sm text-gray-500">
            <FiLock className="h-4 w-4" />
            Pago seguro y encriptado
          </p>
        </div>
      </header>

      <section className="px-6 pb-12">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
          {/* LEFT */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="px-8 pt-7 pb-5 ">
              <h2 className="text-xl font-semibold text-gray-900 ">
                Detalles de contacto
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Ingresa tu información para recibir la confirmación
              </p>
            </div>

            <ContactForm
              fullName={fullName}
              setFullName={setFullName}
              phone={phone}
              setPhone={setPhone}
              email={email}
              setEmail={setEmail}
              touched={touched}
              setTouched={setTouched}
              fullNameValid={fullNameValid}
              phoneValid={phoneValid}
              emailValid={emailValid}
              inputClass={inputClass}
              showError={showError}
            />

            {/* Pago completo */}
            <Collapse show={!useDeposit} >
              <PaymentPanel
                mode="full"
                mustBlockPay={!isFormValid}
                amount={total}
                onSuccess={(details) =>
                  console.log("Pago completo confirmado", details)
                }
                blockedText={
                  <>
                    Please answer all fields marked with{" "}
                    <span className="font-semibold text-red-500">*</span> to
                    complete your booking
                  </>
                }
              />
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-5 mx-8">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                    <FiDollarSign className="h-4 w-4" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-emerald-900">
                      ¿Prefieres evitar el cargo de PayPal?
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-emerald-800">
                      Puedes realizar una{" "}
                      <span className="font-semibold">reserva parcial</span> y
                      pagar el resto en efectivo  el día del
                      tour. De esta manera no se aplicará el cargo de PayPal.
                    </p>


                  </div>
                </div>
              </div>
            </Collapse>

            {/* Apartado 20% */}
            <Collapse show={useDeposit}>
              <div className="px-8 pb-8">
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div className="px-6 pt-6 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Apartado del tour (20%)
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Se cobrará únicamente el{" "}
                      <span className="font-semibold">20%</span>{" "}
                      <span className="font-semibold">
                        ({fmt(depositAmount)})
                      </span>{" "}
                      sin comisión. El resto se paga en efectivo el día del
                      tour.
                    </p>
                  </div>

                  <div className="px-6 pb-6">
                    <PaymentPanel
                      mode="deposit"
                      mustBlockPay={!isFormValid}
                      amount={depositAmount}
                      description={`Apartado 20% - ${descriptionText}`}
                      onSuccess={(details) =>
                        console.log("Apartado confirmado (PayPal)", details)
                      }
                      blockedText="Completa tus datos para habilitar el apartado"
                    />
                  </div>
                </div>
              </div>
            </Collapse>
          </div>

          {/* RIGHT */}
          <aside className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="px-8 pt-7 pb-5">
              <h2 className="text-xl font-semibold text-gray-900 ">
                Resumen del pedido
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Desglose de tu reserva
              </p>
            </div>

            <div className="px-8 pb-8">
              <OrderSummaryBox
                subtotal={booking.subtotal}
                paypalFee={paypalFee}
                total={total}
                fmt={fmt}
                feePercentText={feePercentText}
                showPaypalFeeInfo={showPaypalFeeInfo}
                setShowPaypalFeeInfo={setShowPaypalFeeInfo}
              />

              <DepositToggleCard
                useDeposit={useDeposit}
                setUseDeposit={setUseDeposit}
                depositAmount={depositAmount}
                fmt={fmt}
              />

              <SinpeInfoCard
                fmt={fmt}
                depositAmount={depositAmount}
                descriptionText={descriptionText}
              />

              <p className="mt-6 text-center text-xs text-gray-400">
                Al completar esta transacción, aceptas nuestros{" "}
                <span className="font-medium text-gray-500 underline underline-offset-2">
                  Términos de Servicio
                </span>
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
