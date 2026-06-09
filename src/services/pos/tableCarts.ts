import type { Coupon, Customer } from '@/types/api';
import { storageGetRecord, storageKeys, storageSet } from '@/services/storage';
import type { CartLine } from '@/store/posStore';

export type TableCartSnapshot = {
  lines: CartLine[];
  cartDiscount: number;
  customer: Customer | null;
  appliedCoupon?: { coupon: Coupon; discount: number } | null;
};

export type TableCartsRecord = Record<string, TableCartSnapshot>;

export async function getTableCartsRecord(): Promise<TableCartsRecord> {
  return storageGetRecord<TableCartsRecord>(storageKeys.posTableCarts);
}

export async function setTableCartsRecord(map: TableCartsRecord): Promise<void> {
  await storageSet(storageKeys.posTableCarts, map);
}

export async function removeTableCartEntry(tableId: string): Promise<void> {
  const map = await getTableCartsRecord();
  delete map[tableId];
  await setTableCartsRecord(map);
}
