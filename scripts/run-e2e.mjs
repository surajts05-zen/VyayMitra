#!/usr/bin/env node
import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

const args = process.argv.slice(2);
const isHeaded = args.includes('--headed');
const isUI = args.includes('--ui');
const hasReport = args.includes('--report');
const isDev = args.includes('--dev');
const filterArg = args.find((a) => !a.startsWith('--'));

console.log('\x1b[36m%s\x1b[0m', '==========================================================');
console.log('\x1b[36m%s\x1b[0m', ' VyayMitra Enterprise Expense SaaS - Playwright Runner    ');
console.log('\x1b[36m%s\x1b[0m', '==========================================================');

// 1. Ensure build exists if not using dev server
const distHtml = resolve(rootDir, 'apps/web/dist/index.html');
if (!isDev && !existsSync(distHtml)) {
  console.log('\x1b[33m%s\x1b[0m', '\n[1/2] Building @vyay/web frontend bundle for preview server...');
  const build = spawnSync('pnpm', ['--filter', '@vyay/web', 'build'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
  });
  if (build.status !== 0) {
    console.error('\x1b[31mFailed to build web app\x1b[0m');
    process.exit(build.status || 1);
  }
} else {
  console.log('\x1b[32m%s\x1b[0m', '\n[1/2] Web build artifact ready.');
}

// 2. Run Playwright
console.log('\x1b[33m%s\x1b[0m', '\n[2/2] Running Playwright E2E tests...');
const pwArgs = ['exec', 'playwright', 'test'];

if (isUI) {
  pwArgs.push('--ui');
} else if (isHeaded) {
  pwArgs.push('--headed');
}

if (!args.includes('--all') && !isUI) {
  pwArgs.push('--project=chromium');
}

if (filterArg) {
  pwArgs.push(filterArg);
}

const env = { ...process.env };
if (isDev) {
  env.E2E_DEV_SERVER = '1';
}

const pw = spawnSync('pnpm', pwArgs, {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
  env,
});

if (pw.status === 0) {
  console.log('\x1b[32m%s\x1b[0m', '\nAll Playwright E2E tests PASSED successfully!');
} else {
  console.log('\x1b[31m%s\x1b[0m', `\nPlaywright tests finished with exit code ${pw.status}`);
}

if (hasReport) {
  spawnSync('pnpm', ['exec', 'playwright', 'show-report'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
  });
}

process.exit(pw.status || 0);
