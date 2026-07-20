import nodemailer from "nodemailer";
import { pool } from "../db.js";

// Configurar transporter de nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App password de Gmail
  },
});

/**
 * Genera el HTML del recibo para el email — espejo exacto del PDF (ReceiptPDF.jsx)
 */
function guestsBreakdownText(receipt) {
  const adults = Number(receipt.adults ?? 0);
  const children = Number(receipt.children ?? 0);
  const babies = Number(receipt.babies ?? 0);

  if (adults + children + babies === 0) {
    // Reservas antiguas sin desglose
    return `${receipt.personas} people`;
  }

  const parts = [`${adults} adult${adults === 1 ? "" : "s"}`];
  if (children > 0) parts.push(`${children} child${children === 1 ? "" : "ren"}`);
  if (babies > 0) parts.push(`${babies} bab${babies === 1 ? "y" : "ies"}`);
  return parts.join(" · ");
}

/**
 * Datos del reseller para el correo interno (empresa + reseller).
 * La comisión se calcula sobre el precio ORIGINAL (sin descuento):
 * el dueño siempre neta 70% del precio original en ventas de reseller.
 */
export async function getResellerInfoForPayment(paymentId) {
  const q = await pool.query(
    `
    SELECT
      r.name       AS reseller_name,
      r.email      AS reseller_email,
      r.commission AS commission,
      round(t.price * b.adults + COALESCE(t.child_price, t.price) * b.children, 2) AS original_subtotal
    FROM payments p
    JOIN bookings b ON b.id = p.booking_id
    JOIN tours t ON t.id = b.tour_id
    JOIN resellers r ON r.id = p.reseller_id
    WHERE p.id = $1
    `,
    [paymentId],
  );

  if (q.rowCount === 0) return null;

  const r = q.rows[0];
  const originalSubtotal = Number(r.original_subtotal);
  const commission = Number(r.commission);

  return {
    name: r.reseller_name,
    email: r.reseller_email,
    commission,
    originalSubtotal,
    commissionAmount: Math.round(originalSubtotal * commission) / 100,
  };
}

export function generateReceiptHTML(receipt, reseller = null) {
  const adults = Number(receipt.adults ?? 0);
  const children = Number(receipt.children ?? 0);
  const babies = Number(receipt.babies ?? 0);
  const hasBreakdown = adults + children + babies > 0;

  const adultPrice = Number(receipt.pricePerPerson);
  const childPrice = Number(receipt.childPrice ?? receipt.pricePerPerson);

  // Subtotal real de la BD; fallback para recibos antiguos sin desglose
  const subtotal = Number.isFinite(Number(receipt.subtotal))
    ? Number(receipt.subtotal)
    : receipt.pricePerPerson * receipt.personas;
  const remaining = receipt.mode === "deposit" ? subtotal - receipt.amount : 0;

  const fecha = new Date(receipt.fecha).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  const ROW = (label, value, isTotal = false) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:${isTotal ? '18px' : '14px'};">${label}</td>
      <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-weight:600;color:${isTotal ? '#047857' : '#1f2937'};font-size:${isTotal ? '18px' : '14px'};text-align:right;">${value}</td>
    </tr>`;

  const SECTION = (title, rows, extra = '', green = false) => {
    const bg = green ? '#ecfdf5' : '#f9fafb';
    const border = green ? '#a7f3d0' : '#e5e7eb';
    return `
    <div style="border-radius:12px;overflow:hidden;border:1px solid ${border};margin-bottom:14px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${bg};width:100%;">
        <tr><td style="padding:16px;">
          <p style="font-size:14px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px 0;">${title}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            ${rows}
          </table>
          ${extra}
        </td></tr>
      </table>
    </div>`;
  };

  const paymentBadge = receipt.mode === 'full'
    ? `<span style="display:inline-block;padding:4px 12px;border-radius:6px;font-size:12px;font-weight:600;background:#d1fae5;color:#047857;">Full Payment</span>`
    : `<span style="display:inline-block;padding:4px 12px;border-radius:6px;font-size:12px;font-weight:600;background:#fef3c7;color:#92400e;">20% Deposit</span>`;

  const idBox = (id) =>
    `<span style="background:#f3f4f6;padding:4px 10px;border-radius:6px;font-family:monospace;font-size:12px;">${id}</span>`;

  const remainingNote = receipt.mode === 'deposit'
    ? `<p style="color:#92400e;font-size:13px;margin-top:10px;">The remaining balance of <strong>$${remaining.toFixed(2)}</strong> is due on the day of the tour.</p>`
    : '';

  // Fila de la comisión del reseller (solo correo interno): monto en rojo.
  const commissionRow = reseller
    ? `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px;">Reseller commission (${reseller.commission}% of $${reseller.originalSubtotal.toFixed(2)})</td>
      <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-weight:600;color:#b91c1c;font-size:14px;text-align:right;">−$${reseller.commissionAmount.toFixed(2)}</td>
    </tr>`
    : '';

  // Apartado (deposit): la comisión solo se paga si los clientes llegan y
  // pagan el saldo; si no se cobra la reserva, no hay comisión.
  // Va en la sección Reseller, justo debajo de "Commission to pay".
  const resellerDepositNote = reseller && receipt.mode === 'deposit'
    ? `<p style="color:#b45309;font-size:13px;margin-top:10px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px 12px;">This booking was made using the <strong>deposit system</strong>. The commission payment is subject to the clients showing up and paying the remaining balance — otherwise, the commission will not be paid, since the booking is not charged.</p>`
    : '';

  // Ganancia total del dueño después de pagar al reseller:
  // - full: lo pagado en PayPal (incluye fee) menos la comisión.
  // - deposit: lo que se recauda en total (depósito + efectivo = subtotal)
  //   menos la comisión.
  const netAfterCommission = reseller
    ? (receipt.mode === 'deposit'
        ? subtotal - reseller.commissionAmount
        : Number(receipt.amount) - reseller.commissionAmount)
    : 0;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Receipt - Nature Tours</title>
    </head>
    <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1f2937;background:#ffffff;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:20px;">
        <tr><td>

          <!-- header -->
          <div style="text-align:center;margin-bottom:18px;">
            <div style="font-size:24px;font-weight:800;color:#047857;letter-spacing:0.2px;line-height:1.15;margin:0 0 6px 0;">Nature Tours</div>
            <div style="display:inline-block;background:linear-gradient(135deg,#d1fae5 0%,#ecfdf5 100%);color:#065f46;padding:10px 18px;border-radius:999px;font-weight:700;font-size:14px;letter-spacing:0.3px;box-shadow:0 2px 6px rgba(4,120,87,0.14);">✓ Payment Confirmed</div>
          </div>

          ${reseller ? SECTION('Reseller', [
            ROW('Name', reseller.name),
            ROW('Commission', `${reseller.commission}%`),
            ROW('Commission to pay', `$${reseller.commissionAmount.toFixed(2)}`),
          ].join(''), resellerDepositNote) : ''}

          <!-- Customer -->
          ${(receipt.customerName || receipt.customerPhone) ? SECTION('Customer', [
            receipt.customerName ? ROW('Name', receipt.customerName) : '',
            receipt.customerPhone ? ROW('Phone', receipt.customerPhone) : '',
          ].join('')) : ''}

          <!-- Booking Details -->
          ${SECTION('Booking Details', [
            ROW('Tour', receipt.tour),
            ROW('Date', fecha),
            ROW('Time', receipt.hora.slice(0, 5)),
            ROW('People', guestsBreakdownText(receipt)),
          ].join(''))}

          <!-- Payment Information -->
          ${SECTION('Payment Information', [
            ROW('Payment Type', paymentBadge),
            ...(hasBreakdown
              ? [
                  ROW(`Adults (${adults} × $${adultPrice.toFixed(2)})`, `$${(adults * adultPrice).toFixed(2)}`),
                  children > 0 ? ROW(`Children (${children} × $${childPrice.toFixed(2)})`, `$${(children * childPrice).toFixed(2)}`) : '',
                  babies > 0 ? ROW(`Babies (${babies})`, 'Free') : '',
                ]
              : [
                  ROW('Price per person', `$${Number(receipt.pricePerPerson).toFixed(2)}`),
                  ROW(`Subtotal (${receipt.personas} × $${Number(receipt.pricePerPerson).toFixed(2)})`, `$${subtotal.toFixed(2)}`),
                ]),
            hasBreakdown ? ROW('Subtotal', `$${subtotal.toFixed(2)}`) : '',
            ROW('Amount Paid', `$${Number(receipt.amount).toFixed(2)}`, true),
            commissionRow,
            reseller ? ROW('After commission', `$${netAfterCommission.toFixed(2)}`, true) : '',
          ].join(''), remainingNote, true)}

          <!-- Reference IDs -->
          ${SECTION('Reference IDs', [
            ROW('Purchase ID', idBox(receipt.reservaId)),
            receipt.paypalCaptureId ? ROW('PayPal ID', idBox(receipt.paypalCaptureId)) : '',
          ].join(''))}

          <!-- footer -->
          <div style="text-align:center;margin-top:20px;padding-top:16px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:11px;">
            <p>Thank you for choosing Nature Tours!</p>
            <p style="margin-top:8px;">Please arrive 15 minutes before your scheduled time.</p>
            <p style="margin-top:16px;">Questions? Contact us at naturetourslafortuna@gmail.com</p>
          </div>

        </td></tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Arma el receipt desde la BD (mismo shape que getPaymentById) para poder
 * enviar el correo sin depender de que el cliente llegue a la página de éxito.
 */
async function buildReceiptForPayment(paymentId) {
  const q = await pool.query(
    `
    SELECT
      p.id                AS reserva_id,
      p.paypal_capture_id AS paypal_capture_id,
      p.amount            AS amount,
      p.mode              AS mode,
      b.tour_date         AS fecha,
      b.start_time        AS hora,
      (b.adults + b.children + b.babies) AS personas,
      b.adults            AS adults,
      b.children          AS children,
      b.babies            AS babies,
      b.subtotal          AS subtotal,
      t.name              AS tour,
      round(t.price * (100 - COALESCE(GREATEST(30 - r.commission, 0), 0)) / 100, 2) AS price_per_person,
      round(COALESCE(t.child_price, t.price) * (100 - COALESCE(GREATEST(30 - r.commission, 0), 0)) / 100, 2) AS child_price,
      c.email             AS customer_email,
      c.name              AS customer_name,
      c.phone             AS customer_phone
    FROM payments p
    JOIN bookings b ON b.id = p.booking_id
    JOIN tours t ON t.id = b.tour_id
    LEFT JOIN customers c ON c.id = p.customer_id
    LEFT JOIN resellers r ON r.id = p.reseller_id
    WHERE p.id = $1
    `,
    [paymentId],
  );

  if (q.rowCount === 0) return null;
  const r = q.rows[0];

  return {
    reservaId: r.reserva_id,
    paypalCaptureId: r.paypal_capture_id,
    amount: parseFloat(r.amount),
    mode: r.mode,
    tour: r.tour,
    personas: r.personas,
    adults: r.adults,
    children: r.children,
    babies: r.babies,
    subtotal: parseFloat(r.subtotal),
    fecha: r.fecha,
    hora: r.hora,
    pricePerPerson: parseFloat(r.price_per_person),
    childPrice: parseFloat(r.child_price),
    customerEmail: r.customer_email ?? null,
    customerName: r.customer_name ?? null,
    customerPhone: r.customer_phone ?? null,
  };
}

async function sendReceiptMails(receipt, reseller) {
  const htmlContent = generateReceiptHTML(receipt);
  const internalHtml = reseller ? generateReceiptHTML(receipt, reseller) : htmlContent;

  const fecha = new Date(receipt.fecha).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  const sends = [
    transporter.sendMail({
      from: `"Nature Tours System" <${process.env.EMAIL_USER}>`,
      to: "naturetourslafortuna@gmail.com",
      subject: `🎫 New Booking: ${receipt.tour} - ${fecha} - ${receipt.personas} people`,
      html: internalHtml,
    }),
  ];

  if (reseller?.email) {
    sends.push(
      transporter.sendMail({
        from: `"Nature Tours System" <${process.env.EMAIL_USER}>`,
        to: reseller.email,
        subject: `🎫 New Booking: ${receipt.tour} - ${fecha} - ${receipt.personas} people`,
        html: internalHtml,
      })
    );
  }

  if (receipt.customerEmail) {
    sends.push(
      transporter.sendMail({
        from: `"Nature Tours" <${process.env.EMAIL_USER}>`,
        to: receipt.customerEmail,
        subject: `Nature Tours: ${receipt.tour} - ${fecha}`,
        html: htmlContent,
      })
    );
  }

  await Promise.all(sends);
}

/**
 * Envía los correos de un payment (empresa + reseller + cliente) con claim
 * atómico de email_sent. Si el envío falla, libera el claim para que el
 * fallback de la página de éxito pueda reintentar.
 * La llama el backend al registrar el pago y el handler HTTP como respaldo.
 */
export async function sendReceiptForPayment(paymentId, receiptFallback = null) {
  const mark = await pool.query(
    `UPDATE payments SET email_sent = TRUE
     WHERE id = $1 AND email_sent = FALSE
     RETURNING id`,
    [paymentId],
  );
  if (mark.rowCount === 0) return { sent: false, reason: "already-sent" };

  try {
    const receipt = (await buildReceiptForPayment(paymentId)) ?? receiptFallback;
    if (!receipt) throw new Error(`Payment ${paymentId} sin datos de receipt`);

    // Si la venta fue de un reseller, el correo interno lleva su sección
    // de comisión y también se le reenvía a él. El del cliente va limpio.
    let reseller = null;
    try {
      reseller = await getResellerInfoForPayment(paymentId);
    } catch (e) {
      console.error("getResellerInfoForPayment error:", e);
    }

    await sendReceiptMails(receipt, reseller);
    return { sent: true };
  } catch (error) {
    await pool
      .query(`UPDATE payments SET email_sent = FALSE WHERE id = $1`, [paymentId])
      .catch(() => {});
    throw error;
  }
}

/**
 * POST /api/email/send-receipt — respaldo desde la página de éxito.
 */
export async function sendReceiptEmail(req, res) {
  try {
    const { receipt, paymentId } = req.body;

    if (!receipt && !paymentId) {
      return res.status(400).json({ ok: false, message: "Receipt data is required" });
    }

    if (paymentId) {
      const result = await sendReceiptForPayment(paymentId, receipt ?? null);
      return res.json({
        ok: true,
        message: result.sent ? "Email sent successfully" : "Email already sent",
      });
    }

    // Sin paymentId (recibos viejos): envío directo sin idempotencia.
    await sendReceiptMails(receipt, null);
    res.json({ ok: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({
      ok: false,
      message: "Failed to send email",
      error: error.message
    });
  }
}
