import { create, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import type { ApiEnvelope, AuthSession, Branch } from '@/types/api';
import { secureGet, storageGet, storageKeys } from '@/services/storage';

type UnauthorizedHandler = () => Promise<void> | void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler) {
  unauthorizedHandler = handler;
}

export const apiClient = create({
  baseURL: env.apiUrl,
  timeout: env.requestTimeoutMs,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'Accept-Language': 'ar',
  },
});

async function getTenantSlug(session?: AuthSession | null): Promise<string | null> {
  if (session?.tenant_slug) return session.tenant_slug;
  return storageGet<string>(storageKeys.tenantSlug);
}

async function resolveBranchHeader(config: InternalAxiosRequestConfig): Promise<string | null> {
  const explicit = config.headers?.['X-Branch-Id'];
  if (explicit) return String(explicit);
  const params = config.params as Record<string, unknown> | undefined;
  if (params?.branch_id) return String(params.branch_id);
  const mode = await storageGet<'branch' | 'global'>(storageKeys.branchViewMode);
  if (mode === 'global') return null;
  const activeBranch = await storageGet<Branch>(storageKeys.activeBranch);
  return activeBranch?.id ?? null;
}

apiClient.interceptors.request.use(async (config) => {
  const session = await secureGet<AuthSession>(storageKeys.authSession);
  const tenantSlug = await getTenantSlug(session);
  if (tenantSlug) config.headers.set('X-Tenant-Slug', tenantSlug);
  if (session?.token) config.headers.set('Authorization', `Bearer ${session.token}`);
  const branchId = await resolveBranchHeader(config);
  if (branchId) config.headers.set('X-Branch-Id', branchId);
  else config.headers.delete('X-Branch-Id');
  return config;
});

let permissionsRefreshTimer: ReturnType<typeof setTimeout> | null = null;

apiClient.interceptors.response.use(
  (response) => {
    const reqUrl = String(response.config?.url ?? '');
    if (reqUrl.includes('/auth/me') || reqUrl.includes('/auth/login')) {
      return response;
    }
    const headerV = response.headers?.['x-permissions-version'];
    if (headerV !== undefined && headerV !== null && String(headerV) !== '') {
      void (async () => {
        const { secureGet } = await import('@/services/storage');
        const { storageKeys } = await import('@/services/storage');
        const session = await secureGet<{ user?: { permissions_version?: number } }>(storageKeys.authSession);
        const local = session?.user?.permissions_version;
        if (local !== undefined && String(headerV) !== String(local)) {
          if (permissionsRefreshTimer) clearTimeout(permissionsRefreshTimer);
          permissionsRefreshTimer = setTimeout(() => {
            permissionsRefreshTimer = null;
            void import('@/store/authStore').then(({ useAuthStore }) => {
              void useAuthStore.getState().refreshMe();
            });
          }, 400);
        }
      })();
    }
    return response;
  },
  async (error: AxiosError<ApiEnvelope>) => {
    if (error.response?.status === 401 && unauthorizedHandler) {
      await unauthorizedHandler();
    }
    return Promise.reject(error);
  },
);

export type RequestParams = Record<string, unknown> | undefined;

export async function get<T = unknown>(url: string, params?: RequestParams, headers?: Record<string, string>): Promise<ApiEnvelope<T>> {
  const response = await apiClient.get<ApiEnvelope<T>>(url, { params, headers });
  return response.data;
}

export async function post<T = unknown>(url: string, data?: unknown, headers?: Record<string, string>): Promise<ApiEnvelope<T>> {
  const response = await apiClient.post<ApiEnvelope<T>>(url, data, { headers });
  return response.data;
}

export async function put<T = unknown>(url: string, data?: unknown, headers?: Record<string, string>): Promise<ApiEnvelope<T>> {
  const response = await apiClient.put<ApiEnvelope<T>>(url, data, { headers });
  return response.data;
}

export async function patch<T = unknown>(url: string, data?: unknown, headers?: Record<string, string>): Promise<ApiEnvelope<T>> {
  const response = await apiClient.patch<ApiEnvelope<T>>(url, data, { headers });
  return response.data;
}

export async function del<T = unknown>(url: string, params?: RequestParams): Promise<ApiEnvelope<T>> {
  const response = await apiClient.delete<ApiEnvelope<T>>(url, { params });
  return response.data;
}

export async function postMultipart<T = unknown>(url: string, formData: FormData): Promise<ApiEnvelope<T>> {
  const response = await apiClient.post<ApiEnvelope<T>>(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function putMultipart<T = unknown>(url: string, formData: FormData): Promise<ApiEnvelope<T>> {
  if (!formData.has('_method')) {
    formData.append('_method', 'PUT');
  }
  const response = await apiClient.post<ApiEnvelope<T>>(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

/** Binary export responses (reports export, valuation export, etc.). */
export async function postBlob(url: string, data?: unknown): Promise<Blob> {
  const response = await apiClient.post(url, data ?? {}, {
    responseType: 'blob',
    headers: { Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/pdf,*/*' },
  });
  return response.data as Blob;
}
