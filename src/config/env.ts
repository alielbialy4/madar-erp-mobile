declare const process: {
  env?: Record<string, string | undefined>;
};

export const env = {
  apiUrl: process.env?.EXPO_PUBLIC_API_URL || 'https://your-api-domain.com/api',
  defaultTenantSlug: process.env?.EXPO_PUBLIC_DEFAULT_TENANT_SLUG?.trim() || '',
  timezone: process.env?.EXPO_PUBLIC_TIMEZONE || 'Africa/Cairo',
  requestTimeoutMs: 20000,
};
