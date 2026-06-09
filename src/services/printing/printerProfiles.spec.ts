/**
 * Run: npx tsx src/services/printing/printerProfiles.spec.ts
 *
 * Tests the branch-scoping behavior of printerProfiles via a lightweight
 * storage stub injected at the resolved module path.
 */
import assert from 'node:assert/strict';
import path from 'node:path';
import Module from 'node:module';

const root = path.resolve(__dirname, '..', '..', '..');
const storageIndexPath = path.join(root, 'services/storage/index.ts');
const storageAsyncPath = path.join(root, 'services/storage/async.ts');
const storageKeysPath = path.join(root, 'services/storage/keys.ts');
const uuidPath = path.join(root, 'utils/uuid.ts');
const capsPath = path.join(__dirname, 'printerCapabilities.ts');
const typesPath = path.join(root, 'types/printing.ts');

type KV = Record<string, string>;

function makeStorageStub() {
  const kv: KV = {};
  const storageKeys = {
    authSession: 'madar.auth.session',
    tenantSlug: 'madar.tenant.slug',
    tenantPrimaryHex: 'madar.tenant.primary_hex',
    activeBranch: 'madar.branch.active',
    branchViewMode: 'madar.branch.view_mode',
    posCatalog: 'madar.pos.catalog',
    posPendingOrders: 'madar.pos.pending_orders',
    posTableCarts: 'madar.pos.table_carts',
    posLocallyOccupiedTables: 'madar.pos.locally_occupied_tables',
    posFailedOrders: 'madar.pos.failed_orders',
    offlineQueue: 'madar.offline.queue',
    cachedUser: 'madar.auth.cached_user',
    printerProfiles: 'madar.print.profiles',
    printJobsQueue: 'madar.print.jobs',
    kitchenRoutingRules: 'madar.print.kitchen_routing',
    printDiagnostics: 'madar.print.diagnostics',
    heldCartsLocal: 'madar.pos.held_carts_local',
    recentRoutes: 'madar.nav.recent',
    reportsRecent: 'reports_recent',
  };
  return {
    kv,
    storageGet: async (key: string) => {
      if (!(key in kv)) return null;
      try {
        return JSON.parse(kv[key]) as unknown;
      } catch {
        return null;
      }
    },
    storageSet: async (key: string, value: unknown) => {
      kv[key] = JSON.stringify(value);
    },
    storageGetArray: async <T>(key: string, isValid: (item: unknown) => item is T): Promise<T[]> => {
      if (!(key in kv)) return [];
      try {
        const raw = JSON.parse(kv[key]) as unknown;
        if (!Array.isArray(raw)) return [];
        return raw.filter(isValid);
      } catch {
        return [];
      }
    },
    storageDelete: async (key: string) => {
      delete kv[key];
    },
    storageKeys,
  };
}

function installStub(stub: ReturnType<typeof makeStorageStub>) {
  // Drop existing cache entries so our stubs take effect on next require.
  const require = Module.createRequire(import.meta.url);
  for (const p of [storageIndexPath, storageAsyncPath, storageKeysPath, uuidPath, capsPath]) {
    delete require.cache[p];
  }

  // Patch Module._load to intercept the resolved paths.
  const originalLoad = (Module as unknown as { _load: (req: string, parent: Module, isMain: boolean) => unknown })._load;
  (Module as unknown as { _load: (req: string, parent: Module, isMain: boolean) => unknown })._load = function (
    req: string,
    parent: Module | undefined,
    isMain: boolean,
  ) {
    if (req === storageIndexPath || req === storageAsyncPath || req === '@/services/storage' || req === '@/services/storage/async' || req === '@/services/storage/index') {
      return {
        storageGet: stub.storageGet,
        storageSet: stub.storageSet,
        storageGetArray: stub.storageGetArray,
        storageDelete: stub.storageDelete,
        storageKeys: stub.storageKeys,
      };
    }
    if (req === storageKeysPath) {
      return { storageKeys: stub.storageKeys };
    }
    if (req === uuidPath || req === '@/utils/uuid') {
      let counter = 0;
      return { createUuid: () => `uuid-${++counter}` };
    }
    if (req === capsPath || req === './printerCapabilities') {
      return {
        defaultCharsPerLine: () => 48,
        recommendedConnectionForPlatform: () => 'network_tcp',
        getConnectionCapability: () => ({ supported: true, silent: true, reasonAr: null, reasonEn: null }),
      };
    }
    if (req === typesPath || req === '@/types/printing') {
      return {};
    }
    return originalLoad.call(this, req, parent as Module, isMain);
  };
  return () => {
    (Module as unknown as { _load: unknown })._load = originalLoad;
  };
}

async function loadFresh() {
  // Force a fresh require of printerProfiles (drop from cache).
  const require = Module.createRequire(import.meta.url);
  delete require.cache[path.join(__dirname, 'printerProfiles.ts')];
  const stub = makeStorageStub();
  const restore = installStub(stub);
  try {
    const mod = require('./printerProfiles');
    return { mod, stub };
  } finally {
    restore();
  }
}

async function testGetAllProfilesNoFilter() {
  const { mod, stub } = await loadFresh();
  await stub.storageSet(stub.storageKeys.printerProfiles, [
    { id: 'a', name: 'P1', role: 'cashier', branch_id: null },
    { id: 'b', name: 'P2', role: 'cashier', branch_id: 'branch-1' },
    { id: 'c', name: 'P3', role: 'kitchen', branch_id: 'branch-2' },
  ]);
  const all = await mod.getPrinterProfiles();
  assert.equal(all.length, 3, 'no filter → all profiles');
}

async function testGetProfilesByBranchIncludesShared() {
  const { mod, stub } = await loadFresh();
  await stub.storageSet(stub.storageKeys.printerProfiles, [
    { id: 'a', name: 'Shared', role: 'cashier', branch_id: null, enabled: true },
    { id: 'b', name: 'B1 Cashier', role: 'cashier', branch_id: 'branch-1', enabled: true },
    { id: 'c', name: 'B2 Cashier', role: 'cashier', branch_id: 'branch-2', enabled: true },
  ]);
  const b1 = await mod.getPrinterProfiles('branch-1');
  assert.equal(b1.length, 2, 'branch-1 sees its own + shared');
  const ids = b1.map((p: { id: string }) => p.id).sort();
  assert.deepEqual(ids, ['a', 'b']);
}

async function testGetEnabledByRole() {
  const { mod, stub } = await loadFresh();
  await stub.storageSet(stub.storageKeys.printerProfiles, [
    { id: 'a', name: 'Disabled Cashier', role: 'cashier', branch_id: 'b1', enabled: false },
    { id: 'b', name: 'Enabled Cashier', role: 'cashier', branch_id: 'b1', enabled: true },
    { id: 'c', name: 'Enabled Kitchen', role: 'kitchen', branch_id: 'b1', enabled: true },
  ]);
  const enabledCashier = await mod.getEnabledProfilesByRole('cashier', 'b1');
  assert.equal(enabledCashier.length, 1);
  assert.equal(enabledCashier[0].id, 'b');
}

async function testUpsertStampsBranchIdOnCreate() {
  const { mod } = await loadFresh();
  const created = await mod.upsertPrinterProfile({ name: 'New', role: 'cashier' }, 'branch-x');
  assert.equal(created.branch_id, 'branch-x', 'new profile gets branch_id from arg');
  const persisted = await mod.getPrinterProfile(created.id);
  assert.equal(persisted?.branch_id, 'branch-x');
}

async function testUpsertRespectsExplicitBranchId() {
  const { mod } = await loadFresh();
  const created = await mod.upsertPrinterProfile(
    { name: 'P', role: 'cashier', branch_id: 'explicit' },
    'fallback',
  );
  assert.equal(created.branch_id, 'explicit');
}

async function testMigrationStampsAndIsIdempotent() {
  const { mod, stub } = await loadFresh();
  await stub.storageSet(stub.storageKeys.printerProfiles, [
    { id: '1', name: 'Legacy1', role: 'cashier' },
    { id: '2', name: 'Legacy2', role: 'kitchen' },
    { id: '3', name: 'Modern', role: 'cashier', branch_id: 'other-branch' },
  ]);

  const firstRun = await mod.migrateLegacyProfilesToBranch('active-branch');
  assert.equal(firstRun, 2, 'two legacy profiles stamped');

  const profiles = await mod.getPrinterProfiles();
  const legacy1 = profiles.find((p: { id: string }) => p.id === '1');
  const legacy2 = profiles.find((p: { id: string }) => p.id === '2');
  const modern = profiles.find((p: { id: string }) => p.id === '3');
  assert.equal(legacy1?.branch_id, 'active-branch');
  assert.equal(legacy2?.branch_id, 'active-branch');
  assert.equal(modern?.branch_id, 'other-branch', 'already-stamped profiles untouched');

  const secondRun = await mod.migrateLegacyProfilesToBranch('active-branch');
  assert.equal(secondRun, 0, 'second run is no-op thanks to flag');
}

async function testEncodingMigrationV2() {
  const { mod, stub } = await loadFresh();
  await stub.storageSet(stub.storageKeys.printerProfiles, [
    { id: '1', name: 'Old UTF8', role: 'cashier', encoding: 'utf8', mode: 'escpos_text' },
    { id: '2', name: 'Old W1256', role: 'cashier', encoding: 'windows1256', mode: 'escpos_text' },
    { id: '3', name: 'Kitchen', role: 'kitchen', encoding: 'utf8', mode: 'escpos_text' },
    { id: '4', name: 'Already Image', role: 'cashier', encoding: 'utf8_image', mode: 'escpos_image' },
  ]);

  const firstRun = await mod.migratePrinterEncodingV2();
  assert.equal(firstRun, 2, 'two cashier text profiles migrated');

  const profiles = await mod.getPrinterProfiles();
  const oldUtf8 = profiles.find((p: { id: string }) => p.id === '1');
  const oldW1256 = profiles.find((p: { id: string }) => p.id === '2');
  const kitchen = profiles.find((p: { id: string }) => p.id === '3');
  const already = profiles.find((p: { id: string }) => p.id === '4');

  assert.equal(oldUtf8?.encoding, 'utf8_image');
  assert.equal(oldUtf8?.mode, 'escpos_image');
  assert.equal(oldW1256?.encoding, 'utf8_image');
  assert.equal(kitchen?.encoding, 'utf8');
  assert.equal(already?.encoding, 'utf8_image');

  const secondRun = await mod.migratePrinterEncodingV2();
  assert.equal(secondRun, 0);
}

async function testGetProfilesStrict() {
  const { mod, stub } = await loadFresh();
  await stub.storageSet(stub.storageKeys.printerProfiles, [
    { id: 'a', name: 'Shared', role: 'cashier', branch_id: null, enabled: true },
    { id: 'b', name: 'B1 Cashier', role: 'cashier', branch_id: 'branch-1', enabled: true },
  ]);
  const strict = await mod.getPrinterProfilesStrict('branch-1');
  assert.equal(strict.length, 1);
  assert.equal(strict[0].id, 'b');
}

async function main() {
  await testGetAllProfilesNoFilter();
  await testGetProfilesByBranchIncludesShared();
  await testGetProfilesStrict();
  await testGetEnabledByRole();
  await testUpsertStampsBranchIdOnCreate();
  await testUpsertRespectsExplicitBranchId();
  await testMigrationStampsAndIsIdempotent();
  await testEncodingMigrationV2();
  console.log('printerProfiles.spec.ts: OK');
}

void main().catch((err) => {
  console.error('printerProfiles.spec.ts: FAIL');
  console.error(err);
  process.exit(1);
});
