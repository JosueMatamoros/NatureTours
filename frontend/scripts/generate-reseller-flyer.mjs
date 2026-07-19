// Generador de QR + afiche "Explore The Adventure" para resellers.
// QR estático (nunca expira), colores de marca, SIN logo al centro.
// Uso: node scripts/generate-reseller-flyer.mjs [resellerId] [slug]
import QRCode from 'qrcode';
import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'marketing');
mkdirSync(OUT_DIR, { recursive: true });

const RESELLER_ID = process.argv[2] || '00646918-a078-41b9-aa95-9296da3d8be4';
const SLUG = process.argv[3] || 'andres-matamoros';
const QR_URL = `https://naturetourslafortuna.com/reseller/${RESELLER_ID}`;
const IMG_SIZE = 1400;
const MARGIN = 2;

// Colores de marca
const EMERALD_900 = '#064e3b';
const EMERALD_700 = '#047857';
const EMERALD_600 = '#059669';
const DARK = '#04231b';
const DARK_MID = '#052e23';
const CREAM = '#f5efdd';
const PAPER = '#ede4cf';
const SAGE = '#a9c47f';
const AMBER = '#fbbf24';

const SCRIPT_FONT = `'Snell Roundhand', 'Apple Chancery', 'Brush Script MT', cursive`;
const SLAB_FONT = `Rockwell, Georgia, serif`;
const SANS_FONT = `Helvetica, Arial, sans-serif`;

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

// QR sin logo al centro (exclusivo para resellers)
async function generateQR(color, outFile) {
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

  const svg = `<svg xmlns="http://www.w3.org/2000/svg"
    width="${IMG_SIZE}" height="${IMG_SIZE}" viewBox="0 0 ${IMG_SIZE} ${IMG_SIZE}">
    <path d="${dataPath}" fill="${color}"/>
    ${finderSvg}
  </svg>`;

  const out = path.join(OUT_DIR, outFile);
  await sharp(Buffer.from(svg)).png({ compressionLevel: 1 }).toFile(out);
  console.log('QR guardado:', out);
  return out;
}

// ─── Afiche ──────────────────────────────────────────────────────────────────
async function photoBase64(src, w, h, extractBand) {
  let img = sharp(src);
  if (extractBand) {
    const meta = await img.metadata();
    img = img.extract({
      left: 0,
      top: Math.round(meta.height * extractBand[0]),
      width: meta.width,
      height: Math.round(meta.height * extractBand[1]),
    });
  }
  const buf = await img.resize(w, h, { fit: 'cover', position: 'centre' }).jpeg({ quality: 85 }).toBuffer();
  return buf.toString('base64');
}

function leaf(x, y, scale, angle, fill, opacity) {
  return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})" fill="${fill}" opacity="${opacity}">
    <path d="M0 0 Q 14 -22 46 -26 Q 34 2 0 0 Z"/>
    <path d="M0 0 Q 20 6 46 -26" fill="none" stroke="${fill}" stroke-width="1.6"/>
  </g>`;
}

function polaroid(cx, cy, angle, b64, pw, ph, withTape) {
  const fw = pw + 40, fh = ph + 96; // marco blanco: 20 lados, 76 abajo
  const x = -fw / 2, y = -fh / 2;
  const tape = withTape
    ? `<rect x="${-80}" y="${y - 20}" width="160" height="46" rx="4" fill="${PAPER}" opacity="0.85" transform="rotate(4)"/>`
    : '';
  return `<g transform="translate(${cx} ${cy}) rotate(${angle})">
    <rect x="${x + 8}" y="${y + 10}" width="${fw}" height="${fh}" rx="6" fill="#000" opacity="0.35"/>
    <rect x="${x}" y="${y}" width="${fw}" height="${fh}" rx="4" fill="#fdfbf5"/>
    <image href="data:image/jpeg;base64,${b64}" x="${x + 20}" y="${y + 20}" width="${pw}" height="${ph}" preserveAspectRatio="xMidYMid slice"/>
    ${tape}
  </g>`;
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

// Arte del titular (scripts/assets/headline-art.png): el PNG ya trae máscara
// alfa (fondo transparente e incluye su propio brochazo). Solo se recolorean
// las letras oscuras a los tonos del flyer para que contrasten sobre la foto;
// el brochazo claro y los detalles ámbar conservan su color original.
async function buildHeadlineArt(targetW) {
  const src = path.join(__dirname, 'assets', 'headline-art.png');
  const { data: d, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const aw = info.width, ah = info.height;
  const SAGE_RGB = [169, 196, 127], WHITE = [255, 255, 255];
  const CREAM_RGB = [245, 239, 221], DARKG = [11, 43, 18];
  for (let i = 0, p = 0; i < aw * ah; i++, p += 4) {
    if (d[p + 3] === 0) continue;
    const r = d[p], g = d[p + 1], bl = d[p + 2];
    const lum = 0.3 * r + 0.6 * g + 0.1 * bl;
    const orange = r - bl > 80 && r > 140 && g < r * 0.85;
    if (orange || lum > 150) continue; // ámbar y brochazo claro: color original
    const fy = Math.floor(i / aw) / ah;
    let col;
    if (fy < 0.275) col = SAGE_RGB;
    else if (fy < 0.35) col = WHITE;
    else if (fy < 0.70) col = CREAM_RGB;
    else col = DARKG;
    d[p] = col[0]; d[p + 1] = col[1]; d[p + 2] = col[2];
  }

  // Recorte fijo del área con contenido (proporciones conocidas del arte)
  const cx = Math.round(aw * 0.20), cy = Math.round(ah * 0.04);
  const cw = Math.round(aw * 0.58), ch = Math.round(ah * 0.85);
  const buf = await sharp(d, { raw: { width: aw, height: ah, channels: 4 } })
    .extract({ left: cx, top: cy, width: cw, height: ch })
    .resize({ width: targetW })
    .png()
    .toBuffer();
  const meta = await sharp(buf).metadata();
  return { buf, w: meta.width, h: meta.height };
}

async function generateFlyer(qrPath) {
  const W = 1240, H = 1754;
  const PHOTO_H = 980;   // foto principal visible hasta ~y 920 (fade)
  const PANEL_Y = 920;   // inicio del panel inferior

  // Foto principal: booking/horse/image12
  const heroSrc = path.join(ROOT, 'frontend', 'public', 'booking', 'horse', 'image12.webp');
  const heroMeta = await sharp(heroSrc).metadata();
  const hero = await sharp(heroSrc)
    .extract({
      left: 0,
      top: Math.round(heroMeta.height * 0.16),
      width: heroMeta.width,
      height: Math.round(heroMeta.height * 0.62),
    })
    .resize(W, PHOTO_H, { fit: 'cover', position: 'centre' })
    .toBuffer();

  // Polaroids
  const familyB64 = await photoBase64(
    path.join(ROOT, 'frontend', 'public', 'tours', 'familyHorsebackRiding.webp'), 390, 300);
  const riverB64 = await photoBase64(
    path.join(ROOT, 'frontend', 'public', 'booking', 'horse', 'image7.webp'), 390, 300);

  const qrBuf = await sharp(qrPath).resize(460, 460).toBuffer();

  // Card del QR
  const CARD_W = 610, CARD_H = 670;
  const CARD_X = W - CARD_W - 60, CARD_Y = 910;
  const QR_X = CARD_X + (CARD_W - 460) / 2, QR_Y = CARD_Y + 50;

  const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="leftWash" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="${DARK}" stop-opacity="0.88"/>
        <stop offset="0.34" stop-color="${DARK}" stop-opacity="0.42"/>
        <stop offset="0.62" stop-color="${DARK}" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="topWash" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${DARK}" stop-opacity="0.45"/>
        <stop offset="1" stop-color="${DARK}" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${DARK_MID}" stop-opacity="0"/>
        <stop offset="1" stop-color="${DARK_MID}" stop-opacity="1"/>
      </linearGradient>
      <linearGradient id="panel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${DARK_MID}"/>
        <stop offset="1" stop-color="${EMERALD_900}"/>
      </linearGradient>
    </defs>

    <!-- lavados sobre la foto -->
    <rect x="0" y="0" width="${W}" height="${PHOTO_H}" fill="url(#leftWash)"/>
    <rect x="0" y="0" width="${W}" height="220" fill="url(#topWash)"/>
    <rect x="0" y="${PANEL_Y - 160}" width="${W}" height="160" fill="url(#bottomFade)"/>

    <!-- panel inferior -->
    <rect x="0" y="${PANEL_Y}" width="${W}" height="${H - PANEL_Y}" fill="url(#panel)"/>

    <!-- papel rasgado esquina inferior izquierda -->
    <path d="M0 1585 L58 1600 L128 1584 L204 1606 L272 1592 L340 1614 L352 1754 L0 1754 Z"
      fill="${PAPER}" opacity="0.96"/>

    <!-- hojas decorativas -->
    ${leaf(1195, 1050, 2.2, 140, EMERALD_700, 0.35)}
    ${leaf(1205, 1660, 2.6, 200, EMERALD_700, 0.45)}
    ${leaf(1140, 1720, 1.8, 160, EMERALD_600, 0.35)}
    ${leaf(60, 1000, 1.6, -160, EMERALD_600, 0.3)}

    <!-- badge BOOK NOW -->
    <g transform="translate(70 792)">
      <rect x="0" y="0" width="96" height="96" rx="22" fill="#3c7d46"/>
      <g stroke="#ffffff" stroke-width="5" fill="none" stroke-linecap="round">
        <rect x="22" y="26" width="52" height="46" rx="8"/>
        <line x1="22" y1="42" x2="74" y2="42"/>
        <line x1="36" y1="18" x2="36" y2="30"/>
        <line x1="60" y1="18" x2="60" y2="30"/>
      </g>
      <g fill="#ffffff">
        <circle cx="36" cy="54" r="3.5"/><circle cx="48" cy="54" r="3.5"/><circle cx="60" cy="54" r="3.5"/>
        <circle cx="36" cy="64" r="3.5"/><circle cx="48" cy="64" r="3.5"/>
      </g>
      <text x="120" y="42" font-family="${SANS_FONT}" font-weight="900" font-size="44" fill="#ffffff" letter-spacing="2">BOOK NOW</text>
      <text x="120" y="76" font-family="${SANS_FONT}" font-weight="500" font-size="27" fill="#d8e9c9">with one of our</text>
      <text x="120" y="108" font-family="${SANS_FONT}" font-weight="500" font-size="27" fill="#d8e9c9">official resellers</text>
    </g>

    <!-- flecha hacia el QR (curva descendente) -->
    <g stroke="${CREAM}" stroke-width="5" fill="none" stroke-linecap="round">
      <path d="M 415 900 Q 495 910 556 946"/>
      <path d="M 556 946 l -22 -3 m 22 3 l -9 -20"/>
    </g>

    <!-- card del QR -->
    <rect x="${CARD_X + 10}" y="${CARD_Y + 12}" width="${CARD_W}" height="${CARD_H}" rx="46" fill="#000" opacity="0.3"/>
    <rect x="${CARD_X}" y="${CARD_Y}" width="${CARD_W}" height="${CARD_H}" rx="46" fill="#faf7ef"/>
    ${brackets(QR_X - 24, QR_Y - 24, 460 + 48, 72, 12, EMERALD_900, 26)}
    <text x="${CARD_X + CARD_W / 2}" y="${CARD_Y + CARD_H - 58}" text-anchor="middle"
      font-family="${SANS_FONT}" font-weight="800" font-size="42" fill="${DARK}" letter-spacing="4">SCAN &amp; BOOK</text>

    <!-- polaroids -->
    ${polaroid(300, 1170, -5, familyB64, 390, 300, true)}
    ${polaroid(285, 1545, 4, riverB64, 390, 300, false)}

    <!-- lema inferior -->
    <text x="850" y="1702" text-anchor="middle" font-family="${SCRIPT_FONT}" font-size="46" fill="${CREAM}">Ride through nature, feel the freedom.</text>
    <path d="M1188 1682 c -5 -7 -15 -5 -15 3 c 0 7 8 10 15 17 c 7 -7 15 -10 15 -17 c 0 -8 -10 -10 -15 -3 Z"
      fill="none" stroke="${CREAM}" stroke-width="2.5"/>
  </svg>`;

  const art = await buildHeadlineArt(690);
  const out = path.join(OUT_DIR, `${SLUG}-reseller-flyer.png`);
  await sharp({ create: { width: W, height: H, channels: 4, background: DARK_MID } })
    .composite([
      { input: hero, top: 0, left: 0 },
      { input: Buffer.from(overlay), top: 0, left: 0 },
      { input: art.buf, top: 55, left: 64 },
      { input: qrBuf, top: QR_Y, left: QR_X },
    ])
    .png()
    .toFile(out);
  console.log('Afiche guardado:', out);
}

async function main() {
  const qrEmerald = await generateQR(EMERALD_900, `${SLUG}-reseller-qr-emerald.png`);
  await generateQR('#FFFFFF', `${SLUG}-reseller-qr-white.png`);
  await generateFlyer(qrEmerald);
}
main().catch((e) => { console.error(e); process.exit(1); });
