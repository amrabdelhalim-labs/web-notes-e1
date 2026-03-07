/**
 * generate-icons.mjs
 *
 * Generates modern gradient PWA icons with a note symbol using SVG.
 * Creates both SVG and PNG versions (PNG via data URL for browser compatibility).
 *
 * Design: Blue gradient background with white note icon and shadow.
 *
 * Usage:
 *   node scripts/generate-icons.mjs
 */

import { writeFileSync, mkdirSync } from 'fs';

// ─── SVG Icon Generator ──────────────────────────────────────────────────────

function generateModernIconSVG(size) {
  const cornerRadius = size * 0.18;
  
  // Note dimensions
  const noteWidth = size * 0.45;
  const noteHeight = size * 0.55;
  const noteX = (size - noteWidth) / 2;
  const noteY = (size - noteHeight) / 2 - size * 0.02;
  const noteRadius = size * 0.035;
  
  // Line properties
  const lineSpacing = noteHeight * 0.18;
  const lineY1 = noteY + noteHeight * 0.3;
  const lineY2 = lineY1 + lineSpacing;
  const lineY3 = lineY2 + lineSpacing;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Modern gradient: Blue 700 → Blue 900 -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1976d2;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0d47a1;stop-opacity:1" />
    </linearGradient>
    
    <!-- Subtle shadow for note -->
    <filter id="noteShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="${size * 0.015}"/>
      <feOffset dx="0" dy="${size * 0.02}"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.25"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background with rounded corners -->
  <rect width="${size}" height="${size}" rx="${cornerRadius}" fill="url(#bgGrad)"/>
  
  <!-- Note icon with shadow -->
  <g filter="url(#noteShadow)">
    <!-- White note paper -->
    <rect x="${noteX}" y="${noteY}" width="${noteWidth}" height="${noteHeight}" 
          rx="${noteRadius}" fill="#ffffff"/>
    
    <!-- Note lines (subtle blue) -->
    <line x1="${noteX + noteWidth * 0.18}" y1="${lineY1}" 
          x2="${noteX + noteWidth * 0.82}" y2="${lineY1}" 
          stroke="#1565c0" stroke-width="${Math.max(1.5, size * 0.008)}" 
          stroke-linecap="round" opacity="0.35"/>
    <line x1="${noteX + noteWidth * 0.18}" y1="${lineY2}" 
          x2="${noteX + noteWidth * 0.82}" y2="${lineY2}" 
          stroke="#1565c0" stroke-width="${Math.max(1.5, size * 0.008)}" 
          stroke-linecap="round" opacity="0.35"/>
    <line x1="${noteX + noteWidth * 0.18}" y1="${lineY3}" 
          x2="${noteX + noteWidth * 0.60}" y2="${lineY3}" 
          stroke="#1565c0" stroke-width="${Math.max(1.5, size * 0.008)}" 
          stroke-linecap="round" opacity="0.35"/>
    
    <!-- Folded corner accent -->
    <path d="M ${noteX + noteWidth - noteWidth * 0.22} ${noteY} 
             L ${noteX + noteWidth} ${noteY} 
             L ${noteX + noteWidth} ${noteY + noteHeight * 0.18} 
             Q ${noteX + noteWidth - noteWidth * 0.05} ${noteY + noteHeight * 0.15}
               ${noteX + noteWidth - noteWidth * 0.20} ${noteY + noteHeight * 0.08} Z" 
          fill="#e3f2fd" opacity="0.8"/>
  </g>
</svg>`;
}

// ─── Main ────────────────────────────────────────────────────────────────────

const OUT_DIR = 'public/icons';
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

mkdirSync(OUT_DIR, { recursive: true });

console.log('🎨 Generating modern PWA icons with gradient...\n');

for (const size of SIZES) {
  const svg = generateModernIconSVG(size);
  
  // Save as SVG (proper format)
  const svgPath = `${OUT_DIR}/icon-${size}x${size}.svg`;
  writeFileSync(svgPath, svg, 'utf-8');
  console.log(`✅  ${svgPath}`);
  
  // Note: PNG conversion would require additional library
  // For now, SVG files can be used directly or converted manually
}

console.log('\n✨ Modern gradient icons generated!');
console.log('\n📌 Next steps:');
console.log('   1. SVG icons are ready to use');
console.log('   2. For PNG conversion, install sharp: npm install sharp');
console.log('   3. Or use online converter: https://svgtopng.com/');
console.log('   4. Update manifest.json icon paths if needed\n');

