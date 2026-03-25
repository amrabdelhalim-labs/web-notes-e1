#!/usr/bin/env node
/**
 * check-docker-config.mjs — validates Docker runtime readiness.
 *
 * This script is intentionally conservative:
 * it checks for the presence of required files and a few key markers in them,
 * but it does not attempt to build or run containers.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

let passed = 0;
let failed = 0;

function ok(msg) {
  // eslint-disable-next-line no-console
  console.log(`  ✅ ${msg}`);
  passed++;
}

function fail(msg) {
  // eslint-disable-next-line no-console
  console.error(`  ❌ ${msg}`);
  failed++;
}

function section(title) {
  // eslint-disable-next-line no-console
  console.log(`\n── ${title}`);
}

function readIfExists(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function mustExist(relPath) {
  const abs = path.join(ROOT, relPath);
  if (fs.existsSync(abs)) {
    ok(relPath);
    return true;
  }
  fail(`Missing: ${relPath}`);
  return false;
}

function assertContains(text, marker, contextMsg) {
  if (text && text.includes(marker)) {
    ok(contextMsg ?? `contains: ${marker}`);
    return true;
  }
  fail(contextMsg ?? `missing marker: ${marker}`);
  return false;
}

section('Required files');
const requiredFiles = [
  'Dockerfile',
  'docker-compose.yml',
  '.dockerignore',
  '.env.docker.example',
  '.trivyignore',
  '.github/workflows/docker-publish.yml',
];

for (const f of requiredFiles) mustExist(f);

section('Dockerfile markers');
const dockerfile = readIfExists(path.join(ROOT, 'Dockerfile')) ?? '';
const fromCount = (dockerfile.match(/^FROM /gm) ?? []).length;
if (fromCount >= 2) ok(`multi-stage Dockerfile (FROM count: ${fromCount})`);
else fail(`Dockerfile should have at least 2 FROM stages (found: ${fromCount})`);

assertContains(dockerfile, 'HEALTHCHECK', 'Dockerfile includes HEALTHCHECK');
assertContains(dockerfile, 'standalone', 'Dockerfile references standalone output');
assertContains(dockerfile, 'server.js', 'Dockerfile runs server.js');
assertContains(dockerfile, 'apk upgrade --no-cache', 'Dockerfile upgrades APK packages');
assertContains(dockerfile, 'rm -rf /usr/local/lib/node_modules/npm', 'Dockerfile removes npm from runtime image');

// Non-root user marker
const hasUser = /\nUSER\s+\w+/m.test(dockerfile);
if (hasUser) ok('Dockerfile sets a non-root USER');
else fail('Dockerfile missing USER directive for non-root runtime');

assertContains(dockerfile, 'COPY --from=builder /app/.next/standalone', 'Copies .next/standalone from builder');
assertContains(dockerfile, 'COPY --from=builder /app/.next/static', 'Copies .next/static from builder');

section('docker-compose markers');
const compose = readIfExists(path.join(ROOT, 'docker-compose.yml')) ?? '';

assertContains(compose, 'mongo:', 'compose includes mongo service');
assertContains(compose, 'app:', 'compose includes app service');
assertContains(compose, 'mongodb://mongo:27017/mynotes', 'compose wires DATABASE_URL to mongo');

// Persistent uploads volume for local storage strategy.
const hasUploadsVolume = /\buploads:/m.test(compose);
if (hasUploadsVolume) ok('compose includes uploads volume');
else fail('compose missing uploads volume');

const mountsUploads = /\/app\/uploads/.test(compose);
if (mountsUploads) ok('compose mounts uploads to /app/uploads');
else fail('compose does not mount /app/uploads');

const hasStorageType = /STORAGE_TYPE:\s*local/.test(compose);
if (hasStorageType) ok('compose sets STORAGE_TYPE=local');
else fail('compose missing STORAGE_TYPE: local');

section('Environment example markers');
const envDocker = readIfExists(path.join(ROOT, '.env.docker.example')) ?? '';
assertContains(envDocker, 'DATABASE_URL=', '.env.docker.example has DATABASE_URL');
assertContains(envDocker, 'JWT_SECRET=', '.env.docker.example has JWT_SECRET');
assertContains(envDocker, 'VAPID_EMAIL=', '.env.docker.example has VAPID_EMAIL');
assertContains(envDocker, 'VAPID_PRIVATE_KEY=', '.env.docker.example has VAPID_PRIVATE_KEY');
assertContains(envDocker, 'NEXT_PUBLIC_VAPID_PUBLIC_KEY=', '.env.docker.example has NEXT_PUBLIC_VAPID_PUBLIC_KEY');
assertContains(envDocker, 'STORAGE_TYPE=', '.env.docker.example has STORAGE_TYPE');

section('GHCR workflow markers');
const workflow = readIfExists(path.join(ROOT, '.github/workflows/docker-publish.yml')) ?? '';

assertContains(workflow, 'workflow_dispatch', 'workflow supports workflow_dispatch');
assertContains(workflow, 'push:', 'workflow configured for tag pushes');
assertContains(workflow, 'tags:', 'workflow configured for tag triggers');
assertContains(workflow, 'v*', 'workflow uses v* tag pattern');
assertContains(workflow, "scanners: 'vuln'", 'workflow scans vulnerabilities only (no secret scan in this step)');
assertContains(workflow, "trivyignores: '.trivyignore'", 'workflow uses .trivyignore policy file');

if (failed > 0) {
  // eslint-disable-next-line no-console
  console.error(`\nResult: ${passed} passed, ${failed} failed`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log(`\nResult: ${passed} passed, ${failed} failed`);
process.exit(0);

