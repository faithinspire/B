/**
 * Creates minimal PNG icons for PWA
 * Uses pure JS PNG encoding — no external dependencies
 */
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import zlib from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function createPNG(size) {
  // Create RGBA pixel data for a purple gradient square with rounded corners
  const pixels = new Uint8Array(size * size * 4);
  
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.2; // corner radius
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      
      // Check if inside rounded rectangle
      const dx = Math.max(0, Math.abs(x - cx) - (cx - radius));
      const dy = Math.max(0, Math.abs(y - cy) - (cy - radius));
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > radius) {
        // Outside — transparent
        pixels[idx] = 0;
        pixels[idx + 1] = 0;
        pixels[idx + 2] = 0;
        pixels[idx + 3] = 0;
        continue;
      }
      
      // Purple to pink gradient
      const t = x / size;
      const r = Math.round(124 + (236 - 124) * t); // 7c3aed -> ec4899
      const g = Math.round(58 + (72 - 58) * t);
      const b = Math.round(237 + (153 - 237) * t);
      
      pixels[idx] = r;
      pixels[idx + 1] = g;
      pixels[idx + 2] = b;
      pixels[idx + 3] = 255;
      
      // Draw a simple "B" shape in white
      const nx = x / size; // normalized 0-1
      const ny = y / size;
      
      // Vertical stroke of B (left side)
      if (nx >= 0.22 && nx <= 0.30 && ny >= 0.12 && ny <= 0.88) {
        pixels[idx] = 255;
        pixels[idx + 1] = 255;
        pixels[idx + 2] = 255;
        pixels[idx + 3] = 255;
      }
      
      // Upper bump of B
      const upperCX = 0.52, upperCY = 0.32, upperRX = 0.22, upperRY = 0.18;
      const upperDist = Math.sqrt(
        Math.pow((nx - upperCX) / upperRX, 2) + 
        Math.pow((ny - upperCY) / upperRY, 2)
      );
      if (upperDist >= 0.85 && upperDist <= 1.15 && nx >= 0.26 && ny >= 0.12 && ny <= 0.52) {
        pixels[idx] = 255;
        pixels[idx + 1] = 255;
        pixels[idx + 2] = 255;
        pixels[idx + 3] = 255;
      }
      
      // Lower bump of B
      const lowerCX = 0.54, lowerCY = 0.68, lowerRX = 0.24, lowerRY = 0.20;
      const lowerDist = Math.sqrt(
        Math.pow((nx - lowerCX) / lowerRX, 2) + 
        Math.pow((ny - lowerCY) / lowerRY, 2)
      );
      if (lowerDist >= 0.85 && lowerDist <= 1.15 && nx >= 0.26 && ny >= 0.48 && ny <= 0.88) {
        pixels[idx] = 255;
        pixels[idx + 1] = 255;
        pixels[idx + 2] = 255;
        pixels[idx + 3] = 255;
      }
    }
  }
  
  return encodePNG(pixels, size, size);
}

function encodePNG(pixels, width, height) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  
  // Raw image data with filter bytes
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0; // filter type: None
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = y * (1 + width * 4) + 1 + x * 4;
      rawData[dstIdx] = pixels[srcIdx];
      rawData[dstIdx + 1] = pixels[srcIdx + 1];
      rawData[dstIdx + 2] = pixels[srcIdx + 2];
      rawData[dstIdx + 3] = pixels[srcIdx + 3];
    }
  }
  
  const compressed = zlib.deflateSync(rawData, { level: 6 });
  
  function makeChunk(type, data) {
    const typeBuffer = Buffer.from(type, 'ascii');
    const lenBuffer = Buffer.alloc(4);
    lenBuffer.writeUInt32BE(data.length, 0);
    
    const crcData = Buffer.concat([typeBuffer, data]);
    const crc = crc32(crcData);
    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc >>> 0, 0);
    
    return Buffer.concat([lenBuffer, typeBuffer, data, crcBuffer]);
  }
  
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  const table = makeCRCTable();
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeCRCTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  return table;
}

// Generate icons
console.log('Generating 192x192 icon...');
const png192 = createPNG(192);
writeFileSync(join(root, 'public/icon-192.png'), png192);
console.log('✅ public/icon-192.png created');

console.log('Generating 512x512 icon...');
const png512 = createPNG(512);
writeFileSync(join(root, 'public/icon-512.png'), png512);
console.log('✅ public/icon-512.png created');

console.log('');
console.log('✅ PWA icons generated successfully!');
