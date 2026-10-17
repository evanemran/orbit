import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Minimal PNG encoder for RGBA buffer
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ crcTable[(c ^ buf[i]) & 0xff];
  }
  return (c ^ -1) >>> 0;
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function createOrbitIconPng(size) {
  const rawData = Buffer.alloc(size * (size * 4 + 1));
  const center = (size - 1) / 2;
  const radius = size * 0.42;
  const ringRadius = size * 0.28;
  const coreRadius = size * 0.12;

  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    rawData[rowStart] = 0; // filter type 0
    for (let x = 0; x < size; x++) {
      const idx = rowStart + 1 + x * 4;
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > radius + 1) {
        rawData[idx] = 0;
        rawData[idx + 1] = 0;
        rawData[idx + 2] = 0;
        rawData[idx + 3] = 0;
        continue;
      }

      // Smooth outer edge
      const alpha = dist > radius ? Math.max(0, Math.round((1 - (dist - radius)) * 255)) : 255;

      // Dark space background (#0B0D12 -> #161A23)
      let r = 17;
      let g = 20;
      let b = 27;

      // Orbital ring (#8B9CFF)
      const ringDist = Math.abs(dist - ringRadius);
      const ringThickness = Math.max(1.1, size * 0.055);
      if (ringDist < ringThickness) {
        const t = 1 - ringDist / ringThickness;
        r = Math.round(r * (1 - t) + 139 * t);
        g = Math.round(g * (1 - t) + 156 * t);
        b = Math.round(b * (1 - t) + 255 * t);
      }

      // Core planet (#72E0C1 -> #8B9CFF)
      if (dist < coreRadius) {
        r = 114;
        g = 224;
        b = 193;
      }

      rawData[idx] = r;
      rawData[idx + 1] = g;
      rawData[idx + 2] = b;
      rawData[idx + 3] = alpha;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = zlib.deflateSync(rawData);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idat),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

const outDir = path.resolve('public/icons');
fs.mkdirSync(outDir, { recursive: true });

for (const size of [16, 32, 48, 128]) {
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), createOrbitIconPng(size));
}
console.log('Generated Orbit icons: 16, 32, 48, 128');
