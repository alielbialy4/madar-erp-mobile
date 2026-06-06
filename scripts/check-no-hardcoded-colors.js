#!/usr/bin/env node
/**
 * Fails if hardcoded hex colors appear outside token files.
 * Allowed: colors.ts, brand assets references, rgba in colors.ts
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const ALLOWED_FILES = new Set([
  path.join(SRC, 'constants', 'colors.ts'),
  path.join(SRC, 'constants', 'spacing.ts'),
  path.join(SRC, 'components', 'brand', 'BrandLogo.tsx'),
]);

const HEX_PATTERN = /#[0-9A-Fa-f]{3,8}\b/g;
const violations = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      walk(full);
      continue;
    }
    if (!/\.(tsx?|jsx?)$/.test(entry.name)) continue;
    if (ALLOWED_FILES.has(full)) continue;
    const content = fs.readFileSync(full, 'utf8');
    const matches = content.match(HEX_PATTERN);
    if (matches?.length) {
      violations.push({ file: path.relative(ROOT, full), count: matches.length, sample: matches.slice(0, 3) });
    }
  }
}

walk(SRC);

if (violations.length) {
  console.error('Hardcoded hex colors found outside design tokens:\n');
  for (const v of violations) {
    console.error(`  ${v.file} (${v.count}): ${v.sample.join(', ')}`);
  }
  process.exit(1);
}

console.log('No hardcoded hex colors outside token files.');
