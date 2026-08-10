import AsyncStorage from '@react-native-async-storage/async-storage';
import { storageKeys } from '@/services/storage/keys';
import { secureDelete } from '@/services/storage/secure';

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
  // Dynamic imports break authStore ↔ clearLocalSession ↔ posStore require cycles.
  const [{ useBranchStore }, { usePosStore }, { usePrintStore }, { useThemeStore }] =
    await Promise.all([
      import('@/store/branchStore'),
      import('@/store/posStore'),
      import('@/store/printStore'),
      import('@/store/themeStore'),
    ]);
  useBranchStore.getState().clear();
  usePosStore.getState().resetSession();
  usePrintStore.getState().reset();
  useThemeStore.getState().setPrimaryHex(null);
}

export async function clearLocalSessionData(): Promise<void> {
  await clearPersistedAppData();
  await resetInMemorySessionState();
}
