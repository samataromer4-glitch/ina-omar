const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table for PNG chunk checksums
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c;
}

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function createPNG(width, height, isMaskable = false) {
  // RGBA buffer with scanline filter byte 0 at each row start
  const rowStride = 1 + width * 4;
  const rawData = Buffer.alloc(rowStride * height);

  const cx = width / 2;
  const cy = height / 2;
  const rOuter = Math.min(width, height) * 0.46;
  const rEmblem = Math.min(width, height) * (isMaskable ? 0.28 : 0.32);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowStride;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background styling
      let r = 10, g = 10, b = 12, a = 255; // #0a0a0c

      if (!isMaskable) {
        // Squircle / rounded box
        const cornerR = width * 0.22;
        const qx = Math.max(0, Math.abs(dx) - (cx - cornerR));
        const qy = Math.max(0, Math.abs(dy) - (cy - cornerR));
        const cornerDist = Math.sqrt(qx * qx + qy * qy);
        if (cornerDist > cornerR) {
          a = 0; // Transparent outside corner
        }
      }

      if (a > 0) {
        // Subtle radial gradient from center
        const gradT = Math.min(1, dist / (width * 0.6));
        r = Math.round(24 * (1 - gradT) + 10 * gradT);
        g = Math.round(19 * (1 - gradT) + 10 * gradT);
        b = Math.round(38 * (1 - gradT) + 12 * gradT);

        // Draw central emblem (Graduate diamond cap + shield)
        const inDiamond = (Math.abs(dx) / (rEmblem * 1.1) + Math.abs(dy - (height * -0.05)) / (rEmblem * 0.65)) <= 1;
        const inShield = (Math.abs(dx) < rEmblem * 0.75) && (dy > 0) && (dy < rEmblem * 0.85);

        if (inDiamond || inShield) {
          // Violet / Purple gradient
          const py = (dy + rEmblem) / (2 * rEmblem);
          r = Math.round(196 * (1 - py) + 109 * py); // #c4b5fd to #6d28d9
          g = Math.round(181 * (1 - py) + 40 * py);
          b = Math.round(253 * (1 - py) + 217 * py);
        } else if (dist < rOuter && dist > rOuter - (width * 0.015)) {
          // Subtle border ring
          r = 124; g = 58; b = 237; // Violet accent
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // PNG chunks
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: RGBA
  ihdrData[10] = 0; // Compression: Deflate
  ihdrData[11] = 0; // Filter: Default
  ihdrData[12] = 0; // Interlace: None

  const ihdrChunk = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x0D]),
    Buffer.from('IHDR'),
    ihdrData,
    Buffer.alloc(4)
  ]);
  ihdrChunk.writeUInt32BE(crc32(Buffer.concat([Buffer.from('IHDR'), ihdrData])), 17);

  // IDAT chunk (compressed pixel data)
  const compressedData = zlib.deflateSync(rawData);
  const idatLength = Buffer.alloc(4);
  idatLength.writeUInt32BE(compressedData.length, 0);
  const idatTypeAndData = Buffer.concat([Buffer.from('IDAT'), compressedData]);
  const idatCrc = Buffer.alloc(4);
  idatCrc.writeUInt32BE(crc32(idatTypeAndData), 0);
  const idatChunk = Buffer.concat([idatLength, idatTypeAndData, idatCrc]);

  // IEND chunk
  const iendChunk = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82]);

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.join(__dirname, '..', 'public');

const icons = [
  { file: 'pwa-192x192.png', size: 192, maskable: false },
  { file: 'pwa-512x512.png', size: 512, maskable: false },
  { file: 'pwa-maskable-512x512.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180, maskable: false },
  { file: 'favicon.ico', size: 64, maskable: false }
];

icons.forEach(({ file, size, maskable }) => {
  const pngBuf = createPNG(size, size, maskable);
  const outPath = path.join(publicDir, file);
  fs.writeFileSync(outPath, pngBuf);
  console.log(`Generated ${file} (${size}x${size}, ${pngBuf.length} bytes)`);
});
