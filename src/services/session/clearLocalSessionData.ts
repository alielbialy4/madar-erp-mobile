import AsyncStorage from '@react-native-async-storage/async-storage';
import { storageKeys } from '@/services/storage/keys';
import { secureDelete } from '@/services/storage/secure';
import { useBranchStore } from '@/store/branchStore';
import { usePosStore } from '@/store/posStore';
import { usePrintStore } from '@/store/printStore';
import { useThemeStore } from '@/store/themeStore';

/** Device UX preferences — not tenant/account scoped. */
const PRESERVED_STORAGE_KEYS = new Set(['erb-theme']);

const FALLBACK_KEYS = [
  ...Object.values(storageKeys),
  storageKeys.heldCartsLocal,
  storageKeys.recentRoutes,
  storageKeys.reportsRecent,
];

export async function clearPersistedAppData(): Promise<void> {
  await secureDelete(storageKeys.authSession);

  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const remove = allKeys.filter((key) => !PRESERVED_STORAGE_KEYS.has(key));
    if (remove.length > 0) {
      await AsyncStorage.multiRemove(remove);
    }
  } catch {
    const { storageDelete } = await import('@/services/storage/async');
    await Promise.all(FALLBACK_KEYS.map((key) => storageDelete(key)));
  }
}

export async function resetInMemorySessionState(): Promise<void> {
  useBranchStore.getState().clear();
  usePosStore.getState().resetSession();
  usePrintStore.getState().reset();
  useThemeStore.getState().setPrimaryHex(null);
}

export async function clearLocalSessionData(): Promise<void> {
  await clearPersistedAppData();
  await resetInMemorySessionState();
}
