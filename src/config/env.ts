declare const process: {
  env?: Record<string, string | undefined>;
};

declare const __DEV__: boolean | undefined;

const PLACEHOLDER_HOST = 'your-api-domain.com';

/** Same shape as front `REACT_APP_API_URL` — must end with `/api` */
export function normalizeApiBaseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  try {
    const url = new URL(withScheme);
    let path = url.pathname.replace(/\/+$/, '') || '';
    if (!path || path === '/') {
      path = '/api';
    } else if (!path.endsWith('/api')) {
      path = `${path}/api`;
    }
    url.pathname = path;
    return url.toString().replace(/\/+$/, '');
  } catch {
    const base = trimmed.replace(/\/+$/, '');
    return base.endsWith('/api') ? base : `${base}/api`;
  }
}

function isPlaceholderUrl(url: string): boolean {
  return url.includes(PLACEHOLDER_HOST);
}

/** Local Herd/Laravel — matches `back/.env` APP_URL + `/api` */
function devDefaultApiUrl(): string {
  return 'http://back.test/api';
}

function resolveApiUrl(): string {
  const fromEnv = process.env?.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) {
    const normalized = normalizeApiBaseUrl(fromEnv);
    if (normalized && !isPlaceholderUrl(normalized)) {
      return normalized;
    }
  }

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return devDefaultApiUrl();
  }

  return normalizeApiBaseUrl(`https://${PLACEHOLDER_HOST}/api`);
}

const apiUrl = resolveApiUrl();

export const env = {
  apiUrl,
  defaultTenantSlug: process.env?.EXPO_PUBLIC_DEFAULT_TENANT_SLUG?.trim() || '',
  timezone: process.env?.EXPO_PUBLIC_TIMEZONE || 'Africa/Cairo',
  requestTimeoutMs: 20000,
};

export function isApiUrlConfigured(): boolean {
  return Boolean(apiUrl) && !isPlaceholderUrl(apiUrl);
}

export function apiUrlDisplayHost(): string {
  try {
    return new URL(apiUrl).host;
  } catch {
    return apiUrl;
  }
}
