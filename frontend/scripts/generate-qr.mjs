// Generador de QR + afiche para el reseller Andrés Matamoros.
// QR estático (nunca expira) con colores de la marca y logo al centro.
import QRCode from 'qrcode';
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'marketing');
mkdirSync(OUT_DIR, { recursive: true });

// Uso: node scripts/generate-qr.mjs [resellerId] [slug]
const RESELLER_ID = process.argv[2] || '00646918-a078-41b9-aa95-9296da3d8be4';
const SLUG = process.argv[3] || 'andres-matamoros';
const QR_URL = `https://naturetourslafortuna.com/reseller/${RESELLER_ID}`;
const IMG_SIZE = 1400;
const MARGIN = 2;

// Colores de marca (emerald del sitio)
const EMERALD_900 = '#064e3b';
const EMERALD_700 = '#047857';
const EMERALD_600 = '#059669';
const CREAM = '#fdf6e3';
const AMBER = '#fbbf24';

function isDark(matrix, size, r, c) {
  if (r < 0 || r >= size || c < 0 || c >= size) return false;
  return matrix[r * size + c] !== 0;
}
function isFinderZone(r, c, size) {
  return (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);
}
function modulePath(x, y, s, top, right, bottom, left, r) {
  const rTL = !top && !left, rTR = !top && !right;
  const rBR = !bottom && !right, rBL = !bottom && !left;
  const x0 = x, y0 = y, x1 = x + s, y1 = y + s;
  let d = `M ${x0 + (rTL ? r : 0)} ${y0} `;
  d += `L ${x1 - (rTR ? r : 0)} ${y0} `;
  if (rTR) d += `Q ${x1} ${y0} ${x1} ${y0 + r} `;
  d += `L ${x1} ${y1 - (rBR ? r : 0)} `;
  if (rBR) d += `Q ${x1} ${y1} ${x1 - r} ${y1} `;
  d += `L ${x0 + (rBL ? r : 0)} ${y1} `;
  if (rBL) d += `Q ${x0} ${y1} ${x0} ${y1 - r} `;
  d += `L ${x0} ${y0 + (rTL ? r : 0)} `;
  if (rTL) d += `Q ${x0} ${y0} ${x0 + r} ${y0} `;
  return d + 'Z ';
}
function rrect(x, y, w, h, rx) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" ry="${rx}"/>`;
}

async function generateQR(color, logoEllipseFill, outFile) {
  const qr = QRCode.create(QR_URL, { errorCorrectionLevel: 'H' });
  const { data: matrix, size } = qr.modules;
  const ms = IMG_SIZE / (size + MARGIN * 2);
  const r = ms * 0.42;

  let dataPath = '';
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!isDark(matrix, size, row, col) || isFinderZone(row, col, size)) continue;
      const x = (col + MARGIN) * ms, y = (row + MARGIN) * ms;
      dataPath += modulePath(x, y, ms,
        isDark(matrix, size, row - 1, col), isDark(matrix, size, row, col + 1),
        isDark(matrix, size, row + 1, col), isDark(matrix, size, row, col - 1), r);
    }
  }

  const fp = [{ row: 0, col: 0 }, { row: 0, col: size - 7 }, { row: size - 7, col: 0 }];
  // Marcos de posición: anillo (evenodd) + punto central
  let finderSvg = `<g fill="${color}">`;
  for (const f of fp) {
    const fx = (f.col + MARGIN) * ms, fy = (f.row + MARGIN) * ms;
    finderSvg += `<path fill-rule="evenodd" d="
      M ${fx + ms * 0.9} ${fy} H ${fx + 7 * ms - ms * 0.9} Q ${fx + 7 * ms} ${fy} ${fx + 7 * ms} ${fy + ms * 0.9}
      V ${fy + 7 * ms - ms * 0.9} Q ${fx + 7 * ms} ${fy + 7 * ms} ${fx + 7 * ms - ms * 0.9} ${fy + 7 * ms}
      H ${fx + ms * 0.9} Q ${fx} ${fy + 7 * ms} ${fx} ${fy + 7 * ms - ms * 0.9}
      V ${fy + ms * 0.9} Q ${fx} ${fy} ${fx + ms * 0.9} ${fy} Z
      M ${fx + ms + ms * 0.5} ${fy + ms} H ${fx + 6 * ms - ms * 0.5} Q ${fx + 6 * ms} ${fy + ms} ${fx + 6 * ms} ${fy + ms + ms * 0.5}
      V ${fy + 6 * ms - ms * 0.5} Q ${fx + 6 * ms} ${fy + 6 * ms} ${fx + 6 * ms - ms * 0.5} ${fy + 6 * ms}
      H ${fx + ms + ms * 0.5} Q ${fx + ms} ${fy + 6 * ms} ${fx + ms} ${fy + 6 * ms - ms * 0.5}
      V ${fy + ms + ms * 0.5} Q ${fx + ms} ${fy + ms} ${fx + ms + ms * 0.5} ${fy + ms} Z"/>`;
    finderSvg += rrect(fx + 2 * ms, fy + 2 * ms, 3 * ms, 3 * ms, ms * 0.7);
  }
  finderSvg += `</g>`;

  // Logo al centro
  const logoFile = path.join(ROOT, 'frontend', 'public', 'logo.webp');
  const raw = readFileSync(logoFile);
  const trimmed = await sharp(raw).trim({ threshold: 20 }).png().toBuffer();
  const { width: lw, height: lh } = await sharp(trimmed).metadata();
  const areaH = IMG_SIZE * 0.21, areaW = (lw / lh) * areaH;
  const pad = ms * 1.0, cx = IMG_SIZE / 2, cy = IMG_SIZE / 2;
  const logoSvg = `<ellipse cx="${cx}" cy="${cy}" rx="${areaW / 2 + pad}" ry="${areaH / 2 + pad}" fill="${logoEllipseFill}"/>
    <image href="data:image/png;base64,${trimmed.toString('base64')}"
      x="${cx - areaW / 2}" y="${cy - areaH / 2}" width="${areaW}" height="${areaH}"
      preserveAspectRatio="xMidYMid meet"/>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
    width="${IMG_SIZE}" height="${IMG_SIZE}" viewBox="0 0 ${IMG_SIZE} ${IMG_SIZE}">
    <path d="${dataPath}" fill="${color}"/>
    ${finderSvg}${logoSvg}
  </svg>`;

  const out = path.join(OUT_DIR, outFile);
  await sharp(Buffer.from(svg)).png({ compressionLevel: 1 }).toFile(out);
  console.log('QR guardado:', out);
  return out;
}

// ─── Afiche ──────────────────────────────────────────────────────────────────
async function generateFlyer(qrPath) {
  const W = 1200, H = 1700;
  const PHOTO_TOP = 760; // donde empieza a verse la foto

  // Foto: booking/horse/image12 recortada para que los jinetes queden visibles
  const photoSrc = path.join(ROOT, 'frontend', 'public', 'booking', 'horse', 'image12.webp');
  const meta = await sharp(photoSrc).metadata();
  const photo = await sharp(photoSrc)
    .extract({
      left: 0,
      top: Math.round(meta.height * 0.18),
      width: meta.width,
      height: Math.round(meta.height * 0.72),
    })
    .resize(W, H - PHOTO_TOP + 220, { fit: 'cover', position: 'centre' })
    .toBuffer();

  const qrBuf = await sharp(qrPath).resize(470, 470).toBuffer();

  // Grid decorativo de puntos (como el ejemplo)
  function dotsGrid(x, y, cols, rows, gap, rad, fill, opacity) {
    let s = `<g fill="${fill}" opacity="${opacity}">`;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        s += `<circle cx="${x + c * gap}" cy="${y + r * gap}" r="${rad}"/>`;
    return s + '</g>';
  }

  // Esquinas del marco del QR
  function brackets(x, y, size, len, sw, color, r) {
    const x1 = x + size, y1 = y + size;
    return `<g stroke="${color}" stroke-width="${sw}" fill="none" stroke-linecap="round">
      <path d="M ${x} ${y + len} V ${y + r} Q ${x} ${y} ${x + r} ${y} H ${x + len}"/>
      <path d="M ${x1 - len} ${y} H ${x1 - r} Q ${x1} ${y} ${x1} ${y + r} V ${y + len}"/>
      <path d="M ${x1} ${y1 - len} V ${y1 - r} Q ${x1} ${y1} ${x1 - r} ${y1} H ${x1 - len}"/>
      <path d="M ${x + len} ${y1} H ${x + r} Q ${x} ${y1} ${x} ${y1 - r} V ${y1 - len}"/>
    </g>`;
  }

  // Card del QR
  const CARD_W = 620, CARD_H = 700;
  const CARD_X = W - CARD_W - 70, CARD_Y = 430;
  const QR_X = CARD_X + (CARD_W - 470) / 2, QR_Y = CARD_Y + 55;

  const FONT = `Helvetica, Arial, sans-serif`;

  const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="panel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#04231b"/>
        <stop offset="0.55" stop-color="#052e23"/>
        <stop offset="1" stop-color="#064e3b"/>
      </linearGradient>
      <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#052e23" stop-opacity="1"/>
        <stop offset="1" stop-color="#052e23" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="photoDim" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#04231b" stop-opacity="0.55"/>
        <stop offset="0.5" stop-color="#04231b" stop-opacity="0.12"/>
        <stop offset="1" stop-color="#04231b" stop-opacity="0.45"/>
      </linearGradient>
    </defs>

    <!-- panel superior -->
    <rect x="0" y="0" width="${W}" height="${PHOTO_TOP}" fill="url(#panel)"/>

    <!-- transición hacia la foto -->
    <rect x="0" y="${PHOTO_TOP - 10}" width="${W}" height="260" fill="url(#fade)"/>
    <!-- oscurecer levemente la foto para cohesión -->
    <rect x="0" y="${PHOTO_TOP}" width="${W}" height="${H - PHOTO_TOP}" fill="url(#photoDim)"/>

    <!-- decoración -->
    ${dotsGrid(920, 100, 8, 4, 26, 4, CREAM, 0.3)}
    ${dotsGrid(90, 1540, 6, 3, 26, 4, CREAM, 0.5)}
    <circle cx="${W - 40}" cy="380" r="150" fill="${EMERALD_700}" opacity="0.25"/>
    <circle cx="30" cy="90" r="100" fill="${EMERALD_700}" opacity="0.2"/>

    <!-- titular -->
    <text x="84" y="230" font-family="${FONT}" font-weight="900" font-size="170" fill="${CREAM}" letter-spacing="2">SCAN</text>
    <text x="84" y="390" font-family="${FONT}" font-weight="900" font-size="170" fill="${CREAM}" letter-spacing="2">ME</text>
    <rect x="88" y="440" width="120" height="10" rx="5" fill="${AMBER}"/>

    <text x="88" y="530" font-family="${FONT}" font-weight="800" font-size="44" fill="#ffffff">HORSEBACK</text>
    <text x="88" y="585" font-family="${FONT}" font-weight="800" font-size="44" fill="#ffffff">RIDING TOUR</text>
    <text x="88" y="650" font-family="${FONT}" font-weight="500" font-size="27" fill="#d1fae5">Book with one of our</text>
    <text x="88" y="688" font-family="${FONT}" font-weight="500" font-size="27" fill="#d1fae5">official resellers</text>

    <!-- card del QR -->
    <rect x="${CARD_X}" y="${CARD_Y}" width="${CARD_W}" height="${CARD_H}" rx="48" fill="#ffffff"/>
    ${brackets(QR_X - 22, QR_Y - 22, 470 + 44, 74, 12, EMERALD_600, 26)}
    <text x="${CARD_X + CARD_W / 2}" y="${CARD_Y + CARD_H - 62}" text-anchor="middle"
      font-family="${FONT}" font-weight="800" font-size="40" fill="${EMERALD_700}" letter-spacing="4">SCAN &amp; BOOK</text>
  </svg>`;

  const out = path.join(OUT_DIR, `${SLUG}-flyer.png`);
  await sharp({ create: { width: W, height: H, channels: 4, background: '#052e23' } })
    .composite([
      { input: photo, top: PHOTO_TOP - 220, left: 0 },
      { input: Buffer.from(overlay), top: 0, left: 0 },
      { input: qrBuf, top: QR_Y, left: QR_X },
    ])
    .png()
    .toFile(out);
  console.log('Afiche guardado:', out);
}

async function main() {
  const qrEmerald = await generateQR(EMERALD_900, 'rgba(255,255,255,0.92)', `${SLUG}-qr-emerald.png`);
  await generateQR('#FFFFFF', 'rgba(6,78,59,0.9)', `${SLUG}-qr-white.png`);
  await generateFlyer(qrEmerald);
}
main().catch((e) => { console.error(e); process.exit(1); });
