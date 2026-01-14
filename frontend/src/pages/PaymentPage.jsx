// src/pages/PaymentPage.jsx
import { useEffect, useMemo, useState } from "react";
import { FiLock, FiDollarSign } from "react-icons/fi";
import { TbLogout2 } from "react-icons/tb";

import { useParams, useNavigate } from "react-router-dom";
import { useConfirmExit } from "../hooks/useConfirmExit";

import CancellationTermsModal from "../components/ui/CancellationTermsModal";
import ContactForm from "../components/payment/ContactForm";
import OrderSummaryBox from "../components/payment/OrderSummaryBox";
import DepositToggleCard from "../components/payment/DepositToggleCard";
import SinpeInfoCard from "../components/payment/SinpeInfoCard";
import PaymentPanel from "../components/payment/PaymentPanel";
import Collapse from "../components/ui/Collapse";
import { getBookingById } from "../../services/bookings.api";
import { createPayment } from "../../services/payments.api";
import CancelBookingModal from "../components/ui/CancelBookingModal";
import { expireBooking } from "../../services/bookings.api";

export default function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [bookingError, setBookingError] = useState("");
  const [customerId, setCustomerId] = useState(null);

  // UI
  const [useDeposit, setUseDeposit] = useState(false);
  const [showPaypalFeeInfo, setShowPaypalFeeInfo] = useState(false);
  const [showCancellationTerms, setShowCancellationTerms] = useState(false);
  const mode = useDeposit ? "deposit" : "full";

  // Form
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState({
    fullName: false,
    phone: false,
    email: false,
  });

  const toMoney = (v) => {
    const n = typeof v === "string" ? Number(v) : v;
    return Number.isFinite(n) ? n : 0;
  };

  const [showExitModal, setShowExitModal] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [pendingNav, setPendingNav] = useState(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  const shouldBlockExit = Boolean(
    bookingId &&
      !leaving &&
      !paymentCompleted &&
      (!booking || booking.status === "pending")
  );

  const openExitModal = (blocker = null) => {
    if (showExitModal) return;

    if (blocker) setPendingNav(blocker);
    setShowExitModal(true);
  };

  useConfirmExit(shouldBlockExit && !showExitModal, (blocker) => {
    openExitModal(blocker);
  });

  useEffect(() => {
    if (!bookingId) {
      navigate("/", { replace: true });
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoadingBooking(true);
        setBookingError("");

        const res = await getBookingById(bookingId);

        const data = res?.data ?? res;

        if (!data?.ok || !data?.booking) {
          console.error("Respuesta inválida del servidor:", data);
          throw new Error("Respuesta inválida del servidor");
        }

        if (!cancelled) setBooking(data.booking);
      } catch (e) {
        console.error("Error loading booking:", e);
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "No se pudo cargar la reserva";

        if (!cancelled) setBookingError(msg);
      } finally {
        if (!cancelled) setLoadingBooking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bookingId, navigate]);

  const currency = "USD";

  const subtotal = useMemo(() => toMoney(booking?.subtotal), [booking]);
  const paypalFee = useMemo(() => toMoney(booking?.paypal_fee), [booking]);
  const total = useMemo(() => toMoney(booking?.total), [booking]);

  const depositAmount = useMemo(() => {
    if (!booking) return 0;
    return toMoney(booking.deposit_amount);
  }, [booking]);

  const fmt = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(n);

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

  const showError = (field) => touched[field];

  const inputClass = (ok, show) =>
    [
      "mt-2 flex items-center gap-3 rounded-xl border bg-white px-4 py-3",
      "focus-within:ring-2 focus-within:ring-emerald-600/20",
      show && !ok ? "border-red-300 ring-1 ring-red-200" : "border-gray-200",
    ].join(" ");

  const descriptionText = useMemo(() => {
    if (!booking) return "";
    const date = booking.tour_date
      ? String(booking.tour_date).slice(0, 10)
      : "";
    const time = booking.start_time
      ? String(booking.start_time).slice(0, 5)
      : "";
    return `${booking.tour_name || "Tour"} – ${date} ${time}`;
  }, [booking]);

  // Para OrderSummaryBox: porcentaje real (inferido)
  const feePercentText = useMemo(() => {
    if (subtotal <= 0) return "";
    const pct = (paypalFee / subtotal) * 100;
    return `${pct.toFixed(1)}%`;
  }, [subtotal, paypalFee]);

  if (loadingBooking) {
    return (
      <main className="min-h-screen bg-white grid place-items-center px-6">
        <p className="text-gray-600">Loading booking...</p>
      </main>
    );
  }

  if (bookingError) {
    return (
      <main className="min-h-screen bg-white grid place-items-center px-6">
        <div className="max-w-md w-full rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{bookingError}</p>
        </div>
      </main>
    );
  }

  if (!booking) return null;

  return (
    <main className="min-h-screen bg-white">
      <header className="px-6 pt-10 pb-6">
        <div className="mx-auto max-w-6xl text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Complete Your Booking
          </h1>
          <p className="mt-2 flex items-center justify-center gap-2 text-sm text-gray-500">
            <FiLock className="h-4 w-4" />
            Secure and encrypted payment
          </p>
        </div>
      </header>

      <CancelBookingModal
        open={showExitModal}
        loading={leaving}
        onStay={() => {
          pendingNav?.reset?.();
          setPendingNav(null);
          setShowExitModal(false);
        }}
        onConfirm={async () => {
          try {
            setLeaving(true);
            await expireBooking(bookingId);
          } catch (e) {
            console.error("expireBooking error:", e);
          } finally {
            setLeaving(false);
            setShowExitModal(false);

            if (pendingNav?.proceed) {
              pendingNav.proceed();
              setPendingNav(null);
              return;
            }

            navigate("/", { replace: true });
          }
        }}
      />

      <section className="px-6 pb-12">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
          {/* LEFT */}

          <div className="relative rounded-2xl border border-gray-200 bg-white shadow-sm ">
            <button
              type="button"
              onClick={() => openExitModal(null)}
              className="absolute -top-12 inline-flex items-center justify-center h-10 w-10 z-10 rounded-full bg-white border border-red-200 text-red-600 hover:text-red-700 hover:border-red-300 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-red-500/30"
            >
              <TbLogout2 className="h-5 w-5" />
            </button>

            <div className="px-8 pt-7 pb-5  ">
              <h2 className="text-xl font-semibold text-gray-900 ">
                Contact details
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Enter your information to receive the confirmation
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

            {/* Full payment */}
            <Collapse show={!useDeposit}>
              <PaymentPanel
                mode="full"
                mustBlockPay={!isFormValid}
                amount={total}
                description={descriptionText}
                blockedText="Complete your details to enable payment"
                customerPayload={{
                  name: fullName,
                  email,
                  phone: phone.trim() && touched.phone ? phone : "",
                }}
                onCustomerId={(id) => {
                  setCustomerId(id);
                }}
                onSuccess={async (summary) => {
                  try {
                    setPaymentCompleted(true);

                    const payload = {
                      bookingId,
                      customerId,
                      mode,
                      amount: summary.amount,
                      paypalOrderId: summary.paypalOrderId,
                      paypalCaptureId: summary.paypalCaptureId,
                      status: summary.status,
                    };

                    const res = await createPayment(payload);
                    if (!res?.ok || !res?.id)
                      throw new Error("Payment not saved");

                    navigate(`/success/${res.id}`, { replace: true });
                  } catch (e) {
                    setPaymentCompleted(false);
                    console.error("Error saving payment:", e);
                  }
                }}
              />

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 mt-1 mx-8 mb-8 md:mb-0">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                    <FiDollarSign className="h-4 w-4" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-emerald-900">
                      Prefer to avoid the PayPal fee?
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-emerald-800">
                      You can make a{" "}
                      <span className="font-semibold">partial reservation</span>{" "}
                      and pay the remaining balance in cash on the day of the
                      tour. This way, no PayPal fee will be applied.
                    </p>
                  </div>
                </div>
              </div>
            </Collapse>

            {/* Deposit 20% */}
            <Collapse show={useDeposit}>
              <div className="px-8 ">
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div className="px-6 pt-6 pb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Tour deposit (20%)
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Only the <span className="font-semibold">20%</span>{" "}
                      <span className="font-semibold">
                        ({fmt(depositAmount)})
                      </span>{" "}
                      will be charged with no additional fees. The remaining
                      balance is paid in cash on the day of the tour.
                    </p>
                  </div>

                  <div className="px-6 pt-6">
                    <PaymentPanel
                      mode="deposit"
                      mustBlockPay={!isFormValid}
                      amount={depositAmount}
                      description={`20% deposit – ${descriptionText}`}
                      customerPayload={{
                        name: fullName,
                        email,
                        phone: phone.trim() && touched.phone ? phone : "",
                      }}
                      onCustomerId={(id) => {
                        setCustomerId(id);
                      }}
                      onSuccess={() => navigate(`/success`)}
                      blockedText="Complete your details to enable the deposit"
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
                Order summary
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Breakdown of your booking
              </p>
            </div>

            <div className="px-8 pb-8">
              <OrderSummaryBox
                subtotal={subtotal}
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
                By completing this transaction, you agree to our{" "}
                <button
                  type="button"
                  onClick={() => setShowCancellationTerms(true)}
                  className="font-medium text-gray-500 underline underline-offset-2 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 rounded"
                >
                  Cancellation Terms
                </button>
              </p>

              <CancellationTermsModal
                open={showCancellationTerms}
                onClose={() => setShowCancellationTerms(false)}
              />
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
