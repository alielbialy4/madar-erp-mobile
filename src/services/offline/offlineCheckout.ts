import type { Coupon, SalePayload } from '@/types/api';
import type { OfflinePosOrderRecord } from '@/types/offline';
import { buildReceiptPayloadFromOrder } from '@/services/offline/offlineCheckoutReceipt';
import { hasCachedCatalog } from '@/services/offline/catalogCache';
import { addPendingOrder } from '@/services/offline/posOrders';
import { resolveReceiptProfile } from '@/services/printing/branchPrintBinding';
import { resolveKitchenPrintGroups, type KitchenPrintGroup } from '@/services/printing/kitchenRoutingResolver';
import { getKitchenRoutingRules, resolveKitchenProfilesForCart } from '@/services/offline/kitchenRouting';
import { getPrinterProfile } from '@/services/printing/printerProfiles';
import { printEngine } from '@/services/printing/printEngine';
import { useServerKitchenPrintQueue } from '@/services/pos/posKitchenPrint';
import { normalizeBranchPrintSettings } from '@/utils/branchPrintSettings';
import type { CartLine } from '@/store/posStore';

export const OFFLINE_SAVE_MESSAGE =
  'تم حفظ الطلب محلياً وسيتم مزامنته عند عودة الاتصال';

export async function canCheckoutOffline(branchId: string): Promise<{ ok: boolean; message?: string }> {
  const hasCatalog = await hasCachedCatalog(branchId);
  if (!hasCatalog) {
    return { ok: false, message: 'لا يوجد كتالوج مخزّن. يجب تحميل الكتالوج مرة واحدة على الأقل أثناء الاتصال.' };
  }
  return { ok: true };
}

export async function enqueueOfflinePrintJobs(
  order: OfflinePosOrderRecord,
  cartLines: CartLine[],
  products: { id: number; name: string; category_id?: number | null }[],
  meta: { branchName?: string; cashierName?: string; catalogSettings?: Record<string, unknown> | null },
): Promise<void> {
  const printSettings = normalizeBranchPrintSettings(meta.catalogSettings ?? undefined);
  const serverProfileId = String(meta.catalogSettings?.customer_printer_profile_id ?? '');

  if (printSettings.auto_print_receipt) {
    const profile = await resolveReceiptProfile(order.branch_id, serverProfileId || null);
    if (profile) {
      const receiptPayload = buildReceiptPayloadFromOrder(order, meta, cartLines, meta.catalogSettings);
      try {
        await printEngine.printReceipt(receiptPayload, profile);
      } catch {
        /* queued */
      }
    }
  }

  if (!useServerKitchenPrintQueue(meta.catalogSettings) && printSettings.enable_kitchen_print) {
    let groups: KitchenPrintGroup[] = (
      await resolveKitchenPrintGroups({
        branchId: order.branch_id,
        cart: cartLines,
        products,
      }).catch(() => ({ groups: [], warnings: [] }))
    ).groups;

    if (groups.length === 0) {
      const rules = await getKitchenRoutingRules(order.branch_id);
      const legacy = resolveKitchenProfilesForCart(cartLines, products, rules);
      for (const group of legacy) {
        const profile = await getPrinterProfile(group.profileId);
        if (!profile?.enabled) continue;
        groups.push({
          profileId: profile.id,
          profile,
          ticketType: group.ticketType === 'bar' ? 'bar' : 'kitchen',
          lines: group.lines,
        });
      }
    }

    for (const group of groups) {
      await printEngine.printKitchenTicket(
        {
          order_label: order.local_order_id,
          store_name: meta.branchName,
          cashier_name: meta.cashierName,
          date: new Date(order.created_at).toLocaleString('ar-EG-u-nu-latn'),
          route_label: group.profile.name,
          items: group.lines.map((l) => ({
            name: l.product_name,
            quantity: l.quantity,
            notes: l.notes,
            modifiers: l.selected_options?.flatMap((g) => g.options.map((o) => o.name ?? '')),
            options: l.selected_options?.map((g) => ({
              group_title: g.group_title ?? '',
              options: g.options.map((o) => ({ name: o.name ?? '', applied_price: o.applied_price })),
            })),
          })),
          ticket_type: group.ticketType === 'bar' ? 'bar' : 'kitchen',
        },
        group.profile,
      );
    }
  }
}

export async function saveOfflinePosOrder(input: {
  payload: SalePayload;
  branchId: string;
  shiftId?: string | null;
  cashierId?: number | null;
  coupon?: Coupon | null;
  couponDiscount?: number;
  cartLines: CartLine[];
  products: { id: number; name: string; category_id?: number | null }[];
  branchName?: string;
  cashierName?: string;
  catalogSettings?: Record<string, unknown> | null;
}): Promise<{ order: OfflinePosOrderRecord; message: string }> {
  const check = await canCheckoutOffline(input.branchId);
  if (!check.ok) throw new Error(check.message);

  const order = await addPendingOrder({
    payload: input.payload,
    branchId: input.branchId,
    shiftId: input.shiftId,
    cashierId: input.cashierId,
    coupon: input.coupon,
    couponDiscount: input.couponDiscount,
  });

  await enqueueOfflinePrintJobs(order, input.cartLines, input.products, {
    branchName: input.branchName,
    cashierName: input.cashierName,
    catalogSettings: input.catalogSettings,
  });

  return { order, message: OFFLINE_SAVE_MESSAGE };
}
