import type { CartLine } from '@/store/posStore';
import type { KitchenRoutingCategoryRow, KitchenRoutingProductRow, KitchenRoutingSnapshot } from '@/api/kitchenRouting';
import { kitchenRoutingAPI } from '@/api/kitchenRouting';
import { getServerPrinterMap } from '@/services/printing/branchPrintBinding';
import { getPrinterProfiles } from '@/services/printing/printerProfiles';
import type { PrinterProfile } from '@/types/printing';

type ProductRef = { id: number; name: string; category_id?: number | null };

export type KitchenPrintGroup = {
  profileId: string;
  profile: PrinterProfile;
  ticketType: 'kitchen' | 'bar';
  lines: CartLine[];
};

let snapshotCache: { branchId: string; at: number; data: KitchenRoutingSnapshot } | null = null;
const CACHE_MS = 60_000;

export async function loadKitchenRoutingSnapshot(
  branchId: string,
  force = false,
): Promise<KitchenRoutingSnapshot> {
  if (
    !force &&
    snapshotCache &&
    snapshotCache.branchId === branchId &&
    Date.now() - snapshotCache.at < CACHE_MS
  ) {
    return snapshotCache.data;
  }
  const data = await kitchenRoutingAPI.branchSnapshot(branchId, { per_page: 200, page: 1 });
  snapshotCache = { branchId, at: Date.now(), data };
  return data;
}

function resolveRoutingForProduct(
  product: ProductRef,
  categories: KitchenRoutingCategoryRow[],
  products: KitchenRoutingProductRow[],
): { type: 'screen' | 'printer' | 'none'; printerId: string | null } {
  const row = products.find((p) => p.id === product.id);
  const category = categories.find((c) => c.id === product.category_id);

  const productType = row?.kitchen_routing_type;
  if (productType === 'screen' || productType === 'printer' || productType === 'none') {
    return {
      type: productType,
      printerId: productType === 'printer' ? row?.kitchen_printer_id ?? null : null,
    };
  }

  const catType = category?.kitchen_routing_type;
  if (catType === 'screen' || catType === 'printer' || catType === 'none') {
    return {
      type: catType,
      printerId: catType === 'printer' ? category?.kitchen_printer_id ?? null : null,
    };
  }

  return { type: 'none', printerId: null };
}

export type KitchenPrintResolveResult = {
  groups: KitchenPrintGroup[];
  warnings: string[];
};

export async function resolveKitchenPrintGroups(input: {
  branchId: string;
  cart: CartLine[];
  products: ProductRef[];
  snapshot?: KitchenRoutingSnapshot;
}): Promise<KitchenPrintResolveResult> {
  const { branchId, cart, products } = input;
  const snapshot = input.snapshot ?? (await loadKitchenRoutingSnapshot(branchId));
  const serverMap = await getServerPrinterMap(branchId);
  const profileById = new Map((await getPrinterProfiles(branchId)).map((p) => [p.id, p]));
  const groups = new Map<string, KitchenPrintGroup>();
  const warnings: string[] = [];
  const unmappedServerIds = new Set<string>();
  const disabledLocalIds = new Set<string>();

  for (const line of cart) {
    const pref = products.find((p) => p.id === line.product_id);
    if (!pref) continue;
    const routing = resolveRoutingForProduct(pref, snapshot.categories, snapshot.products.data);
    if (routing.type !== 'printer' || !routing.printerId) continue;

    const localId = serverMap[routing.printerId];
    if (!localId) {
      unmappedServerIds.add(routing.printerId);
      continue;
    }

    const profile = profileById.get(localId);
    if (!profile?.enabled) {
      disabledLocalIds.add(localId);
      continue;
    }

    const key = profile.id;
    const existing = groups.get(key);
    if (existing) {
      existing.lines.push(line);
    } else {
      groups.set(key, {
        profileId: profile.id,
        profile,
        ticketType: profile.role === 'bar' ? 'bar' : 'kitchen',
        lines: [line],
      });
    }
  }

  if (unmappedServerIds.size > 0) {
    warnings.push(
      'بعض أصناف المطبخ غير مربوطة بملف طابعة على هذا الجهاز — راجع طابعات المطبخ وربط السيرفر.',
    );
  }
  if (disabledLocalIds.size > 0) {
    warnings.push('ملف طابعة مطبخ مربوط لكنه معطّل على هذا الجهاز.');
  }

  return { groups: [...groups.values()], warnings };
}

export function invalidateKitchenRoutingCache(branchId?: string): void {
  if (!branchId || snapshotCache?.branchId === branchId) snapshotCache = null;
}
