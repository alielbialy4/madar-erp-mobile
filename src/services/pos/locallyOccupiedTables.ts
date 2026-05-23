import { storageGet, storageKeys, storageSet } from '@/services/storage';

function normalizeTableId(tableId: string | number): string {
  return String(tableId);
}

function normalizeIds(ids: string[]): string[] {
  return ids.map(normalizeTableId);
}

export async function getLocallyOccupiedTables(): Promise<string[]> {
  const raw = await storageGet<string[]>(storageKeys.posLocallyOccupiedTables);
  return Array.isArray(raw) ? normalizeIds(raw) : [];
}

export async function markTableLocallyOccupied(tableId: string | number): Promise<string[]> {
  const id = normalizeTableId(tableId);
  const arr = await getLocallyOccupiedTables();
  if (!arr.includes(id)) {
    arr.push(id);
    await storageSet(storageKeys.posLocallyOccupiedTables, arr);
  }
  return arr;
}

export async function markTableLocallyAvailable(tableId: string | number): Promise<string[]> {
  const id = normalizeTableId(tableId);
  const filtered = (await getLocallyOccupiedTables()).filter((entry) => entry !== id);
  await storageSet(storageKeys.posLocallyOccupiedTables, filtered);
  return filtered;
}

export async function setLocallyOccupiedTables(ids: string[]): Promise<void> {
  await storageSet(storageKeys.posLocallyOccupiedTables, ids);
}
