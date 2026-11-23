// PDFs de pago para imprimir/enviar: Propina y Saldo del tour.
// Propina: 2 opciones, directo por PayPal (PayPal.me o correo) y por el sistema.
// Saldo: SOLO por el sistema (ahí el cliente paga la comisión de PayPal).
// Salida local: marketing/pagos/ (las imágenes salen de generate-payment-cards.mjs)
// Uso: node scripts/generate-payment-pdfs.mjs [paypalMeUser]
//   sin paypalMeUser → la opción PayPal muestra solo el correo (sin QR).
import QRCode from 'qrcode';
import sharp from 'sharp';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'marketing', 'pagos');
const SITE = 'https://naturetourslafortuna.com';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const PAYPAL_EMAIL = '1002matamoros@gmail.com';
const PAYPAL_ME = process.argv[2]?.replace(/^https?:\/\//, '').replace(/^(www\.)?paypal\.me\//i, '') || null;

const DOCS = [
  {
    slug: 'propina-tip',
    kicker: 'Thank you · Gracias',
    title: 'Tip for our guides',
    subtitle: 'Propina para los guías',
    intro: 'Thank you for riding with us! If you enjoyed the tour, you can leave a tip in either of these two ways.',
    introEs: '¡Gracias por cabalgar con nosotros! Si disfrutaste el tour, puedes dejar una propina de cualquiera de estas dos formas.',
    siteUrl: `${SITE}/tip`,
    siteLabel: 'naturetourslafortuna.com/tip',
    siteNote: 'Choose the amount · Elige el monto',
    paypalDirect: true,
  },
  {
    slug: 'saldo-tour',
    kicker: 'Pay online · Paga en línea',
    title: 'Pay your tour balance',
    subtitle: 'Paga el saldo de tu tour',
    intro: 'Scan the code and enter the amount you owe. You can pay with card or PayPal.',
    introEs: 'Escanea el código e ingresa el monto que debes. Puedes pagar con tarjeta o PayPal.',
    siteUrl: `${SITE}/pay-balance`,
    siteLabel: 'naturetourslafortuna.com/pay-balance',
    siteNote: 'Includes 5.4% PayPal fee · Incluye 5.4 % de comisión de PayPal',
    paypalDirect: false,
  },
];

const DARK = '#04231b';
const EMERALD = '#047857';
const CREAM = '#f5efdd';
const SAGE = '#a9c47f';
const AMBER = '#b45309';

async function qrSvg(url) {
  return QRCode.toString(url, {
    type: 'svg', errorCorrectionLevel: 'M', margin: 1,
    color: { dark: DARK, light: '#ffffff00' },
  });
}

function paypalOption(qr) {
  const link = PAYPAL_ME ? `paypal.me/${PAYPAL_ME}` : null;
  return `
    <div class="opt">
      <div class="badge">1</div>
      <h3>Directly with PayPal</h3>
      <p class="es">Directo por PayPal</p>
      ${qr ? `<div class="qr">${qr}</div>` : `<div class="mail-box"><span>Send to · Enviar a</span><b>${PAYPAL_EMAIL}</b></div>`}
      ${link ? `<p class="url">${link}</p>` : ''}
      <p class="note">${link ? `Or send to · O envía a <b>${PAYPAL_EMAIL}</b>` : 'From your PayPal app · Desde tu app de PayPal'}</p>
    </div>`;
}

function siteOption(d, qr) {
  return `
    <div class="opt${d.paypalDirect ? '' : ' solo'}">
      ${d.paypalDirect ? '<div class="badge">2</div>' : ''}
      <h3>Card or PayPal on our website</h3>
      <p class="es">Con tarjeta o PayPal en nuestro sistema</p>
      <div class="qr">${qr}</div>
      <p class="url">${d.siteLabel}</p>
      <p class="note">${d.siteNote}</p>
    </div>`;
}

async function makePdf(d, logoB64) {
  const siteQr = await qrSvg(d.siteUrl);
  const ppQr = PAYPAL_ME && d.paypalDirect ? await qrSvg(`https://paypal.me/${PAYPAL_ME}`) : null;
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: letter; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { width: 8.5in; height: 11in; font-family: -apple-system, Helvetica, Arial, sans-serif; color: ${DARK};
      background: ${CREAM}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .top { background: ${DARK}; color: ${CREAM}; text-align: center; padding: 0.45in 0.6in 0.5in; position: relative; overflow: hidden; }
    .top::after { content: ""; position: absolute; right: -60px; bottom: -90px; width: 260px; height: 260px; border-radius: 50%; background: #073a2c; }
    .top img { width: 92px; }
    .kicker { margin-top: 10px; font-size: 12px; letter-spacing: 4px; text-transform: uppercase; color: #fbbf24; font-weight: 700; }
    h1 { font-size: 40px; font-weight: 900; margin-top: 6px; }
    h2 { font-family: 'Snell Roundhand', 'Apple Chancery', cursive; font-weight: 400; font-size: 34px; color: ${SAGE}; margin-top: 2px; }
    .intro { padding: 0.35in 0.8in 0.1in; text-align: center; font-size: 14px; line-height: 1.5; }
    .intro .es { color: #4b5d55; margin-top: 4px; }
    .opts { display: flex; gap: 0.3in; padding: 0.25in 0.6in; }
    .opt { flex: 1; background: #fff; border-radius: 22px; padding: 26px 20px 22px; text-align: center; position: relative;
      box-shadow: 0 8px 24px rgba(4,35,27,0.10); border: 2px solid #e6dcc3; }
    .opt.solo { flex: 0 0 4.4in; margin: 0 auto; padding: 30px 30px 26px; }
    .opt.solo .qr { width: 3.2in; height: 3.2in; }
    .opt.solo h3 { font-size: 22px; } .opt.solo .url { font-size: 17px; } .opt.solo .note { font-size: 13px; }
    .badge { position: absolute; top: -18px; left: 50%; transform: translateX(-50%); width: 36px; height: 36px; border-radius: 50%;
      background: ${EMERALD}; color: #fff; font-weight: 900; font-size: 18px; line-height: 36px; }
    .opt h3 { font-size: 18px; font-weight: 800; margin-top: 4px; }
    .opt .es { font-size: 14px; color: #4b5d55; margin-top: 2px; }
    .qr { width: 2.3in; height: 2.3in; margin: 16px auto 8px; }
    .qr svg { width: 100%; height: 100%; }
    .mail-box { margin: 16px auto 8px; height: 2.3in; display: flex; flex-direction: column; justify-content: center; gap: 10px;
      border-radius: 16px; background: #f0f7f3; border: 2px dashed ${SAGE}; }
    .mail-box span { font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: ${EMERALD}; font-weight: 700; }
    .mail-box b { font-size: 17px; word-break: break-all; padding: 0 10px; }
    .url { font-weight: 800; font-size: 14px; color: ${EMERALD}; }
    .note { font-size: 11.5px; color: #5b6b64; margin-top: 6px; line-height: 1.4; }
    .note b { color: ${DARK}; }
    .foot { position: absolute; bottom: 0.4in; width: 100%; text-align: center; }
    .foot .script { font-family: 'Snell Roundhand', 'Apple Chancery', cursive; font-size: 26px; color: ${EMERALD}; }
    .foot .site { font-size: 12px; color: #5b6b64; margin-top: 4px; letter-spacing: 1px; }
  </style></head><body>
    <div class="top">
      <img src="data:image/png;base64,${logoB64}" alt="">
      <p class="kicker">${d.kicker}</p>
      <h1>${d.title}</h1>
      <h2>${d.subtitle}</h2>
    </div>
    <div class="intro"><p>${d.intro}</p><p class="es">${d.introEs}</p></div>
    <div class="opts">${d.paypalDirect ? paypalOption(ppQr) : ''}${siteOption(d, siteQr)}</div>
    <div class="foot"><p class="script">Ride through nature, feel the freedom.</p>
      <p class="site">NATURETOURSLAFORTUNA.COM</p></div>
  </body></html>`;

  const tmp = path.join(OUT_DIR, `.${d.slug}.html`);
  const out = path.join(OUT_DIR, `${d.slug}.pdf`);
  writeFileSync(tmp, html);
  execFileSync(CHROME, ['--headless', '--disable-gpu', '--no-pdf-header-footer',
    `--print-to-pdf=${out}`, `file://${tmp}`], { stdio: 'ignore' });
  console.log('PDF:', out);
  if (d.png) {
    const png = path.join(OUT_DIR, `${d.slug}.png`);
    execFileSync(CHROME, ['--headless', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=2',
      '--window-size=816,1056', `--screenshot=${png}`, `file://${tmp}`], { stdio: 'ignore' });
    console.log('PNG:', png);
  }
  rmSync(tmp);
}

mkdirSync(OUT_DIR, { recursive: true });
const logo = await sharp(path.join(ROOT, 'frontend', 'public', 'logo.webp')).png().toBuffer();
for (const d of DOCS) await makePdf(d, logo.toString('base64'));
