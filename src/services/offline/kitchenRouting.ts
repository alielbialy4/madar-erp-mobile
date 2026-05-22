import type { KitchenRoutingRule } from '@/types/offline';
import type { CartLine } from '@/store/posStore';
import { storageGet, storageKeys, storageSet } from '@/services/storage';
import { createUuid } from '@/utils/uuid';

export async function getKitchenRoutingRules(branchId?: string): Promise<KitchenRoutingRule[]> {
  const all = (await storageGet<KitchenRoutingRule[]>(storageKeys.kitchenRoutingRules)) ?? [];
  if (!branchId) return all;
  return all.filter((r) => r.branch_id === branchId && r.enabled);
}

export async function saveKitchenRoutingRules(rules: KitchenRoutingRule[]): Promise<void> {
  await storageSet(storageKeys.kitchenRoutingRules, rules);
}

export async function upsertKitchenRoutingRule(rule: Omit<KitchenRoutingRule, 'id'> & { id?: string }): Promise<KitchenRoutingRule> {
  const all = (await storageGet<KitchenRoutingRule[]>(storageKeys.kitchenRoutingRules)) ?? [];
  const row: KitchenRoutingRule = { ...rule, id: rule.id ?? createUuid() };
  const next = all.some((r) => r.id === row.id) ? all.map((r) => (r.id === row.id ? row : r)) : [...all, row];
  await saveKitchenRoutingRules(next);
  return row;
}

export function resolveKitchenProfilesForCart(
  lines: CartLine[],
  products: { id: number; category_id?: number | null }[],
  rules: KitchenRoutingRule[],
): { profileId: string; lines: CartLine[]; ticketType: KitchenRoutingRule['ticket_type'] }[] {
  const groups = new Map<string, { profileId: string; lines: CartLine[]; ticketType: KitchenRoutingRule['ticket_type'] }>();
  for (const line of lines) {
    const product = products.find((p) => p.id === line.product_id);
    const categoryId = product?.category_id ?? null;
    const rule =
      rules.find((r) => r.product_id === line.product_id) ??
      (categoryId != null ? rules.find((r) => r.category_id === categoryId) : undefined) ??
      rules.find((r) => !r.product_id && !r.category_id);
    if (!rule) continue;
    const key = `${rule.printer_profile_id}:${rule.ticket_type}`;
    const existing = groups.get(key);
    if (existing) {
      existing.lines.push(line);
    } else {
      groups.set(key, { profileId: rule.printer_profile_id, lines: [line], ticketType: rule.ticket_type });
    }
  }
  return [...groups.values()];
}
