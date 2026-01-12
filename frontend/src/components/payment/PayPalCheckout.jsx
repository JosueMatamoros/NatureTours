// src/components/payment/PayPalCheckout.jsx
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useState } from "react";
import { upsertCustomer } from "../../../services/customers.api";

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

export default function PayPalCheckout({
  amount,
  description,
  onSuccess,
  customerPayload,
  onCustomerId,
  mustBlockPay = false,
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

            const paypalOrderId = details?.id ?? null;
            const capture =
              details?.purchase_units?.[0]?.payments?.captures?.[0] ?? null;

            const paypalCaptureId = capture?.id ?? null;
            const amount =
              capture?.amount?.value ??
              details?.purchase_units?.[0]?.amount?.value ??
              null;

            const currency =
              capture?.amount?.currency_code ??
              details?.purchase_units?.[0]?.amount?.currency_code ??
              "USD";

            const status = (
              capture?.status ??
              details?.status ??
              ""
            ).toLowerCase();

            const summary = {
              paypalOrderId,
              paypalCaptureId,
              amount: amount ? Number(amount) : null,
              currency,
              status,
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
