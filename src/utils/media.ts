import { env } from '@/config/env';

export function resolveMediaUrl(path?: string | null): string | null {
  if (!path) return null;
  const trimmed = String(path).trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  const origin = env.apiUrl.replace(/\/api\/?$/, '');
  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${origin}${normalizedPath}`;
}
