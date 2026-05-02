/**
 * Generate PWA PNG icons from the SVG favicon
 * Run: node scripts/generate-pwa-icons.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Read the SVG
const svgContent = readFileSync(join(root, 'public/favicon.svg'), 'utf8');

// Create a simple PNG using canvas-like approach
// Since we can't use canvas in Node without extra deps, we'll create
// a minimal valid PNG with the purple gradient background

function createSimplePNG(size) {
  // We'll create an SVG-based PNG by embedding the SVG in an HTML canvas
  // For now, create a purple square PNG as placeholder
  // This is a minimal valid 1x1 purple PNG scaled up
  
  // Actually, let's create a proper SVG with background for the icon
  const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c3aed"/>
      <stop offset="100%" style="stop-color:#ec4899"/>
    </linearGradient>
    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff"/>
      <stop offset="100%" style="stop-color:#f0e6ff"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bg)"/>
  <!-- B letter scaled to size -->
  <g transform="scale(${size / 100})">
    <path d="M25 15 L25 75" stroke="white" stroke-width="8" stroke-linecap="round" fill="none"/>
    <path d="M25 15 Q60 15 60 32 Q60 50 25 50" stroke="white" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M25 50 Q65 50 65 68 Q65 85 25 85" stroke="white" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M32 18 L28 30" stroke="rgba(255,255,255,0.6)" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M42 17 L36 32" stroke="rgba(255,255,255,0.6)" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M52 20 L46 35" stroke="rgba(255,255,255,0.6)" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M34 53 L30 65" stroke="rgba(255,255,255,0.6)" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M45 52 L40 67" stroke="rgba(255,255,255,0.6)" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M56 55 L50 70" stroke="rgba(255,255,255,0.6)" stroke-width="2.5" stroke-linecap="round"/>
  </g>
</svg>`;
  
  return iconSvg;
}

// Write SVG versions that browsers can use as PNG fallbacks
// Modern browsers accept SVG in manifest icons
const icon192 = createSimplePNG(192);
const icon512 = createSimplePNG(512);

// Save as SVG files named as PNG (browsers will handle it)
// Actually save proper SVG files
writeFileSync(join(root, 'public/icon-192.svg'), icon192);
writeFileSync(join(root, 'public/icon-512.svg'), icon512);

console.log('✅ Generated icon-192.svg and icon-512.svg');
console.log('');
console.log('NOTE: For best PWA support, convert these to actual PNG files.');
console.log('You can use: https://cloudconvert.com/svg-to-png');
console.log('Or install sharp: npm install sharp && node scripts/generate-pwa-icons-png.mjs');
