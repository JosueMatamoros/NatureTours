import { FiDownload } from "react-icons/fi";

export default function ReceiptPDF({ receipt }) {
  const generatePDF = () => {
    const subtotal = receipt.pricePerPerson * receipt.personas;
    const remaining = receipt.mode === "deposit" ? subtotal - receipt.amount : 0;

    const fecha = new Date(receipt.fecha).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Receipt - Nature Tours</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { margin: 15mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            color: #1f2937;
            max-width: 600px;
            margin: 0 auto;
          }
          .header { text-align: center; margin-bottom: 24px; }
          .logo-img { width: 80px; height: auto; margin-bottom: 8px; }
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
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .row:last-child { border-bottom: none; }
          .row-label { color: #6b7280; font-size: 14px; }
          .row-value { font-weight: 600; color: #1f2937; font-size: 14px; }
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
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/logo.webp" alt="Nature Tours" class="logo-img" />
          <div class="logo-text">Nature Tours</div>
          <div class="success-badge">✓ Payment Confirmed</div>
        </div>

        <div class="section">
          <div class="section-title">Booking Details</div>
          <div class="row">
            <span class="row-label">Tour</span>
            <span class="row-value">${receipt.tour}</span>
          </div>
          <div class="row">
            <span class="row-label">Date</span>
            <span class="row-value">${fecha}</span>
          </div>
          <div class="row">
            <span class="row-label">Time</span>
            <span class="row-value">${receipt.hora.slice(0, 5)}</span>
          </div>
          <div class="row">
            <span class="row-label">People</span>
            <span class="row-value">${receipt.personas} people</span>
          </div>
        </div>

        <div class="section payment-section">
          <div class="section-title">Payment Information</div>
          <div class="row">
            <span class="row-label">Payment Type</span>
            <span class="row-value">
              <span class="payment-badge ${receipt.mode === 'full' ? 'badge-full' : 'badge-deposit'}">
                ${receipt.mode === 'full' ? 'Full Payment' : '20% Deposit'}
              </span>
            </span>
          </div>
          <div class="row">
            <span class="row-label">Price per person</span>
            <span class="row-value">$${receipt.pricePerPerson.toFixed(2)}</span>
          </div>
          <div class="row">
            <span class="row-label">Subtotal (${receipt.personas} × $${receipt.pricePerPerson.toFixed(2)})</span>
            <span class="row-value">$${subtotal.toFixed(2)}</span>
          </div>
          <div class="row total-row">
            <span class="row-label">Amount Paid</span>
            <span class="row-value">$${receipt.amount.toFixed(2)}</span>
          </div>
          ${receipt.mode === 'deposit' ? `
          <div class="remaining">
            ⚠️ Remaining balance to pay on tour day: <strong>$${remaining.toFixed(2)}</strong>
          </div>
          ` : ''}
        </div>

        <div class="section">
          <div class="section-title">Reference IDs</div>
          <div class="row">
            <span class="row-label">Purchase ID</span>
            <span class="row-value"><span class="id-box">${receipt.reservaId}</span></span>
          </div>
          ${receipt.paypalCaptureId ? `
          <div class="row">
            <span class="row-label">PayPal ID</span>
            <span class="row-value"><span class="id-box">${receipt.paypalCaptureId}</span></span>
          </div>
          ` : ''}
        </div>

        <div class="footer">
          <p>Thank you for choosing Nature Tours!</p>
          <p style="margin-top: 8px;">Please arrive 15 minutes before your scheduled time.</p>
          <p style="margin-top: 16px;">Questions? Contact us at info@naturetours.com</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <button
      onClick={generatePDF}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3d5a3d] py-3 font-semibold text-white hover:bg-[#2f4a2f] transition-colors"
    >
      <FiDownload />
      Download PDF Receipt
    </button>
  );
}
