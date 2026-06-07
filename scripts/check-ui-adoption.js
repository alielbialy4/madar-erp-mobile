#!/usr/bin/env node
/**
 * UI adoption gates — fails CI when new screens regress to legacy primitives.
 * Run: node scripts/check-ui-adoption.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SCREENS = path.join(ROOT, 'src/screens');

const THRESHOLDS = {
  minListLayoutScreens: 20,
  minFormLayoutScreens: 12,
  maxAppListItemInScreens: 45,
  maxCrudListScreenImports: 0,
  maxParityModuleRoutes: 1,
};

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (/\.(tsx|ts)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

function countFilesMatching(files, pattern) {
  return files.filter((file) => pattern.test(fs.readFileSync(file, 'utf8'))).length;
}

function countImportUsage(files, importNeedle) {
  return files.filter((file) => {
    const src = fs.readFileSync(file, 'utf8');
    return src.includes(importNeedle);
  }).length;
}

const screenFiles = walk(SCREENS);
const allSrcFiles = walk(path.join(ROOT, 'src'));

const listLayoutScreens = countFilesMatching(
  screenFiles,
  /ListScreenLayout|ListScreenTemplate/,
);
const formLayoutScreens = countFilesMatching(screenFiles, /FormScreenLayout/);
const appListItemScreens = countFilesMatching(screenFiles, /AppListItem/);
const crudListImports = countImportUsage(allSrcFiles, 'CrudListScreen');
const parityRoutes = countImportUsage([path.join(ROOT, 'src/navigation/MoreStack.tsx')], 'ParityModule');

const failures = [];

if (listLayoutScreens < THRESHOLDS.minListLayoutScreens) {
  failures.push(`ListScreenLayout/ListScreenTemplate usage ${listLayoutScreens} < ${THRESHOLDS.minListLayoutScreens}`);
}
if (formLayoutScreens < THRESHOLDS.minFormLayoutScreens) {
  failures.push(`FormScreenLayout usage ${formLayoutScreens} < ${THRESHOLDS.minFormLayoutScreens}`);
}
if (appListItemScreens > THRESHOLDS.maxAppListItemInScreens) {
  failures.push(`AppListItem in screens ${appListItemScreens} > ${THRESHOLDS.maxAppListItemInScreens}`);
}
if (crudListImports > THRESHOLDS.maxCrudListScreenImports) {
  failures.push(`CrudListScreen imports ${crudListImports} > ${THRESHOLDS.maxCrudListScreenImports}`);
}
if (parityRoutes > THRESHOLDS.maxParityModuleRoutes) {
  failures.push(`ParityModule route registrations ${parityRoutes} > ${THRESHOLDS.maxParityModuleRoutes}`);
}

console.log('UI adoption report');
console.log(`  List layouts:     ${listLayoutScreens} (min ${THRESHOLDS.minListLayoutScreens})`);
console.log(`  Form layouts:     ${formLayoutScreens} (min ${THRESHOLDS.minFormLayoutScreens})`);
console.log(`  AppListItem:      ${appListItemScreens} (max ${THRESHOLDS.maxAppListItemInScreens})`);
console.log(`  CrudListScreen:   ${crudListImports} (max ${THRESHOLDS.maxCrudListScreenImports})`);
console.log(`  ParityModule:     ${parityRoutes} route(s) (max ${THRESHOLDS.maxParityModuleRoutes})`);

if (failures.length) {
  console.error('\nUI adoption check FAILED:');
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}

console.log('\nUI adoption check passed.');
process.exit(0);
