/**
 * Generador de iconos PNG para la PWA — sin dependencias externas.
 * Escribe PNG a mano (IHDR/IDAT/IEND) usando zlib de Node.
 *
 *   node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../public/icons');

/* ---------------------------------------------------------------- PNG core */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePNG(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    const o = y * (width * 4 + 1);
    raw[o] = 0; // filtro none
    rgba.copy(raw, o + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* -------------------------------------------------------------- geometria */

const mix = (a, b, t) => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

/** Distancia con signo a un rectangulo redondeado centrado en el origen. */
function sdRoundRect(px, py, hw, hh, r) {
  const qx = Math.abs(px) - (hw - r);
  const qy = Math.abs(py) - (hh - r);
  const ax = Math.max(qx, 0);
  const ay = Math.max(qy, 0);
  return Math.hypot(ax, ay) + Math.min(Math.max(qx, qy), 0) - r;
}

const BG_TOP = [0x14, 0x1d, 0x28];
const BG_BOT = [0x08, 0x0b, 0x10];
const ACCENT_A = [0xd8, 0xff, 0x4f];
const ACCENT_B = [0x7c, 0xe0, 0x3a];

/**
 * Dibuja el icono: fondo oscuro + mancuerna lima en diagonal.
 * @param {number} size lado en px
 * @param {number} scale escala del simbolo (0.62 para maskable)
 * @param {number} corner radio de esquina relativo (0 = cuadrado full-bleed)
 */
function drawIcon(size, scale = 1, corner = 0.22) {
  const px = Buffer.alloc(size * size * 4);
  const SS = 3; // supersampling
  const c = size / 2;
  const rot = -Math.PI / 4; // 45 grados
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const S = size * scale;

  // Piezas de la mancuerna en espacio rotado (semi-anchos, semi-altos, radio)
  const bar = { cx: 0, hw: 0.24 * S, hh: 0.036 * S, r: 0.024 * S };
  const inner = { off: 0.252 * S, hw: 0.046 * S, hh: 0.108 * S, r: 0.03 * S };
  const outer = { off: 0.348 * S, hw: 0.058 * S, hh: 0.175 * S, r: 0.038 * S };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let cov = 0;
      let gsum = 0;
      let outside = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const fx = x + (sx + 0.5) / SS;
          const fy = y + (sy + 0.5) / SS;

          // recorte de la tarjeta
          if (corner > 0) {
            const d = sdRoundRect(fx - c, fy - c, c, c, corner * size);
            if (d > 0.5) {
              outside++;
              continue;
            }
          }

          // espacio rotado
          const dx = fx - c;
          const dy = fy - c;
          const u = dx * cos - dy * sin;
          const v = dx * sin + dy * cos;

          const dBar = sdRoundRect(u - bar.cx, v, bar.hw, bar.hh, bar.r);
          const dIn = Math.min(
            sdRoundRect(u - inner.off, v, inner.hw, inner.hh, inner.r),
            sdRoundRect(u + inner.off, v, inner.hw, inner.hh, inner.r),
          );
          const dOut = Math.min(
            sdRoundRect(u - outer.off, v, outer.hw, outer.hh, outer.r),
            sdRoundRect(u + outer.off, v, outer.hw, outer.hh, outer.r),
          );
          const d = Math.min(dBar, dIn, dOut);
          if (d <= 0) {
            cov++;
            gsum += Math.min(1, Math.max(0, (u / (0.8 * S)) + 0.5));
          }
        }
      }

      const total = SS * SS;
      const i = (y * size + x) * 4;
      if (outside === total) {
        px[i] = px[i + 1] = px[i + 2] = px[i + 3] = 0;
        continue;
      }
      const alpha = Math.round(255 * ((total - outside) / total));
      const bg = mix(BG_TOP, BG_BOT, y / size);
      if (cov === 0) {
        px[i] = bg[0];
        px[i + 1] = bg[1];
        px[i + 2] = bg[2];
        px[i + 3] = alpha;
      } else {
        const fg = mix(ACCENT_A, ACCENT_B, gsum / cov);
        const t = cov / (total - outside || 1);
        const col = mix(bg, fg, Math.min(1, t));
        px[i] = col[0];
        px[i + 1] = col[1];
        px[i + 2] = col[2];
        px[i + 3] = alpha;
      }
    }
  }
  return encodePNG(size, size, px);
}

/* ------------------------------------------------------------------- main */

mkdirSync(OUT, { recursive: true });

const targets = [
  ['icon-192.png', 192, 1, 0.22],
  ['icon-512.png', 512, 1, 0.22],
  ['icon-maskable-512.png', 512, 0.62, 0], // full-bleed, simbolo en zona segura
  ['apple-touch-icon.png', 180, 1, 0], // iOS aplica su propia mascara
  ['favicon.png', 64, 1, 0.22],
];

for (const [name, size, scale, corner] of targets) {
  writeFileSync(resolve(OUT, name), drawIcon(size, scale, corner));
  console.log(`  ✓ ${name} (${size}x${size})`);
}
console.log('Iconos generados en public/icons');
