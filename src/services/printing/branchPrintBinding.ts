import { storageGet, storageSet } from '@/services/storage';
import { getEnabledProfilesByRole, getPrinterProfile, getPrinterProfilesStrict } from './printerProfiles';
import type { PrinterProfile } from '@/types/printing';

export type BranchPrintBinding = {
  defaultReceiptProfileId: string | null;
  updatedAt: string;
};

export type ServerPrinterMap = Record<string, string>;

function bindingKey(branchId: string): string {
  return `madar.print.branch_binding.${branchId}`;
}

function serverMapKey(branchId: string): string {
  return `madar.print.server_printer_map.${branchId}`;
}

export async function getBranchPrintBinding(branchId: string): Promise<BranchPrintBinding | null> {
  return storageGet<BranchPrintBinding>(bindingKey(branchId));
}

export async function saveBranchPrintBinding(
  branchId: string,
  defaultReceiptProfileId: string | null,
): Promise<BranchPrintBinding> {
  const binding: BranchPrintBinding = {
    defaultReceiptProfileId,
    updatedAt: new Date().toISOString(),
  };
  await storageSet(bindingKey(branchId), binding);
  return binding;
}

export async function getServerPrinterMap(branchId: string): Promise<ServerPrinterMap> {
  return (await storageGet<ServerPrinterMap>(serverMapKey(branchId))) ?? {};
}

export async function saveServerPrinterMap(branchId: string, map: ServerPrinterMap): Promise<void> {
  await storageSet(serverMapKey(branchId), map);
}

export async function mapServerPrinterToLocal(
  branchId: string,
  serverPrinterId: string,
  localProfileId: string | null,
): Promise<ServerPrinterMap> {
  const map = await getServerPrinterMap(branchId);
  if (localProfileId) {
    map[serverPrinterId] = localProfileId;
  } else {
    delete map[serverPrinterId];
  }
  await saveServerPrinterMap(branchId, map);
  return map;
}

/** Resolve default receipt printer: device binding → first enabled cashier for branch. */
export async function resolveReceiptProfile(
  branchId: string,
  serverProfileId?: string | null,
): Promise<PrinterProfile | null> {
  const binding = await getBranchPrintBinding(branchId);
  const candidateIds = [
    binding?.defaultReceiptProfileId,
    serverProfileId?.trim() || null,
  ].filter(Boolean) as string[];

  for (const id of candidateIds) {
    const profile = await getPrinterProfile(id);
    if (profile?.enabled && profile.role === 'cashier') {
      if (!profile.branch_id || profile.branch_id === branchId) return profile;
    }
  }

  const cashiers = await getEnabledProfilesByRole('cashier', branchId, true);
  return cashiers[0] ?? null;
}

export async function countBranchPrinters(branchId: string): Promise<number> {
  return (await getPrinterProfilesStrict(branchId)).length;
}
