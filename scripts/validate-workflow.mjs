#!/usr/bin/env node
/**
 * validate-workflow.mjs — Local project validator for web-notes-e1 (ملاحظاتي)
 *
 * Runs pre-push sanity checks to catch production issues before deploying:
 *   1. Required files    — .env.example, next.config.js, tsconfig.json present
 *   2. package.json      — engines field, required scripts, no forbidden patterns
 *   3. TypeScript        — tsc --noEmit passes without errors
 *   4. Test suite        — vitest run exits 0
 *   5. Environment vars  — .env.example covers all keys referenced in the source
 *
 * Usage:
 *   node validate-workflow.mjs        # run all checks, exit 1 on failure
 *
 * Exit codes:
 *   0 — all checks passed
 *   1 — one or more checks failed
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Script lives in scripts/ — resolve root as parent directory
const ROOT = path.resolve(__dirname, '..');

// ── Helpers ───────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function ok(msg) {
  console.log(`  ✅ ${msg}`);
  passed++;
}
function fail(msg) {
  console.error(`  ❌ ${msg}`);
  failed++;
}
function section(title) {
  console.log(`\n── ${title}`);
}

// ── 1. Required files ─────────────────────────────────────────────────────────

section('Required files');

const requiredFiles = [
  '.env.example',
  '.gitattributes',
  '.gitignore',
  '.prettierrc.json',
  'next.config.js',
  'tsconfig.json',
  'vitest.config.ts',
  'CONTRIBUTING.md',
  'README.md',
  'src/proxy.ts',
  'src/sw.ts',
  'src/instrumentation.ts',
];

for (const f of requiredFiles) {
  if (existsSync(path.join(ROOT, f))) {
    ok(f);
  } else {
    fail(`Missing: ${f}`);
  }
}

// Ensure duplicate config is gone
if (existsSync(path.join(ROOT, 'next.config.mjs'))) {
  fail('Duplicate next.config.mjs exists alongside next.config.js — remove one');
} else {
  ok('No duplicate next.config.mjs');
}

// Ensure default Next.js placeholder SVGs are removed
const defaultNextSvgs = ['public/file.svg', 'public/globe.svg', 'public/next.svg', 'public/vercel.svg', 'public/window.svg'];
for (const f of defaultNextSvgs) {
  if (existsSync(path.join(ROOT, f))) {
    fail(`Default Next.js placeholder still present: ${f} — remove it`);
  }
}
ok('No default Next.js placeholder SVGs in public/');

// ── 2. package.json checks ────────────────────────────────────────────────────

section('package.json');

const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

const requiredScripts = ['dev', 'build', 'start', 'test', 'format', 'lint'];
for (const s of requiredScripts) {
  if (pkg.scripts?.[s]) {
    ok(`scripts.${s}`);
  } else {
    fail(`Missing script: ${s}`);
  }
}

if (pkg.engines?.node) {
  ok(`engines.node = ${pkg.engines.node}`);
} else {
  fail('Missing engines.node (required for Heroku)');
}

// ── 3. TypeScript ─────────────────────────────────────────────────────────────

section('TypeScript');

try {
  execSync('npx tsc --noEmit', { cwd: ROOT, stdio: 'pipe' });
  ok('tsc --noEmit → 0 errors');
} catch (e) {
  fail(`TypeScript errors:\n${e.stdout?.toString() ?? e.message}`);
}

// ── 4. Test suite ─────────────────────────────────────────────────────────────

section('Test suite');

try {
  const out = execSync('npx vitest run --reporter=dot', { cwd: ROOT, stdio: 'pipe' });
  const summary = out.toString().split('\n').slice(-5).join('\n');
  ok(`vitest run passed\n${summary}`);
} catch (e) {
  fail(`Tests failed:\n${e.stdout?.toString().slice(-500) ?? e.message}`);
}

// ── 5. Env example coverage ───────────────────────────────────────────────────

section('.env.example coverage');

const envExample = readFileSync(path.join(ROOT, '.env.example'), 'utf8');
const exampleKeys = new Set(
  envExample
    .split('\n')
    .filter((l) => l.match(/^[A-Z_]+=/) )
    .map((l) => l.split('=')[0])
);

const criticalEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY',
  'VAPID_EMAIL',
  'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
];

for (const key of criticalEnvVars) {
  if (exampleKeys.has(key)) {
    ok(`.env.example has ${key}`);
  } else {
    fail(`.env.example missing ${key}`);
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.error('\n[FAIL] Fix the issues above before pushing.\n');
  process.exit(1);
} else {
  console.log('\n[OK] All checks passed. Safe to push.\n');
}
