// Tarjetas con QR para los links de pago (propina, saldo, pago personalizado).
// QR estático (nunca expira), colores de marca, sin logo al centro.
// Salida local (no se sube): marketing/pagos/<slug>.png
// Uso: node scripts/generate-payment-cards.mjs
import QRCode from 'qrcode';
import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'marketing', 'pagos');
const SITE = 'https://naturetourslafortuna.com';

const DARK = '#04231b';
const DARK_MID = '#073a2c';
const CREAM = '#f5efdd';
const SAGE = '#a9c47f';
const AMBER = '#fbbf24';
const SCRIPT_FONT = `'Snell Roundhand', 'Apple Chancery', 'Brush Script MT', cursive`;
const SANS_FONT = `Helvetica, Arial, sans-serif`;

const CARDS = [
  {
    slug: 'saldo-tour',
    url: `${SITE}/pay-balance`,
    title: 'Pay your balance',
    subtitle: 'Paga tu saldo',
    lines: [
      'Scan, enter the amount you owe and pay by card or PayPal.',
      'Escanea, ingresa lo que debes y paga con tarjeta o PayPal.',
    ],
    small: 'Includes PayPal fee · Incluye comisión de PayPal',
  },
  {
    slug: 'propina-tip',
    url: `${SITE}/tip`,
    title: 'Tip our guides',
    subtitle: 'Propina para los guías',
    lines: [
      'Scan to leave a tip by card or PayPal.',
      'Escanea para dejar propina con tarjeta o PayPal.',
    ],
    small: 'Or PayPal directly · O PayPal directo: 1002matamoros@gmail.com',
  },
];

// ─── QR con módulos redondeados ──────────────────────────────────────────────
const isDark = (m, n, r, c) => r >= 0 && r < n && c >= 0 && c < n && m[r * n + c] !== 0;
const isFinder = (r, c, n) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);

function modulePath(x, y, s, top, right, bottom, left, r) {
  const rTL = !top && !left, rTR = !top && !right, rBR = !bottom && !right, rBL = !bottom && !left;
  const x1 = x + s, y1 = y + s;
  let d = `M ${x + (rTL ? r : 0)} ${y} L ${x1 - (rTR ? r : 0)} ${y} `;
  if (rTR) d += `Q ${x1} ${y} ${x1} ${y + r} `;
  d += `L ${x1} ${y1 - (rBR ? r : 0)} `;
  if (rBR) d += `Q ${x1} ${y1} ${x1 - r} ${y1} `;
  d += `L ${x + (rBL ? r : 0)} ${y1} `;
  if (rBL) d += `Q ${x} ${y1} ${x} ${y1 - r} `;
  d += `L ${x} ${y + (rTL ? r : 0)} `;
  if (rTL) d += `Q ${x} ${y} ${x + r} ${y} `;
  return d + 'Z ';
}

// Devuelve el SVG (grupo) del QR dentro de un cuadrado de `size` px en (ox, oy).
function qrSvg(url, ox, oy, size, color) {
  const qr = QRCode.create(url, { errorCorrectionLevel: 'H' });
  const { data: m, size: n } = qr.modules;
  const ms = size / n;
  const r = ms * 0.42;
  let d = '';
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      if (!isDark(m, n, row, col) || isFinder(row, col, n)) continue;
      d += modulePath(ox + col * ms, oy + row * ms, ms,
        isDark(m, n, row - 1, col), isDark(m, n, row, col + 1),
        isDark(m, n, row + 1, col), isDark(m, n, row, col - 1), r);
    }
  }
  let finders = '';
  for (const f of [{ row: 0, col: 0 }, { row: 0, col: n - 7 }, { row: n - 7, col: 0 }]) {
    const fx = ox + f.col * ms, fy = oy + f.row * ms, k = ms * 0.9, q = ms * 0.5;
    finders += `<path fill-rule="evenodd" d="
      M ${fx + k} ${fy} H ${fx + 7 * ms - k} Q ${fx + 7 * ms} ${fy} ${fx + 7 * ms} ${fy + k}
      V ${fy + 7 * ms - k} Q ${fx + 7 * ms} ${fy + 7 * ms} ${fx + 7 * ms - k} ${fy + 7 * ms}
      H ${fx + k} Q ${fx} ${fy + 7 * ms} ${fx} ${fy + 7 * ms - k} V ${fy + k} Q ${fx} ${fy} ${fx + k} ${fy} Z
      M ${fx + ms + q} ${fy + ms} H ${fx + 6 * ms - q} Q ${fx + 6 * ms} ${fy + ms} ${fx + 6 * ms} ${fy + ms + q}
      V ${fy + 6 * ms - q} Q ${fx + 6 * ms} ${fy + 6 * ms} ${fx + 6 * ms - q} ${fy + 6 * ms}
      H ${fx + ms + q} Q ${fx + ms} ${fy + 6 * ms} ${fx + ms} ${fy + 6 * ms - q} V ${fy + ms + q} Q ${fx + ms} ${fy + ms} ${fx + ms + q} ${fy + ms} Z"/>
      <rect x="${fx + 2 * ms}" y="${fy + 2 * ms}" width="${3 * ms}" height="${3 * ms}" rx="${ms * 0.7}"/>`;
  }
  return `<g fill="${color}"><path d="${d}"/>${finders}</g>`;
}

function brackets(x, y, size, len, sw, color, r) {
  const x1 = x + size, y1 = y + size;
  return `<g stroke="${color}" stroke-width="${sw}" fill="none" stroke-linecap="round">
    <path d="M ${x} ${y + len} V ${y + r} Q ${x} ${y} ${x + r} ${y} H ${x + len}"/>
    <path d="M ${x1 - len} ${y} H ${x1 - r} Q ${x1} ${y} ${x1} ${y + r} V ${y + len}"/>
    <path d="M ${x1} ${y1 - len} V ${y1 - r} Q ${x1} ${y1} ${x1 - r} ${y1} H ${x1 - len}"/>
    <path d="M ${x + len} ${y1} H ${x + r} Q ${x} ${y1} ${x} ${y1 - r} V ${y1 - len}"/>
  </g>`;
}

function leaf(x, y, scale, angle, opacity) {
  return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})" fill="${SAGE}" opacity="${opacity}">
    <path d="M0 0 Q 14 -22 46 -26 Q 34 2 0 0 Z"/>
  </g>`;
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

async function makeCard(c) {
  const W = 1080, H = 1500;

  // Foto a pantalla completa, oscurecida para que resalten el QR y el texto.
  const heroSrc = path.join(ROOT, 'frontend', 'public', 'booking', 'horse', 'image12.webp');
  const hero = await sharp(heroSrc).resize(W, H, { fit: 'cover', position: 'centre' }).toBuffer();

  const logo = await sharp(path.join(ROOT, 'frontend', 'public', 'logo.webp'))
    .resize(150, 134, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();

  const CARD = 600, CX = (W - CARD) / 2, CY = 420;
  const QR = 440, QX = CX + (CARD - QR) / 2, QY = CY + (CARD - QR) / 2;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${DARK}" stop-opacity="0.78"/>
        <stop offset="0.3" stop-color="${DARK}" stop-opacity="0.6"/>
        <stop offset="0.6" stop-color="${DARK}" stop-opacity="0.5"/>
        <stop offset="1" stop-color="${DARK}" stop-opacity="0.92"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#shade)"/>

    <text x="${W / 2}" y="290" text-anchor="middle" font-family="${SANS_FONT}" font-weight="900"
      font-size="76" fill="${CREAM}">${esc(c.title)}</text>
    <text x="${W / 2}" y="365" text-anchor="middle" font-family="${SCRIPT_FONT}"
      font-size="60" fill="#dcebc4">${esc(c.subtitle)}</text>

    <rect x="${CX + 10}" y="${CY + 16}" width="${CARD}" height="${CARD}" rx="44" fill="#000" opacity="0.35"/>
    <rect x="${CX}" y="${CY}" width="${CARD}" height="${CARD}" rx="44" fill="${CREAM}"/>
    ${brackets(QX - 44, QY - 44, QR + 88, 70, 12, DARK, 28)}
    ${qrSvg(c.url, QX, QY, QR, DARK)}

    <text x="${W / 2}" y="1150" text-anchor="middle" font-family="${SANS_FONT}" font-weight="700"
      font-size="34" fill="${CREAM}">${esc(c.lines[0])}</text>
    <text x="${W / 2}" y="1200" text-anchor="middle" font-family="${SANS_FONT}" font-weight="500"
      font-size="31" fill="#d8e9c9">${esc(c.lines[1])}</text>
    <text x="${W / 2}" y="1290" text-anchor="middle" font-family="${SANS_FONT}" font-weight="600"
      font-size="26" fill="${AMBER}">${esc(c.small)}</text>
    <text x="${W / 2}" y="1440" text-anchor="middle" font-family="${SANS_FONT}" font-weight="500"
      font-size="24" letter-spacing="2" fill="${SAGE}">naturetourslafortuna.com</text>
  </svg>`;

  const out = path.join(OUT_DIR, `${c.slug}.png`);
  await sharp(hero)
    .composite([
      { input: Buffer.from(svg), top: 0, left: 0 },
      { input: logo, top: 60, left: (W - 150) / 2 },
    ])
    .png()
    .toFile(out);
  console.log('Tarjeta:', out);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const c of CARDS) await makeCard(c);
