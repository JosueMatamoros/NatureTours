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
 * Genera el HTML del recibo para el email
 */
function generateReceiptHTML(receipt) {
  const subtotal = receipt.pricePerPerson * receipt.personas;
  const remaining = receipt.mode === "deposit" ? subtotal - receipt.amount : 0;

  const fecha = new Date(receipt.fecha).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Receipt - Nature Tours</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 20px;
          color: #1f2937;
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
        }
        .header { text-align: center; margin-bottom: 24px; }
        .logo-text { font-size: 22px; font-weight: bold; color: #047857; margin-bottom: 4px; }
        .success-badge {
          display: inline-block;
          background: #d1fae5;
          color: #047857;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          margin: 16px 0;
        }
        .section {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 14px;
        }
        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 16px;
        }
        .row {
          display: table;
          width: 100%;
          padding: 10px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .row:last-child { border-bottom: none; }
        .row-label {
          display: table-cell;
          color: #6b7280;
          font-size: 14px;
          width: 140px;
          padding-right: 16px;
          vertical-align: middle;
        }
        .row-value {
          display: table-cell;
          font-weight: 600;
          color: #1f2937;
          font-size: 14px;
          text-align: right;
          vertical-align: middle;
        }
        .payment-section { background: #ecfdf5; border-color: #a7f3d0; }
        .payment-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }
        .badge-full { background: #d1fae5; color: #047857; }
        .badge-deposit { background: #fef3c7; color: #92400e; }
        .total-row { font-size: 18px; }
        .total-row .row-value { color: #047857; font-size: 18px; }
        .remaining { color: #92400e; font-size: 13px; margin-top: 8px; }
        .footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
          color: #9ca3af;
          font-size: 11px;
        }
        .id-box {
          background: #f3f4f6;
          padding: 8px 12px;
          border-radius: 6px;
          font-family: monospace;
          font-size: 12px;
        }
        .customer-info {
          background: #eff6ff;
          border-color: #bfdbfe;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-text">🌿 Nature Tours</div>
        <div class="success-badge">✓ Payment Confirmed</div>
      </div>

      ${receipt.customerName || receipt.customerEmail ? `
      <div class="section customer-info">
        <div class="section-title">Customer Information</div>
        ${receipt.customerName ? `
        <div class="row">
          <span class="row-label">Name: </span>
          <span class="row-value">${receipt.customerName}</span>
        </div>
        ` : ''}
        ${receipt.customerEmail ? `
        <div class="row">
          <span class="row-label">Email: </span>
          <span class="row-value">${receipt.customerEmail}</span>
        </div>
        ` : ''}
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">Booking Details</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Tour:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #1f2937; font-size: 14px; text-align: right;">${receipt.tour}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Date:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #1f2937; font-size: 14px; text-align: right;">${fecha}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Time:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #1f2937; font-size: 14px; text-align: right;">${receipt.hora.slice(0, 5)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">People:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #1f2937; font-size: 14px; text-align: right;">${receipt.personas} people</td>
          </tr>
        </table>
      </div>

      <div class="section payment-section">
        <div class="section-title">Payment Information</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Payment Type:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #1f2937; font-size: 14px; text-align: right;">
              <span class="payment-badge ${receipt.mode === 'full' ? 'badge-full' : 'badge-deposit'}">
                ${receipt.mode === 'full' ? 'Full Payment' : '50% Deposit'}
              </span>
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Price per person:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #1f2937; font-size: 14px; text-align: right;">$${Number(receipt.pricePerPerson).toFixed(2)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Subtotal (${receipt.personas} × $${Number(receipt.pricePerPerson).toFixed(2)}):</td>
            <td style="padding: 10px 0; font-weight: 600; color: #1f2937; font-size: 14px; text-align: right;">$${subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #6b7280; font-size: 18px;">Amount Paid:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #047857; font-size: 18px; text-align: right;">$${Number(receipt.amount).toFixed(2)}</td>
          </tr>
        </table>
        ${receipt.mode === 'deposit' ? `
        <div class="remaining">
          ⚠️ Remaining balance to pay on tour day: <strong>$${remaining.toFixed(2)}</strong>
        </div>
        ` : ''}
      </div>

      <div class="section">
        <div class="section-title">Reference IDs</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Purchase ID:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #1f2937; font-size: 14px; text-align: right;"><span class="id-box">${receipt.reservaId}</span></td>
          </tr>
          ${receipt.paypalCaptureId ? `
          <tr>
            <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">PayPal ID:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #1f2937; font-size: 14px; text-align: right;"><span class="id-box">${receipt.paypalCaptureId}</span></td>
          </tr>
          ` : ''}
        </table>
      </div>

      <div class="footer">
        <p>Thank you for choosing Nature Tours!</p>
        <p style="margin-top: 8px;">Please arrive 15 minutes before your scheduled time.</p>
        <p style="margin-top: 16px;">Questions? Contact us at naturetourslafortuna@gmail.com</p>
      </div>
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

    // Enviar email a Nature Tours
    await transporter.sendMail({
      from: `"Nature Tours System" <${process.env.EMAIL_USER}>`,
      to: "naturetourslafortuna@gmail.com",
      subject: `🎫 New Booking: ${receipt.tour} - ${fecha} - ${receipt.personas} people`,
      html: htmlContent,
    });


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
