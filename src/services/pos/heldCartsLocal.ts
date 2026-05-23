import type { Coupon } from '@/types/api';
import type { CartLine } from '@/store/posStore';
import { storageGet, storageKeys, storageSet } from '@/services/storage';
import { createUuid } from '@/utils/uuid';

export type HeldCartLocalRecord = {
  local_id: string;
  name: string;
  notes?: string | null;
  branch_id: string;
  user_id?: number | null;
  customer_id?: number | null;
  customer_name?: string | null;
  cart_lines: CartLine[];
  subtotal: number;
  tax: number;
  discount: number;
  cart_discount: number;
  coupon_id?: string | null;
  coupon_discount: number;
  coupon_snapshot?: Coupon | null;
  total: number;
  paid: number;
  created_at: string;
};

const KEY = storageKeys.heldCartsLocal;

export async function getLocalHeldCarts(branchId?: string): Promise<HeldCartLocalRecord[]> {
  const all = (await storageGet<HeldCartLocalRecord[]>(KEY)) ?? [];
  if (!branchId) return all;
  return all.filter((c) => c.branch_id === branchId);
}

export async function saveLocalHeldCart(record: Omit<HeldCartLocalRecord, 'local_id' | 'created_at'>): Promise<HeldCartLocalRecord> {
  const all = (await storageGet<HeldCartLocalRecord[]>(KEY)) ?? [];
  const entry: HeldCartLocalRecord = {
    ...record,
    local_id: createUuid(),
    created_at: new Date().toISOString(),
  };
  await storageSet(KEY, [entry, ...all]);
  return entry;
}

export async function deleteLocalHeldCart(localId: string): Promise<void> {
  const all = (await storageGet<HeldCartLocalRecord[]>(KEY)) ?? [];
  await storageSet(KEY, all.filter((c) => c.local_id !== localId));
}
