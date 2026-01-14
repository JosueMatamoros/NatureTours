// src/components/payment/PayPalCheckout.jsx
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useState } from "react";
import { upsertCustomer } from "../../../services/customers.api";
import { validateBooking } from "../../../services/bookings.api";

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

export default function PayPalCheckout({
  bookingId,
  amount,
  description,
  onSuccess,
  customerPayload,
  onCustomerId,
  mustBlockPay = false,
  onTimeout,
}) {
  const [status, setStatus] = useState("idle");

  if (!PAYPAL_CLIENT_ID) {
    console.error("PayPal Client ID not defined");
    return <p>Payment configuration error</p>;
  }

  return (
    <div style={{ maxWidth: 420 }}>
      <PayPalScriptProvider
        options={{
          clientId: PAYPAL_CLIENT_ID,
          currency: "USD",
          intent: "capture",
        }}
      >
        <PayPalButtons
          disabled={mustBlockPay}
          style={{ layout: "vertical" }}
          createOrder={async (data, actions) => {
            setStatus("creating");

            // 1) VALIDAR BOOKING ANTES DE CREAR ORDEN
            let payload;
            try {
              payload = await validateBooking(bookingId);
              console.log("🕒 validateBooking response:", payload);
            } catch (err) {
              console.error("validateBooking request failed:", err);
              setStatus("error");
              throw err; // aborta PayPal
            }

            if (!payload?.ok || payload?.valid !== true) {
              setStatus("error");

              // solo mostrar modal si realmente expiró
              if (payload?.reason === "expired" || payload?.reason === "not_pending") {
                onTimeout?.();
              }

              throw new Error(`Booking not valid: ${payload?.reason || "unknown"}`);
            }

            // 2) CREAR / ACTUALIZAR CLIENTE
            try {
              const c = await upsertCustomer(customerPayload);
              const customerId = c?.id;

              if (!customerId) throw new Error("No customerId returned");
              onCustomerId?.(customerId);
            } catch (e) {
              console.error("Error creating customer:", e);
              setStatus("error");
              throw e;
            }

            // 3) CREAR ORDEN PAYPAL
            return actions.order.create({
              purchase_units: [
                {
                  description,
                  amount: {
                    currency_code: "USD",
                    value: Number(amount).toFixed(2),
                  },
                },
              ],
            });
          }}
          onApprove={async (data, actions) => {
            setStatus("capturing");

            const details = await actions.order.capture();
            const capture =
              details?.purchase_units?.[0]?.payments?.captures?.[0] ?? null;

            const summary = {
              paypalOrderId: details?.id ?? null,
              paypalCaptureId: capture?.id ?? null,
              amount: capture?.amount?.value ? Number(capture.amount.value) : null,
              currency:
                capture?.amount?.currency_code ??
                details?.purchase_units?.[0]?.amount?.currency_code ??
                "USD",
              status: (capture?.status ?? details?.status ?? "").toLowerCase(),
            };

            setStatus("paid");
            onSuccess?.(summary);
          }}
          onCancel={() => setStatus("cancelled")}
          onError={(err) => {
            console.error("PayPal error:", err);
            setStatus("error");
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}
