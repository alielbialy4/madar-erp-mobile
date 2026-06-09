import AsyncStorage from '@react-native-async-storage/async-storage';

export async function storageGet<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function storageSet<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function storageDelete(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

/** Returns a plain object record; never null (handles JSON `null` in storage). */
export async function storageGetRecord<T extends Record<string, unknown>>(key: string): Promise<T> {
  const raw = await storageGet<T>(key);
  if (raw != null && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw;
  }
  return {} as T;
}

/** Returns an array from storage, omitting null/invalid entries (handles corrupted JSON arrays). */
export async function storageGetArray<T>(
  key: string,
  isValid: (item: unknown) => item is T,
): Promise<T[]> {
  const raw = await storageGet<T[]>(key);
  if (!Array.isArray(raw)) return [];
  return raw.filter(isValid);
}
