// Pagos personalizados: /custom-payment
// El cliente elige monto y descripción, paga con PayPal y se registra aquí
// (sin reserva). Correo propio para cliente y empresa: mismo estilo que el
// recibo de reservas, pero como "Custom Payment".
import { z } from "zod";
import { pool } from "../db.js";
import { transporter } from "./email.controller.js";

const INTERNAL_EMAIL = "naturetourslafortuna@gmail.com";

const idSchema = z.object({ id: z.string().uuid() });

const createSchema = z.object({
  name: z.string().trim().min(3).max(120),
  email: z.string().trim().email().max(200),
  phone: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().min(8).max(20).optional()
  ),
  description: z.string().trim().min(3).max(500),
  amount: z.number().positive().max(100000),
  paypalOrderId: z.string().min(6).max(100),
  paypalCaptureId: z.string().min(6).max(100).nullable().optional(),
  status: z.string(),
});

const escapeHtml = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const fmtMoney = (n) => `$${Number(n).toFixed(2)}`;

function toReceipt(r) {
  return {
    id: r.id,
    name: r.customer_name,
    email: r.customer_email,
    phone: r.customer_phone,
    description: r.description,
    amount: Number(r.amount),
    currency: r.currency,
    paypalOrderId: r.paypal_order_id,
    paypalCaptureId: r.paypal_capture_id,
    createdAt: r.created_at,
  };
}

export function generateCustomPaymentHTML(p, { internal = false } = {}) {
  const fecha = new Date(p.createdAt).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Costa_Rica",
  });

  const ROW = (label, value, isTotal = false) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:${isTotal ? "18px" : "14px"};vertical-align:top;">${label}</td>
      <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-weight:600;color:${isTotal ? "#047857" : "#1f2937"};font-size:${isTotal ? "18px" : "14px"};text-align:right;">${value}</td>
    </tr>`;

  const SECTION = (title, inner, green = false) => `
    <div style="border-radius:12px;overflow:hidden;border:1px solid ${green ? "#a7f3d0" : "#e5e7eb"};margin-bottom:14px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${green ? "#ecfdf5" : "#f9fafb"};width:100%;">
        <tr><td style="padding:16px;">
          <p style="font-size:14px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px 0;">${title}</p>
          ${inner}
        </td></tr>
      </table>
    </div>`;

  const TABLE = (rows) =>
    `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${rows}</table>`;

  const idBox = (id) =>
    `<span style="background:#f3f4f6;padding:4px 10px;border-radius:6px;font-family:monospace;font-size:12px;">${escapeHtml(id)}</span>`;

  const badge = `<span style="display:inline-block;padding:4px 12px;border-radius:6px;font-size:12px;font-weight:600;background:#e0e7ff;color:#3730a3;">Custom Payment</span>`;

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>Payment Receipt - Nature Tours</title></head>
    <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1f2937;background:#ffffff;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:20px;">
        <tr><td>
          <div style="text-align:center;margin-bottom:18px;">
            <div style="font-size:24px;font-weight:800;color:#047857;letter-spacing:0.2px;line-height:1.15;margin:0 0 6px 0;">Nature Tours</div>
            <div style="display:inline-block;background:linear-gradient(135deg,#d1fae5 0%,#ecfdf5 100%);color:#065f46;padding:10px 18px;border-radius:999px;font-weight:700;font-size:14px;letter-spacing:0.3px;box-shadow:0 2px 6px rgba(4,120,87,0.14);">✓ Payment Received</div>
          </div>

          ${SECTION(
            "Customer",
            TABLE(
              [
                ROW("Name", escapeHtml(p.name)),
                ROW("Email", escapeHtml(p.email)),
                p.phone ? ROW("Phone", escapeHtml(p.phone)) : "",
              ].join("")
            )
          )}

          ${SECTION(
            "Payment Details",
            TABLE(
              [
                ROW("Payment Type", badge),
                ROW("Date", fecha),
                ROW("Amount Paid", fmtMoney(p.amount), true),
              ].join("")
            ) +
              `<p style="font-size:13px;font-weight:600;color:#6b7280;margin:14px 0 6px 0;">Description</p>
               <p style="font-size:14px;color:#1f2937;line-height:1.5;margin:0;background:#ffffff;border:1px solid #d1fae5;border-radius:8px;padding:10px 12px;white-space:pre-wrap;">${escapeHtml(p.description)}</p>`,
            true
          )}

          ${SECTION(
            "Reference IDs",
            TABLE(
              [
                ROW("Payment ID", idBox(p.id)),
                p.paypalCaptureId ? ROW("PayPal ID", idBox(p.paypalCaptureId)) : "",
              ].join("")
            )
          )}

          <div style="text-align:center;margin-top:20px;padding-top:16px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:11px;">
            ${internal ? "<p>Custom payment received through naturetourslafortuna.com/custom-payment</p>" : "<p>Thank you for choosing Nature Tours!</p>"}
            <p style="margin-top:16px;">Questions? Contact us at ${INTERNAL_EMAIL}</p>
          </div>
        </td></tr>
      </table>
    </body>
    </html>`;
}

// Envía cliente + empresa con claim atómico de email_sent (sin duplicados).
async function sendCustomPaymentMails(id) {
  const mark = await pool.query(
    `update custom_payments set email_sent = true where id = $1 and email_sent = false returning *`,
    [id]
  );
  if (mark.rowCount === 0) return;
  const p = toReceipt(mark.rows[0]);

  try {
    await Promise.all([
      transporter.sendMail({
        from: `"Nature Tours System" <${process.env.EMAIL_USER}>`,
        to: INTERNAL_EMAIL,
        subject: `💳 Custom Payment: ${fmtMoney(p.amount)} - ${p.name}`,
        html: generateCustomPaymentHTML(p, { internal: true }),
      }),
      transporter.sendMail({
        from: `"Nature Tours" <${process.env.EMAIL_USER}>`,
        to: p.email,
        subject: `Nature Tours: Payment received - ${fmtMoney(p.amount)}`,
        html: generateCustomPaymentHTML(p),
      }),
    ]);
  } catch (e) {
    await pool
      .query(`update custom_payments set email_sent = false where id = $1`, [id])
      .catch(() => {});
    throw e;
  }
}

// POST /api/custom-payments (público) — se llama tras el capture de PayPal.
export async function createCustomPayment(req, res) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }
  const d = parsed.data;

  if (String(d.status).toLowerCase() !== "completed") {
    return res.status(400).json({
      ok: false,
      message: "El pago solo se registra si está completado",
    });
  }

  try {
    const q = await pool.query(
      `insert into custom_payments
         (customer_name, customer_email, customer_phone, description, amount,
          paypal_order_id, paypal_capture_id, status)
       values ($1, $2, $3, $4, $5, $6, $7, 'completed')
       on conflict (paypal_order_id) do update set paypal_order_id = excluded.paypal_order_id
       returning id`,
      [
        d.name,
        d.email,
        d.phone || null,
        d.description,
        Math.round(d.amount * 100) / 100,
        d.paypalOrderId,
        d.paypalCaptureId || null,
      ]
    );
    const id = q.rows[0].id;

    sendCustomPaymentMails(id).catch((e) =>
      console.error(`sendCustomPaymentMails(${id}) error:`, e)
    );

    return res.status(201).json({ ok: true, id });
  } catch (err) {
    console.error("createCustomPayment error:", err);
    return res.status(500).json({ ok: false, message: "Error registrando el pago" });
  }
}

// GET /api/custom-payments/:id (público) — confirmación post-pago.
export async function getCustomPayment(req, res) {
  const p = idSchema.safeParse(req.params);
  if (!p.success) {
    return res.status(404).json({ ok: false, message: "Pago no encontrado" });
  }
  try {
    const q = await pool.query(`select * from custom_payments where id = $1`, [p.data.id]);
    if (q.rowCount === 0) {
      return res.status(404).json({ ok: false, message: "Pago no encontrado" });
    }
    return res.json({ ok: true, payment: toReceipt(q.rows[0]) });
  } catch (err) {
    console.error("getCustomPayment error:", err);
    return res.status(500).json({ ok: false, message: "Error obteniendo el pago" });
  }
}

// GET /api/custom-payments (admin) — últimos pagos recibidos.
export async function listCustomPayments(_req, res) {
  try {
    const q = await pool.query(
      `select * from custom_payments order by created_at desc limit 100`
    );
    return res.json({ ok: true, payments: q.rows.map(toReceipt) });
  } catch (err) {
    console.error("listCustomPayments error:", err);
    return res.status(500).json({ ok: false, message: "Error listando pagos" });
  }
}
