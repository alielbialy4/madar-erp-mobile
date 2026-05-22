import type { PrinterProfile } from '@/types/printing';
import { defaultCharsPerLine, recommendedConnectionForPlatform } from './printerCapabilities';
import { storageGet, storageKeys, storageSet } from '@/services/storage';
import { createUuid } from '@/utils/uuid';

export async function getPrinterProfiles(): Promise<PrinterProfile[]> {
  return (await storageGet<PrinterProfile[]>(storageKeys.printerProfiles)) ?? [];
}

export async function savePrinterProfiles(profiles: PrinterProfile[]): Promise<void> {
  await storageSet(storageKeys.printerProfiles, profiles);
}

export async function getPrinterProfile(id: string): Promise<PrinterProfile | null> {
  const profiles = await getPrinterProfiles();
  return profiles.find((p) => p.id === id) ?? null;
}

export async function upsertPrinterProfile(input: Partial<PrinterProfile> & Pick<PrinterProfile, 'name' | 'role'>): Promise<PrinterProfile> {
  const profiles = await getPrinterProfiles();
  const existing = input.id ? profiles.find((p) => p.id === input.id) : undefined;
  const profile: PrinterProfile = {
    id: existing?.id ?? createUuid(),
    name: input.name,
    role: input.role,
    connection_type: input.connection_type ?? existing?.connection_type ?? recommendedConnectionForPlatform(),
    paper_width: input.paper_width ?? existing?.paper_width ?? '80mm',
    ip: input.ip ?? existing?.ip,
    port: input.port ?? existing?.port ?? 9100,
    bluetoothAddress: input.bluetoothAddress ?? existing?.bluetoothAddress,
    airprintName: input.airprintName ?? existing?.airprintName,
    mode: input.mode ?? existing?.mode ?? 'escpos_text',
    encoding: input.encoding ?? existing?.encoding ?? 'cp864',
    characters_per_line: input.characters_per_line ?? existing?.characters_per_line ?? defaultCharsPerLine(input.paper_width ?? '80mm'),
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

export async function getEnabledProfilesByRole(role: PrinterProfile['role']): Promise<PrinterProfile[]> {
  const profiles = await getPrinterProfiles();
  return profiles.filter((p) => p.enabled && p.role === role);
}

export async function ensureDefaultCashierProfile(): Promise<PrinterProfile | null> {
  const profiles = await getPrinterProfiles();
  const cashier = profiles.find((p) => p.role === 'cashier');
  if (cashier) return cashier;
  return upsertPrinterProfile({
    name: 'طابعة الكاشير',
    role: 'cashier',
    connection_type: recommendedConnectionForPlatform(),
    paper_width: '80mm',
    port: 9100,
    enabled: false,
  });
}
