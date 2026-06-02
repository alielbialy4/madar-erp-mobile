import { create } from 'zustand';
import type { Branch, User } from '@/types/api';
import { branchesAPI } from '@/api/branches';
import { storageDelete, storageGet, storageKeys, storageSet } from '@/services/storage';

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

export const useBranchStore = create<BranchState>((set, get) => ({
  branches: [],
  activeBranch: null,
  viewMode: 'branch',
  loading: false,

  bootstrap: async (user) => {
    const storedBranch = await storageGet<Branch>(storageKeys.activeBranch);
    const storedMode = await storageGet<ViewMode>(storageKeys.branchViewMode);
    if (storedMode === 'global' && user?.can_use_global_view) {
      set({ viewMode: 'global', activeBranch: null });
    } else if (storedBranch) {
      set({ activeBranch: storedBranch, viewMode: 'branch' });
    } else if (user?.current_branch) {
      set({ activeBranch: user.current_branch, viewMode: 'branch' });
      await storageSet(storageKeys.activeBranch, user.current_branch);
    }
    await get().loadBranches();
  },

  loadBranches: async () => {
    set({ loading: true });
    try {
      const response = await branchesAPI.listAccessible();
      const branches = response.data?.branches ?? [];
      set((state) => {
        const activeBranch = state.activeBranch ?? branches.find((branch) => branch.id === state.activeBranch?.id) ?? branches[0] ?? null;
        return { branches, activeBranch, loading: false, viewMode: state.viewMode === 'global' ? 'global' : 'branch' };
      });
      const active = get().activeBranch;
      if (active) await storageSet(storageKeys.activeBranch, active);
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
        return;
      }
      const branch = get().branches.find((item) => item.id === branchId) ?? null;
      if (branch) await storageSet(storageKeys.activeBranch, branch);
      await storageSet(storageKeys.branchViewMode, 'branch');
      set({ activeBranch: branch, viewMode: 'branch', loading: false });
      void import('./authStore').then(({ useAuthStore }) => {
        void useAuthStore.getState().refreshMe();
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  clear: () => set({ branches: [], activeBranch: null, viewMode: 'branch', loading: false }),
}));
