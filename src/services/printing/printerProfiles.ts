import type { PrinterProfile } from '@/types/printing';
import { defaultCharsPerLine, recommendedConnectionForPlatform } from './printerCapabilities';
import { storageGet, storageGetArray, storageKeys, storageSet } from '@/services/storage';
import { createUuid } from '@/utils/uuid';

function isPrinterProfile(item: unknown): item is PrinterProfile {
  return (
    item != null &&
    typeof item === 'object' &&
    typeof (item as PrinterProfile).id === 'string' &&
    typeof (item as PrinterProfile).name === 'string' &&
    typeof (item as PrinterProfile).role === 'string'
  );
}

let profilesCache: PrinterProfile[] | null = null;

async function readAllPrinterProfiles(): Promise<PrinterProfile[]> {
  if (profilesCache) return profilesCache;
  profilesCache = await storageGetArray(storageKeys.printerProfiles, isPrinterProfile);
  return profilesCache;
}

export function invalidatePrinterProfilesCache(): void {
  profilesCache = null;
}

/**
 * Read all stored printer profiles, optionally filtered by branch.
 *
 * Filtering rules:
 * - If `branchId` is provided: include profiles where `branch_id === branchId`
 *   OR `branch_id` is null/undefined (legacy / shared profiles).
 * - If `branchId` is undefined: return all profiles (no filtering — used by
 *   the global PrintQueueScreen, migrations, and diagnostics).
 */
export async function getPrinterProfiles(branchId?: string | null): Promise<PrinterProfile[]> {
  const all = await readAllPrinterProfiles();
  if (branchId === undefined) return all;
  const normalized = branchId || null;
  return all.filter((p) => (p.branch_id ?? null) === normalized || p.branch_id == null);
}

/** Branch UI: only profiles scoped to this branch (no legacy shared rows). */
export async function getPrinterProfilesStrict(branchId: string): Promise<PrinterProfile[]> {
  const all = await readAllPrinterProfiles();
  return all.filter((p) => p.branch_id === branchId);
}

export async function savePrinterProfiles(profiles: PrinterProfile[]): Promise<void> {
  profilesCache = profiles;
  await storageSet(storageKeys.printerProfiles, profiles);
}

export async function getPrinterProfile(id: string): Promise<PrinterProfile | null> {
  const profiles = await getPrinterProfiles();
  return profiles.find((p) => p.id === id) ?? null;
}

/**
 * Create or update a printer profile. If `branchId` is provided, the profile
 * is scoped to that branch. If not, the profile is stamped with the currently
 * active branch (if any) on creation, or left shared (null) for legacy.
 */
export async function upsertPrinterProfile(
  input: Partial<PrinterProfile> & Pick<PrinterProfile, 'name' | 'role'>,
  branchId?: string | null,
): Promise<PrinterProfile> {
  const profiles = await getPrinterProfiles();
  const existing = input.id ? profiles.find((p) => p.id === input.id) : undefined;
  const profile: PrinterProfile = {
    id: existing?.id ?? createUuid(),
    name: input.name,
    role: input.role,
    connection_type: input.connection_type ?? existing?.connection_type ?? recommendedConnectionForPlatform(),
    paper_width: input.paper_width ?? existing?.paper_width ?? '80mm',
    branch_id: input.branch_id !== undefined ? input.branch_id : (existing?.branch_id ?? branchId ?? null),
    ip: input.ip ?? existing?.ip,
    port: input.port ?? existing?.port ?? 9100,
    bluetoothAddress: input.bluetoothAddress ?? existing?.bluetoothAddress,
    airprintName: input.airprintName ?? existing?.airprintName,
    mode:
      input.mode ??
      existing?.mode ??
      (input.encoding === 'utf8_image' || existing?.encoding === 'utf8_image' ? 'escpos_image' : 'escpos_text'),
    encoding: input.encoding ?? existing?.encoding ?? 'utf8_image',
    code_page_preset: input.code_page_preset ?? existing?.code_page_preset ?? 'generic_clone',
    code_page_table: input.code_page_table ?? existing?.code_page_table,
    characters_per_line:
      input.characters_per_line ?? existing?.characters_per_line ?? defaultCharsPerLine(input.paper_width ?? '80mm'),
    cut_paper: input.cut_paper ?? existing?.cut_paper ?? true,
    enabled: input.enabled ?? existing?.enabled ?? true,
  };
  const next = existing ? profiles.map((p) => (p.id === profile.id ? profile : p)) : [...profiles, profile];
  await savePrinterProfiles(next);
  return profile;
}

export async function deletePrinterProfile(id: string): Promise<void> {
  const profiles = await getPrinterProfiles();
  await savePrinterProfiles(profiles.filter((p) => p.id !== id));
}

/**
 * Enabled profiles for a given role, optionally scoped to a branch.
 * Includes shared (branch_id=null) profiles for backward compatibility.
 */
export async function getEnabledProfilesByRole(
  role: PrinterProfile['role'],
  branchId?: string | null,
  strict = false,
): Promise<PrinterProfile[]> {
  const profiles =
    strict && branchId ? await getPrinterProfilesStrict(branchId) : await getPrinterProfiles(branchId);
  return profiles.filter((p) => p.enabled && p.role === role);
}

/**
 * One-time migration: stamp any profile that has no `branch_id` with the active branch.
 * Idempotent — sets a flag in AsyncStorage to skip on subsequent launches.
 */
/**
 * One-time migration: upgrade legacy cashier profiles to utf8_image raster mode.
 * Targets profiles still on utf8 or windows1256 text encoding.
 */
export async function migratePrinterEncodingV2(): Promise<number> {
  const migrationFlag = 'madar.print.profiles_migrated_v2';
  const done = await storageGet<boolean>(migrationFlag);
  if (done) return 0;

  const profiles = await getPrinterProfiles();
  let changed = 0;
  const next = profiles.map((p) => {
    const needsMigrate =
      p.role === 'cashier' &&
      (!p.encoding || p.encoding === 'utf8' || p.encoding === 'windows1256');
    if (!needsMigrate) return p;
    changed += 1;
    return {
      ...p,
      encoding: 'utf8_image' as PrinterProfile['encoding'],
      mode: 'escpos_image' as PrinterProfile['mode'],
      code_page_preset: p.code_page_preset ?? 'generic_clone',
    };
  });

  if (changed > 0) await savePrinterProfiles(next);
  await storageSet(migrationFlag, true);
  return changed;
}

export async function migrateLegacyProfilesToBranch(branchId: string | null): Promise<number> {
  if (!branchId) return 0;
  const migrationFlag = 'madar.print.profiles_migrated_v1';
  const done = await storageGet<boolean>(migrationFlag);
  if (done) return 0;
  const profiles = await getPrinterProfiles();
  let changed = 0;
  const next = profiles.map((p) => {
    if (p.branch_id == null) {
      changed += 1;
      return { ...p, branch_id: branchId };
    }
    return p;
  });
  if (changed > 0) await savePrinterProfiles(next);
  await storageSet(migrationFlag, true);
  return changed;
}

export async function ensureDefaultCashierProfile(branchId?: string | null): Promise<PrinterProfile | null> {
  const profiles = await getPrinterProfiles(branchId);
  const cashier = profiles.find((p) => p.role === 'cashier');
  if (cashier) return cashier;
  return upsertPrinterProfile(
    {
      name: 'طابعة الكاشير',
      role: 'cashier',
      connection_type: recommendedConnectionForPlatform(),
      paper_width: '80mm',
      port: 9100,
      enabled: false,
      encoding: 'utf8_image',
      code_page_preset: 'generic_clone',
    },
    branchId,
  );
}
