import { create } from 'zustand';
import type { AuthSession, User } from '@/types/api';
import { authAPI } from '@/api/auth';
import { tenantAPI } from '@/api/tenant';
import { setUnauthorizedHandler } from '@/api/client';
import { secureGet, secureSet, storageKeys, storageSet } from '@/services/storage';
import { clearLocalSessionData } from '@/services/session/clearLocalSessionData';
import { normalizeApiError } from '@/utils/errors';
import { useBranchStore } from './branchStore';
import { useThemeStore } from './themeStore';

type LoginInput = {
  identifier: string;
  password: string;
  tenant_slug?: string;
};

type AuthState = {
  token: string | null;
  user: User | null;
  tenantSlug: string | null;
  bootstrapping: boolean;
  loading: boolean;
  error: string | null;
  bootstrap: () => Promise<void>;
  login: (input: LoginInput) => Promise<boolean>;
  refreshMe: () => Promise<void>;
  logout: () => Promise<void>;
  clearLocalSession: () => Promise<void>;
};

async function persistSession(session: AuthSession): Promise<void> {
  await secureSet(storageKeys.authSession, session);
  await storageSet(storageKeys.cachedUser, session.user);
  if (session.tenant_slug) {
    await storageSet(storageKeys.tenantSlug, session.tenant_slug);
  }
}

async function refreshTenantThemeColor(): Promise<void> {
  try {
    const response = await tenantAPI.getTheme();
    const primary = String((response.data as { primary_hex?: string | null } | undefined)?.primary_hex ?? '').trim();
    if (/^#([0-9a-fA-F]{6})$/.test(primary)) {
      useThemeStore.getState().setPrimaryHex(primary);
    }
  } catch {
    // Theme color is cosmetic; auth/bootstrap should never fail because it cannot load.
  }
}

export const useAuthStore = create<AuthState>((set, get) => {
  setUnauthorizedHandler(async () => {
    await get().clearLocalSession();
  });

  return {
    token: null,
    user: null,
    tenantSlug: null,
    bootstrapping: true,
    loading: false,
    error: null,

    bootstrap: async () => {
      set({ bootstrapping: true });
      const session = await secureGet<AuthSession>(storageKeys.authSession);
      if (!session?.token) {
        set({ bootstrapping: false, token: null, user: null });
        return;
      }
      set({ token: session.token, user: session.user, tenantSlug: session.tenant_slug ?? null });
      await useBranchStore.getState().bootstrap(session.user);
      void refreshTenantThemeColor();
      try {
        await get().refreshMe();
      } catch {
        set({ bootstrapping: false });
      }
    },

    login: async ({ identifier, password, tenant_slug }) => {
      set({ loading: true, error: null });
      try {
        await clearLocalSessionData();
        set({ token: null, user: null, tenantSlug: null });
        const slug = tenant_slug?.trim();
        if (slug) await storageSet(storageKeys.tenantSlug, slug);
        const cleanIdentifier = identifier.trim();
        const looksLikeEmail = cleanIdentifier.includes('@');
        const response = await authAPI.login(
          {
            ...(looksLikeEmail ? { email: cleanIdentifier } : { phone: cleanIdentifier }),
            password,
          },
          slug ? { 'X-Tenant-Slug': slug } : undefined,
        );
        const token = response.data?.token;
        const user = response.data?.user;
        if (!token || !user) throw new Error(response.message || 'تعذر تسجيل الدخول');
        const session: AuthSession = { token, user, tenant_slug: slug || undefined };
        await persistSession(session);
        set({ token, user, tenantSlug: slug || null, loading: false });
        await useBranchStore.getState().bootstrap(user);
        void refreshTenantThemeColor();
        return true;
      } catch (error) {
        const normalized = normalizeApiError(error);
        set({ loading: false, error: normalized.message });
        return false;
      }
    },

    refreshMe: async () => {
      const token = get().token;
      if (!token) return;
      const response = await authAPI.me();
      const user = response.data?.user;
      if (user) {
        const session: AuthSession = { token, user, tenant_slug: get().tenantSlug ?? undefined };
        await persistSession(session);
        set({ user, bootstrapping: false });
        await useBranchStore.getState().bootstrap(user);
      } else {
        set({ bootstrapping: false });
      }
    },

    logout: async () => {
      set({ loading: true });
      try {
        await authAPI.logout();
      } catch {
        // Local logout remains source of truth when the revoke call fails.
      } finally {
        await get().clearLocalSession();
      }
    },

    clearLocalSession: async () => {
      await clearLocalSessionData();
      set({ token: null, user: null, tenantSlug: null, loading: false, bootstrapping: false, error: null });
    },
  };
});
