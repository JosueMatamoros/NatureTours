import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useState } from "react";

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

export default function PayPalCheckout({ amount, description, onSuccess }) {
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
          style={{ layout: "vertical" }}
          createOrder={(data, actions) => {
            setStatus("creating");
            return actions.order.create({
              purchase_units: [
                {
                  description,
                  amount: {
                    currency_code: "USD",
                    value: amount.toFixed(2),
                  },
                },
              ],
            });
          }}
          onApprove={async (data, actions) => {
            setStatus("capturing");

            const details = await actions.order.capture();

            // 🔑 ID REAL DE TRANSACCIÓN PAYPAL
            const capture =
              details?.purchase_units?.[0]?.payments?.captures?.[0];

            const paypalTransactionId = capture?.id;

            console.log("PAYPAL TRANSACTION ID:", paypalTransactionId);
            console.log("FULL PAYPAL DETAILS:", details);

            setStatus("paid");

            onSuccess?.({
              paypalTransactionId,
              details,
            });
          }}
          onCancel={() => {
            setStatus("cancelled");
          }}
          onError={(err) => {
            console.error("PayPal error:", err);
            setStatus("error");
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}
