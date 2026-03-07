/**
 * convert-icons.mjs
 *
 * Converts the generated SVG icons to PNG using sharp.
 *
 * Usage:
 *   node scripts/convert-icons.mjs
 */

import sharp from 'sharp';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const ICONS_DIR = 'public/icons';
const svgFiles = readdirSync(ICONS_DIR).filter(f => f.endsWith('.svg') && f.startsWith('icon'));

console.log(`🔄 Converting ${svgFiles.length} SVG icons to PNG...\n`);

for (const svgFile of svgFiles) {
  const svgPath = join(ICONS_DIR, svgFile);
  const pngPath = svgPath.replace('.svg', '.png');
  
  try {
    const svgBuffer = readFileSync(svgPath);
    await sharp(svgBuffer)
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(pngPath);
    
    console.log(`✅  ${pngPath}`);
  } catch (error) {
    console.error(`❌  Failed to convert ${svgFile}:`, error.message);
  }
}

console.log('\n🎉 PNG conversion complete!');
