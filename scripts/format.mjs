#!/usr/bin/env node
/**
 * format.mjs — Cross-platform code formatter for web-notes-e1 (ملاحظاتي)
 *
 * Runs Prettier across all TypeScript/CSS source files under src/.
 * Works on Windows, macOS, and Linux without any extra tools.
 *
 * Usage:
 *   node format.mjs           # format all files (write mode)
 *   node format.mjs --check   # validate only, exit 1 if unformatted (CI)
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Script lives in scripts/ — run prettier from the project root
const ROOT = path.resolve(__dirname, '..');

const isCheck = process.argv.includes('--check');
const mode = isCheck ? '--check' : '--write';
let failed = false;

const targets = [
  '"src/**/*.{ts,tsx,css}"',
  '"*.{js,mjs,json}"',
  '"!next.config.js"',
];

console.log(`\n==> Prettier ${mode} : src/**/*.{ts,tsx,css}, *.{js,mjs,json}`);
try {
  execSync(`npx prettier ${mode} ${targets.join(' ')}`, { cwd: ROOT, stdio: 'inherit' });
} catch {
  failed = true;
}

if (failed) {
  console.error('\n[FAIL] Some files are not formatted. Run: node format.mjs');
  process.exit(1);
} else {
  console.log('\n[OK] All files are properly formatted.');
}
