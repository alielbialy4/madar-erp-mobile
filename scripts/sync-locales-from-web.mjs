#!/usr/bin/env node
/**
 * Sync web locale JSON into the mobile app and re-apply mobile-only keys.
 * Usage: node scripts/sync-locales-from-web.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const webLocales = path.resolve(root, '../front/src/locales');
const mobileLocales = path.join(root, 'src/i18n/locales');
const overlayPath = path.join(mobileLocales, 'mobile-overlay.json');

const langs = ['ar', 'en', 'fr'];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

const overlay = fs.existsSync(overlayPath) ? readJson(overlayPath) : { ar: {}, en: {}, fr: {} };

for (const lang of langs) {
  const webFile = path.join(webLocales, `${lang}.json`);
  const outFile = path.join(mobileLocales, `${lang}.json`);
  if (!fs.existsSync(webFile)) {
    console.error(`Missing ${webFile}`);
    process.exit(1);
  }
  const merged = { ...readJson(webFile), ...(overlay[lang] ?? {}) };
  writeJson(outFile, merged);
  console.log(`synced ${lang}: ${Object.keys(merged).length} keys`);
}
