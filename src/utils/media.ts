import { env } from '@/config/env';

export function resolveMediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const origin = env.apiUrl.replace(/\/api\/?$/, '');
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}
