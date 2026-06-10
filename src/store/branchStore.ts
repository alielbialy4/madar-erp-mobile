import { create } from 'zustand';
import type { Branch, User } from '@/types/api';
import { branchesAPI } from '@/api/branches';
import { storageDelete, storageGet, storageKeys, storageSet } from '@/services/storage';
import { canUseGlobalView } from '@/utils/permissions';

type ViewMode = 'branch' | 'global';

type BranchState = {
  branches: Branch[];
  activeBranch: Branch | null;
  viewMode: ViewMode;
  loading: boolean;
  bootstrap: (user?: User | null) => Promise<void>;
  loadBranches: () => Promise<void>;
  switchBranch: (branchId: string | null) => Promise<void>;
  clear: () => void;
};

/** Mirrors front `readInitialViewMode()` in branchSlice. */
async function readInitialViewMode(): Promise<ViewMode> {
  const storedMode = await storageGet<ViewMode>(storageKeys.branchViewMode);
  if (storedMode === 'global' || storedMode === 'branch') return storedMode;
  const storedBranch = await storageGet<Branch>(storageKeys.activeBranch);
  return storedBranch ? 'branch' : 'global';
}

let autoSingleBranchBootstrapped = false;

/** Mirrors front BranchSwitcher auto-select for single-branch users without global access. */
async function maybeAutoSelectSingleBranch(
  user: User | null | undefined,
  get: () => BranchState,
  switchBranch: (branchId: string | null) => Promise<void>,
): Promise<void> {
  if (autoSingleBranchBootstrapped) return;
  const { viewMode, branches, loading } = get();
  if (loading || canUseGlobalView(user)) return;
  if (viewMode !== 'global' || branches.length !== 1) return;
  autoSingleBranchBootstrapped = true;
  try {
    await switchBranch(branches[0].id);
  } catch {
    autoSingleBranchBootstrapped = false;
  }
}

export const useBranchStore = create<BranchState>((set, get) => ({
  branches: [],
  activeBranch: null,
  viewMode: 'branch',
  loading: false,

  bootstrap: async (user) => {
    const storedBranch = await storageGet<Branch>(storageKeys.activeBranch);
    const initialMode = await readInitialViewMode();

    if (initialMode === 'global' && canUseGlobalView(user)) {
      await storageSet(storageKeys.branchViewMode, 'global');
      set({ viewMode: 'global', activeBranch: null });
    } else if (initialMode === 'branch' || storedBranch) {
      const branch = storedBranch ?? user?.current_branch ?? null;
      if (branch) {
        set({ activeBranch: branch, viewMode: 'branch' });
        await storageSet(storageKeys.activeBranch, branch);
        await storageSet(storageKeys.branchViewMode, 'branch');
      } else {
        set({ viewMode: 'branch', activeBranch: null });
      }
    } else if (initialMode === 'global' && !canUseGlobalView(user)) {
      const branch = user?.current_branch ?? null;
      if (branch) {
        set({ activeBranch: branch, viewMode: 'branch' });
        await storageSet(storageKeys.activeBranch, branch);
        await storageSet(storageKeys.branchViewMode, 'branch');
      } else {
        set({ viewMode: 'global', activeBranch: null });
      }
    } else {
      set({ viewMode: 'global', activeBranch: null });
      if (canUseGlobalView(user)) {
        await storageSet(storageKeys.branchViewMode, 'global');
      }
    }

    await get().loadBranches();
    await maybeAutoSelectSingleBranch(user, get, (branchId) => get().switchBranch(branchId));

    const active = get().activeBranch;
    if (active?.id) {
      try {
        const { migrateLegacyProfilesToBranch, migratePrinterEncodingV2 } = await import(
          '@/services/printing/printerProfiles'
        );
        await migrateLegacyProfilesToBranch(active.id);
        await migratePrinterEncodingV2();
      } catch {
        /* ignore — migration is best-effort */
      }
    }
  },

  loadBranches: async () => {
    set({ loading: true });
    try {
      const response = await branchesAPI.listAccessible();
      const branches = response.data?.branches ?? [];
      set((state) => {
        if (state.viewMode === 'global') {
          return { branches, activeBranch: null, loading: false, viewMode: 'global' };
        }
        const activeBranch =
          state.activeBranch ??
          branches.find((branch) => branch.id === state.activeBranch?.id) ??
          branches[0] ??
          null;
        return { branches, activeBranch, loading: false, viewMode: 'branch' };
      });
      const { activeBranch, viewMode } = get();
      if (viewMode === 'global') {
        await storageDelete(storageKeys.activeBranch);
      } else if (activeBranch) {
        await storageSet(storageKeys.activeBranch, activeBranch);
      }
    } catch {
      set({ loading: false });
    }
  },

  switchBranch: async (branchId) => {
    set({ loading: true });
    try {
      await branchesAPI.switchCurrent(branchId);
      if (!branchId) {
        await storageSet(storageKeys.branchViewMode, 'global');
        await storageDelete(storageKeys.activeBranch);
        set({ activeBranch: null, viewMode: 'global', loading: false });
      } else {
        const branch = get().branches.find((item) => item.id === branchId) ?? null;
        if (branch) await storageSet(storageKeys.activeBranch, branch);
        await storageSet(storageKeys.branchViewMode, 'branch');
        set({ activeBranch: branch, viewMode: 'branch', loading: false });
      }
      void import('./authStore').then(({ useAuthStore }) => {
        void useAuthStore.getState().refreshMe();
      });
      const { onBranchScopeChanged } = await import('./branchScopeEffects');
      onBranchScopeChanged();
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  clear: () => {
    autoSingleBranchBootstrapped = false;
    set({ branches: [], activeBranch: null, viewMode: 'global', loading: false });
  },
}));
