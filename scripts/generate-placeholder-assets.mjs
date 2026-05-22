/**
 * Generates simple brand placeholder PNGs for Expo (dev/internal builds).
 * Replace assets/*.png with final brand artwork before store submission.
 */
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, '..', 'assets');

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function pngFromRgba(width, height, rgbaFn) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rowSize = 1 + width * 4;
  const raw = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * rowSize;
    raw[rowStart] = 0;
    for (let x = 0; x < width; x += 1) {
      const [r, g, b, a] = rgbaFn(x, y, width, height);
      const i = rowStart + 1 + x * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  }

  const idat = deflateSync(raw);
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function brandRgba(x, y, width, height) {
  const cx = width / 2;
  const cy = height / 2;
  const dx = (x - cx) / width;
  const dy = (y - cy) / height;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const bg = dist < 0.34 ? [37, 99, 235, 255] : [15, 23, 42, 255];
  const letter = Math.abs(dx) < 0.08 && Math.abs(dy) < 0.22;
  if (letter) return [255, 255, 255, 255];
  return bg;
}

async function writePng(name, width, height, rgbaFn = brandRgba) {
  const buf = pngFromRgba(width, height, rgbaFn);
  await writeFile(join(assetsDir, name), buf);
  const hash = createHash('sha256').update(buf).digest('hex').slice(0, 12);
  console.log(`wrote ${name} (${width}x${height}) sha256:${hash}`);
}

await mkdir(assetsDir, { recursive: true });
await writePng('icon.png', 1024, 1024);
await writePng('splash.png', 1284, 2778);
await writePng('adaptive-icon.png', 1024, 1024);
await writePng('favicon.png', 48, 48, (x, y, w, h) => brandRgba(x, y, w, h));
