import nodemailer from "nodemailer";

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
function generateReceiptHTML(receipt) {
  const subtotal = receipt.pricePerPerson * receipt.personas;
  const remaining = receipt.mode === "deposit" ? subtotal - receipt.amount : 0;

  const fecha = new Date(receipt.fecha).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
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

          <!-- Booking Details -->
          ${SECTION('Booking Details', [
            ROW('Tour', receipt.tour),
            ROW('Date', fecha),
            ROW('Time', receipt.hora.slice(0, 5)),
            ROW('People', `${receipt.personas} people`),
          ].join(''))}

          <!-- Payment Information -->
          ${SECTION('Payment Information', [
            ROW('Payment Type', paymentBadge),
            ROW('Price per person', `$${Number(receipt.pricePerPerson).toFixed(2)}`),
            ROW(`Subtotal (${receipt.personas} × $${Number(receipt.pricePerPerson).toFixed(2)})`, `$${subtotal.toFixed(2)}`),
            ROW('Amount Paid', `$${Number(receipt.amount).toFixed(2)}`, true),
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
 * Envía el recibo por email a Nature Tours
 */
export async function sendReceiptEmail(req, res) {
  try {
    const { receipt } = req.body;

    if (!receipt) {
      return res.status(400).json({ ok: false, message: "Receipt data is required" });
    }

    const htmlContent = generateReceiptHTML(receipt);

    const fecha = new Date(receipt.fecha).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    const sends = [
      transporter.sendMail({
        from: `"Nature Tours System" <${process.env.EMAIL_USER}>`,
        to: "naturetourslafortuna@gmail.com",
        subject: `🎫 New Booking: ${receipt.tour} - ${fecha} - ${receipt.personas} people`,
        html: htmlContent,
      }),
    ];

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
