import { storageGet, storageSet } from '@/services/storage';

const KEY = 'madar.nav.recent';
const MAX = 8;

export type RecentRoute = {
  id: string;
  label: string;
  at: number;
};

export async function getRecentRoutes(): Promise<RecentRoute[]> {
  return (await storageGet<RecentRoute[]>(KEY)) ?? [];
}

export async function pushRecentRoute(id: string, label: string): Promise<void> {
  const list = await getRecentRoutes();
  const next = [{ id, label, at: Date.now() }, ...list.filter((r) => r.id !== id)].slice(0, MAX);
  await storageSet(KEY, next);
}
