import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { storageDelete, storageGet, storageSet } from './async';

export async function secureGet<T>(key: string): Promise<T | null> {
  if (Platform.OS === 'web') return storageGet<T>(key);
  const raw = await SecureStore.getItemAsync(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function secureSet<T>(key: string, value: T): Promise<void> {
  if (Platform.OS === 'web') {
    await storageSet(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, JSON.stringify(value));
}

export async function secureDelete(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    await storageDelete(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
