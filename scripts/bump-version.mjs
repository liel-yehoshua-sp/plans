#!/usr/bin/env node
/**
 * Bump semver across workspace packages and sync CLI commander .version().
 * Usage: node bump-version.mjs <repoRoot> <major|minor|patch>
 */
import fs from 'node:fs';
import path from 'node:path';

const [, , repoRoot, kind] = process.argv;

if (!repoRoot || !kind || !['major', 'minor', 'patch'].includes(kind)) {
  console.error('Usage: node bump-version.mjs <repoRoot> <major|minor|patch>');
  process.exit(1);
}

const pkgPaths = [
  'packages/store/package.json',
  'packages/viewer/package.json',
  'packages/cli/package.json',
].map((rel) => path.join(repoRoot, rel));

const versions = pkgPaths.map((p) => JSON.parse(fs.readFileSync(p, 'utf8')).version);
if (new Set(versions).size !== 1) {
  console.error('Package versions are out of sync:', Object.fromEntries(pkgPaths.map((p, i) => [path.basename(path.dirname(p)), versions[i]])));
  process.exit(1);
}

const [maj, min, pat] = versions[0].split('.').map((n) => Number.parseInt(n, 10));
if ([maj, min, pat].some(Number.isNaN)) {
  console.error('Invalid semver:', versions[0]);
  process.exit(1);
}

let next;
if (kind === 'major') next = `${maj + 1}.0.0`;
else if (kind === 'minor') next = `${maj}.${min + 1}.0`;
else next = `${maj}.${min}.${pat + 1}`;

for (const p of pkgPaths) {
  const json = JSON.parse(fs.readFileSync(p, 'utf8'));
  json.version = next;
  fs.writeFileSync(p, `${JSON.stringify(json, null, 2)}\n`);
}

const indexTs = path.join(repoRoot, 'packages/cli/src/index.ts');
let src = fs.readFileSync(indexTs, 'utf8');
const replaced = src.replace(/\.version\('[^']+'\)/, `.version('${next}')`);
if (replaced === src) {
  console.error('Could not find .version(\'...\') in packages/cli/src/index.ts');
  process.exit(1);
}
fs.writeFileSync(indexTs, replaced);

console.log(next);
