import { readdir, readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = resolve(import.meta.dirname, '..');
const failures = [];

async function requireText(relativePath, needles) {
  const text = await readFile(join(root, relativePath), 'utf8');
  for (const needle of needles) {
    if (!text.includes(needle)) failures.push(`${relativePath} is missing ${JSON.stringify(needle)}`);
  }
}

await requireText('packages/ui/src/components/AppShell.tsx', [
  'Skip to main content',
  'aria-label="Primary navigation"',
  'aria-current=',
  'id="main-content"',
  'min-h-11',
]);
await requireText('apps/web/src/index.css', [':focus-visible', 'prefers-reduced-motion']);
await requireText('apps/api/src/common/filters/http-exception.filter.ts', ['Internal server error', 'requestId']);
await requireText('docs/runbooks.md', ['PostgreSQL Backup and Restore Drill', 'Current Launch Blockers']);

const assetsDirectory = join(root, 'apps/web/dist/assets');
const assets = await readdir(assetsDirectory);
const jsAssets = assets.filter((name) => name.endsWith('.js'));
if (jsAssets.length < 4) failures.push('Web build does not contain route-level JavaScript chunks');

const indexHtml = await readFile(join(root, 'apps/web/dist/index.html'), 'utf8');
const entryMatch = indexHtml.match(/src="\/assets\/([^"]+\.js)"/);
if (!entryMatch) {
  failures.push('Unable to identify the web entry chunk');
} else {
  const entryPath = join(assetsDirectory, entryMatch[1]);
  const entryStats = await stat(entryPath);
  const entryBudget = 400 * 1024;
  const gzipBudget = 125 * 1024;
  const gzipBytes = gzipSync(await readFile(entryPath)).length;
  if (entryStats.size > entryBudget) {
    failures.push(`Initial web entry chunk is ${entryStats.size} bytes; budget is ${entryBudget}`);
  }
  if (gzipBytes > gzipBudget) {
    failures.push(`Initial web entry chunk is ${gzipBytes} gzip bytes; budget is ${gzipBudget}`);
  }
}

if (failures.length) {
  console.error('M7 release verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`M7 release verification passed (${jsAssets.length} JavaScript chunks; entry <= 400 KiB raw and 125 KiB gzip).`);
